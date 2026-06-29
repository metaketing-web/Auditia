#!/usr/bin/env python3
"""Vérification complète collecte + Data Room sur l'instance locale (à lancer sur le serveur)."""
from __future__ import annotations

import json
import secrets
import sqlite3
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

APP = Path("/opt/portia-audit")
DB = APP / "data/portia.db"
BASE = "http://127.0.0.1:3080"
failures: list[str] = []


def ok(msg: str) -> None:
    print(f"  OK {msg}")


def fail(msg: str) -> None:
    print(f"  FAIL {msg}")
    failures.append(msg)


def check(cond: bool, pass_msg: str, fail_msg: str) -> None:
    ok(pass_msg) if cond else fail(fail_msg)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    if not DB.is_file():
        fail(f"database missing: {DB}")
        return 1

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    tokens: dict[str, tuple[str, str]] = {}
    for role in ("admin", "juliana", "auditeur_b", "auditeur_t"):
        row = conn.execute(
            "SELECT id, email FROM users WHERE role=? AND active=1 LIMIT 1", (role,)
        ).fetchone()
        if not row:
            continue
        tok = secrets.token_urlsafe(32)
        exp = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?,?,?,?)",
            (tok, row["id"], exp, now()),
        )
        tokens[role] = (tok, row["email"])
    conn.commit()
    conn.close()
    ok(f"test sessions: {list(tokens.keys())}")

    def get(path: str, role: str = "admin") -> tuple[int, dict]:
        tok, _ = tokens[role]
        req = urllib.request.Request(f"{BASE}{path}", headers={"X-Portia-Token": tok})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())

    def get_raw(path: str) -> tuple[int, bytes]:
        req = urllib.request.Request(f"{BASE}{path}")
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read()

    def post(path: str, role: str = "admin", data: bytes = b"{}") -> tuple[int, dict]:
        tok, _ = tokens[role]
        req = urllib.request.Request(
            f"{BASE}{path}",
            data=data,
            headers={"X-Portia-Token": tok, "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())

    _, health_raw = get_raw("/api/health")
    h = json.loads(health_raw)
    check(h.get("ok") is True, "health", "health")

    _, d = get("/api/collecte/folders")
    check(len(d.get("folders", [])) == 11, "folders x11", f"folders {len(d.get('folders', []))}")

    _, d = get("/api/collecte/status", "juliana")
    items = d.get("items", [])
    check(len(items) == 49, f"status {len(items)} entretiens", f"status count {len(items)}")
    sync = d.get("sync", {})
    check(sync.get("total") == 49, "sync total 49", f"sync {sync}")

    eid = items[0]["entretienId"]
    pub = items[0]["token"]

    for kind in ("initial", "relance"):
        _, m = get(f"/api/collecte/email/{eid}?kind={kind}")
        check(bool(m.get("subject") and m.get("body")), f"email {kind}", f"email {kind}")

    for role in tokens:
        try:
            _, ent = get(f"/api/collecte/entretien/{eid}", role)
            link = ent.get("token", {}).get("link")
            check(bool(link), f"entretien/{role}", f"entretien {role} no link")
        except Exception as ex:
            fail(f"entretien {role}: {ex}")

    _, info_raw = get_raw(f"/api/collecte/{pub}/info")
    info = json.loads(info_raw)
    check("depositOpen" in info, "public info", "public info")
    code, _ = get_raw(f"/collecte/{pub}")
    check(code == 200, "collecte page HTML", f"collecte page {code}")

    tok, _ = tokens["admin"]
    req = urllib.request.Request(f"{BASE}/api/collecte/export.csv", headers={"X-Portia-Token": tok})
    with urllib.request.urlopen(req, timeout=30) as r:
        csv = r.read().decode("utf-8-sig")
    check("entretien_id" in csv and csv.count(";") > 10, "export csv", "export csv")

    _, dr = get("/api/dataroom/docs")
    docs = dr if isinstance(dr, list) else dr.get("docs", [])
    ok(f"dataroom {len(docs)} docs")

    try:
        post("/api/dataroom/docs/nonexistent_doc_xyz/validate")
        fail("validate should 4xx")
    except urllib.error.HTTPError as e:
        check(e.code in (404, 422, 400), f"validate 4xx ({e.code})", f"validate {e.code}")

    _, d = post("/api/collecte/tokens/sync")
    check(d.get("ok") and d.get("total") == 49, "tokens sync", f"sync post {d}")

    sys.path.insert(0, str(APP))
    import calendar_db as cdb  # noqa: E402
    import collecte_db as colldb  # noqa: E402

    check(
        hasattr(cdb, "init_calendar_schema") and hasattr(colldb, "init_collecte_schema"),
        "cdb/colldb imports",
        "import conflict",
    )

    state = json.loads(sqlite3.connect(DB).execute("SELECT payload FROM mission_state WHERE id=1").fetchone()[0])
    notifs = state.get("notifications") or []
    col_notifs = [n for n in notifs if n.get("type") == "collecte_relance_j7"]
    ok(f"notifications total={len(notifs)} collecte_j7={len(col_notifs)}")

    boundary = "----PortiaTest"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test-preuve.txt"\r\n'
        f"Content-Type: text/plain\r\n\r\n"
        f"Test preuve collecte PNIPM audit skydeen\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="description"\r\n\r\n'
        f"Fiche test automatique\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="docType"\r\n\r\n'
        f"DOC\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    req = urllib.request.Request(
        f"{BASE}/api/collecte/{pub}/deposit",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            dep = json.loads(r.read())
        check(dep.get("ok") and dep.get("doc"), "deposit upload", f"deposit {dep}")
        doc_id = dep.get("doc", {}).get("id")
        if doc_id:
            row = sqlite3.connect(DB).execute(
                "SELECT statut, ministry_folder, deposit_origin FROM dataroom_documents WHERE id=?",
                (doc_id,),
            ).fetchone()
            check(row and row[0] == "a_verifier", "deposit statut a_verifier", f"deposit statut {row}")
            check(row and row[1], f"ministry_folder={row[1]}", "no ministry_folder")
            check(row and row[2] == "externe", "deposit_origin externe", f"origin {row}")
            tok_a, _ = tokens["admin"]
            req2 = urllib.request.Request(
                f"{BASE}/api/dataroom/docs/{doc_id}/validate",
                headers={"X-Portia-Token": tok_a},
                method="POST",
                data=b"{}",
            )
            with urllib.request.urlopen(req2, timeout=30) as r2:
                val = json.loads(r2.read())
            check(
                val.get("doc", {}).get("statut") == "verse",
                "validate -> verse",
                f"validate {val}",
            )
    except urllib.error.HTTPError as e:
        fail(f"deposit HTTP {e.code}: {e.read()[:200]}")
    except Exception as ex:
        fail(f"deposit: {ex}")

    conn = sqlite3.connect(DB)
    for _, (tok, _) in tokens.items():
        conn.execute("DELETE FROM sessions WHERE token=?", (tok,))
    conn.commit()
    conn.close()

    print()
    if failures:
        print(f"FAILED: {len(failures)}")
        for f in failures:
            print(" -", f)
        return 1
    print("=== ALL CHECKS PASSED ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

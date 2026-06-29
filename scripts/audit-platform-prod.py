#!/usr/bin/env python3
"""Audit plateforme Portia — assets, API, rôles, collecte, Data Room."""
from __future__ import annotations

import json
import re
import secrets
import sqlite3
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

APP = Path("/opt/portia-audit")
DB = APP / "data/portia.db"
LOCAL = "http://127.0.0.1:3080"
PUBLIC = "https://audit.skydeen.ai"

failures: list[str] = []
warnings: list[str] = []
passed = 0


def ok(msg: str) -> None:
    global passed
    passed += 1
    print(f"  OK {msg}")


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f"  WARN {msg}")


def fail(msg: str) -> None:
    failures.append(msg)
    print(f"  FAIL {msg}")


def check(cond: bool, pass_msg: str, fail_msg: str) -> None:
    ok(pass_msg) if cond else fail(fail_msg)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Client:
    def __init__(self, token: str = "") -> None:
        self.token = token

    def request(self, method: str, path: str, data: bytes | None = None, auth: bool = True) -> tuple[int, bytes]:
        headers: dict[str, str] = {}
        if auth and self.token:
            headers["X-Portia-Token"] = self.token
        if data is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(f"{LOCAL}{path}", data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def get_json(self, path: str, auth: bool = True) -> tuple[int, dict | list]:
        code, body = self.request("GET", path, auth=auth)
        try:
            return code, json.loads(body) if body else {}
        except json.JSONDecodeError:
            return code, {}


def make_sessions() -> dict[str, Client]:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    clients: dict[str, Client] = {}
    for role in ("admin", "juliana", "auditeur_b", "auditeur_t", "cabinet"):
        row = conn.execute(
            "SELECT id, email FROM users WHERE role=? AND active=1 LIMIT 1", (role,)
        ).fetchone()
        if not row:
            warn(f"no user for role {role}")
            continue
        tok = secrets.token_urlsafe(32)
        exp = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?,?,?,?)",
            (tok, row["id"], exp, now_iso()),
        )
        clients[role] = Client(tok)
    conn.commit()
    conn.close()
    return clients


def cleanup_sessions(clients: dict[str, Client]) -> None:
    conn = sqlite3.connect(DB)
    for c in clients.values():
        if c.token:
            conn.execute("DELETE FROM sessions WHERE token=?", (c.token,))
    conn.commit()
    conn.close()


def audit_services() -> None:
    print("\n=== 1. SERVICES ===")
    import subprocess

    for svc in ("nginx", "portia-audit"):
        r = subprocess.run(["systemctl", "is-active", svc], capture_output=True, text=True)
        check(r.stdout.strip() == "active", f"service {svc}", f"service {svc} inactive")


def audit_assets() -> None:
    print("\n=== 2. ASSETS STATIQUES ===")
    html = (APP / "index.html").read_text(encoding="utf-8", errors="replace")
    scripts = re.findall(r'<script[^>]+src="([^"?]+)', html)
    missing = []
    for src in scripts:
        p = APP / src
        if not p.is_file():
            missing.append(src)
            fail(f"missing script {src}")
        else:
            ok(f"script {src}")
    for extra in ("collecte.html", "collecte.js", "portia-sw.js"):
        p = APP / extra
        check(p.is_file(), extra, f"missing {extra}")

    # HTTP externe
    for path in ["/", "/collecte.html", "/collecte.js"] + [f"/{s}" for s in scripts[:5]]:
        try:
            req = urllib.request.Request(f"{PUBLIC}{path}")
            with urllib.request.urlopen(req, timeout=20) as r:
                check(r.status == 200, f"HTTPS GET {path}", f"HTTPS {path} -> {r.status}")
        except Exception as ex:
            fail(f"HTTPS {path}: {ex}")


def audit_public_api() -> str:
    print("\n=== 3. API PUBLIQUE ===")
    anon = Client()
    code, h = anon.get_json("/api/health", auth=False)
    check(code == 200 and h.get("ok"), "GET /api/health", f"health {code} {h}")

    code, cfg = anon.get_json("/api/config/public", auth=False)
    check(code == 200, "GET /api/config/public", f"config/public {code}")

    code, _ = anon.request("GET", "/api/state", auth=False)
    check(code in (401, 403), "GET /api/state sans auth -> 401", f"state unauth {code}")

    conn = sqlite3.connect(DB)
    pub = conn.execute("SELECT token FROM collecte_tokens LIMIT 1").fetchone()[0]
    conn.close()

    code, info = anon.get_json(f"/api/collecte/{pub}/info", auth=False)
    check(code == 200 and "interviewee" in info, "collecte public info", f"collecte info {code}")

    code, _ = anon.request("GET", f"/collecte/{pub}", auth=False)
    check(code == 200, "collecte page", f"collecte page {code}")
    return pub


def audit_auth(clients: dict[str, Client]) -> None:
    print("\n=== 4. AUTH & RÔLES ===")
    for role, c in clients.items():
        code, me = c.get_json("/api/auth/me")
        check(code == 200 and me.get("user"), f"auth/me {role}", f"auth/me {role} {code}")

    # cabinet lecture seule
    cab = clients.get("cabinet")
    if cab:
        code, _ = cab.request("POST", "/api/collecte/tokens/sync", b"{}")
        check(code in (401, 403), "cabinet blocked collecte sync", f"cabinet sync {code}")

    # auditeur accès collecte entretien (entretien affecté A ou A+L)
    aud = clients.get("auditeur_b")
    if aud:
        conn = sqlite3.connect(DB)
        st = json.loads(conn.execute("SELECT payload FROM mission_state WHERE id=1").fetchone()[0])
        eid = None
        for row in conn.execute("SELECT entretien_id FROM collecte_tokens"):
            ent = next(
                (e for e in (st.get("entretiens") or []) if e.get("id") == row[0]),
                None,
            )
            if ent and str(ent.get("aud") or "").upper() in ("A", "A+L"):
                eid = row[0]
                break
        conn.close()
        if eid:
            code, d = aud.get_json(f"/api/collecte/entretien/{eid}")
            check(code == 200 and d.get("token"), "auditeur collecte/entretien", f"auditeur ent {code}")
        else:
            warn("no entretien A for auditeur_b collecte test")


def audit_core_api(clients: dict[str, Client]) -> tuple[str | None, str | None]:
    print("\n=== 5. API MÉTIER (admin) ===")
    admin = clients.get("admin")
    if not admin:
        fail("no admin client")
        return None, None

    endpoints = [
        "/api/state",
        "/api/dataroom/docs",
        "/api/dataroom/repos",
        "/api/dataroom/stats",
        "/api/dataroom/trash",
        "/api/planning",
        "/api/calendar/status",
        "/api/notifications",
        "/api/audit/journal",
        "/api/state/snapshots",
        "/api/collecte/folders",
        "/api/collecte/status",
    ]
    for ep in endpoints:
        code, data = admin.get_json(ep)
        check(code == 200, f"GET {ep}", f"GET {ep} -> {code}")

    code, state = admin.get_json("/api/state")
    ents = (state.get("entretiens") or []) if isinstance(state, dict) else []
    check(len(ents) >= 40, f"state entretiens={len(ents)}", f"entretiens count {len(ents)}")

    eid = ents[0]["id"] if ents else None
    if eid:
        code, _ = admin.get_json(f"/api/entretiens/{eid}/questionnaire")
        check(code == 200, "GET questionnaire", f"questionnaire {code}")

    code, docs = admin.get_json("/api/dataroom/docs")
    doc_list = docs if isinstance(docs, list) else docs.get("docs", [])
    doc_id = None
    file_id = None
    for d in doc_list:
        if d.get("fileId") or d.get("file_id"):
            doc_id = d.get("id")
            file_id = d.get("fileId") or d.get("file_id")
            break

    if doc_id and file_id:
        code, _ = admin.request("GET", f"/api/files/{file_id}")
        check(code == 200, f"GET /api/files/{file_id[:8]}…", f"file download {code}")
        code, _ = admin.request("GET", f"/api/files/{file_id}/preview")
        check(code in (200, 415), "GET file preview", f"preview {code}")
        code, _ = admin.get_json(f"/api/dataroom/docs/{doc_id}")
        check(code == 200, "GET doc detail", f"doc detail {code}")
    else:
        warn("no doc with file for preview test")

    # exports
    for ep in ["/api/export/gaps", "/api/export/constats", "/api/collecte/export.csv"]:
        code, body = admin.request("GET", ep)
        check(code == 200 and len(body) > 50, f"GET {ep}", f"{ep} {code} len={len(body)}")

    return eid, doc_id


def audit_collecte_flow(pub: str, clients: dict[str, Client]) -> None:
    print("\n=== 6. COLLECTE DÉPÔT + VALIDATION ===")
    anon = Client()
    boundary = "----AuditBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="audit-preuve.txt"\r\n'
        f"Content-Type: text/plain\r\n\r\n"
        f"Audit plateforme PNIPM {now_iso()}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="description"\r\n\r\n'
        f"test-audit\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="docType"\r\n\r\n'
        f"DOC\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    req = urllib.request.Request(
        f"{LOCAL}/api/collecte/{pub}/deposit",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    doc_id = None
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            dep = json.loads(r.read())
        check(dep.get("ok") and dep.get("doc"), "collecte deposit", f"deposit {dep}")
        doc_id = dep.get("doc", {}).get("id")
    except urllib.error.HTTPError as e:
        fail(f"collecte deposit HTTP {e.code}: {e.read()[:200]}")

    admin = clients.get("admin")
    if doc_id and admin:
        code, val = admin.request("POST", f"/api/dataroom/docs/{doc_id}/validate", b"{}")
        try:
            data = json.loads(val)
            check(
                code == 200 and data.get("doc", {}).get("statut") == "verse",
                "validate deposit",
                f"validate {code} {val[:120]}",
            )
        except json.JSONDecodeError:
            fail(f"validate json {code}")


def audit_db_integrity() -> None:
    print("\n=== 7. INTÉGRITÉ BASE ===")
    conn = sqlite3.connect(DB)
    tokens = conn.execute("SELECT COUNT(*) FROM collecte_tokens").fetchone()[0]
    ents = json.loads(conn.execute("SELECT payload FROM mission_state WHERE id=1").fetchone()[0])
    n_ent = len(ents.get("entretiens") or [])
    check(tokens == n_ent, f"tokens={tokens} entretiens={n_ent}", f"token mismatch {tokens}/{n_ent}")

    orphans = conn.execute(
        """
        SELECT COUNT(*) FROM dataroom_documents d
        LEFT JOIN dataroom_files f ON f.doc_id = d.id
        WHERE d.statut IN ('verse','a_verifier') AND (f.id IS NULL OR f.id = '')
        """
    ).fetchone()[0]
    if orphans:
        warn(f"{orphans} docs versés/a_verifier sans fichier")
    else:
        ok("0 orphelins dataroom")

    conn.close()


def audit_views_registered() -> None:
    print("\n=== 8. VUES FRONT (présence VIEWS.*) ===")
    html = (APP / "index.html").read_text(encoding="utf-8", errors="replace")
    base_views = re.findall(r"VIEWS\.(\w+)\s*=", html)
    for v in base_views:
        ok(f"VIEWS.{v} in index.html")

    # collecte_externe dans portia-collecte.js
    pc = (APP / "portia-collecte.js").read_text(encoding="utf-8", errors="replace")
    check("collecte_externe" in pc, "portia-collecte collecte_externe", "missing collecte_externe patch")

    # MISSION_VIEWS
    m = re.search(r'MISSION_VIEWS=\[([^\]]+)\]', html)
    if m:
        views = re.findall(r'"(\w+)"', m.group(1))
        check("collecte_externe" in views, "MISSION_VIEWS collecte_externe", "collecte_externe not in MISSION_VIEWS")


def main() -> int:
    print("AUDIT PLATEFORME PORTIA —", PUBLIC)
    if not DB.is_file():
        fail(f"DB missing {DB}")
        return 1

    clients: dict[str, Client] = {}
    try:
        audit_services()
        audit_assets()
        pub = audit_public_api()
        clients = make_sessions()
        ok(f"sessions: {list(clients.keys())}")
        audit_auth(clients)
        audit_core_api(clients)
        audit_collecte_flow(pub, clients)
        audit_db_integrity()
        audit_views_registered()
    finally:
        if clients:
            cleanup_sessions(clients)

    print("\n" + "=" * 50)
    print(f"PASS: {passed}  |  WARN: {len(warnings)}  |  FAIL: {len(failures)}")
    if warnings:
        print("\nAvertissements:")
        for w in warnings:
            print(f"  - {w}")
    if failures:
        print("\nÉchecs:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("\n=== AUDIT RÉUSSI ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

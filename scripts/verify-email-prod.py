#!/usr/bin/env python3
"""Vérifie migration e-mail + login sur le serveur (lancer dans /opt/portia-audit)."""
from __future__ import annotations

import json
import os
import sqlite3
import sys
from pathlib import Path


def load_env(app_dir: Path) -> None:
    p = app_dir / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k.strip(), v)


def main() -> int:
    app_dir = Path(os.environ.get("PORTIA_APP_DIR", "/opt/portia-audit"))
    os.chdir(app_dir)
    sys.path.insert(0, str(app_dir))
    load_env(app_dir)

    import enterprise_auth as eauth

    data_dir = Path(os.environ.get("DATA_DIR", "data"))
    db = data_dir / "portia.db"
    code = os.environ.get("MISSION_ACCESS_CODE", "")

    print("=== ENV email vars ===")
    for k in ("ADMIN_EMAIL", "JULIANA_EMAIL", "AUDITOR_B_EMAIL", "AUDITOR_T_EMAIL"):
        print(f"  {k}={os.environ.get(k, '(not set)')}")

    print("\n=== Users ===")
    conn = sqlite3.connect(db)
    for row in conn.execute(
        "SELECT id, email, role, active, totp_enabled FROM users ORDER BY role"
    ):
        print(f"  {row}")

    dup = conn.execute(
        "SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*)>1"
    ).fetchall()
    print("\n=== Duplicate emails ===", dup or "none")

    for em in (
        "diopasse@hotmail.fr",
        "auditeur.b@portia.local",
        "juliana@portia.local",
        "diopasse.pro@gmail.com",
        "jc@metaketing.io",
    ):
        r = conn.execute(
            "SELECT id, email, role, active FROM users WHERE email=?", (em,)
        ).fetchone()
        if r:
            print(f"  found {em}: {r}")

    print("\n=== Login tests ===")
    tests = [
        ("Asse new", "diopasse.pro@gmail.com", "AUDITEUR_B_PASSWORD"),
        ("Asse old hotmail", "diopasse@hotmail.fr", "AUDITEUR_B_PASSWORD"),
        ("Juliana", "jc@metaketing.io", "JULIANA_PASSWORD"),
        ("Juliana old", "juliana@portia.local", "JULIANA_PASSWORD"),
    ]
    # Fallback: latest team-passwords file on server (not in git)
    team_pw: dict[str, str] = {}
    for fp in sorted(app_dir.glob(".team-passwords-*.txt"), reverse=True):
        if "test" in fp.name or "jean" in fp.name:
            continue
        for line in fp.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "\t" not in line:
                continue
            em, pw = line.split("\t", 1)
            team_pw[em.strip().lower()] = pw.strip()

    email_aliases = {
        "diopasse.pro@gmail.com": ["diopasse@hotmail.fr", "auditeur.b@portia.local"],
        "jc@metaketing.io": ["juliana@portia.local"],
    }

    for label, email, env_key in tests:
        pwd = os.environ.get(env_key, "") or team_pw.get(email.lower(), "")
        if not pwd:
            for alias in email_aliases.get(email.lower(), []):
                pwd = team_pw.get(alias, "")
                if pwd:
                    break
        if not pwd:
            print(f"  {label}: skip (no {env_key})")
            continue
        r = eauth.authenticate(db, email, pwd, code, code)
        if r and r.get("token"):
            u = r.get("user") or {}
            print(f"  {label}: OK role={u.get('role')} email={u.get('email')}")
        elif r and r.get("totpRequired"):
            print(f"  {label}: password OK, totpRequired")
        elif r and r.get("totpSetupRequired"):
            print(f"  {label}: password OK, totpSetupRequired")
        else:
            print(f"  {label}: FAIL")

    state_path = data_dir / "state.json"
    if state_path.is_file():
        st = json.loads(state_path.read_text(encoding="utf-8"))
        prefs = (st.get("meta") or {}).get("notificationPrefs") or {}
        print("\n=== notificationPrefs keys ===")
        for k in sorted(prefs.keys()):
            print(f"  {k}")
    else:
        # state might be in sqlite
        print("\nstate.json not found; checking mission_state table...")
        try:
            row = conn.execute("SELECT payload FROM mission_state LIMIT 1").fetchone()
            if row:
                st = json.loads(row[0])
                prefs = (st.get("meta") or {}).get("notificationPrefs") or {}
                print("notificationPrefs keys:", list(prefs.keys()))
        except sqlite3.Error:
            pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

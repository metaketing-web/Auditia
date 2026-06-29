#!/usr/bin/env python3
"""Régénère les mots de passe équipe (hash PBKDF2) — à lancer sur le serveur."""
from __future__ import annotations

import os
import secrets
import sqlite3
import string
from datetime import datetime, timezone
from pathlib import Path

import enterprise_auth as eauth

APP_DIR = Path(os.environ.get("PORTIA_APP_DIR", "/opt/portia-audit"))
DB_PATH = Path(os.environ.get("DATA_DIR", str(APP_DIR / "data"))) / "portia.db"

ACCOUNTS = [
    ("ac@metaketing.io", "ADMIN_PASSWORD"),
    ("jc@metaketing.io", "JULIANA_PASSWORD"),
    ("diopasse@hotmail.fr", "AUDITEUR_B_PASSWORD"),
    ("lbaoka@gmail.com", "AUDITEUR_T_PASSWORD"),
    ("jeanmajax234@gmail.com", "AUDITEUR_TEST_PASSWORD"),
    ("cabinet@mpjipsc.local", "CABINET_PASSWORD"),
    ("rplurielles@gmail.com", "CABINET_TEST_PASSWORD"),
]


def _gen_password(length: int = 18) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.islower() for c in pwd) and any(c.isupper() for c in pwd) and any(c.isdigit() for c in pwd):
            return pwd


def main() -> None:
    if not DB_PATH.is_file():
        raise SystemExit(f"Base introuvable: {DB_PATH}")
    out = APP_DIR / f".team-passwords-{datetime.now(timezone.utc).strftime('%Y%m%d')}.txt"
    lines: list[str] = []
    with sqlite3.connect(DB_PATH) as conn:
        for email, env_key in ACCOUNTS:
            pwd = os.environ.get(env_key, "").strip() or _gen_password()
            ph = eauth._hash_password(pwd)
            cur = conn.execute(
                "UPDATE users SET password_hash = ?, active = 1 WHERE email = ?",
                (ph, email.lower()),
            )
            if cur.rowcount == 0:
                lines.append(f"# ABSENT {email}")
                continue
            lines.append(f"{email}\t{pwd}")
        conn.execute("DELETE FROM sessions")
        conn.commit()
    out.write_text(
        "# Mots de passe Skydeen — conserver en lieu sûr puis SUPPRIMER ce fichier\n"
        f"# Généré {datetime.now(timezone.utc).isoformat()}\n"
        + "\n".join(lines)
        + "\n",
        encoding="utf-8",
    )
    out.chmod(0o600)
    print(f"OK — {len(lines)} comptes mis à jour. Sessions révoquées.")
    print(f"Fichier (chmod 600): {out}")
    print("Lisez-le une fois sur le serveur, puis: rm", out.name)


if __name__ == "__main__":
    main()

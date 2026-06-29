"""Auth, sessions, RBAC — SQLite (compatible migration PostgreSQL)."""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import enterprise_totp as etotp

ROLES = ("admin", "juliana", "auditeur_b", "auditeur_t", "cabinet")

PERMISSIONS: dict[str, set[str]] = {
    "admin": {"*"},
    "juliana": {"*"},
    "auditeur_b": {
        "read", "write_collecte", "conduct", "depot", "constats_write", "assistant",
    },
    "auditeur_t": {
        "read", "write_collecte", "conduct", "depot", "constats_write", "assistant",
    },
    "cabinet": {"read", "cabinet_view", "assistant_read", "depot"},
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        _, salt, hexd = stored.split("$", 2)
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
        return secrets.compare_digest(check, hexd)
    except Exception:
        return False


def init_auth_schema(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        from enterprise_security import apply_sqlite_pragmas

        apply_sqlite_pragmas(conn)
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
            """
        )
        conn.commit()
        _migrate_users_totp(conn)
        _migrate_admin_email(conn)
        _migrate_juliana_email(conn)
        _migrate_auditor_emails(conn)


ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "ac@metaketing.io").strip().lower()
JULIANA_EMAIL = os.environ.get("JULIANA_EMAIL", "jc@metaketing.io").strip().lower()
AUDITOR_B_EMAIL = os.environ.get("AUDITOR_B_EMAIL", "diopasse@hotmail.fr").strip().lower()
AUDITOR_T_EMAIL = os.environ.get("AUDITOR_T_EMAIL", "lbaoka@gmail.com").strip().lower()


def _migrate_admin_email(conn: sqlite3.Connection) -> None:
    """Ancien compte admin@portia.local → e-mail réel pour 2FA / notifications."""
    if not ADMIN_EMAIL:
        return
    row = conn.execute(
        "SELECT id, email FROM users WHERE id = 'u_admin' OR email IN ('admin@portia.local', ?)",
        (ADMIN_EMAIL,),
    ).fetchone()
    if not row:
        return
    uid, current = row[0], (row[1] or "").lower()
    if current == ADMIN_EMAIL:
        return
    clash = conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        (ADMIN_EMAIL, uid),
    ).fetchone()
    if clash:
        return
    conn.execute("UPDATE users SET email = ? WHERE id = ?", (ADMIN_EMAIL, uid))
    conn.commit()


def _migrate_juliana_email(conn: sqlite3.Connection) -> None:
    """Compte pilotage Juliana — e-mail réel pour connexion / 2FA."""
    if not JULIANA_EMAIL:
        return
    row = conn.execute(
        "SELECT id, email FROM users WHERE id = 'u_juliana' OR email IN ('juliana@portia.local', ?)",
        (JULIANA_EMAIL,),
    ).fetchone()
    if not row:
        return
    uid, current = row[0], (row[1] or "").lower()
    if current == JULIANA_EMAIL:
        return
    clash = conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        (JULIANA_EMAIL, uid),
    ).fetchone()
    if clash:
        return
    conn.execute(
        "UPDATE users SET email = ?, display_name = ? WHERE id = ?",
        (JULIANA_EMAIL, "Juliana", uid),
    )
    conn.commit()


def _migrate_auditor_emails(conn: sqlite3.Connection) -> None:
    """Comptes terrain nominatifs — Asse (B) et Laetitia (T)."""
    for uid, email, name in (
        ("u_aud_b", AUDITOR_B_EMAIL, "Asse"),
        ("u_aud_t", AUDITOR_T_EMAIL, "Laetitia"),
    ):
        if not email:
            continue
        row = conn.execute("SELECT id, email FROM users WHERE id = ?", (uid,)).fetchone()
        if not row:
            continue
        current = (row[1] or "").lower()
        if current == email:
            continue
        clash = conn.execute(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            (email, uid),
        ).fetchone()
        if clash:
            conn.execute("UPDATE users SET active = 0 WHERE id = ?", (clash[0],))
        conn.execute(
            "UPDATE users SET email = ?, display_name = ? WHERE id = ?",
            (email, name, uid),
        )
    row = conn.execute("SELECT id FROM users WHERE id = 'u_test_auditeur'").fetchone()
    if row and os.environ.get("ENABLE_TEST_AUDITOR", "").lower() not in ("1", "true", "yes"):
        conn.execute(
            "UPDATE users SET active = 0 WHERE id = 'u_test_auditeur'"
        )
    conn.commit()


def _migrate_users_totp(conn: sqlite3.Connection) -> None:
    cols = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "totp_secret" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN totp_secret TEXT")
    if "totp_enabled" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0")
    conn.commit()


def upsert_user(
    db_path: Path,
    email: str,
    display_name: str,
    role: str,
    password: str,
    *,
    user_id: Optional[str] = None,
) -> str:
    if role not in ROLES:
        raise ValueError(f"Rôle invalide: {role}")
    email = email.strip().lower()
    uid = user_id or ("u_" + email.split("@")[0].replace(".", "_")[:40])
    ph = _hash_password(password)
    with sqlite3.connect(db_path) as conn:
        if user_id:
            by_id = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
            if by_id:
                clash = conn.execute(
                    "SELECT id FROM users WHERE email = ? AND id != ?",
                    (email, user_id),
                ).fetchone()
                if clash:
                    conn.execute("UPDATE users SET active = 0 WHERE id = ?", (clash[0],))
                conn.execute(
                    """
                    UPDATE users SET email = ?, display_name = ?, role = ?, password_hash = ?, active = 1
                    WHERE id = ?
                    """,
                    (email, display_name, role, ph, user_id),
                )
                conn.commit()
                return user_id
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if row:
            conn.execute(
                """
                UPDATE users SET display_name = ?, role = ?, password_hash = ?, active = 1
                WHERE email = ?
                """,
                (display_name, role, ph, email),
            )
            uid = row[0]
        else:
            conn.execute(
                """
                INSERT INTO users (id, email, display_name, role, password_hash, active, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?)
                """,
                (uid, email, display_name, role, ph, _now()),
            )
        conn.commit()
    return uid


def seed_team_users(db_path: Path) -> int:
    """Comptes nominatifs depuis MISSION_TEAM_JSON ou MISSION_TEAM_FILE (hors git).

    Par défaut : crée les comptes manquants uniquement — ne réécrit pas les mots de passe
    existants (évite la rotation involontaire à chaque déploiement).
    FORCE_TEAM_PASSWORD_SYNC=1 pour forcer la synchro des mots de passe depuis la source.
    """
    candidates: list[dict[str, Any]] = []
    raw = os.environ.get("MISSION_TEAM_JSON", "").strip()
    if raw:
        try:
            candidates = json.loads(raw)
        except json.JSONDecodeError:
            pass
    if not candidates:
        team_file = os.environ.get("MISSION_TEAM_FILE", "").strip()
        if not team_file:
            return 0
        p = Path(team_file)
        if p.is_file():
            try:
                candidates = json.loads(p.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                candidates = []
    if not isinstance(candidates, list):
        return 0
    force_sync = os.environ.get("FORCE_TEAM_PASSWORD_SYNC", "").lower() in ("1", "true", "yes")
    n = 0
    for u in candidates:
        if not isinstance(u, dict):
            continue
        email = (u.get("email") or "").strip()
        role = (u.get("role") or "").strip()
        name = (u.get("name") or email).strip()
        pwd = (u.get("password") or "").strip()
        uid = (u.get("id") or "").strip() or None
        if not email or not role:
            continue
        with sqlite3.connect(db_path) as conn:
            row = None
            if uid:
                row = conn.execute("SELECT id FROM users WHERE id = ?", (uid,)).fetchone()
            if not row:
                row = conn.execute(
                    "SELECT id FROM users WHERE email = ?", (email.lower(),)
                ).fetchone()
        if row and not force_sync:
            continue
        if not pwd:
            continue
        upsert_user(db_path, email, name, role, pwd, user_id=uid)
        n += 1
    return n


def _default_seed_disabled() -> bool:
    explicit = os.environ.get("DISABLE_DEFAULT_USER_SEED", "").strip().lower()
    if explicit in ("0", "false", "no"):
        return False
    if explicit in ("1", "true", "yes"):
        return True
    require_auth = os.environ.get("REQUIRE_AUTH", "true").lower() in ("1", "true", "yes")
    return require_auth


def seed_default_users(db_path: Path) -> None:
    if _default_seed_disabled():
        return
    accounts = [
        ("u_admin", ADMIN_EMAIL or "ac@metaketing.io", "Directeur de Projet Audit", "admin", "ADMIN_PASSWORD"),
        ("u_juliana", JULIANA_EMAIL or "jc@metaketing.io", "Juliana", "juliana", "JULIANA_PASSWORD"),
        ("u_aud_b", AUDITOR_B_EMAIL or "diopasse@hotmail.fr", "Asse", "auditeur_b", "AUDITEUR_B_PASSWORD"),
        ("u_aud_t", AUDITOR_T_EMAIL or "lbaoka@gmail.com", "Laetitia", "auditeur_t", "AUDITEUR_T_PASSWORD"),
        ("u_cabinet", "cabinet@mpjipsc.local", "Vue Cabinet", "cabinet", "CABINET_PASSWORD"),
    ]
    with sqlite3.connect(db_path) as conn:
        for uid, email, name, role, env_key in accounts:
            pwd = os.environ.get(env_key, "").strip()
            if not pwd:
                continue
            exists = conn.execute("SELECT 1 FROM users WHERE id = ?", (uid,)).fetchone()
            if exists:
                continue
            conn.execute(
                """
                INSERT INTO users (id, email, display_name, role, password_hash, active, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?)
                """,
                (uid, email, name, role, _hash_password(pwd), _now()),
            )
        conn.commit()


def _require_totp_pilotage() -> bool:
    return os.environ.get("REQUIRE_TOTP_PILOTAGE", "").lower() in ("1", "true", "yes")


def _session_days_for_role(role: str) -> int:
    if etotp.role_eligible(role):
        days = int(os.environ.get("SESSION_DAYS_PILOTAGE", os.environ.get("SESSION_DAYS", "1")))
    else:
        days = int(os.environ.get("SESSION_DAYS", "2"))
    return max(1, min(days, 30))


def authenticate(
    db_path: Path,
    email: str,
    password: str,
    mission_code: str,
    expected_code: str,
    totp_code: str = "",
) -> Optional[dict[str, Any]]:
    if expected_code and mission_code.strip() != expected_code.strip():
        return None
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM users WHERE email = ? AND active = 1",
            (email.strip().lower(),),
        ).fetchone()
    if not row or not _verify_password(password, row["password_hash"]):
        return None
    totp_enabled = bool(row["totp_enabled"]) if "totp_enabled" in row.keys() else False
    totp_secret = (row["totp_secret"] or "") if "totp_secret" in row.keys() else ""
    role = row["role"]
    totp_setup_required = (
        _require_totp_pilotage() and etotp.role_eligible(role) and not totp_enabled
    )
    if totp_secret and not totp_enabled:
        code = (totp_code or "").strip()
        if code:
            if not etotp.verify_totp(totp_secret, code):
                return {"totpInvalid": True}
            with sqlite3.connect(db_path) as conn:
                conn.execute("UPDATE users SET totp_enabled = 1 WHERE id = ?", (row["id"],))
                conn.commit()
            totp_enabled = True
            totp_setup_required = False
    if totp_enabled and totp_secret:
        if not (totp_code or "").strip():
            return {"totpRequired": True}
        if not etotp.verify_totp(totp_secret, totp_code):
            return {"totpInvalid": True}
    token = secrets.token_urlsafe(32)
    session_days = _session_days_for_role(role)
    expires = (datetime.now(timezone.utc) + timedelta(days=session_days)).isoformat()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (token, row["id"], expires, _now()),
        )
        conn.commit()
    return {
        "token": token,
        "totpSetupRequired": totp_setup_required,
        "user": {
            "id": row["id"],
            "email": row["email"],
            "name": row["display_name"],
            "role": row["role"],
            "permissions": list(PERMISSIONS.get(row["role"], {"read"})),
            "readOnly": row["role"] == "cabinet",
            "totpEnabled": totp_enabled,
            "totpSetupRequired": totp_setup_required,
        },
    }


def totp_status(db_path: Path, user_id: str) -> dict[str, Any]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT role, totp_enabled, totp_secret FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return {"eligible": False, "enabled": False, "pending": False}
    enabled = bool(row["totp_enabled"])
    pending = bool(row["totp_secret"]) and not enabled
    return {
        "eligible": etotp.role_eligible(row["role"]),
        "enabled": enabled,
        "pending": pending,
    }


def totp_begin_setup(db_path: Path, user_id: str, email: str) -> dict[str, str]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT totp_secret, totp_enabled FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        resumed = bool(row and row["totp_secret"] and not bool(row["totp_enabled"]))
        if resumed:
            secret = row["totp_secret"]
        else:
            secret = etotp.generate_secret()
            conn.execute(
                "UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?",
                (secret, user_id),
            )
            conn.commit()
    return {
        "secret": secret,
        "uri": etotp.provisioning_uri(secret, email),
        "resumed": resumed,
    }


def totp_confirm_setup(db_path: Path, user_id: str, code: str) -> bool:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT totp_secret FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row or not row["totp_secret"]:
            return False
        if not etotp.verify_totp(row["totp_secret"], code):
            return False
        conn.execute("UPDATE users SET totp_enabled = 1 WHERE id = ?", (user_id,))
        conn.commit()
    return True


def totp_disable(db_path: Path, user_id: str, password: str, code: str) -> bool:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT password_hash, totp_secret, totp_enabled FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row or not _verify_password(password, row["password_hash"]):
            return False
        if row["totp_enabled"] and row["totp_secret"] and not etotp.verify_totp(row["totp_secret"], code):
            return False
        conn.execute("UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?", (user_id,))
        conn.commit()
    return True


def revoke_session(db_path: Path, token: Optional[str]) -> None:
    if not token:
        return
    with sqlite3.connect(db_path) as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token.strip(),))
        conn.commit()


def purge_expired_sessions(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (_now(),))
        conn.commit()


def resolve_session(db_path: Path, token: Optional[str]) -> Optional[dict[str, Any]]:
    if not token:
        return None
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT s.token, s.expires_at, u.id, u.email, u.display_name, u.role,
                   COALESCE(u.totp_enabled, 0) AS totp_enabled
            FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token = ? AND u.active = 1
            """,
            (token,),
        ).fetchone()
    if not row:
        return None
    if row["expires_at"] < _now():
        return None
    role = row["role"]
    totp_enabled = bool(row["totp_enabled"])
    totp_setup_required = (
        _require_totp_pilotage() and etotp.role_eligible(role) and not totp_enabled
    )
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["display_name"],
        "role": role,
        "permissions": list(PERMISSIONS.get(role, {"read"})),
        "readOnly": role == "cabinet",
        "totpEnabled": totp_enabled,
        "totpSetupRequired": totp_setup_required,
    }


def has_permission(user: Optional[dict[str, Any]], perm: str) -> bool:
    if not user:
        return False
    perms = set(user.get("permissions") or [])
    if "*" in perms:
        return True
    return perm in perms


def is_pilotage(user: Optional[dict[str, Any]]) -> bool:
    if not user:
        return False
    return user.get("role") in ("admin", "juliana")


def can_write(user: Optional[dict[str, Any]], perm: str = "write") -> bool:
    if not user:
        return False
    if user.get("readOnly"):
        return False
    perms = set(user.get("permissions") or [])
    return "*" in perms or perm in perms or "write_collecte" in perms


def can_deposit(user: Optional[dict[str, Any]]) -> bool:
    """Versement Data Room — autorisé pour auditeurs, pilotage et Cabinet MPJIPSC."""
    if not user:
        return False
    if can_write(user):
        return True
    perms = set(user.get("permissions") or [])
    return "depot" in perms or "write_collecte" in perms


def ics_feed_token_for_user(user_id: str, secret: str) -> str:
    import hashlib

    raw = f"ics:{user_id}:{secret}".encode()
    return hashlib.sha256(raw).hexdigest()[:40]


def validate_ics_feed_token(token: str, db_path: Path, secret: str) -> bool:
    if not token or not secret:
        return False
    allow_shared = os.environ.get("DISABLE_SHARED_ICS_TOKEN", "1").lower() not in (
        "1",
        "true",
        "yes",
    )
    if allow_shared and secrets.compare_digest(token, secret):
        return True
    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            "SELECT id FROM users WHERE active = 1 AND role IN ('admin', 'juliana')"
        ).fetchall()
    for (uid,) in rows:
        expected = ics_feed_token_for_user(uid, secret)
        if secrets.compare_digest(token, expected):
            return True
    return False



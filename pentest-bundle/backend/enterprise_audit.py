"""Journal d'audit détaillé — qui modifie quoi."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


def init_audit_schema(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS audit_journal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                user_name TEXT,
                user_role TEXT,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id TEXT,
                detail TEXT,
                ip_address TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_audit_journal_at ON audit_journal(created_at);
            CREATE INDEX IF NOT EXISTS idx_audit_journal_user ON audit_journal(user_id);
            """
        )
        conn.commit()


def journal(
    db_path: Path,
    *,
    user: Optional[dict[str, Any]],
    action: str,
    entity_type: str = "",
    entity_id: str = "",
    detail: Any = None,
    ip: str = "",
) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO audit_journal
            (user_id, user_name, user_role, action, entity_type, entity_id, detail, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user.get("id") if user else "",
                user.get("name") if user else "système",
                user.get("role") if user else "",
                action,
                entity_type,
                entity_id,
                json.dumps(detail, ensure_ascii=False) if detail is not None else "",
                ip,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()


def list_journal(db_path: Path, limit: int = 200) -> list[dict[str, Any]]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT * FROM audit_journal ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]

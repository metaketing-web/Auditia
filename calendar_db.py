"""Connexions calendrier OAuth (Google / Microsoft) — SQLite."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_calendar_schema(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS calendar_connections (
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                expires_at TEXT,
                calendar_id TEXT,
                email TEXT,
                meta TEXT,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, provider)
            )
            """
        )
        conn.commit()


def save_connection(
    db_path: Path,
    user_id: str,
    provider: str,
    access_token: str,
    *,
    refresh_token: Optional[str] = None,
    expires_at: Optional[str] = None,
    calendar_id: Optional[str] = None,
    email: Optional[str] = None,
    meta: Optional[dict[str, Any]] = None,
) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO calendar_connections
            (user_id, provider, access_token, refresh_token, expires_at, calendar_id, email, meta, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                provider,
                access_token,
                refresh_token,
                expires_at,
                calendar_id or ("primary" if provider == "google" else None),
                email,
                json.dumps(meta or {}, ensure_ascii=False),
                _now(),
            ),
        )
        conn.commit()


def get_connection(db_path: Path, user_id: str, provider: str) -> Optional[dict[str, Any]]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM calendar_connections WHERE user_id = ? AND provider = ?",
            (user_id, provider),
        ).fetchone()
    if not row:
        return None
    return {
        "user_id": row["user_id"],
        "provider": row["provider"],
        "access_token": row["access_token"],
        "refresh_token": row["refresh_token"],
        "expires_at": row["expires_at"],
        "calendar_id": row["calendar_id"],
        "email": row["email"],
        "meta": json.loads(row["meta"] or "{}"),
        "updated_at": row["updated_at"],
    }


def delete_connection(db_path: Path, user_id: str, provider: str) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "DELETE FROM calendar_connections WHERE user_id = ? AND provider = ?",
            (user_id, provider),
        )
        conn.commit()


def list_connections(db_path: Path, user_id: str) -> list[dict[str, Any]]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT provider, email, calendar_id, expires_at, updated_at FROM calendar_connections WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]

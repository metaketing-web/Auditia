"""Points de restauration de l'état mission (auto-save horodaté)."""
from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

MAX_SNAPSHOTS = 40


def init_snapshot_schema(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS state_snapshots (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                created_at TEXT NOT NULL,
                created_by TEXT,
                created_by_name TEXT,
                payload TEXT NOT NULL,
                size_bytes INTEGER NOT NULL DEFAULT 0,
                auto INTEGER NOT NULL DEFAULT 1
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_state_snapshots_at ON state_snapshots(created_at DESC)"
        )
        conn.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def list_snapshots(db_path: Path, limit: int = 40) -> list[dict[str, Any]]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT id, label, created_at, created_by, created_by_name, size_bytes, auto
            FROM state_snapshots
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def create_snapshot(
    db_path: Path,
    payload: dict[str, Any],
    *,
    label: str,
    user: Optional[dict[str, Any]] = None,
    auto: bool = True,
) -> dict[str, Any]:
    init_snapshot_schema(db_path)
    raw = json.dumps(payload, ensure_ascii=False)
    snap_id = str(uuid.uuid4())
    created_at = _now()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO state_snapshots
            (id, label, created_at, created_by, created_by_name, payload, size_bytes, auto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                snap_id,
                label,
                created_at,
                (user or {}).get("id", ""),
                (user or {}).get("name", ""),
                raw,
                len(raw.encode("utf-8")),
                1 if auto else 0,
            ),
        )
        excess = conn.execute("SELECT COUNT(*) FROM state_snapshots").fetchone()[0]
        if excess > MAX_SNAPSHOTS:
            conn.execute(
                """
                DELETE FROM state_snapshots WHERE id IN (
                    SELECT id FROM state_snapshots
                    ORDER BY created_at ASC
                    LIMIT ?
                )
                """,
                (excess - MAX_SNAPSHOTS,),
            )
        conn.commit()
    return {
        "id": snap_id,
        "label": label,
        "createdAt": created_at,
        "createdBy": (user or {}).get("name", ""),
        "sizeBytes": len(raw.encode("utf-8")),
        "auto": auto,
    }


def get_snapshot_payload(db_path: Path, snap_id: str) -> Optional[dict[str, Any]]:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT payload FROM state_snapshots WHERE id = ?", (snap_id,)
        ).fetchone()
    if not row:
        return None
    return json.loads(row[0])


def delete_snapshot(db_path: Path, snap_id: str) -> bool:
    with sqlite3.connect(db_path) as conn:
        cur = conn.execute("DELETE FROM state_snapshots WHERE id = ?", (snap_id,))
        conn.commit()
        return cur.rowcount > 0

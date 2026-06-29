"""Persistance SQLite des réponses aux questionnaires d'entretien."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def init_questionnaire_schema(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS interview_questionnaire (
                entretien_id TEXT NOT NULL,
                phase TEXT NOT NULL,
                question_id TEXT NOT NULL,
                answer TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL,
                PRIMARY KEY (entretien_id, phase, question_id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS interview_questionnaire_meta (
                entretien_id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def save_questionnaire(db_path: Path, entretien_id: str, data: dict[str, Any]) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "DELETE FROM interview_questionnaire WHERE entretien_id = ?",
            (entretien_id,),
        )
        for phase, answers in data.items():
            if not isinstance(answers, dict):
                continue
            for qid, ans in answers.items():
                conn.execute(
                    """
                    INSERT INTO interview_questionnaire
                    (entretien_id, phase, question_id, answer, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (entretien_id, phase, qid, str(ans or ""), ts),
                )
        conn.execute(
            """
            INSERT OR REPLACE INTO interview_questionnaire_meta
            (entretien_id, payload, updated_at) VALUES (?, ?, ?)
            """,
            (entretien_id, json.dumps(data, ensure_ascii=False), ts),
        )
        conn.commit()


def load_questionnaire(db_path: Path, entretien_id: str) -> dict[str, Any]:
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT payload FROM interview_questionnaire_meta WHERE entretien_id = ?",
            (entretien_id,),
        ).fetchone()
    if row and row[0]:
        return json.loads(row[0])
    return {"invest": {}, "confront": {}, "coconstruct": {}}


def merge_questionnaire_into_state(
    db_path: Path, get_state_fn, set_state_fn, entretien_id: str, questionnaire: dict[str, Any]
) -> None:
    state = get_state_fn()
    if not state or "entretiens" not in state:
        return
    for ent in state["entretiens"]:
        if ent.get("id") == entretien_id:
            ent["questionnaire"] = questionnaire
            break
    set_state_fn(state)
    save_questionnaire(db_path, entretien_id, questionnaire)

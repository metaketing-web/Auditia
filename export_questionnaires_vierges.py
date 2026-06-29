#!/usr/bin/env python3
"""Exporte un fichier Word (.doc) par entretien — questionnaire vierge uniquement."""
from __future__ import annotations

import json
import os
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import enterprise_item_export as eitem

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("PORTIA_DB", ROOT / "data" / "portia.db"))
OUT_DIR = Path(os.environ.get("PORTIA_EXPORT_DIR", ROOT / "exports-word" / "questionnaires_vierges"))
ZIP_PATH = Path(os.environ.get("PORTIA_EXPORT_ZIP", ROOT / "questionnaires-vierges.zip"))


def load_state() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM mission_state LIMIT 1").fetchone()
    if not row:
        raise SystemExit(f"mission_state vide ({DB_PATH})")
    return json.loads(row[0])


def main() -> None:
    state = load_state()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for f in OUT_DIR.glob("*.doc"):
        f.unlink()

    counts = {"ok": 0, "errors": []}
    for ent in state.get("entretiens") or []:
        eid = ent.get("id")
        if not eid:
            continue
        try:
            data, fname, _ = eitem.export_entretien_questionnaire_vierge(state, eid, "doc")
            (OUT_DIR / fname).write_bytes(data)
            counts["ok"] += 1
        except Exception as ex:
            counts["errors"].append(f"{eid} ({ent.get('n')}): {ex}")

    manifest = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "db": str(DB_PATH),
        "count": counts["ok"],
        "errors": counts["errors"],
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    data, _, _ = eitem.export_all_questionnaires_vierges_zip(state)
    ZIP_PATH.write_bytes(data)

    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    print("Dossier:", OUT_DIR)
    print("ZIP:", ZIP_PATH, "size:", ZIP_PATH.stat().st_size)


if __name__ == "__main__":
    main()

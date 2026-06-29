#!/usr/bin/env python3
"""Annule les versements démo (fichiers + statut attendu/relance) sans supprimer les fiches doc."""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import dataroom_db as dr
import enterprise_security as esec

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("PORTIA_DB", ROOT / "data" / "portia.db"))
UPLOAD_DIR = Path(os.environ.get("PORTIA_UPLOAD_DIR", ROOT / "data" / "uploads"))

# Statuts d'origine (SEED_DOCS index.html)
ORIGINAL_STATUT = {
    ("R2", "CABINET", "fiches-poste-directions"): "attendu",
    ("R3", "DPSD", "referentiel-donnees"): "attendu",
    ("R3", "NNI", "modalites-acces-nni"): "attendu",
    ("R4", "AEJ", "base-beneficiaires-aej"): "attendu",
    ("R4", "PEJEDEC", "base-beneficiaires-pejedec"): "attendu",
    ("R4", "USEP", "rapport-activite-usep-2025"): "attendu",
    ("R5", "DAF", "budget-programmes-2026"): "attendu",
    ("R5", "DAF", "export-sigfip-execution"): "attendu",
    ("R5", "SIGFIP", "modalites-raccordement-sigfip"): "relance",
    ("R6", "DRH", "etat-effectifs-ministere"): "attendu",
    ("R7", "DSI", "cartographie-applicative"): "attendu",
    ("R7", "DSI", "architecture-reseau-ipv6"): "relance",
    ("R7", "UXP", "specs-raccordement-xroad"): "relance",
    ("R8", "PATRI", "inventaire-flotte-automobile"): "attendu",
    ("R9", "DAJC", "conventions-bailleurs"): "attendu",
    ("R10", "BAD", "template-reporting-bad"): "attendu",
    ("R11", "DR-ABJ", "procedures-saisie-regionales"): "attendu",
}

DEMO_MARKERS = ("génération démo", "generation demo", "Skydeen — génération")


def get_state() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM mission_state WHERE id = 1").fetchone()
    return json.loads(row[0]) if row else {}


def set_state(state: dict) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE mission_state SET payload = ?, updated_at = ? WHERE id = 1",
            (json.dumps(state, ensure_ascii=False), ts),
        )
        conn.commit()


def is_demo_deposit(doc: dict) -> bool:
    par = (doc.get("par") or "").lower()
    name = (doc.get("normalizedName") or "").lower()
    if any(m.lower() in par for m in DEMO_MARKERS):
        return True
    if doc.get("statut") != "verse":
        return False
    key = (doc.get("rep"), doc.get("source"), doc.get("desc"))
    return key in ORIGINAL_STATUT and doc.get("fileId")


def revert_one(db_path: Path, upload_dir: Path, doc: dict) -> bool:
    key = (doc.get("rep"), doc.get("source"), doc.get("desc"))
    statut = ORIGINAL_STATUT.get(key, "attendu")
    doc_id = doc["id"]
    ts = datetime.now(timezone.utc).isoformat()

    with dr._connect(db_path) as conn:
        files = conn.execute(
            "SELECT id, stored_path FROM dataroom_files WHERE doc_id = ?", (doc_id,)
        ).fetchall()
        for fr in files:
            if upload_dir is not None:
                safe = esec.safe_download_path(fr["stored_path"], upload_dir)
                if safe and safe.is_file():
                    safe.unlink(missing_ok=True)
            conn.execute("DELETE FROM dataroom_files WHERE id = ?", (fr["id"],))
        conn.execute("DELETE FROM uploaded_files WHERE doc_id = ?", (doc_id,))
        conn.execute(
            """
            UPDATE dataroom_documents SET
                statut = ?, file_id = '', size_label = '', uploaded_by = '',
                mission_j = NULL, normalized_name = '', updated_at = ?
            WHERE id = ?
            """,
            (statut, ts, doc_id),
        )
        conn.commit()
    return True


def main() -> None:
    dr.init_dataroom_schema(DB_PATH)
    docs = dr.list_documents(DB_PATH)
    targets = [d for d in docs if is_demo_deposit(d)]
    reverted = []
    for d in targets:
        revert_one(DB_PATH, UPLOAD_DIR, d)
        reverted.append(
            {
                "id": d["id"],
                "rep": d["rep"],
                "source": d["source"],
                "desc": d["desc"],
                "statut": ORIGINAL_STATUT.get((d["rep"], d["source"], d["desc"]), "attendu"),
            }
        )
    dr.sync_state_docs(DB_PATH, get_state, set_state)
    print(json.dumps({"reverted": len(reverted), "docs": reverted}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

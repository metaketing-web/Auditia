#!/usr/bin/env python3
"""Génère et verse les documents Data Room encore attendus / en relance."""
from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

import dataroom_db as dr
import dataroom_doc_factory as ddf

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("PORTIA_DB", ROOT / "data" / "portia.db"))
UPLOAD_DIR = Path(os.environ.get("PORTIA_UPLOAD_DIR", ROOT / "data" / "uploads"))
OUT_DIR = Path(os.environ.get("PORTIA_PREVU_OUT", ROOT / "demo-documents" / "prevu"))
MISSION_J = int(os.environ.get("PORTIA_MISSION_J", "8"))
UPLOADED_BY = os.environ.get("PORTIA_UPLOADED_BY", "Skydeen — génération démo")

TARGET_STATUTS = frozenset({"attendu", "relance"})

SPECS = [
    ("R2", "CABINET", "DOC", "fiches-poste-directions", "docx"),
    ("R3", "DPSD", "REF", "referentiel-donnees", "xlsx"),
    ("R3", "NNI", "DOC", "modalites-acces-nni", "pdf"),
    ("R4", "AEJ", "BASE", "base-beneficiaires-aej", "csv"),
    ("R4", "PEJEDEC", "BASE", "base-beneficiaires-pejedec", "csv"),
    ("R4", "USEP", "RAPPORT", "rapport-activite-usep-2025", "pdf"),
    ("R5", "DAF", "BUDGET", "budget-programmes-2026", "xlsx"),
    ("R5", "DAF", "EXPORT", "export-sigfip-execution", "xlsx"),
    ("R5", "SIGFIP", "DOC", "modalites-raccordement-sigfip", "pdf"),
    ("R6", "DRH", "EFFECTIF", "etat-effectifs-ministere", "xlsx"),
    ("R7", "DSI", "DOC", "cartographie-applicative", "pdf"),
    ("R7", "DSI", "DOC", "architecture-reseau-ipv6", "pdf"),
    ("R7", "UXP", "SPEC", "specs-raccordement-xroad", "pdf"),
    ("R8", "PATRI", "INVENTAIRE", "inventaire-flotte-automobile", "xlsx"),
    ("R9", "DAJC", "CONVENTION", "conventions-bailleurs", "pdf"),
    ("R10", "BAD", "MODELE", "template-reporting-bad", "pdf"),
    ("R11", "DR-ABJ", "DOC", "procedures-saisie-regionales", "pdf"),
]


def get_state() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM mission_state WHERE id = 1").fetchone()
    if not row:
        return {}
    return json.loads(row[0])


def set_state(state: dict) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE mission_state SET payload = ?, updated_at = ? WHERE id = 1",
            (json.dumps(state, ensure_ascii=False), ts),
        )
        conn.commit()


def find_doc(docs: list[dict], rep: str, source: str, desc: str) -> dict | None:
    for d in docs:
        if d.get("rep") == rep and d.get("source") == source and d.get("desc") == desc:
            return d
    return None


def main() -> None:
    dr.init_dataroom_schema(DB_PATH)
    dr.seed_repositories(DB_PATH)
    state = get_state()
    if state.get("docs"):
        dr.import_docs_from_state(DB_PATH, state["docs"])
    docs = dr.list_documents(DB_PATH)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {"ok": [], "skipped": [], "errors": []}

    for rep, source, doc_type, desc, fmt in SPECS:
        key = f"{rep}/{source}/{desc}"
        doc = find_doc(docs, rep, source, desc)
        if not doc:
            doc = find_doc(dr.list_documents(DB_PATH), rep, source, desc)
        if not doc:
            results["errors"].append(f"{key}: métadonnée introuvable")
            continue
        if doc.get("fileId") and doc.get("statut") == "verse":
            results["skipped"].append(f"{key}: déjà versé")
            continue
        if doc.get("statut") not in TARGET_STATUTS and not doc.get("fileId"):
            pass  # relance / attendu — on verse quand même si pas de fichier

        try:
            content = ddf.generate_document(rep, source, doc_type, desc, fmt)
            fname = ddf.normalized_filename(rep, source, doc_type, desc, "v1", fmt)
            (OUT_DIR / fname).write_bytes(content)

            fid = str(uuid.uuid4())
            dr.deposit_file(
                DB_PATH,
                UPLOAD_DIR,
                file_id=fid,
                doc_id=doc["id"],
                content=content,
                original_name=fname,
                mime_type=ddf.mime_for(fmt),
                rep=rep,
                source=source,
                doc_type=doc_type,
                description=desc,
                version=doc.get("version") or "v1",
                fmt=fmt,
                mission_j=MISSION_J,
                uploaded_by=UPLOADED_BY,
                existing_doc_id=doc["id"],
            )
            results["ok"].append({"key": key, "file": fname, "bytes": len(content)})
        except Exception as ex:
            results["errors"].append(f"{key}: {ex}")

    dr.sync_state_docs(DB_PATH, get_state, set_state)
    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "missionJ": MISSION_J,
        "outDir": str(OUT_DIR),
        **results,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

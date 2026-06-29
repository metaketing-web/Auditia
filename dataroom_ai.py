"""Résumé IA des documents versés — Data Room."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import ai_providers as aip
import dataroom_db as dr
from doc_text_extract import extract_document_text

SUMMARY_SYSTEM = """Tu es l'assistant IA du cockpit d'audit Skydeen — mission PNIPM (MPJIPSC).
On te fournit le texte extrait d'une pièce probante versée en Data Room.
Rédige un résumé structuré en français, factuel, sans inventer d'information absente du document.

Format attendu (Markdown léger) :
## Objet
(1-2 phrases)

## Points clés
- 3 à 6 puces maximum

## Données / éléments probants
(ce qui peut servir l'audit : chiffres, dates, processus, acteurs)

## Limites / zones d'attention
(complétude, incohérences, pièces manquantes éventuelles — ou « Non identifié »)

Reste concis (250-400 mots). Si le texte est vide ou illisible, indique-le clairement."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_ai_summary_schema(db_path: Path) -> None:
    with dr._connect(db_path) as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(dataroom_documents)").fetchall()}
        if "ai_summary" not in cols:
            conn.execute("ALTER TABLE dataroom_documents ADD COLUMN ai_summary TEXT")
        if "ai_summary_at" not in cols:
            conn.execute("ALTER TABLE dataroom_documents ADD COLUMN ai_summary_at TEXT")
        conn.commit()


def set_ai_summary(db_path: Path, doc_id: str, summary: str) -> None:
    ensure_ai_summary_schema(db_path)
    ts = _now()
    with dr._connect(db_path) as conn:
        conn.execute(
            "UPDATE dataroom_documents SET ai_summary = ?, ai_summary_at = ?, updated_at = ? WHERE id = ?",
            (summary.strip(), ts, ts, doc_id),
        )
        conn.commit()


def summarize_document(
    db_path: Path,
    upload_dir: Path,
    doc_id: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    ensure_ai_summary_schema(db_path)
    doc = dr.get_document(db_path, doc_id)
    if not doc:
        raise ValueError("Document introuvable")

    if doc.get("aiSummary") and not force:
        return {
            "ok": True,
            "docId": doc_id,
            "summary": doc["aiSummary"],
            "generatedAt": doc.get("aiSummaryAt") or "",
            "cached": True,
        }

    if not aip.ai_ready():
        raise RuntimeError("Assistant IA non configuré sur le serveur")

    dl = dr.get_file_for_download(db_path, doc.get("fileId") or doc_id, upload_dir=upload_dir)
    if not dl:
        raise ValueError("Fichier introuvable pour ce document")

    path_str, _name, mime = dl
    text, method = extract_document_text(Path(path_str), mime_type=mime, original_name=_name)

    meta_lines = [
        f"Répertoire : {doc.get('rep', '—')}",
        f"Source : {doc.get('source', '—')}",
        f"Type : {doc.get('type', '—')}",
        f"Description : {doc.get('desc', '—')}",
        f"Nom fichier : {_name}",
    ]

    if not text.strip():
        summary = (
            "## Objet\n"
            "Pièce versée en Data Room — le contenu n'a pas pu être extrait automatiquement "
            f"({method}).\n\n"
            "## Points clés\n"
            "- Document enregistré et traçable dans la mission\n"
            "- Analyse IA manuelle recommandée (PDF scanné, image ou format non supporté)\n\n"
            "## Données / éléments probants\n"
            "- Métadonnées : " + " · ".join(meta_lines) + "\n\n"
            "## Limites / zones d'attention\n"
            "- Texte non extractible automatiquement"
        )
        set_ai_summary(db_path, doc_id, summary)
        return {
            "ok": True,
            "docId": doc_id,
            "summary": summary,
            "generatedAt": _now(),
            "extractMethod": method,
            "cached": False,
        }

    user_content = (
        "Métadonnées document :\n"
        + "\n".join(meta_lines)
        + "\n\n---\n\nTexte extrait du document :\n\n"
        + text
    )

    summary, provider = aip.complete(
        provider=aip.AI_DEFAULT_PROVIDER,
        system=SUMMARY_SYSTEM,
        messages=[{"role": "user", "content": user_content}],
        max_tokens=1200,
    )

    set_ai_summary(db_path, doc_id, summary)
    doc = dr.get_document(db_path, doc_id)
    return {
        "ok": True,
        "docId": doc_id,
        "summary": summary,
        "generatedAt": doc.get("aiSummaryAt") if doc else _now(),
        "extractMethod": method,
        "provider": provider,
        "cached": False,
    }

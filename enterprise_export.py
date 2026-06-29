"""Export mission — JSON + binaires (ZIP), option anonymisation RGPD."""
from __future__ import annotations

import io
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

import sqlite3


def _anonymize_text(text: str) -> str:
    if not text:
        return text
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[email]", text)
    text = re.sub(r"\b\d{10,}\b", "[tel]", text)
    text = re.sub(
        r"\b(Directeur|Ministre|Madame|Monsieur|Juliana|[A-Z][a-zéèêëàâùûôîïç]+ [A-Z][a-zéèêëàâùûôîïç]+)\b",
        "[personne]",
        text,
    )
    return text


def anonymize_state(state: dict[str, Any]) -> dict[str, Any]:
    out = json.loads(json.dumps(state, ensure_ascii=False))

    for e in out.get("entretiens", []):
        e["n"] = _anonymize_text(e.get("n", ""))
        e["cr"] = _anonymize_text(e.get("cr", ""))
        for k in ("obs",):
            if isinstance(e.get(k), list):
                e[k] = [_anonymize_text(x) for x in e[k]]
        if e.get("questionnaire"):
            for ph in e["questionnaire"].values():
                if isinstance(ph, dict):
                    for qid in ph:
                        ph[qid] = _anonymize_text(ph[qid])

    for c in out.get("constats", []):
        c["titre"] = _anonymize_text(c.get("titre", ""))
        c["desc"] = _anonymize_text(c.get("desc", ""))

    return out


def build_export_zip(
    state: dict[str, Any],
    db_path: Path,
    upload_dir: Path,
    *,
    include_files: bool = True,
    anonymize: bool = False,
) -> bytes:
    payload = anonymize_state(state) if anonymize else state
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        meta = {
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "anonymized": anonymize,
            "version": payload.get("meta", {}).get("version", 1),
        }
        zf.writestr("manifest.json", json.dumps(meta, indent=2, ensure_ascii=False))
        zf.writestr(
            "mission_state.json",
            json.dumps(payload, indent=2, ensure_ascii=False),
        )
        with sqlite3.connect(db_path) as conn:
            qmeta = conn.execute(
                "SELECT entretien_id, payload, updated_at FROM interview_questionnaire_meta"
            ).fetchall()
            if qmeta:
                questionnaires = {
                    eid: {"payload": json.loads(pl), "updatedAt": ts}
                    for eid, pl, ts in qmeta
                }
                zf.writestr(
                    "questionnaires.json",
                    json.dumps(questionnaires, indent=2, ensure_ascii=False),
                )
                zf.writestr(
                    "questionnaires_detail.json",
                    json.dumps(
                        [
                            {
                                "entretienId": eid,
                                "updatedAt": ts,
                                "phases": list(json.loads(pl).keys()) if pl else [],
                                "payload": json.loads(pl),
                            }
                            for eid, pl, ts in qmeta
                        ],
                        indent=2,
                        ensure_ascii=False,
                    ),
                )

            try:
                import enterprise_audit as eaudit

                journal = eaudit.list_journal(db_path, limit=500)
                zf.writestr(
                    "audit_journal.json",
                    json.dumps(journal, indent=2, ensure_ascii=False),
                )
            except Exception:
                pass

            dr_docs = conn.execute(
                """
                SELECT id, rep_id, source, doc_type, description, statut, file_id, normalized_name
                FROM dataroom_documents
                """
            ).fetchall()
            zf.writestr(
                "dataroom_index.json",
                json.dumps(
                    [
                        {
                            "id": r[0],
                            "rep": r[1],
                            "source": r[2],
                            "type": r[3],
                            "desc": r[4],
                            "statut": r[5],
                            "fileId": r[6],
                            "normalizedName": r[7],
                        }
                        for r in dr_docs
                    ],
                    indent=2,
                    ensure_ascii=False,
                ),
            )

            file_manifest: list[dict[str, Any]] = []
            if include_files:
                seen: set[str] = set()
                for table, prefix in (
                    ("dataroom_files", "files/dataroom"),
                    ("uploaded_files", "files/uploads"),
                ):
                    try:
                        rows = conn.execute(
                            f"SELECT id, COALESCE(doc_id, id), original_name, stored_path FROM {table}"
                        ).fetchall()
                    except sqlite3.OperationalError:
                        continue
                    for fid, doc_id, name, spath in rows:
                        p = Path(spath)
                        key = str(p.resolve()) if p.is_file() else ""
                        entry = {
                            "table": table,
                            "fileId": fid,
                            "docId": doc_id,
                            "name": name,
                            "path": spath,
                            "included": False,
                        }
                        if not key or key in seen:
                            file_manifest.append({**entry, "reason": "missing_or_duplicate"})
                            continue
                        seen.add(key)
                        arc = f"{prefix}/{doc_id}/{name or p.name}"
                        zf.write(p, arcname=arc)
                        file_manifest.append({**entry, "arcname": arc, "included": True})
                zf.writestr(
                    "files_manifest.json",
                    json.dumps(file_manifest, indent=2, ensure_ascii=False),
                )

        extras = {
            "collecteLacunes": payload.get("collecteLacunes"),
            "dataQualitySources": payload.get("dataQualitySources"),
            "progNonProg": payload.get("progNonProg"),
            "ecoLinks": payload.get("ecoLinks"),
            "projectMatrix": payload.get("projectMatrix"),
            "voletB": payload.get("voletB"),
            "dataFlows": payload.get("dataFlows"),
            "checklists": payload.get("checklists"),
        }
        zf.writestr(
            "mission_extras.json",
            json.dumps(extras, indent=2, ensure_ascii=False),
        )
    return buf.getvalue()

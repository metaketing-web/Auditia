"""Import mission — restauration depuis export ZIP Skydeen, extraction DOCX."""
from __future__ import annotations

import html as html_lib
import io
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Callable

import enterprise_security as esec

WNS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

HEADING_STYLES = {
    "title": 1,
    "heading1": 1,
    "heading2": 2,
    "heading3": 3,
    "heading4": 4,
    "titre": 1,
    "titre1": 1,
    "titre2": 2,
    "titre3": 3,
    "titre4": 4,
    "subtitle": 2,
    "soustitre": 2,
}


def extract_docx_text(data: bytes, max_chars: int = 120_000) -> str:
    """Extrait le texte brut d'un fichier .docx (OOXML)."""
    structured = extract_docx_structured(data, max_chars=max_chars)
    return structured["plainText"]


def _style_level(style_val: str | None) -> int:
    if not style_val:
        return 0
    key = style_val.strip().lower().replace(" ", "").replace("-", "").replace("_", "")
    return HEADING_STYLES.get(key, 0)


def _para_text(p_el: ET.Element) -> str:
    parts: list[str] = []
    for node in p_el.iter():
        tag = node.tag.split("}")[-1] if "}" in node.tag else node.tag
        if tag == "t" and node.text:
            parts.append(node.text)
        elif tag == "tab":
            parts.append("\t")
        elif tag == "br":
            parts.append("\n")
    return re.sub(r"[ \t]+", " ", "".join(parts)).strip()


def _cell_texts(tr_el: ET.Element) -> list[str]:
    cells: list[str] = []
    for tc in tr_el.findall(f".//{WNS}tc"):
        bits: list[str] = []
        for p in tc.findall(f".//{WNS}p"):
            t = _para_text(p)
            if t:
                bits.append(t)
        cells.append("\n".join(bits))
    return cells


def _render_table(tbl_el: ET.Element) -> str:
    rows: list[list[str]] = []
    for tr in tbl_el.findall(f".//{WNS}tr"):
        row = _cell_texts(tr)
        if any(c.strip() for c in row):
            rows.append(row)
    if not rows:
        return ""
    ncol = max(len(r) for r in rows)
    out = ['<table class="md-tbl">']
    for i, row in enumerate(rows):
        tag = "th" if i == 0 else "td"
        out.append("<tr>")
        for j in range(ncol):
            cell = html_lib.escape(row[j] if j < len(row) else "")
            out.append(f"<{tag}>{cell.replace(chr(10), '<br>')}</{tag}>")
        out.append("</tr>")
    out.append("</table>")
    return "".join(out)


def extract_docx_structured(data: bytes, max_chars: int = 500_000) -> dict[str, Any]:
    """Convertit un DOCX en HTML consultable + table des matières."""
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        if "word/document.xml" not in zf.namelist():
            raise ValueError("Fichier DOCX invalide")
        root = ET.fromstring(zf.read("word/document.xml"))

    body = root.find(f".//{WNS}body")
    if body is None:
        raise ValueError("Corps du document introuvable")

    blocks: list[str] = []
    sections: list[dict[str, Any]] = []
    plain_parts: list[str] = []
    sec_idx = 0
    current_sec: dict[str, Any] | None = None

    def flush_section():
        nonlocal current_sec
        if current_sec and current_sec.get("blocks"):
            current_sec["html"] = "".join(current_sec.pop("blocks"))
            sections.append(current_sec)
        current_sec = None

    def append_block(html: str, plain: str = ""):
        nonlocal sec_idx, current_sec
        if not html.strip():
            return
        blocks.append(html)
        if plain:
            plain_parts.append(plain)
        if current_sec is not None:
            current_sec.setdefault("blocks", []).append(html)

    for child in body:
        tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if tag == "p":
            style_el = child.find(f".//{WNS}pStyle")
            style_val = style_el.get(f"{WNS}val") if style_el is not None else None
            level = _style_level(style_val)
            text = _para_text(child)
            if not text:
                continue
            if level:
                flush_section()
                sec_idx += 1
                sid = f"sec-{sec_idx}"
                htag = f"h{min(level, 4)}"
                append_block(f'<{htag} id="{sid}" class="md-h">{html_lib.escape(text)}</{htag}>', text)
                current_sec = {"id": sid, "title": text, "level": level, "blocks": []}
            else:
                append_block(f"<p>{html_lib.escape(text)}</p>", text)
        elif tag == "tbl":
            tbl_html = _render_table(child)
            if tbl_html:
                tbl_plain = re.sub(r"<[^>]+>", " ", tbl_html)
                append_block(tbl_html, tbl_plain)

    flush_section()

    html_body = "".join(blocks)
    plain = "\n\n".join(plain_parts).strip()
    if len(plain) > max_chars:
        plain = plain[:max_chars] + "\n[… tronqué …]"
        html_body += '<p class="md-trunc"><em>[… document tronqué …]</em></p>'

    title = sections[0]["title"] if sections else (plain.split("\n")[0][:120] if plain else "Document")

    return {
        "title": title,
        "html": f'<article class="md-prose">{html_body}</article>',
        "sections": [{"id": s["id"], "title": s["title"], "level": s["level"], "html": s["html"]} for s in sections],
        "plainText": plain,
        "sectionCount": len(sections),
        "charCount": len(plain),
    }


def mission_doc_from_docx(data: bytes, source_file: str, max_chars: int = 500_000) -> dict[str, Any]:
    """Payload missionDocs pour une section (cadrage, charte, agenda, cdc)."""
    parsed = extract_docx_structured(data, max_chars=max_chars)
    return {
        "title": parsed["title"],
        "sourceFile": source_file,
        "html": parsed["html"],
        "sections": parsed["sections"],
        "plainText": parsed["plainText"],
        "sectionCount": parsed["sectionCount"],
        "charCount": parsed["charCount"],
        "ingestedAt": None,
    }


MISSION_DOC_PATTERNS: dict[str, tuple[str, ...]] = {
    "cadrage": ("cadrage", "document_cadrage"),
    "agenda": ("agenda", "4 semaine", "4semaine"),
    "charte": ("charte", "copil"),
    "cdc": ("cahier", "charges", "cdc"),
}


def detect_mission_doc_key(filename: str) -> str | None:
    """Associe un nom de fichier à cadrage | agenda | charte | cdc."""
    low = filename.lower().replace("é", "e").replace("è", "e").replace("'", " ")
    scores: dict[str, int] = {k: 0 for k in MISSION_DOC_PATTERNS}
    for key, patterns in MISSION_DOC_PATTERNS.items():
        for p in patterns:
            if p in low:
                scores[key] += 2
    if "agenda" in low and "semaine" in low:
        scores["agenda"] += 3
    if "charte" in low and "copil" in low:
        scores["charte"] += 3
    if "cadrage" in low:
        scores["cadrage"] += 3
    if "cahier" in low and "charge" in low:
        scores["cdc"] += 4
    best = max(scores.items(), key=lambda x: x[1])
    return best[0] if best[1] > 0 else None


def ingest_mission_docx_files(
    files: list[tuple[str, bytes]],
    *,
    get_state: Callable[[], dict[str, Any]],
    set_state: Callable[[dict[str, Any]], None],
) -> dict[str, Any]:
    """Importe plusieurs DOCX dans missionDocs."""
    from datetime import datetime, timezone

    state = get_state() or {}
    md = state.get("missionDocs") or {}
    ingested: list[str] = []
    skipped: list[str] = []

    for filename, data in files:
        key = detect_mission_doc_key(filename)
        if not key:
            skipped.append(filename)
            continue
        doc = mission_doc_from_docx(data, filename)
        doc["ingestedAt"] = datetime.now(timezone.utc).isoformat()
        md[key] = doc
        ingested.append(f"{key}:{filename}")

    if not ingested:
        return {"ok": False, "ingested": [], "skipped": skipped}

    md["updatedAt"] = datetime.now(timezone.utc).isoformat()
    state["missionDocs"] = md
    set_state(state)
    return {"ok": True, "ingested": ingested, "skipped": skipped}


def import_mission_zip(
    data: bytes,
    db_path: Path,
    upload_dir: Path,
    *,
    get_state: Callable[[], dict[str, Any]],
    set_state: Callable[[dict[str, Any]], None],
    import_files: bool = True,
) -> dict[str, Any]:
    upload_dir.mkdir(parents=True, exist_ok=True)
    restored_files = 0
    questionnaires_merged = 0

    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        names = zf.namelist()
        if "mission_state.json" not in names:
            raise ValueError("ZIP invalide : mission_state.json absent")

        state = json.loads(zf.read("mission_state.json").decode("utf-8"))
        state = esec.sanitize_entity_ids(state)

        if "mission_extras.json" in names:
            extras = json.loads(zf.read("mission_extras.json").decode("utf-8"))
            for key in (
                "collecteLacunes",
                "dataQualitySources",
                "progNonProg",
                "ecoLinks",
                "projectMatrix",
                "voletB",
                "dataFlows",
                "checklists",
            ):
                if extras.get(key) is not None:
                    state[key] = extras[key]

        current = get_state() or {}
        merged = {**current, **state}
        for key in (
            "entretiens",
            "docs",
            "constats",
            "gaps",
            "risques",
            "livrables",
            "gouv",
            "horsperim",
            "settings",
            "meta",
            "missionDocs",
            "chat",
            "checklists",
            "voletB",
            "dataFlows",
            "ecoLinks",
            "projectMatrix",
            "collecteLacunes",
            "dataQualitySources",
            "progNonProg",
        ):
            if key in state and state[key] is not None:
                merged[key] = state[key]

        set_state(merged)

        if "questionnaires.json" in names:
            import questionnaires_db as qr

            qdata = json.loads(zf.read("questionnaires.json").decode("utf-8"))
            for eid, row in qdata.items():
                payload = row.get("payload") if isinstance(row, dict) else row
                if payload:
                    qr.merge_questionnaire_into_state(
                        db_path, get_state, lambda s: set_state(s), eid, payload
                    )
                    questionnaires_merged += 1

        if import_files:
            for name in names:
                if not name.startswith("files/"):
                    continue
                try:
                    content = zf.read(name)
                except Exception:
                    continue
                parts = name.split("/")
                if len(parts) < 3:
                    continue
                dest_name = parts[-1]
                fid = dest_name.rsplit(".", 1)[0] if "." in dest_name else dest_name
                dest = upload_dir / dest_name
                if dest.exists():
                    continue
                dest.write_bytes(content)
                restored_files += 1

    return {
        "ok": True,
        "questionnairesMerged": questionnaires_merged,
        "filesRestored": restored_files,
        "entretiens": len(merged.get("entretiens") or []),
        "docs": len(merged.get("docs") or []),
    }

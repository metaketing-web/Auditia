"""Extraction de texte depuis les pièces versées (Data Room)."""
from __future__ import annotations

import csv
import io
import zipfile
from pathlib import Path
from typing import Optional

from file_preview import extract_office_text

MAX_EXTRACT_CHARS = 48_000


def _clip(text: str) -> str:
    text = (text or "").strip()
    if len(text) <= MAX_EXTRACT_CHARS:
        return text
    return text[:MAX_EXTRACT_CHARS] + "\n\n[… texte tronqué pour analyse IA …]"


def _read_plain(path: Path) -> Optional[str]:
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return path.read_text(encoding=enc)
        except (UnicodeDecodeError, OSError):
            continue
    return None


def _extract_pdf(path: Path) -> Optional[str]:
    try:
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        parts: list[str] = []
        for page in reader.pages[:80]:
            parts.append(page.extract_text() or "")
        text = "\n".join(parts).strip()
        return text or None
    except Exception:
        return None


def _extract_xlsx(path: Path) -> Optional[str]:
    try:
        import openpyxl

        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        parts: list[str] = []
        for sheet in wb.worksheets[:5]:
            parts.append(f"## {sheet.title}")
            for i, row in enumerate(sheet.iter_rows(values_only=True)):
                if i >= 200:
                    parts.append("[…]")
                    break
                cells = [str(c).strip() for c in row if c is not None and str(c).strip()]
                if cells:
                    parts.append(" | ".join(cells))
        return "\n".join(parts).strip() or None
    except Exception:
        return None


def _extract_csv(path: Path) -> Optional[str]:
    raw = _read_plain(path)
    if not raw:
        return None
    try:
        sample = raw[:4096]
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        reader = csv.reader(io.StringIO(raw), dialect)
        lines = []
        for i, row in enumerate(reader):
            if i >= 150:
                lines.append("[…]")
                break
            lines.append(" | ".join(row))
        return "\n".join(lines).strip() or None
    except Exception:
        return raw.strip() or None


def _extract_pptx(path: Path) -> Optional[str]:
    import re

    try:
        with zipfile.ZipFile(path) as zf:
            slides = sorted(
                n for n in zf.namelist()
                if n.startswith("ppt/slides/slide") and n.endswith(".xml")
            )
            parts: list[str] = []
            for slide in slides[:40]:
                raw = zf.read(slide).decode("utf-8", errors="replace")
                text = re.sub(r"<[^>]+>", " ", raw)
                text = re.sub(r"\s+", " ", text).strip()
                if text:
                    parts.append(text)
            return "\n\n".join(parts).strip() or None
    except Exception:
        return None


def extract_document_text(
    path: Path,
    *,
    mime_type: str = "",
    original_name: str = "",
) -> tuple[str, str]:
    """Retourne (texte, méthode). Texte vide si extraction impossible."""
    if not path.is_file():
        return "", "missing"

    ext = path.suffix.lower()
    if not ext and original_name:
        ext = Path(original_name).suffix.lower()
    mime = (mime_type or "").lower()

    if mime.startswith("text/") or ext in (".txt", ".text", ".md", ".log", ".json", ".xml", ".html", ".htm"):
        text = _read_plain(path)
        return _clip(text or ""), "text"

    if ext == ".csv" or mime == "text/csv":
        text = _extract_csv(path)
        return _clip(text or ""), "csv"

    if ext == ".pdf" or mime == "application/pdf":
        text = _extract_pdf(path)
        return _clip(text or ""), "pdf"

    if ext in (".doc", ".docx") or "word" in mime:
        text = extract_office_text(path)
        return _clip(text or ""), "office"

    if ext in (".xlsx", ".xls") or "spreadsheet" in mime or "excel" in mime:
        if ext == ".xlsx":
            text = _extract_xlsx(path)
            return _clip(text or ""), "xlsx"
        return "", "xls_unsupported"

    if ext in (".pptx", ".ppt") or "presentation" in mime or "powerpoint" in mime:
        if ext == ".pptx":
            text = _extract_pptx(path)
            return _clip(text or ""), "pptx"
        text = extract_office_text(path)
        if text:
            return _clip(text), "ppt"
        return "", "ppt_legacy"

    if ext == ".text":
        text = _read_plain(path)
        return _clip(text or ""), "text"

    if ext == ".zip":
        try:
            with zipfile.ZipFile(path) as zf:
                names = [n for n in zf.namelist() if not n.endswith("/")][:20]
                return _clip("\n".join(names)), "zip_index"
        except Exception:
            return "", "zip_unreadable"

    return "", "unsupported"

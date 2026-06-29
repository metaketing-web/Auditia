"""Conversion et préparation de fichiers pour prévisualisation inline."""
from __future__ import annotations

import hashlib
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional, Tuple

OFFICE_EXTS = {".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".ods", ".rtf"}


def _soffice_path() -> Optional[str]:
    for cmd in ("soffice", "libreoffice"):
        if shutil.which(cmd):
            return cmd
    return None


def _cache_key(source: Path) -> str:
    st = source.stat()
    return hashlib.sha256(
        f"{source.resolve()}:{st.st_mtime_ns}:{st.st_size}".encode()
    ).hexdigest()


def extract_office_text(source: Path) -> Optional[str]:
    ext = source.suffix.lower()
    if ext == ".doc":
        antiword = shutil.which("antiword")
        if not antiword:
            return None
        try:
            proc = subprocess.run(
                [antiword, "-t", "-w", "0", str(source)],
                check=True,
                timeout=90,
                capture_output=True,
            )
            text = proc.stdout.decode("utf-8", errors="replace").strip()
            return text or None
        except Exception:
            return None
    if ext == ".docx":
        try:
            import mammoth

            with source.open("rb") as fh:
                return mammoth.extract_raw_text(fh).value.strip() or None
        except Exception:
            return None
    return None


def convert_to_pdf(source: Path, cache_dir: Path) -> Optional[Path]:
    soffice = _soffice_path()
    if not soffice or not source.is_file():
        return None
    cache_dir.mkdir(parents=True, exist_ok=True)
    digest = _cache_key(source)
    cached = cache_dir / f"{digest}.pdf"
    if cached.is_file():
        return cached
    outdir = cache_dir / digest
    outdir.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [
                soffice,
                "--headless",
                "--norestore",
                "--convert-to",
                "pdf",
                "--outdir",
                str(outdir),
                str(source),
            ],
            check=True,
            timeout=120,
            capture_output=True,
        )
        pdfs = sorted(outdir.glob("*.pdf"))
        if not pdfs:
            return None
        pdfs[0].replace(cached)
        return cached
    except Exception:
        return None
    finally:
        shutil.rmtree(outdir, ignore_errors=True)


def prepare_preview(
    path: Path, mime: str, name: str, cache_dir: Path
) -> Tuple[Path, str, str]:
    """Retourne (chemin, mime, mode) — mode: original | pdf | text."""
    ext = path.suffix.lower()
    mime = mime or "application/octet-stream"
    if mime == "application/pdf" or ext == ".pdf":
        return path, "application/pdf", "original"
    if mime.startswith("image/"):
        return path, mime, "original"
    if mime.startswith("text/") or ext in (".txt", ".csv", ".md", ".json", ".log", ".text"):
        return path, mime if mime.startswith("text/") else "text/plain", "original"
    office = ext in OFFICE_EXTS or any(
        x in mime
        for x in (
            "msword",
            "wordprocessingml",
            "spreadsheetml",
            "excel",
            "powerpoint",
            "presentationml",
        )
    )
    if office:
        pdf = convert_to_pdf(path, cache_dir)
        if pdf:
            return pdf, "application/pdf", "pdf"
        text = extract_office_text(path)
        if text:
            cache_dir.mkdir(parents=True, exist_ok=True)
            txt_path = cache_dir / f"{_cache_key(path)}.txt"
            if not txt_path.is_file():
                txt_path.write_text(text, encoding="utf-8")
            return txt_path, "text/plain; charset=utf-8", "text"
    return path, mime, "original"


def can_preview_inline(mime: str) -> bool:
    return mime == "application/pdf" or mime.startswith("image/") or mime.startswith("text/")

#!/usr/bin/env python3
from pathlib import Path

p = Path("/opt/portia-audit/server.py")
text = p.read_text(encoding="utf-8")
old = """    preview_path, preview_mime, converted = fp.prepare_preview(
        path, info[2], info[1], cache_dir
    )
    if not fp.can_preview_inline(preview_mime):
        raise HTTPException(
            415,
            "Prévisualisation non disponible pour ce format — téléchargez le fichier.",
        )
    headers: dict[str, str] = {
        "Content-Disposition": f'inline; filename="{preview_path.name}"'
    }
    if converted:
        headers["X-Portia-Preview"] = "pdf-converted"
"""
new = """    preview_path, preview_mime, mode = fp.prepare_preview(
        path, info[2], info[1], cache_dir
    )
    if not fp.can_preview_inline(preview_mime):
        raise HTTPException(
            415,
            "Prévisualisation non disponible pour ce format — téléchargez le fichier.",
        )
    headers: dict[str, str] = {
        "Content-Disposition": f'inline; filename="{preview_path.name}"'
    }
    if mode == "pdf":
        headers["X-Portia-Preview"] = "pdf-converted"
    elif mode == "text":
        headers["X-Portia-Preview"] = "text-extracted"
"""
if old not in text:
    raise SystemExit("block not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("fixed")

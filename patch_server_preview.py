#!/usr/bin/env python3
"""Insère l'endpoint /preview dans server.py si absent."""
from pathlib import Path

SERVER = Path("/opt/portia-audit/server.py")
text = SERVER.read_text(encoding="utf-8")
if "/preview" in text and "preview_file" in text:
    print("already patched")
    raise SystemExit(0)

needle = '''@app.get("/api/files/{file_id}")
def download_file(file_id: str, user: dict[str, Any] = Depends(require_user)):
    info = dr.get_file_for_download(DB_PATH, file_id, upload_dir=UPLOAD_DIR)
    if not info:
        raise HTTPException(404, "Fichier introuvable")
    path = Path(info[0])
    return FileResponse(path, filename=info[1], media_type=info[2])


'''

insert = needle + '''@app.get("/api/files/{file_id}/preview")
def preview_file(file_id: str, user: dict[str, Any] = Depends(require_user)):
    import file_preview as fp

    info = dr.get_file_for_download(DB_PATH, file_id, upload_dir=UPLOAD_DIR)
    if not info:
        raise HTTPException(404, "Fichier introuvable")
    path = Path(info[0])
    cache_dir = DATA_DIR / "preview-cache"
    preview_path, preview_mime, mode = fp.prepare_preview(
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
    return FileResponse(preview_path, media_type=preview_mime, headers=headers)


'''

if needle not in text:
    raise SystemExit("needle not found in server.py")

SERVER.write_text(text.replace(needle, insert, 1), encoding="utf-8")
print("patched ok")

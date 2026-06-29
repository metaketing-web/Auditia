#!/usr/bin/env python3
"""Ajoute corbeille Data Room : GET trash, DELETE doc, purge orphelins."""
from pathlib import Path

SERVER = Path("/opt/portia-audit/server.py")
text = SERVER.read_text(encoding="utf-8")

if "/api/dataroom/trash" in text:
    print("already patched")
    raise SystemExit(0)

needle = """@app.patch("/api/dataroom/docs/{doc_id}")
def api_patch_doc"""

insert = '''@app.get("/api/dataroom/trash")
def api_dataroom_trash(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    return {
        "orphans": dr.list_orphan_documents(DB_PATH),
        "duplicates": dr.list_duplicate_groups(DB_PATH),
    }


@app.post("/api/dataroom/trash/purge-orphans")
def api_purge_orphan_docs(
    user: dict[str, Any] = Depends(require_write),
) -> dict[str, Any]:
    if user.get("role") not in ("admin", "juliana"):
        raise HTTPException(403, "Réservé au pilotage")
    n = dr.purge_orphan_documents(DB_PATH, upload_dir=UPLOAD_DIR)
    dr.sync_state_docs(DB_PATH, get_state, lambda s: set_state(s, audit=False))
    eaudit.journal(
        DB_PATH,
        user=user,
        action="dataroom_purge_orphans",
        entity_type="dataroom",
        entity_id="orphans",
        detail={"deleted": n},
    )
    return {"ok": True, "deleted": n}


@app.delete("/api/dataroom/docs/{doc_id}")
def api_delete_dataroom_doc(
    doc_id: str, user: dict[str, Any] = Depends(require_write)
) -> dict[str, Any]:
    if user.get("role") not in ("admin", "juliana"):
        raise HTTPException(403, "Suppression réservée au pilotage")
    if not dr.delete_document(DB_PATH, doc_id, upload_dir=UPLOAD_DIR):
        raise HTTPException(404, "Document introuvable")
    dr.sync_state_docs(DB_PATH, get_state, lambda s: set_state(s, audit=False))
    eaudit.journal(
        DB_PATH,
        user=user,
        action="dataroom_delete",
        entity_type="document",
        entity_id=doc_id,
        detail={},
    )
    return {"ok": True, "id": doc_id}


''' + needle

if needle not in text:
    raise SystemExit("patch needle not found")

SERVER.write_text(text.replace(needle, insert, 1), encoding="utf-8")
print("patched trash ok")

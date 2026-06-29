#!/usr/bin/env python3
"""Ajoute les routes /api/state/snapshots dans server.py."""
from pathlib import Path

SERVER = Path("/opt/portia-audit/server.py")
text = SERVER.read_text(encoding="utf-8")

if "api/state/snapshots" in text:
    print("already patched")
    raise SystemExit(0)

init_needle = "    eaudit.init_audit_schema(DB_PATH)"
init_insert = """    eaudit.init_audit_schema(DB_PATH)
    import enterprise_snapshots as esnap

    esnap.init_snapshot_schema(DB_PATH)"""

if init_needle in text and "enterprise_snapshots" not in text:
    text = text.replace(init_needle, init_insert, 1)

route_needle = """@app.put("/api/state")
async def api_put_state"""

route_insert = '''@app.get("/api/state/snapshots")
def api_list_snapshots(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    import enterprise_snapshots as esnap

    if user.get("role") != "admin":
        raise HTTPException(403, "Réservé aux administrateurs")
    return {"snapshots": esnap.list_snapshots(DB_PATH)}


@app.post("/api/state/snapshots")
async def api_create_snapshot(
    body: dict[str, Any], user: dict[str, Any] = Depends(require_user)
) -> dict[str, Any]:
    import enterprise_snapshots as esnap

    if user.get("role") != "admin":
        raise HTTPException(403, "Réservé aux administrateurs")
    payload = body.get("payload")
    if not isinstance(payload, dict):
        raise HTTPException(400, "payload requis")
    snap = esnap.create_snapshot(
        DB_PATH,
        payload,
        label=str(body.get("label") or "Sauvegarde"),
        user=user,
        auto=bool(body.get("auto", True)),
    )
    eaudit.journal(
        DB_PATH,
        user=user,
        action="state_snapshot",
        entity_type="state",
        entity_id=snap["id"],
        detail={"label": snap["label"], "auto": snap.get("auto")},
    )
    return {"ok": True, "snapshot": snap}


@app.post("/api/state/snapshots/{snap_id}/restore")
def api_restore_snapshot(
    snap_id: str, user: dict[str, Any] = Depends(require_user)
) -> dict[str, Any]:
    import enterprise_snapshots as esnap

    if user.get("role") != "admin":
        raise HTTPException(403, "Réservé aux administrateurs")
    payload = esnap.get_snapshot_payload(DB_PATH, snap_id)
    if not payload:
        raise HTTPException(404, "Point de restauration introuvable")
    set_state(payload)
    eaudit.journal(
        DB_PATH,
        user=user,
        action="state_restore",
        entity_type="state",
        entity_id=snap_id,
        detail={"label": "restore"},
    )
    return {"ok": True, "state": get_state()}


''' + route_needle

if route_needle not in text:
    raise SystemExit("route needle not found")

SERVER.write_text(text.replace(route_needle, route_insert, 1), encoding="utf-8")
print("patched snapshots ok")

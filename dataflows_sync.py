"""Synchronise dataFlows depuis ecoLinks (miroir portia-flux-edit.js)."""
from __future__ import annotations

import re
from typing import Any


def _infer_flow_mode(lk: dict[str, Any]) -> str:
    lbl = (lk.get("label") or "").lower()
    if any(x in lbl for x in ("absent", "non branch", "non partag")):
        return "critique"
    if lk.get("type") == "integration" and "api" in lbl:
        return "auto"
    if any(x in lbl for x in ("api", "batch sécurisé", "sigfip")):
        return "auto"
    return "manuel"


def _protocol_for(lk: dict[str, Any]) -> str:
    if lk.get("protocol"):
        return str(lk["protocol"])
    mode = lk.get("flowMode") or _infer_flow_mode(lk)
    if mode == "auto":
        return "API / intégration"
    if mode == "critique":
        return "Non établi"
    return "Excel / e-mail / batch"


def _statut_for(lk: dict[str, Any]) -> str:
    st = lk.get("statut")
    if st in ("actif", "planifie", "absent"):
        return st
    mode = lk.get("flowMode") or _infer_flow_mode(lk)
    if mode == "critique":
        return "absent"
    if mode == "auto":
        return "actif"
    return "planifie"


def eco_link_to_dataflow(lk: dict[str, Any], node_names: dict[str, str] | None = None) -> dict[str, Any]:
    node_names = node_names or {}
    lid = str(lk.get("id") or "")
    from_id = str(lk.get("from") or "")
    to_id = str(lk.get("to") or "")
    mode = lk.get("flowMode") or _infer_flow_mode(lk)
    return {
        "id": f"df_{lid}" if lid else f"df_{from_id}_{to_id}",
        "ecoLinkId": lid,
        "from": node_names.get(from_id, from_id),
        "to": node_names.get(to_id, to_id),
        "fromId": from_id,
        "toId": to_id,
        "type": lk.get("type") or "data",
        "protocol": _protocol_for(lk),
        "pii": bool(lk.get("pii")),
        "statut": _statut_for(lk),
        "critique": mode == "critique",
        "label": lk.get("label") or "",
    }


def sync_dataflows_from_ecolinks(state: dict[str, Any]) -> bool:
    links = state.get("ecoLinks") or []
    if not isinstance(links, list) or not links:
        return False
    flows = [eco_link_to_dataflow(lk) for lk in links if isinstance(lk, dict)]
    state["dataFlows"] = flows
    return True

"""Fusion contrôlée PUT /api/state — auditeurs vs pilotage."""
from __future__ import annotations

import copy
import json
from typing import Any, Optional

import dataflows_sync as dfsync
import enterprise_security as esec

ALLOWED_TOP_KEYS = frozenset(
    {
        "entretiens",
        "docs",
        "constats",
        "gaps",
        "risques",
        "livrables",
        "gouv",
        "horsperim",
        "collecteLacunes",
        "dataQualitySources",
        "progNonProg",
        "ecoLinks",
        "dataFlows",
        "planning4s",
        "tasks",
        "missionDocs",
        "reportDrafts",
        "settings",
        "meta",
        "notifications",
        "gapJournal",
        "riskJournal",
        "cdcChecklist",
        "empty",
    }
)

AUDITOR_MERGE_KEYS = frozenset(
    {
        "entretiens",
        "constats",
        "collecteLacunes",
        "dataQualitySources",
        "progNonProg",
        "cdcChecklist",
        "ecoLinks",
        "dataFlows",
    }
)

LIST_KEYS = frozenset(
    {
        "entretiens",
        "docs",
        "constats",
        "gaps",
        "risques",
        "livrables",
        "gouv",
        "horsperim",
        "collecteLacunes",
        "dataQualitySources",
        "progNonProg",
        "ecoLinks",
        "dataFlows",
        "tasks",
        "notifications",
        "gapJournal",
        "riskJournal",
    }
)

MAX_STATE_BYTES = 12 * 1024 * 1024


def validate_state_payload(body: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(body, dict):
        raise ValueError("État invalide (objet JSON attendu)")
    raw = json.dumps(body, ensure_ascii=False)
    if len(raw.encode("utf-8")) > MAX_STATE_BYTES:
        raise ValueError("État trop volumineux")
    cleaned: dict[str, Any] = {}
    for key, val in body.items():
        if key not in ALLOWED_TOP_KEYS:
            continue
        if key in LIST_KEYS and val is not None and not isinstance(val, list):
            raise ValueError(f"Champ {key} : liste attendue")
        if key in ("meta", "settings", "missionDocs", "reportDrafts", "planning4s") and val is not None:
            if not isinstance(val, dict):
                raise ValueError(f"Champ {key} : objet attendu")
        cleaned[key] = val
    if "settings" in cleaned and isinstance(cleaned["settings"], dict):
        cleaned["settings"] = dict(cleaned["settings"])
        cleaned["settings"]["apiKey"] = ""
    return cleaned


def _merge_meta_auditor(current_meta: dict[str, Any], incoming_meta: dict[str, Any], email: str) -> None:
    if not email:
        return
    inc_prefs = incoming_meta.get("notificationPrefs")
    if not isinstance(inc_prefs, dict):
        return
    if email not in inc_prefs:
        return
    prefs = current_meta.setdefault("notificationPrefs", {})
    if isinstance(prefs, dict):
        prefs[email] = inc_prefs[email]


def merge_state_put(
    user: Optional[dict[str, Any]],
    current: dict[str, Any],
    incoming: dict[str, Any],
    *,
    is_pilotage: bool,
) -> dict[str, Any]:
    incoming = validate_state_payload(incoming)
    if is_pilotage:
        merged = copy.deepcopy(incoming)
        if "settings" not in merged and current.get("settings"):
            merged["settings"] = copy.deepcopy(current["settings"])
        if isinstance(merged.get("settings"), dict):
            merged["settings"]["apiKey"] = ""
        return esec.sanitize_entity_ids(merged)

    merged = copy.deepcopy(current or {})
    for key in AUDITOR_MERGE_KEYS:
        if key in incoming:
            merged[key] = copy.deepcopy(incoming[key])
    if "ecoLinks" in incoming:
        dfsync.sync_dataflows_from_ecolinks(merged)
    if "meta" in incoming and isinstance(incoming["meta"], dict):
        meta = merged.setdefault("meta", {})
        if isinstance(meta, dict):
            _merge_meta_auditor(meta, incoming["meta"], (user or {}).get("email", "").strip().lower())
    if isinstance(merged.get("settings"), dict):
        merged["settings"]["apiKey"] = ""
    return esec.sanitize_entity_ids(merged)

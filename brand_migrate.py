"""Remplace les mentions « Portia » par « Skydeen » dans l'état mission."""
from __future__ import annotations

import re
from typing import Any

_PORTIA_RE = re.compile(r"\bPortia\b", re.IGNORECASE)
_PORTIA_SLUG_RE = re.compile(r"portia", re.IGNORECASE)


def replace_portia_text(text: str) -> str:
    if not text or "portia" not in text.lower():
        return text
    out = _PORTIA_RE.sub("Skydeen", text)
    out = out.replace("sec-2-portia-", "sec-2-skydeen-")
    out = out.replace("sec-2-Portia-", "sec-2-skydeen-")
    return out


def migrate_portia_branding(state: dict[str, Any]) -> dict[str, Any]:
    """Nettoie clés et textes ; régénère les HTML mission si nécessaire."""
    meta = state.get("meta") or {}
    if meta.get("skydeenBrandRev") == "20260619":
        return state

    def walk(obj: Any) -> Any:
        if isinstance(obj, dict):
            if "portia" in obj:
                if not obj.get("skydeen"):
                    obj["skydeen"] = obj.pop("portia")
                else:
                    del obj["portia"]
            for key in list(obj.keys()):
                obj[key] = walk(obj[key])
            return obj
        if isinstance(obj, list):
            for i, item in enumerate(obj):
                obj[i] = walk(item)
            return obj
        if isinstance(obj, str):
            return replace_portia_text(obj)
        return obj

    walk(state)

    md = state.get("missionDocs")
    if isinstance(md, dict):
        for section in ("cadrage", "charte", "cdc", "agenda"):
            block = md.get(section)
            if isinstance(block, dict):
                block.pop("html", None)
                block.pop("plainText", None)
                block.pop("sections", None)

    import mission_docs_build as mdbuild

    mdbuild.ensure_mission_docs_html(state)

    state.setdefault("meta", {})["skydeenBrandRev"] = "20260619"
    return state

"""Catalogue des questionnaires (généré depuis questionnaires-complets.js + questionnaires-terrain.js)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

_CATALOG_PATH = Path(__file__).with_name("questionnaires_catalog.json")
_CATALOG: dict[str, Any] | None = None

PHASE_LABELS = {
    "invest": "Phase 1 — Investigation",
    "confront": "Phase 2 — Confrontation",
    "coconstruct": "Phase 3 — Co-construction",
}


def _load_catalog() -> dict[str, Any]:
    global _CATALOG
    if _CATALOG is None:
        raw = _CATALOG_PATH.read_text(encoding="utf-8")
        _CATALOG = json.loads(raw)
    return _CATALOG


def _trames() -> dict[str, Any]:
    return _load_catalog().get("trames") or {}


def _terrain_resolve(e: dict[str, Any]) -> str:
    if e.get("trame") == "focusgroup":
        return "focusgroup"
    n = (e.get("n") or "").lower()
    if e.get("couche") == "Terrain" or e.get("sem") == 4:
        if "focus group" in n or e.get("struct") == "Bénéficiaires":
            return "focusgroup"
        if "démo" in n or "demo" in n or "chefs" in n:
            return "terrain_demo"
        if "agents" in n or "opérateurs" in n or "operateurs" in n:
            return "terrain_agents"
        if "directeur régional" in n or "regional" in n:
            return "terrain_dr"
    return e.get("trame") or "direction"


def resolve_trame_key(e: dict[str, Any]) -> str:
    if not e:
        return "direction"
    trames = _trames()
    n = (e.get("n") or "").lower()
    struct = (e.get("struct") or "").lower()
    tr = e.get("trame") or ""

    terrain = _terrain_resolve(e)
    if terrain in trames and trames[terrain].get("phases"):
        return terrain

    if tr in (
        "drh",
        "flotte",
        "marches",
        "daf",
        "dpsd",
        "dajc",
        "dajip",
        "carte_jeunes",
    ):
        return tr
    if tr == "rssi_dpo":
        return "dpo" if "dpo" in n else "rssi"
    if tr == "cabinet":
        return "cabinet"
    if tr == "dsi":
        return "dsi"
    if tr == "technique" or "sigfip" in struct:
        return "technique_sigfip"
    if "uxp" in struct or "x-road" in struct:
        return "technique_uxp"
    if struct == "nni" or "nni" in n:
        return "technique_nni"
    if tr == "technique":
        return "technique"
    if tr == "bailleur":
        if any(b in struct for b in ("afd", "pnud", "boad")):
            return "bailleur_multi"
        return "bailleur"
    if tr == "programme":
        if any(b in struct for b in ("bad", "banque mondiale", "afd", "pnud", "boad")):
            return "programme_bailleur"
        return "programme"
    if tr == "tutelle":
        if "aej" in struct:
            return "tutelle_aej"
        if "oscn" in struct:
            return "tutelle_oscn"
        return "tutelle"
    if tr in ("direction", "volet_b_np"):
        if "daf" in struct or "affaires financi" in n:
            return "daf" if "daf" in trames else "direction_daf"
        if "dpsd" in struct or "planification" in n:
            return "dpsd" if "dpsd" in trames else "direction_dpsd"
        if "dajc" in struct or "juridique" in n:
            return "dajc" if "dajc" in trames else "direction"
        if "dajip" in struct or "autonomisation" in n:
            return "dajip" if "dajip" in trames else "direction"
        if struct == "drh" or "ressources humaines" in n:
            return "drh" if "drh" in trames else "direction"
        if struct == "patrimoine" or "flotte" in n:
            return "flotte" if "flotte" in trames else "direction"
        if struct == "marchés" or "marchés" in n:
            return "marches" if "marches" in trames else "direction"
        if "carte jeunes" in struct.lower():
            return "carte_jeunes" if "carte_jeunes" in trames else "programme"
        if "inspection" in struct or "inspecteur" in n:
            return "direction_ig"
        return "direction"
    return tr if tr in trames else "direction"


def get_trame(e: dict[str, Any]) -> Optional[dict[str, Any]]:
    trames = _trames()
    key = resolve_trame_key(e)
    tr = trames.get(key)
    if tr and tr.get("phases"):
        return tr
    return trames.get("direction")


def questionnaire_to_markdown(e: dict[str, Any], answers: dict[str, Any]) -> str:
    tr = get_trame(e)
    if not tr or not tr.get("phases"):
        return _answers_fallback_markdown(answers)
    lines: list[str] = []
    for ph, label in PHASE_LABELS.items():
        phase = tr["phases"].get(ph) or {}
        sections = phase.get("sections") or []
        if not sections:
            continue
        phase_has_answer = False
        block: list[str] = []
        for sec in sections:
            sec_lines: list[str] = []
            for it in sec.get("items") or []:
                qid = it.get("id") or ""
                ans = ((answers or {}).get(ph) or {}).get(qid) or ""
                if not str(ans).strip():
                    continue
                phase_has_answer = True
                sec_lines.append(f"- **{it.get('q', qid)}**")
                hint = (it.get("hint") or "").strip()
                if hint:
                    sec_lines.append(f"  - *Indication :* {hint}")
                sec_lines.append(f"  - **Réponse :** {ans}")
                sec_lines.append("")
            if sec_lines:
                block.append(f"#### {sec.get('title', '')}")
                block.append("")
                block.extend(sec_lines)
        if phase_has_answer:
            lines.append(f"### {label}")
            lines.append("")
            lines.extend(block)
    return "\n".join(lines).strip()


def questionnaire_to_markdown_full(
    e: dict[str, Any], answers: dict[str, Any] | None = None
) -> str:
    """Export backup : toutes les questions de la trame + réponses si saisies."""
    answers = answers or {}
    tr = get_trame(e)
    if not tr or not tr.get("phases"):
        return _answers_fallback_markdown(answers) or "_Aucune trame structurée._"
    tr_key = resolve_trame_key(e)
    lines: list[str] = [
        f"**Grille :** {tr.get('label', tr_key)}",
        f"**Durée indicative :** {tr.get('dur', '—')}",
        f"**Clé trame :** `{tr_key}`",
        "",
    ]
    total_q = 0
    for ph, label in PHASE_LABELS.items():
        phase = tr["phases"].get(ph) or {}
        sections = phase.get("sections") or []
        if not sections:
            continue
        dur = (phase.get("duration") or "").strip()
        lines.append(f"### {label}" + (f" ({dur})" if dur else ""))
        lines.append("")
        for sec in sections:
            items = sec.get("items") or []
            if not items:
                continue
            lines.append(f"#### {sec.get('title', '')}")
            lines.append("")
            for n, it in enumerate(items, 1):
                qid = it.get("id") or ""
                qtext = it.get("q") or qid
                ans = ((answers.get(ph) if answers else None) or {}).get(qid) or ""
                ans_str = str(ans).strip() if ans else ""
                total_q += 1
                lines.append(f"**{n}. {qtext}**")
                lines.append(f"- *Réf. :* `{qid}`")
                hint = (it.get("hint") or "").strip()
                if hint:
                    lines.append(f"- *Indication :* {hint}")
                if ans_str:
                    lines.append(f"- **Réponse enregistrée :** {ans_str}")
                else:
                    lines.append("- **Réponse :** _… à compléter lors de l'entretien …_")
                lines.append("")
    lines.insert(4, f"**Nombre de questions :** {total_q}")
    lines.insert(5, "")
    return "\n".join(lines).strip()


def _answers_fallback_markdown(answers: dict[str, Any]) -> str:
    lines: list[str] = []
    for ph, label in PHASE_LABELS.items():
        block = (answers or {}).get(ph) or {}
        if not isinstance(block, dict):
            continue
        keys = [k for k, v in block.items() if v]
        if not keys:
            continue
        lines.append(f"### {label}")
        lines.append("")
        for qid in sorted(keys):
            lines.append(f"- **{qid}**")
            lines.append(f"  - **Réponse :** {block[qid]}")
            lines.append("")
    return "\n".join(lines).strip()

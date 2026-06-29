"""Export unitaire — entretien, constat, ligne matrice CDC, livrable (+ listes)."""
from __future__ import annotations

import csv
import io
import json
import re
import zipfile
from datetime import datetime, timezone
from typing import Any, Optional

import questionnaires_catalog as qc
import questionnaires_db as qr
from enterprise_export import anonymize_state

VALID_FORMATS = frozenset({"json", "md", "html", "csv", "txt", "doc"})

PHASE_LABELS = {
    "invest": "Phase 1 — Investigation",
    "confront": "Phase 2 — Confrontation",
    "coconstruct": "Phase 3 — Co-construction",
}

VERDICT_LABELS = {
    "confirme": "Confirmé",
    "ajuster": "À ajuster",
    "completer": "À compléter",
    "caduc": "Caduc",
}


def _slug(name: str, fallback: str = "export") -> str:
    s = re.sub(r"[^\w\-]+", "_", (name or fallback).strip())[:80]
    return s or fallback


def _meta_block(meta: dict[str, Any]) -> list[str]:
    lines = [
        f"- **Mission :** {meta.get('client', 'PNIPM')}",
        f"- **Exporté le :** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    ]
    if meta.get("j0"):
        lines.append(f"- **J0 mission :** {meta['j0']}")
    return lines


def _find_entretien(state: dict[str, Any], eid: str) -> Optional[dict[str, Any]]:
    for e in state.get("entretiens") or []:
        if e.get("id") == eid:
            return e
    return None


def _find_constat(state: dict[str, Any], cid: str) -> Optional[dict[str, Any]]:
    for c in state.get("constats") or []:
        if c.get("id") == cid or c.get("ref") == cid:
            return c
    return None


def _find_gap(state: dict[str, Any], gid: str) -> Optional[dict[str, Any]]:
    for g in state.get("gaps") or []:
        if g.get("id") == gid or g.get("ref") == gid:
            return g
    return None


def _find_livrable(state: dict[str, Any], lid: str) -> Optional[dict[str, Any]]:
    for l in state.get("livrables") or []:
        if l.get("id") == lid or l.get("ref") == lid:
            return l
    return None


def entretien_payload(
    state: dict[str, Any],
    db_path: Any,
    eid: str,
    *,
    anonymize: bool = False,
) -> dict[str, Any]:
    st = anonymize_state(state) if anonymize else state
    ent = _find_entretien(st, eid)
    if not ent:
        raise KeyError("entretien")
    questionnaire = qr.load_questionnaire(db_path, eid)
    if not questionnaire.get("invest") and ent.get("questionnaire"):
        questionnaire = ent.get("questionnaire") or questionnaire
    return {
        "type": "entretien",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "anonymized": anonymize,
        "meta": st.get("meta") or {},
        "entretien": ent,
        "questionnaire": questionnaire,
        "observations": ent.get("obs") or [],
    }


EMPTY_QUESTIONNAIRE: dict[str, dict[str, str]] = {
    "invest": {},
    "confront": {},
    "coconstruct": {},
}


def entretien_vierge_payload(
    state: dict[str, Any],
    eid: str,
    *,
    anonymize: bool = False,
) -> dict[str, Any]:
    st = anonymize_state(state) if anonymize else state
    ent = _find_entretien(st, eid)
    if not ent:
        raise KeyError("entretien")
    ent_copy = dict(ent)
    ent_copy["statut"] = "planifie"
    ent_copy["cr"] = ""
    ent_copy["qual"] = ""
    ent_copy["obs"] = []
    return {
        "type": "entretien_questionnaire_vierge",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "anonymized": anonymize,
        "meta": st.get("meta") or {},
        "entretien": ent_copy,
        "questionnaire": dict(EMPTY_QUESTIONNAIRE),
        "observations": [],
    }


def constat_payload(state: dict[str, Any], cid: str, *, anonymize: bool = False) -> dict[str, Any]:
    st = anonymize_state(state) if anonymize else state
    c = _find_constat(st, cid)
    if not c:
        raise KeyError("constat")
    return {
        "type": "constat",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "anonymized": anonymize,
        "meta": st.get("meta") or {},
        "constat": c,
    }


def gap_payload(state: dict[str, Any], gid: str) -> dict[str, Any]:
    g = _find_gap(state, gid)
    if not g:
        raise KeyError("gap")
    return {
        "type": "gap",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "meta": state.get("meta") or {},
        "gap": g,
    }


def livrable_payload(state: dict[str, Any], lid: str) -> dict[str, Any]:
    l = _find_livrable(state, lid)
    if not l:
        raise KeyError("livrable")
    return {
        "type": "livrable",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "meta": state.get("meta") or {},
        "livrable": l,
    }


def _md_entretien(payload: dict[str, Any]) -> str:
    e = payload["entretien"]
    meta = payload.get("meta") or {}
    lines = [
        f"# Entretien — {e.get('n', '')}",
        "",
        *_meta_block(meta),
        "",
        "## Fiche entretien",
        "",
        f"| Champ | Valeur |",
        f"|-------|--------|",
        f"| Structure | {e.get('struct', '—')} |",
        f"| Axe | {e.get('axe', '—')} |",
        f"| Semaine | S{e.get('sem', '—')} |",
        f"| Date mission | J+{e.get('j', '—')} |",
        f"| Heure | {e.get('heure', '—')} |",
        f"| Auditeur(s) | {e.get('aud', '—')} |",
        f"| Statut | {e.get('statut', '—')} |",
        f"| Qualification | {e.get('qual') or '—'} |",
        f"| Triangulation | {e.get('triang', 0)} source(s) |",
        f"| Trame | {e.get('trame', '—')} |",
        "",
    ]
    if e.get("cr"):
        lines += ["## Compte rendu", "", e["cr"], ""]
    obs = payload.get("observations") or e.get("obs") or []
    if obs:
        lines += ["## Observations", ""]
        lines += [f"- {o}" for o in obs]
        lines.append("")
    q = payload.get("questionnaire") or {}
    qmd = qc.questionnaire_to_markdown_full(e, q)
    if qmd:
        lines += ["## Questionnaire structuré (grille complète)", "", qmd, ""]
    return "\n".join(lines)


def _md_questionnaire_vierge(payload: dict[str, Any]) -> str:
    e = payload["entretien"]
    meta = payload.get("meta") or {}
    lines = [
        f"# Questionnaire vierge — {e.get('n', '')}",
        "",
        *_meta_block(meta),
        "",
        "_Grille terrain à compléter lors de l'entretien — aucune réponse ni compte rendu prérempli._",
        "",
        "## Fiche entretien",
        "",
        f"| Champ | Valeur |",
        f"|-------|--------|",
        f"| Structure | {e.get('struct', '—')} |",
        f"| Axe | {e.get('axe', '—')} |",
        f"| Semaine | S{e.get('sem', '—')} |",
        f"| Date mission | J+{e.get('j', '—')} |",
        f"| Heure | {e.get('heure', '—')} |",
        f"| Auditeur(s) | {e.get('aud', '—')} |",
        f"| Trame | {e.get('trame', '—')} |",
        "",
    ]
    qmd = qc.questionnaire_to_markdown_full(e, payload.get("questionnaire") or EMPTY_QUESTIONNAIRE)
    if qmd:
        lines += ["## Questionnaire structuré (grille complète)", "", qmd, ""]
    return "\n".join(lines)


def _md_constat(payload: dict[str, Any]) -> str:
    c = payload["constat"]
    meta = payload.get("meta") or {}
    lines = [
        f"# Constat {c.get('ref', '')} — {c.get('titre', '')}",
        "",
        *_meta_block(meta),
        "",
        f"| Champ | Valeur |",
        f"|-------|--------|",
        f"| Référence | {c.get('ref', '—')} |",
        f"| Axe | {c.get('axe', '—')} |",
        f"| Criticité | {c.get('crit', '—')} |",
        f"| Structure | {c.get('struct', '—')} |",
        f"| Qualification | {c.get('qual') or '—'} |",
        f"| Triangulation | {c.get('triang', 0)} |",
        f"| Sources | {', '.join(c.get('sources') or []) or '—'} |",
        "",
        "## Description",
        "",
        c.get("desc", ""),
        "",
    ]
    if c.get("ecart"):
        lines += ["## Écart / implication", "", c["ecart"], ""]
    atts = c.get("attachments") or []
    if atts:
        lines += ["## Pièces jointes", ""]
        for a in atts:
            nm = a.get("name") or a.get("fileId") or "—"
            lines.append(f"- {nm}")
        lines.append("")
    return "\n".join(lines)


def _md_gap(payload: dict[str, Any]) -> str:
    g = payload["gap"]
    meta = payload.get("meta") or {}
    v = VERDICT_LABELS.get(g.get("verdict", ""), g.get("verdict", ""))
    return "\n".join(
        [
            f"# Matrice CDC — {g.get('ref', '')}",
            "",
            *_meta_block(meta),
            "",
            f"| Champ | Valeur |",
            f"|-------|--------|",
            f"| Référence | {g.get('ref', '—')} |",
            f"| Thème | {g.get('theme', '—')} |",
            f"| Verdict | {v} |",
            f"| Référence CDC | {g.get('cdc', '—')} |",
            "",
            "## Exigence du cahier des charges",
            "",
            g.get("exig", ""),
            "",
            "## Réalité observée",
            "",
            g.get("realite", ""),
            "",
        ]
    )


def _md_livrable(payload: dict[str, Any]) -> str:
    l = payload["livrable"]
    meta = payload.get("meta") or {}
    lines = [
        f"# Livrable {l.get('ref', '')} — {l.get('titre', '')}",
        "",
        *_meta_block(meta),
        "",
        f"| Champ | Valeur |",
        f"|-------|--------|",
        f"| Statut | {l.get('statut', '—')} |",
        f"| Avancement | {l.get('progress', 0)}% |",
        f"| Jalon | J+{l.get('jalon', '—')} |",
        "",
        "## Description contractuelle",
        "",
        l.get("desc", ""),
        "",
    ]
    if l.get("contenu"):
        lines += ["## Contenu / projet de livrable", "", l["contenu"], ""]
    else:
        lines += [
            "## Contenu / projet de livrable",
            "",
            "_… section à rédiger — brouillon IA ou saisie manuelle …_",
            "",
        ]
    return "\n".join(lines)


import md_to_word


def _md_to_simple_html(body_md: str) -> str:
    return md_to_word.markdown_to_html(body_md)


def _wrap_html(title: str, body_md: str) -> str:
    body = _md_to_simple_html(body_md)
    return f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>{title}</title><style>body{{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.55;color:#1a1a1a}}
h1{{color:#8b4513}}h2{{color:#5c4033;margin-top:1.4em}}table{{border-collapse:collapse;width:100%;margin:12px 0}}
td,th{{border:1px solid #ddd;padding:8px;text-align:left}}th{{background:#f5f0eb}}</style></head>
<body><p>{body}</p></body></html>"""


def _wrap_word_doc(title: str, body_md: str) -> str:
    return md_to_word.wrap_word_doc(title, body_md)


def render_item(
    payload: dict[str, Any],
    fmt: str,
    *,
    basename: str,
) -> tuple[bytes, str, str]:
    fmt = (fmt or "md").lower()
    if fmt not in VALID_FORMATS:
        fmt = "md"
    if fmt == "json":
        data = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
        return data, f"{basename}.json", "application/json; charset=utf-8"
    kind = payload.get("type", "item")
    if kind == "entretien":
        md = _md_entretien(payload)
    elif kind == "entretien_questionnaire_vierge":
        md = _md_questionnaire_vierge(payload)
    elif kind == "constat":
        md = _md_constat(payload)
    elif kind == "gap":
        md = _md_gap(payload)
    elif kind == "livrable":
        md = _md_livrable(payload)
    elif kind == "gaps_list":
        md = _md_gaps_list(payload)
    elif kind == "constats_list":
        md = _md_constats_list(payload)
    else:
        md = json.dumps(payload, indent=2, ensure_ascii=False)
    if fmt == "md":
        return md.encode("utf-8"), f"{basename}.md", "text/markdown; charset=utf-8"
    if fmt == "txt":
        return md.encode("utf-8"), f"{basename}.txt", "text/plain; charset=utf-8"
    if fmt == "html":
        title = basename.replace("_", " ")
        html = _wrap_html(title, md)
        return html.encode("utf-8"), f"{basename}.html", "text/html; charset=utf-8"
    if fmt == "doc":
        title = basename.replace("_", " ")
        doc = _wrap_word_doc(title, md)
        return doc.encode("utf-8"), f"{basename}.doc", "application/msword"
    raise ValueError("format")


def _md_gaps_list(payload: dict[str, Any]) -> str:
    gaps = payload.get("gaps") or []
    lines = ["# Matrice d'écart CDC — export complet", "", *_meta_block(payload.get("meta") or {}), ""]
    for g in gaps:
        v = VERDICT_LABELS.get(g.get("verdict", ""), g.get("verdict", ""))
        lines += [
            f"## {g.get('ref', '')} — {g.get('theme', '')} ({v})",
            "",
            f"**Exigence :** {g.get('exig', '')}",
            "",
            f"**Réalité :** {g.get('realite', '')}",
            "",
            f"**CDC :** {g.get('cdc', '')}",
            "",
        ]
    return "\n".join(lines)


def _md_constats_list(payload: dict[str, Any]) -> str:
    constats = payload.get("constats") or []
    lines = ["# Constats & observations — export complet", "", *_meta_block(payload.get("meta") or {}), ""]
    for c in constats:
        lines += [
            f"## {c.get('ref', '')} — {c.get('titre', '')}",
            "",
            c.get("desc", ""),
            "",
        ]
        if c.get("ecart"):
            lines.append(f"*Écart :* {c['ecart']}")
            lines.append("")
    return "\n".join(lines)


def gaps_csv_bytes(gaps: list[dict[str, Any]]) -> bytes:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["ref", "theme", "exigence", "cdc", "realite", "verdict"])
    for g in gaps:
        w.writerow(
            [
                g.get("ref", ""),
                g.get("theme", ""),
                g.get("exig", ""),
                g.get("cdc", ""),
                g.get("realite", ""),
                g.get("verdict", ""),
            ]
        )
    return buf.getvalue().encode("utf-8-sig")


def export_entretien(
    state: dict[str, Any],
    db_path: Any,
    eid: str,
    fmt: str,
    *,
    anonymize: bool = False,
) -> tuple[bytes, str, str]:
    payload = entretien_payload(state, db_path, eid, anonymize=anonymize)
    ent = payload["entretien"]
    base = _slug(f"entretien_{ent.get('struct', '')}_{ent.get('n', eid)}", eid)
    return render_item(payload, fmt, basename=base)


def export_entretien_questionnaire_vierge(
    state: dict[str, Any],
    eid: str,
    fmt: str,
    *,
    anonymize: bool = False,
) -> tuple[bytes, str, str]:
    payload = entretien_vierge_payload(state, eid, anonymize=anonymize)
    ent = payload["entretien"]
    base = _slug(f"questionnaire_vierge_{ent.get('n', eid)}", eid)
    return render_item(payload, fmt, basename=base)


def export_all_questionnaires_vierges_zip(
    state: dict[str, Any],
    *,
    anonymize: bool = False,
) -> tuple[bytes, str, str]:
    buf = io.BytesIO()
    manifest: list[dict[str, Any]] = []
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for ent in state.get("entretiens") or []:
            eid = ent.get("id")
            if not eid:
                continue
            data, fname, _ = export_entretien_questionnaire_vierge(
                state, eid, "doc", anonymize=anonymize
            )
            arc = f"questionnaires_vierges/{fname}"
            zf.writestr(arc, data)
            manifest.append(
                {
                    "id": eid,
                    "nom": ent.get("n"),
                    "structure": ent.get("struct"),
                    "trame": ent.get("trame"),
                    "file": arc,
                }
            )
        meta = {
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "anonymized": anonymize,
            "count": len(manifest),
            "files": manifest,
        }
        zf.writestr(
            "questionnaires_vierges/manifest.json",
            json.dumps(meta, indent=2, ensure_ascii=False),
        )
    return buf.getvalue(), "questionnaires-vierges.zip", "application/zip"


def export_constat(
    state: dict[str, Any],
    cid: str,
    fmt: str,
    *,
    anonymize: bool = False,
) -> tuple[bytes, str, str]:
    payload = constat_payload(state, cid, anonymize=anonymize)
    c = payload["constat"]
    base = _slug(f"constat_{c.get('ref', cid)}", cid)
    return render_item(payload, fmt, basename=base)


def export_gap(state: dict[str, Any], gid: str, fmt: str) -> tuple[bytes, str, str]:
    payload = gap_payload(state, gid)
    g = payload["gap"]
    base = _slug(f"matrice_{g.get('ref', gid)}", gid)
    return render_item(payload, fmt, basename=base)


def export_livrable(state: dict[str, Any], lid: str, fmt: str) -> tuple[bytes, str, str]:
    payload = livrable_payload(state, lid)
    l = payload["livrable"]
    base = _slug(f"livrable_{l.get('ref', lid)}", lid)
    return render_item(payload, fmt, basename=base)


def export_all_gaps(state: dict[str, Any], fmt: str) -> tuple[bytes, str, str]:
    gaps = state.get("gaps") or []
    fmt = (fmt or "md").lower()
    if fmt == "csv":
        return (
            gaps_csv_bytes(gaps),
            "matrice_ecart_cdc.csv",
            "text/csv; charset=utf-8",
        )
    payload = {
        "type": "gaps_list",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "meta": state.get("meta") or {},
        "gaps": gaps,
    }
    return render_item(payload, fmt, basename="matrice_ecart_cdc")


def export_all_constats(
    state: dict[str, Any],
    fmt: str,
    *,
    anonymize: bool = False,
) -> tuple[bytes, str, str]:
    st = anonymize_state(state) if anonymize else state
    payload = {
        "type": "constats_list",
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "anonymized": anonymize,
        "meta": st.get("meta") or {},
        "constats": st.get("constats") or [],
    }
    if fmt == "json":
        data = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
        return data, "constats_mission.json", "application/json; charset=utf-8"
    return render_item(payload, fmt, basename="constats_mission")

"""Construction HTML consultables pour Documents de mission (sans DOCX)."""
from __future__ import annotations

import html as html_lib
import re
from typing import Any

MIN_HTML = 400

CHARTE_ENGAGEMENTS = [
    {
        "cote": "MPJIPSC",
        "items": [
            "Désigner les interlocuteurs et valider l'agenda sous 48 h",
            "Mettre à disposition les pièces listées dans la Data Room (checklists A→F)",
            "Faciliter l'accès graduel aux données sensibles (NNI, SIGFIP) selon cadre juridique",
            "Participer aux instances COPIL et valider les livrables intermédiaires",
        ],
    },
    {
        "cote": "Skydeen (équipe audit)",
        "items": [
            "Respecter la confidentialité et l'usage interne des données",
            "Partager l'avancement hebdomadaire via ce cockpit (vue Cabinet)",
            "Documenter chaque entretien (CR, qualification, pièces probantes)",
            "Signaler sans délai les blocages nécessitant arbitrage du COPIL",
        ],
    },
]

CDC_MODULES = [
    {"id": "pilotage", "n": "Pilotage Cabinet & drill-down", "cdc": "§ Fonc. 3.1", "themes": ["Fonctionnel", "Politique"]},
    {"id": "prog", "n": "Programmatique / non-programmatique", "cdc": "§ Fonc. 3.2", "themes": ["Fonctionnel", "Programmatique", "Collecte"]},
    {"id": "voletb", "n": "Volet B (RH, flotte, GED, marchés)", "cdc": "§ Fonc. 3.9", "themes": ["Fonctionnel"]},
    {"id": "donnees", "n": "Données & référentiels", "cdc": "§ Données 2.x", "themes": ["Données"]},
    {"id": "interop", "n": "Interopérabilité (SIGFIP, UXP, NNI)", "cdc": "§ Interop 5.x", "themes": ["Interop"]},
    {"id": "archi", "n": "Architecture & SI", "cdc": "§ Tech 4.x", "themes": ["Architecture", "Réseau"]},
    {"id": "securite", "n": "Sécurité & conformité", "cdc": "§ Sécu 6.x", "themes": ["Sécurité"]},
    {"id": "perf", "n": "Performance & exploitation", "cdc": "§ Perf 7.x", "themes": ["Performance"]},
]

AGENDA_SEMAINES = [
    {"s": 1, "titre": "Cadrage stratégique", "objectif": "Commande politique, sponsors, périmètre, Data Room initiale, COPIL de lancement."},
    {"s": 2, "titre": "Deep-dive programmatique", "objectif": "Directions métiers, SIGFIP, programmatique / non-programmatique, lacunes collecte."},
    {"s": 3, "titre": "Volet B & intégrations", "objectif": "RH, patrimoine, marchés, GED, DSI, RSSI/DPO, flux et interopérabilité."},
    {"s": 4, "titre": "Terrain régional", "objectif": "Directions régionales, démo SI, agents, focus groups — questionnaires terrain."},
]


def _esc(text: str) -> str:
    return html_lib.escape(text or "")


def _slug(title: str, idx: int) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower())[:40].strip("-") or "section"
    return f"sec-{idx}-{base}"


def _section(title: str, level: int, sections: list[dict[str, Any]], idx: int) -> tuple[str, int]:
    sid = _slug(title, idx)
    sections.append({"id": sid, "title": title.strip(), "level": level})
    return f'<h{level} id="{sid}">{_esc(title.strip())}</h{level}>', idx + 1


def markdown_to_html(md: str) -> str:
    if not md or not md.strip():
        return ""
    out: list[str] = []
    in_ul = False
    lines = md.replace("\r\n", "\n").split("\n")

    def close_ul():
        nonlocal in_ul
        if in_ul:
            out.append("</ul>")
            in_ul = False

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            close_ul()
            continue
        if line.strip() == "---":
            close_ul()
            out.append("<hr>")
            continue
        m = re.match(r"^(#{1,4})\s+(.+)$", line)
        if m:
            close_ul()
            lvl = min(len(m.group(1)) + 1, 4)
            out.append(f"<h{lvl}>{_inline_md(m.group(2))}</h{lvl}>")
            continue
        if re.match(r"^[-*•]\s+", line.strip()):
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            item = re.sub(r"^[-*•]\s+", "", line.strip())
            out.append(f"<li>{_inline_md(item)}</li>")
            continue
        close_ul()
        out.append(f"<p>{_inline_md(line)}</p>")

    close_ul()
    return "".join(out)


def _inline_md(text: str) -> str:
    text = _esc(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    return text


def _render_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    ncol = max(len(r) for r in rows)
    parts = ['<table class="md-tbl">']
    for i, row in enumerate(rows):
        tag = "th" if i == 0 else "td"
        parts.append("<tr>")
        for j in range(ncol):
            cell = row[j] if j < len(row) else ""
            parts.append(f"<{tag}>{_esc(cell)}</{tag}>")
        parts.append("</tr>")
    parts.append("</table>")
    return "".join(parts)


def parse_agenda_text(text: str) -> dict[str, Any]:
    """Convertit le texte agenda (export Word / copier-coller) en HTML + sommaire."""
    if not text or len(text.strip()) < 200:
        return {}

    lines = text.replace("\r\n", "\n").split("\n")
    sections: list[dict[str, Any]] = []
    blocks: list[str] = ['<article class="md-prose">']
    sec_idx = 0
    table_rows: list[list[str]] = []
    in_table = False
    in_ul = False
    title = "Agenda détaillé — 4 semaines"

    def flush_table():
        nonlocal in_table, table_rows
        if table_rows:
            blocks.append(_render_table(table_rows))
        table_rows = []
        in_table = False

    def flush_ul():
        nonlocal in_ul
        if in_ul:
            blocks.append("</ul>")
            in_ul = False

    day_row = re.compile(r"^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim)\t")
    section_line = re.compile(r"^(Semaine \d+|Phase pré-lancement|J-?\d+\s+·|JOUR \d+\s+·)", re.I)

    for i, raw in enumerate(lines):
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_table()
            flush_ul()
            continue

        if i < 10 and stripped.isupper() and len(stripped) < 80 and "AGENDA" not in stripped:
            if i <= 5:
                blocks.append(f"<p class='md-cover'>{_esc(stripped)}</p>")
                continue

        if stripped.startswith("AGENDA") or stripped.startswith("MISSION D'AUDIT"):
            blocks.append(f"<h1>{_esc(stripped)}</h1>")
            continue

        if stripped == "DOCUMENT DE TRAVAIL OPÉRATIONNEL":
            h, sec_idx = _section(stripped, 2, sections, sec_idx)
            blocks.append(h)
            continue

        if stripped in ("Légende des types d'activité", "Code Auditeur"):
            flush_table()
            flush_ul()
            h, sec_idx = _section(stripped, 2, sections, sec_idx)
            blocks.append(h)
            continue

        if section_line.match(stripped):
            flush_table()
            flush_ul()
            h, sec_idx = _section(stripped, 2 if stripped.startswith("Semaine") else 3, sections, sec_idx)
            blocks.append(h)
            continue

        if stripped.startswith("Jour\tDate\tCréneau"):
            flush_ul()
            flush_table()
            table_rows = [stripped.split("\t")]
            in_table = True
            continue

        if in_table and day_row.match(stripped):
            table_rows.append(stripped.split("\t"))
            continue

        if in_table:
            flush_table()

        if stripped.startswith("Objectif :"):
            flush_ul()
            blocks.append(f"<p><strong>Objectif :</strong>{_esc(stripped[10:].strip())}</p>")
            continue

        if stripped.startswith("Cibles prioritaires"):
            flush_ul()
            h, sec_idx = _section(stripped, 3, sections, sec_idx)
            blocks.append(h)
            continue

        if stripped.startswith("•") or stripped.startswith("\u2022"):
            if not in_ul:
                blocks.append("<ul>")
                in_ul = True
            item = re.sub(r"^[•\u2022]\s*", "", stripped).strip()
            blocks.append(f"<li>{_esc(item)}</li>")
            continue

        if "\t" in stripped and len(stripped.split("\t")) >= 2:
            rows = [stripped.split("\t")]
            j = i + 1
            while j < len(lines) and lines[j].strip() and "\t" in lines[j]:
                rows.append(lines[j].strip().split("\t"))
                j += 1
            blocks.append(_render_table(rows))
            continue

        flush_ul()
        blocks.append(f"<p>{_esc(stripped)}</p>")

    flush_table()
    flush_ul()
    blocks.append("</article>")
    html = "".join(blocks)
    plain = re.sub(r"<[^>]+>", " ", html)
    return {
        "html": html,
        "sections": sections,
        "plainText": plain,
        "title": title,
        "charCount": len(plain),
        "sourceFile": "Agenda 4 semaines (texte mission)",
        "builtAt": "auto",
    }


def build_cadrage_doc(state: dict[str, Any], md: dict[str, Any]) -> dict[str, Any]:
    cad = md.get("cadrage") or {}
    if cad.get("html") and len(cad["html"]) >= MIN_HTML:
        return cad

    sections: list[dict[str, Any]] = []
    blocks: list[str] = ['<article class="md-prose">']
    sec_idx = 0

    l1 = next((l for l in state.get("livrables", []) if l.get("ref") == "L1"), None)
    l1_text = (l1 or {}).get("contenu") or ""

    if l1_text and len(l1_text) > 500:
        h, sec_idx = _section("Note de cadrage (L1)", 2, sections, sec_idx)
        blocks.append(h)
        blocks.append(markdown_to_html(l1_text))
    else:
        finalite = cad.get("finalite") or ""
        methode = cad.get("methode") or ""
        if finalite:
            h, sec_idx = _section("Finalité de la mission", 2, sections, sec_idx)
            blocks.append(h)
            blocks.append(f"<p>{_esc(finalite)}</p>")
        if methode:
            h, sec_idx = _section("Méthode", 2, sections, sec_idx)
            blocks.append(h)
            blocks.append(f"<p>{_esc(methode)}</p>")

    h, sec_idx = _section("Agenda — 4 semaines (synthèse)", 2, sections, sec_idx)
    blocks.append(h)
    blocks.append("<ul>")
    for w in AGENDA_SEMAINES:
        blocks.append(
            f"<li><strong>Semaine {w['s']} — {_esc(w['titre'])}</strong> : {_esc(w['objectif'])}</li>"
        )
    blocks.append("</ul>")

    hp = state.get("horsperim") or []
    if hp:
        h, sec_idx = _section("Hors périmètre confirmé", 2, sections, sec_idx)
        blocks.append(h)
        blocks.append("<ul>")
        for item in hp:
            blocks.append(
                f"<li><strong>{_esc(item.get('ref', ''))}</strong> — {_esc(item.get('titre', ''))} : {_esc(item.get('raison', ''))}</li>"
            )
        blocks.append("</ul>")

    blocks.append("</article>")
    html = "".join(blocks)
    plain = re.sub(r"<[^>]+>", " ", html)
    return {
        **cad,
        "html": html,
        "sections": sections,
        "plainText": plain,
        "title": "Document de cadrage",
        "charCount": len(plain),
        "sourceFile": "Document de cadrage (cockpit)",
        "builtAt": "auto",
    }


def build_agenda_doc(state: dict[str, Any], md: dict[str, Any]) -> dict[str, Any]:
    agenda = md.get("agenda") or {}
    if agenda.get("html") and len(agenda["html"]) >= MIN_HTML:
        return agenda

    raw = (md.get("cadrage") or {}).get("agendaComplement") or ""
    if len(raw.strip()) < 200:
        raw = agenda.get("plainText") or agenda.get("text") or ""

    parsed = parse_agenda_text(raw)
    if not parsed:
        return agenda

    return {**agenda, **parsed}


def build_charte_doc(state: dict[str, Any], md: dict[str, Any]) -> dict[str, Any]:
    ch = md.get("charte") or {}
    if ch.get("html") and len(ch["html"]) >= MIN_HTML:
        return ch

    sections: list[dict[str, Any]] = []
    blocks: list[str] = ['<article class="md-prose">']
    sec_idx = 0

    h, sec_idx = _section("Charte du COPIL — réciprocité des échanges", 2, sections, sec_idx)
    blocks.append(h)
    blocks.append(
        "<p>Cadre d'engagement mutuel entre le MPJIPSC et l'équipe Skydeen pour la collecte, "
        "l'accès aux données et la restitution de la mission d'audit pré-déploiement PNIPM.</p>"
    )

    gouv = state.get("gouv") or []
    lancement = next((g for g in gouv if g.get("ref") == "LANCEMENT"), None)
    sig = (lancement or {}).get("signatureCopil")
    if sig:
        blocks.append(
            f"<p><strong>Charte signée</strong> — {_esc(' · '.join(sig.get('signataires') or []))} "
            f"({_esc((sig.get('signedAt') or '')[:10])})</p>"
        )
    else:
        blocks.append("<p><em>Signature COPIL à confirmer lors de l'instance de lancement.</em></p>")

    for block in CHARTE_ENGAGEMENTS:
        custom = None
        if block["cote"] == "MPJIPSC" and ch.get("mpjipsc"):
            custom = [x.strip() for x in re.split(r"[\n;]+", ch["mpjipsc"]) if x.strip()]
        elif "Skydeen" in block["cote"] and (ch.get("skydeen") or ch.get("portia")):
            raw = ch.get("skydeen") or ch.get("portia") or ""
            custom = [x.strip() for x in re.split(r"[\n;]+", raw) if x.strip()]
        items = custom or block["items"]
        h, sec_idx = _section(block["cote"], 2, sections, sec_idx)
        blocks.append(h)
        blocks.append("<ul>" + "".join(f"<li>{_esc(it)}</li>" for it in items) + "</ul>")

    principes = ch.get("principes") or (
        "Approche graduelle NNI/RGPD · traçabilité des pièces · triangulation des sources · "
        "transparence via la vue Cabinet."
    )
    h, sec_idx = _section("Principes de collecte", 2, sections, sec_idx)
    blocks.append(h)
    blocks.append("<ul>")
    for p in re.split(r"[·;]\s*", principes):
        p = p.strip()
        if p:
            blocks.append(f"<li>{_esc(p)}</li>")
    blocks.append("</ul>")
    blocks.append(
        "<ul><li>Approche graduelle pour les données sensibles (NNI, données personnelles)</li>"
        "<li>Traçabilité : chaque pièce versée avec source, répertoire et convention de nommage</li>"
        "<li>Triangulation : croiser déclarations, documents et observations terrain</li>"
        "<li>Transparence : vue Cabinet en lecture pour rendre compte de l'avancement</li></ul>"
    )

    blocks.append("</article>")
    html = "".join(blocks)
    plain = re.sub(r"<[^>]+>", " ", html)
    return {
        **ch,
        "html": html,
        "sections": sections,
        "plainText": plain,
        "title": "Charte du COPIL",
        "charCount": len(plain),
        "sourceFile": "Charte COPIL (cockpit)",
        "builtAt": "auto",
    }


def _gaps_for_module(gaps: list[dict[str, Any]], themes: list[str]) -> list[dict[str, Any]]:
    out = []
    for g in gaps:
        theme = (g.get("theme") or "").lower()
        if any(t.lower() in theme for t in themes):
            out.append(g)
    return out


def build_cdc_doc(state: dict[str, Any], md: dict[str, Any]) -> dict[str, Any]:
    cdc = md.get("cdc") or {}
    if cdc.get("html") and len(cdc["html"]) >= MIN_HTML:
        return cdc

    gaps = state.get("gaps") or []
    sections: list[dict[str, Any]] = []
    blocks: list[str] = ['<article class="md-prose">']
    sec_idx = 0

    h, sec_idx = _section("Cahier des charges — synthèse mission", 2, sections, sec_idx)
    blocks.append(h)
    synthese = cdc.get("synthese") or (
        "L'audit de cadrage ne remplace pas le marché plateforme (HP-01) : il alimente une feuille de route "
        "réaliste pour le dashboard Cabinet et le portail terrain, en s'appuyant sur la matrice d'écart."
    )
    blocks.append(f"<p>{_esc(synthese)}</p>")

    h, sec_idx = _section("Modules fonctionnels et techniques", 2, sections, sec_idx)
    blocks.append(h)
    blocks.append(
        "<table class='md-tbl'><tr><th>Module</th><th>Réf. CDC</th><th>Exigences suivies</th>"
        "<th>Confirmées</th><th>À compléter</th><th>À ajuster</th></tr>"
    )
    for mod in CDC_MODULES:
        sub = _gaps_for_module(gaps, mod["themes"])
        conf = sum(1 for g in sub if g.get("verdict") == "confirme")
        comp = sum(1 for g in sub if g.get("verdict") == "completer")
        aj = sum(1 for g in sub if g.get("verdict") == "ajuster")
        blocks.append(
            f"<tr><td><strong>{_esc(mod['n'])}</strong></td><td>{_esc(mod['cdc'])}</td>"
            f"<td>{len(sub)}</td><td>{conf}</td><td>{comp}</td><td>{aj}</td></tr>"
        )
    blocks.append("</table>")

    h, sec_idx = _section("Exigences prioritaires (aperçu)", 2, sections, sec_idx)
    blocks.append(h)
    blocks.append("<ul>")
    for g in gaps[:25]:
        blocks.append(
            f"<li><strong>{_esc(g.get('ref', ''))}</strong> — {_esc(g.get('lib', g.get('titre', '')))} "
            f"<em>({ _esc(g.get('verdict', '')) })</em></li>"
        )
    if len(gaps) > 25:
        blocks.append(f"<li><em>… et {len(gaps) - 25} autres exigences dans la matrice d'écart.</em></li>")
    blocks.append("</ul>")

    blocks.append("</article>")
    html = "".join(blocks)
    plain = re.sub(r"<[^>]+>", " ", html)
    return {
        **cdc,
        "html": html,
        "sections": sections,
        "plainText": plain,
        "title": "Cahier des charges PNIPM",
        "charCount": len(plain),
        "sourceFile": "Cahier des charges (cockpit + matrice)",
        "builtAt": "auto",
    }


def doc_is_ready(doc: dict[str, Any] | None) -> bool:
    if not doc:
        return False
    html = doc.get("html") or ""
    return len(html) >= MIN_HTML and bool(doc.get("sections"))


def ensure_mission_docs_html(state: dict[str, Any]) -> dict[str, Any]:
    """Enrichit missionDocs avec HTML consultable si DOCX non importés."""
    md = state.get("missionDocs")
    if not md or not isinstance(md, dict):
        return state

    built = False
    new_md = dict(md)
    for key, builder in (
        ("cadrage", lambda: build_cadrage_doc(state, new_md)),
        ("agenda", lambda: build_agenda_doc(state, new_md)),
        ("charte", lambda: build_charte_doc(state, new_md)),
        ("cdc", lambda: build_cdc_doc(state, new_md)),
    ):
        current = new_md.get(key) or {}
        if current.get("ingestedAt"):
            continue
        if doc_is_ready(current):
            continue
        doc = builder()
        if doc.get("html"):
            new_md[key] = doc
            built = True

    if built:
        from datetime import datetime, timezone

        new_md["updatedAt"] = datetime.now(timezone.utc).isoformat()
        new_md["builtAt"] = datetime.now(timezone.utc).isoformat()
        state["missionDocs"] = new_md
    return state

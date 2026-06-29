#!/usr/bin/env python3
"""Export entretiens (questionnaires), checklists A-F + CDC tech, livrables → .doc"""
from __future__ import annotations

import json
import re
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import enterprise_item_export as eitem

DB_PATH = Path("/opt/portia-audit/data/portia.db")
OUT = Path("/opt/portia-audit/export-mission-doc")
ZIP_PATH = Path("/opt/portia-audit/export-entretiens-checklists-livrables.doc.zip")


def load_state() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM mission_state LIMIT 1").fetchone()
    if not row:
        raise SystemExit("mission_state vide")
    return json.loads(row[0])


def md_to_doc(title: str, md: str) -> bytes:
    return eitem._wrap_word_doc(title, md).encode("utf-8")


def write_doc(folder: Path, fname: str, md: str, title: str) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / fname).write_bytes(md_to_doc(title, md))


def sort_entretiens(ents: list) -> list:
    return sorted(ents, key=lambda e: (e.get("sem") or 0, e.get("j") or 0, e.get("heure") or ""))


def sort_livrables(livs: list) -> list:
    return sorted(livs, key=lambda l: l.get("ref") or "")


def entretien_md(state: dict, e: dict) -> str:
    payload = eitem.entretien_payload(state, DB_PATH, e["id"])
    md = eitem._md_entretien(payload)
    contact = " · ".join(
        x
        for x in [
            " ".join(p for p in (e.get("prenom"), e.get("nom")) if p),
            e.get("mail"),
            e.get("tel"),
        ]
        if x
    )
    if contact:
        md = md.replace(
            f"| Trame | {e.get('trame', '—')} |",
            f"| Trame | {e.get('trame', '—')} |\n| Contact | {contact} |",
        )
    return md


def checklist_af_md(state: dict, cl: dict) -> str:
    meta = state.get("meta") or {}
    lines = [
        f"# Checklist documentaire {cl.get('id', '')} — {cl.get('n', '')}",
        "",
        f"- **Mission :** {meta.get('client', 'PNIPM')}",
        f"- **Exporté le :** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "## Points de contrôle",
        "",
    ]
    items = cl.get("items") or []
    ok = sum(1 for i in items if i.get("ok"))
    lines.append(f"**Complétude :** {ok}/{len(items)} points cochés")
    lines.append("")
    for it in items:
        mark = "Fait" if it.get("ok") else "À faire"
        lines.append(f"- **[{mark}]** {it.get('t', '')}")
    lines.append("")
    return "\n".join(lines)


def checklist_af_all_md(state: dict) -> str:
    lists = state.get("checklists") or []
    meta = state.get("meta") or {}
    lines = [
        "# Checklists documentaires A → F — export complet",
        "",
        f"- **Mission :** {meta.get('client', 'PNIPM')}",
        f"- **Exporté le :** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]
    for cl in lists:
        lines.append(checklist_af_md(state, cl))
        lines.append("\n---\n")
    return "\n".join(lines)


def checklist_cdc_md(state: dict) -> str:
    rows = state.get("cdcChecklistTech") or {}
    gaps = {g["ref"]: g for g in state.get("gaps") or []}
    tech_gaps = [
        g
        for g in gaps.values()
        if g.get("theme")
        in {
            "Architecture",
            "Données",
            "Interop",
            "Réseau",
            "Sécurité",
            "Fonctionnel",
            "Performance",
            "IA",
            "Conformité",
            "UX",
            "Reporting",
            "Legacy",
        }
        or (g.get("ref") or "").startswith("G-4")
    ]
    refs = sorted(
        set(list(rows.keys()) + [g["ref"] for g in tech_gaps]),
        key=lambda r: int(r.replace("G-", "")) if r.startswith("G-") else 0,
    )
    meta = state.get("meta") or {}
    lines = [
        "# Checklist CDC technique — besoins SI / PNIPM",
        "",
        f"- **Mission :** {meta.get('client', 'PNIPM')}",
        f"- **Exporté le :** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]
    for ref in refs:
        g = gaps.get(ref, {})
        s = rows.get(ref, {})
        lines += [
            f"## {ref} — {g.get('theme', '—')}",
            "",
            f"**Exigence CDC :** {g.get('exig', '—')}",
            "",
            f"**Réalité observée :** {g.get('realite', '—')}",
            "",
            f"**Réf. CDC :** {g.get('cdc', '—')}",
            "",
            f"**Verdict audit :** {g.get('verdict', '—')}",
            "",
            f"**Couverture technique :** {s.get('couverture', '—')}",
            f"**Preuve / source :** {s.get('preuve', '—') or '—'}",
            f"**Point vérifié :** {'oui' if s.get('verifie') else 'non'}",
            "",
        ]
        if s.get("notes"):
            lines += ["**Notes audit :**", "", s["notes"], ""]
        pjs = s.get("attachments") or []
        if pjs:
            lines.append("**Pièces jointes :** " + ", ".join(p.get("name", "") for p in pjs))
            lines.append("")
    return "\n".join(lines)


def consolidated_doc(title: str, sections: list[str]) -> bytes:
    now = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
    parts = []
    for i, md in enumerate(sections):
        html = eitem._md_to_simple_html(md)
        brk = ' style="page-break-before:always;margin-top:24px;border-top:2px solid #e8e0d8;padding-top:12px"' if i > 0 else ""
        parts.append(f"<div{brk}><p>{html}</p></div>")
    body = "\n".join(parts)
    safe = title.replace("&", "&amp;").replace("<", "&lt;")
    doc = f"""<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>{safe}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
body{{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#1a1a1a;margin:24px 32px}}
h1{{font-size:16pt;color:#8b4513}} h2{{font-size:13pt;color:#5c4033}}
.pagebreak{{page-break-before:always}}
</style></head>
<body>
<div style="text-align:center;padding:60px 20px">
<h1>{safe}</h1>
<p style="color:#555">Mission PNIPM · Export {now}</p>
</div>
{body}
</body></html>"""
    return doc.encode("utf-8")


def slug(name: str) -> str:
    s = re.sub(r"[^\w\-]+", "_", (name or "doc").strip())[:70]
    return s or "doc"


def main() -> None:
    state = load_state()
    if OUT.exists():
        import shutil

        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    dirs = {
        "entretiens": OUT / "entretiens",
        "checklists": OUT / "checklists",
        "livrables": OUT / "livrables",
        "volumes": OUT / "volumes",
    }
    for d in dirs.values():
        d.mkdir(parents=True)

    ents = sort_entretiens(state.get("entretiens") or [])
    livs = sort_livrables(state.get("livrables") or [])
    clists = state.get("checklists") or []

    ent_sections = []
    for e in ents:
        md = entretien_md(state, e)
        ent_sections.append(md)
        fname = slug(f"entretien_S{e.get('sem','')}_{e.get('struct','')}_{e.get('n','')}") + ".doc"
        write_doc(dirs["entretiens"], fname, md, e.get("n", "Entretien"))

    (dirs["volumes"] / "TOUS_ENTRETIENS_QUESTIONNAIRES.doc").write_bytes(
        consolidated_doc("Tous les entretiens — questionnaires", ent_sections)
    )

    for cl in clists:
        md = checklist_af_md(state, cl)
        fname = f"checklist_{cl.get('id', 'X')}_{slug(cl.get('n', ''))}.doc"
        write_doc(dirs["checklists"], fname, md, f"Checklist {cl.get('id')}")

    cdc_md = checklist_cdc_md(state)
    write_doc(dirs["checklists"], "checklist_CDC_technique_G01-G48.doc", cdc_md, "Checklist CDC technique")

    (dirs["volumes"] / "TOUTES_CHECKLISTS.doc").write_bytes(
        consolidated_doc(
            "Toutes les checklists (A-F + CDC technique)",
            [checklist_af_all_md(state), cdc_md],
        )
    )

    liv_sections = []
    for l in livs:
        payload = eitem.livrable_payload(state, l.get("id") or l.get("ref"))
        md = eitem._md_livrable(payload)
        liv_sections.append(md)
        lid = l.get("id") or l.get("ref")
        data, fname, _ = eitem.export_livrable(state, lid, "doc")
        (dirs["livrables"] / fname).write_bytes(data)

    (dirs["volumes"] / "TOUS_LIVRABLES_L1-L7.doc").write_bytes(
        consolidated_doc("Tous les livrables contractuels", liv_sections)
    )

    readme = f"""EXPORT MISSION — .doc
========================
Exporté : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

entretiens/          {len(ents)} fichiers (questionnaire 3 phases + CR)
checklists/          {len(clists)} checklists A-F + 1 CDC technique
livrables/           {len(livs)} livrables L1-L7
volumes/             3 volumes consolidés pour impression

Ouvrir les .doc dans Word → Imprimer ou Enregistrer en PDF.
"""
    (OUT / "LISEZMOI.txt").write_text(readme, encoding="utf-8")

    manifest = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "format": "doc",
        "entretiens": len(ents),
        "checklists_af": len(clists),
        "checklist_cdc": 1,
        "livrables": len(livs),
        "volumes": 3,
        "total_files": len(ents) + len(clists) + 1 + len(livs) + 3,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(OUT.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(OUT.parent))

    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    print("ZIP:", ZIP_PATH, ZIP_PATH.stat().st_size)


if __name__ == "__main__":
    main()

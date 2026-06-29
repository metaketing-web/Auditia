#!/usr/bin/env python3
"""Backup papier — tous les entretiens + tous les livrables (Word + HTML imprimable)."""
from __future__ import annotations

import json
import re
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import enterprise_item_export as eitem

DB_PATH = Path("/opt/portia-audit/data/portia.db")
OUT = Path("/opt/portia-audit/backup-papier")
ZIP_PATH = Path("/opt/portia-audit/backup-papier-entretiens-livrables.zip")


def load_state() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM mission_state LIMIT 1").fetchone()
    if not row:
        raise SystemExit("mission_state vide")
    return json.loads(row[0])


def _contact_line(e: dict) -> str:
    parts = []
    name = " ".join(x for x in (e.get("prenom"), e.get("nom")) if x)
    if name:
        parts.append(name)
    if e.get("mail"):
        parts.append(e["mail"])
    if e.get("tel"):
        parts.append(e["tel"])
    return " · ".join(parts) if parts else "—"


def entretien_md(state: dict, e: dict) -> str:
    payload = eitem.entretien_payload(state, DB_PATH, e["id"])
    md = eitem._md_entretien(payload)
    contact = _contact_line(e)
    md = md.replace(
        f"| Trame | {e.get('trame', '—')} |",
        f"| Trame | {e.get('trame', '—')} |\n| Contact | {contact} |",
    )
    if e.get("region"):
        md = md.replace(
            f"| Structure | {e.get('struct', '—')} |",
            f"| Structure | {e.get('struct', '—')} |\n| Région | {e.get('region', '—')} |",
        )
    return md


def livrable_md(state: dict, l: dict) -> str:
    payload = eitem.livrable_payload(state, l.get("id") or l.get("ref"))
    return eitem._md_livrable(payload)


def _md_to_html(body_md: str) -> str:
    body = body_md.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    body = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", body)
    body = re.sub(r"^# (.+)$", r"<h1>\1</h1>", body, flags=re.M)
    body = re.sub(r"^## (.+)$", r"<h2>\1</h2>", body, flags=re.M)
    body = re.sub(r"^\- (.+)$", r"<li>\1</li>", body, flags=re.M)
    body = re.sub(r"^\| (.+?) \|$", r"<tr><td>\1</td></tr>", body, flags=re.M)
    return body.replace("\n\n", "</p><p>")


def wrap_print_doc(title: str, sections: list[str], *, kind: str) -> str:
    now = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
    parts = []
    for i, md in enumerate(sections):
        html = _md_to_html(md)
        brk = ' class="pagebreak"' if i > 0 else ""
        parts.append(f'<div{brk}><p>{html}</p></div>')
    body = "\n".join(parts)
    return f"""<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>{title}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
body{{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#1a1a1a;margin:24px 32px}}
h1{{font-size:16pt;color:#8b4513;margin-top:0}}
h2{{font-size:13pt;color:#5c4033;margin-top:1em;border-bottom:1px solid #ddd;padding-bottom:4px}}
.cover{{text-align:center;padding:80px 40px}}
.cover h1{{font-size:22pt}}
.cover .sub{{font-size:12pt;color:#555;margin-top:12px}}
.toc{{margin:24px 0 32px}}
.toc li{{margin:4px 0}}
.pagebreak{{page-break-before:always;margin-top:24px;padding-top:8px;border-top:2px solid #e8e0d8}}
@media print{{.pagebreak{{page-break-before:always}}}}
</style></head>
<body>
<div class="cover">
  <h1>{title}</h1>
  <p class="sub">Mission PNIPM — MPJIPSC · Backup papier<br>{kind}<br>Exporté le {now}</p>
</div>
<div class="pagebreak"><h2>Sommaire</h2><ol class="toc" id="toc"></ol></div>
{body}
</body></html>"""


def wrap_print_html(title: str, toc_items: list[tuple[str, str]], sections: list[str]) -> str:
    now = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
    toc = "".join(f'<li><a href="#{aid}">{label}</a></li>' for aid, label in toc_items)
    parts = []
    for aid, md in zip((x[0] for x in toc_items), sections):
        html = _md_to_html(md)
        parts.append(f'<section id="{aid}" class="pagebreak"><p>{html}</p></section>')
    return f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>{title}</title>
<style>
body{{font-family:Georgia,"Times New Roman",serif;font-size:11pt;line-height:1.5;max-width:210mm;margin:0 auto;padding:15mm;color:#111}}
h1{{font-size:18pt;color:#8b4513}}
h2{{font-size:14pt;color:#5c4033;border-bottom:1px solid #ccc}}
.cover{{text-align:center;padding:60mm 10mm 40mm}}
.cover h1{{font-size:24pt}}
.toc{{margin:20px 0}}
.toc a{{color:#5c4033;text-decoration:none}}
.pagebreak{{page-break-before:always;margin-top:20px}}
@media print{{
  body{{padding:12mm}}
  .no-print{{display:none}}
  .pagebreak{{page-break-before:always}}
}}
</style></head><body>
<div class="cover"><h1>{title}</h1><p>Mission PNIPM — backup papier<br>{now}</p></div>
<nav class="pagebreak toc"><h2>Sommaire</h2><ol>{toc}</ol></nav>
{"".join(parts)}
<p class="no-print" style="margin-top:40px;text-align:center;color:#666">
  Ouvrir ce fichier dans Chrome/Safari → Fichier → Imprimer → Enregistrer en PDF
</p>
</body></html>"""


def sort_entretiens(ents: list) -> list:
    return sorted(ents, key=lambda e: (e.get("sem") or 0, e.get("j") or 0, e.get("heure") or ""))


def sort_livrables(livs: list) -> list:
    return sorted(livs, key=lambda l: l.get("ref") or l.get("jalon") or "")


def main() -> None:
    state = load_state()
    OUT.mkdir(parents=True, exist_ok=True)
    indiv_e = OUT / "entretiens_individuels"
    indiv_l = OUT / "livrables_individuels"
    for d in (indiv_e, indiv_l):
        d.mkdir(parents=True, exist_ok=True)
        for f in d.glob("*.doc"):
            f.unlink()

    ents = sort_entretiens(state.get("entretiens") or [])
    livs = sort_livrables(state.get("livrables") or [])

    ent_sections = []
    ent_toc = []
    for i, e in enumerate(ents):
        md = entretien_md(state, e)
        ent_sections.append(md)
        aid = f"ent-{i+1}"
        label = f"S{e.get('sem','?')} · {e.get('n','')[:60]}"
        ent_toc.append((aid, label))
        data, fname, _ = eitem.render_item(
            eitem.entretien_payload(state, DB_PATH, e["id"]),
            "doc",
            basename=eitem._slug(f"entretien_{e.get('struct','')}_{e.get('n', e['id'])}", e["id"]),
        )
        (indiv_e / fname).write_bytes(data)

    liv_sections = []
    liv_toc = []
    for i, l in enumerate(livs):
        md = livrable_md(state, l)
        liv_sections.append(md)
        aid = f"liv-{i+1}"
        label = f"{l.get('ref','')} — {l.get('titre','')[:50]}"
        liv_toc.append((aid, label))
        lid = l.get("id") or l.get("ref")
        data, fname, _ = eitem.export_livrable(state, lid, "doc")
        (indiv_l / fname).write_bytes(data)

    ent_cons = wrap_print_doc(
        "BACKUP PAPIER — TOUS LES ENTRETIENS",
        ent_sections,
        kind=f"{len(ents)} entretiens · programme complet",
    )
    liv_cons = wrap_print_doc(
        "BACKUP PAPIER — TOUS LES LIVRABLES",
        liv_sections,
        kind=f"{len(livs)} livrables contractuels L1–L7",
    )
    (OUT / "BACKUP_ENTRETIENS_COMPLET.doc").write_text(ent_cons, encoding="utf-8")
    (OUT / "BACKUP_LIVRABLES_COMPLET.doc").write_text(liv_cons, encoding="utf-8")

    ent_html = wrap_print_html("Backup papier — Entretiens", ent_toc, ent_sections)
    liv_html = wrap_print_html("Backup papier — Livrables", liv_toc, liv_sections)
    (OUT / "BACKUP_ENTRETIENS_COMPLET.html").write_text(ent_html, encoding="utf-8")
    (OUT / "BACKUP_LIVRABLES_COMPLET.html").write_text(liv_html, encoding="utf-8")

    readme = f"""BACKUP PAPIER — MISSION PNIPM
Exporté le {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

CONTENU
=======
• BACKUP_ENTRETIENS_COMPLET.doc   → 1 volume Word, {len(ents)} entretiens (impression reliure)
• BACKUP_LIVRABLES_COMPLET.doc    → 1 volume Word, {len(livs)} livrables L1–L7
• BACKUP_*_COMPLET.html           → version navigateur → Imprimer → PDF
• entretiens_individuels/           → {len(ents)} fichiers .doc (1 par entretien)
• livrables_individuels/            → {len(livs)} fichiers .doc (1 par livrable)

IMPRESSION
==========
1. Ouvrir BACKUP_ENTRETIENS_COMPLET.doc dans Word → Imprimer (recto verso conseillé)
2. Ouvrir BACKUP_LIVRABLES_COMPLET.doc dans Word → Imprimer
   OU ouvrir les .html dans Chrome → Cmd+P → Enregistrer en PDF

Les sauts de page sont insérés entre chaque entretien / livrable.
"""
    (OUT / "LISEZMOI.txt").write_text(readme, encoding="utf-8")

    manifest = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "entretiens": len(ents),
        "livrables": len(livs),
        "files": [
            "BACKUP_ENTRETIENS_COMPLET.doc",
            "BACKUP_LIVRABLES_COMPLET.doc",
            "BACKUP_ENTRETIENS_COMPLET.html",
            "BACKUP_LIVRABLES_COMPLET.html",
            f"entretiens_individuels/ ({len(ents)} fichiers)",
            f"livrables_individuels/ ({len(livs)} fichiers)",
        ],
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

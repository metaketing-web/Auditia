#!/usr/bin/env python3
"""Exporte tous les documents générables de la mission au format Word (.doc)."""
from __future__ import annotations

import json
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import enterprise_item_export as eitem

DB_PATH = Path("/opt/portia-audit/data/portia.db")
OUT_DIR = Path("/opt/portia-audit/exports-word")
ZIP_PATH = Path("/opt/portia-audit/portia-export-word-complet.zip")


def load_state() -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM mission_state LIMIT 1").fetchone()
    if not row:
        raise SystemExit("mission_state vide")
    return json.loads(row[0])


def write_doc(folder: Path, data: bytes, fname: str) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / fname
    path.write_bytes(data)
    return path


def export_checklist_word(state: dict) -> tuple[bytes, str] | None:
    rows = state.get("cdcChecklistTech") or {}
    gaps = {g["ref"]: g for g in state.get("gaps") or []}
    if not rows and not gaps:
        return None
    lines = [
        "# Checklist CDC technique — export complet",
        "",
        f"- **Mission :** {(state.get('meta') or {}).get('client', 'PNIPM')}",
        f"- **Exporté le :** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]
    refs = sorted(
        set(list(rows.keys()) + list(gaps.keys())),
        key=lambda r: int(r.replace("G-", "")) if r.startswith("G-") else 0,
    )
    for ref in refs:
        g = gaps.get(ref, {})
        s = rows.get(ref, {})
        lines += [
            f"## {ref} — {g.get('theme', '—')}",
            "",
            f"**Exigence :** {g.get('exig', '—')}",
            "",
            f"**Réalité :** {g.get('realite', '—')}",
            "",
            f"**Couverture :** {s.get('couverture', '—')}",
            f"**Preuve :** {s.get('preuve', '—')}",
            f"**Vérifié :** {'oui' if s.get('verifie') else 'non'}",
            "",
        ]
        if s.get("notes"):
            lines += ["**Notes audit :**", "", s["notes"], ""]
        pjs = s.get("attachments") or []
        if pjs:
            lines.append("**Pièces jointes :** " + ", ".join(p.get("name", "") for p in pjs))
            lines.append("")
    md = "\n".join(lines)
    doc = eitem._wrap_word_doc("Checklist CDC technique", md)
    return doc.encode("utf-8"), "checklist_cdc_technique.doc"


def main() -> None:
    state = load_state()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for sub in ("entretiens", "constats", "matrice_cdc", "livrables", "synthese"):
        d = OUT_DIR / sub
        if d.exists():
            for f in d.glob("*.doc"):
                f.unlink()

    counts = {"entretiens": 0, "constats": 0, "matrice_cdc": 0, "livrables": 0, "synthese": 0}
    errors: list[str] = []

    for ent in state.get("entretiens") or []:
        eid = ent.get("id")
        if not eid:
            continue
        try:
            data, fname, _ = eitem.export_entretien(state, DB_PATH, eid, "doc")
            write_doc(OUT_DIR / "entretiens", data, fname)
            counts["entretiens"] += 1
        except Exception as ex:
            errors.append(f"entretien {eid}: {ex}")

    for c in state.get("constats") or []:
        cid = c.get("id") or c.get("ref")
        if not cid:
            continue
        try:
            data, fname, _ = eitem.export_constat(state, cid, "doc")
            write_doc(OUT_DIR / "constats", data, fname)
            counts["constats"] += 1
        except Exception as ex:
            errors.append(f"constat {cid}: {ex}")

    try:
        data, fname, _ = eitem.export_all_constats(state, "doc")
        write_doc(OUT_DIR / "synthese", data, fname)
        counts["synthese"] += 1
    except Exception as ex:
        errors.append(f"constats_all: {ex}")

    for g in state.get("gaps") or []:
        gid = g.get("id") or g.get("ref")
        if not gid:
            continue
        try:
            data, fname, _ = eitem.export_gap(state, gid, "doc")
            write_doc(OUT_DIR / "matrice_cdc", data, fname)
            counts["matrice_cdc"] += 1
        except Exception as ex:
            errors.append(f"gap {gid}: {ex}")

    try:
        data, fname, _ = eitem.export_all_gaps(state, "doc")
        write_doc(OUT_DIR / "synthese", data, fname)
        counts["synthese"] += 1
    except Exception as ex:
        errors.append(f"gaps_all: {ex}")

    ck = export_checklist_word(state)
    if ck:
        write_doc(OUT_DIR / "synthese", ck[0], ck[1])
        counts["synthese"] += 1

    for l in state.get("livrables") or []:
        lid = l.get("id") or l.get("ref")
        if not lid:
            continue
        try:
            data, fname, _ = eitem.export_livrable(state, lid, "doc")
            write_doc(OUT_DIR / "livrables", data, fname)
            counts["livrables"] += 1
        except Exception as ex:
            errors.append(f"livrable {lid}: {ex}")

    manifest = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "format": "doc",
        "counts": counts,
        "total": sum(counts.values()),
        "errors": errors,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(OUT_DIR.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(OUT_DIR.parent))

    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    print("ZIP:", ZIP_PATH, "size:", ZIP_PATH.stat().st_size)


if __name__ == "__main__":
    main()

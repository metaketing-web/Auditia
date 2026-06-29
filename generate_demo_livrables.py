#!/usr/bin/env python3
"""Génère les livrables L1–L8 en version démo (.doc Word)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import demo_livrables_content as demo
import md_to_word

OUT = Path(__file__).resolve().parent / "demo-livrables"
EXPORT_DIR = Path(__file__).resolve().parent / "export-mission-doc/export-mission-doc/livrables"

LIVRABLES = {
    "L1": {
        "titre": "Note de cadrage validée",
        "content_fn": demo.l1_note_cadrage,
    },
    "L2": {
        "titre": "Inventaire des besoins qualifiés",
        "content_fn": demo.l2_inventaire_besoins,
    },
    "L3": {
        "titre": "Cartographie des données & des systèmes",
        "content_fn": demo.l3_cartographie,
    },
    "L4": {
        "titre": "Matrice des écarts CDC / réalité",
        "content_fn": demo.l4_matrice_ecarts,
    },
    "L5": {
        "titre": "Analyse des risques & recommandations",
        "content_fn": demo.l5_risques,
    },
    "L6": {
        "titre": "Feuille de route de déploiement",
        "content_fn": demo.l6_feuille_route,
    },
    "L7": {
        "titre": "Rapport final d'audit & restitution",
        "content_fn": demo.l7_rapport_final,
    },
    "L8": {
        "titre": "Annexe — chiffrage par scénario",
        "content_fn": demo.l8_chiffrage,
    },
}


def livrable_md(content: str) -> str:
    return content.strip() + "\n"


def generate(ref: str, *, copy_export: bool = True) -> Path:
    ref = ref.upper()
    if ref not in LIVRABLES:
        raise KeyError(ref)
    meta = LIVRABLES[ref]
    md = livrable_md(meta["content_fn"]())
    title = f"Livrable {ref} — {meta['titre']} (DEMO)"
    html = md_to_word.wrap_word_doc(title, md)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"livrable_{ref}_DEMO.doc"
    path.write_bytes(html.encode("utf-8"))
    if copy_export:
        EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        export_path = EXPORT_DIR / f"livrable_{ref}.doc"
        shutil.copy2(path, export_path)
    return path


def generate_volume(*, copy_export: bool = True) -> Path:
    """Volume consolidé L1–L8 pour impression."""
    parts: list[str] = []
    for ref, meta in LIVRABLES.items():
        md = livrable_md(meta["content_fn"]())
        parts.append(
            f'<!-- pagebreak -->\n\n# {ref} — {meta["titre"]}\n\n> Volume consolidé · {ref}\n\n{md}'
        )
    combined = "\n\n".join(parts)
    title = "Tous les livrables contractuels L1–L8 (DEMO)"
    html = md_to_word.wrap_word_doc(title, combined)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "TOUS_LIVRABLES_L1-L8_DEMO.doc"
    path.write_bytes(html.encode("utf-8"))
    if copy_export:
        vol_dir = Path(__file__).resolve().parent / "export-mission-doc/export-mission-doc/volumes"
        vol_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, vol_dir / "TOUS_LIVRABLES_L1-L8.doc")
        shutil.copy2(path, vol_dir / "TOUS_LIVRABLES_L1-L7.doc")
    return path


def main() -> None:
    refs = sys.argv[1:] if len(sys.argv) > 1 else list(LIVRABLES.keys())
    for ref in refs:
        p = generate(ref.upper())
        print(f"OK {p} ({p.stat().st_size} octets)")
    if len(refs) == len(LIVRABLES):
        vol = generate_volume()
        print(f"OK {vol} ({vol.stat().st_size} octets)")


if __name__ == "__main__":
    main()

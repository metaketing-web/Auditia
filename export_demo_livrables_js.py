#!/usr/bin/env python3
"""Exporte les contenus démo L1–L8 vers portia-demo-livrables-data.js."""
from __future__ import annotations

import json
from pathlib import Path

import demo_livrables_content as demo

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "portia-demo-livrables-data.js"

CONTENT = {
    "L1": demo.l1_note_cadrage(),
    "L2": demo.l2_inventaire_besoins(),
    "L3": demo.l3_cartographie(),
    "L4": demo.l4_matrice_ecarts(),
    "L5": demo.l5_risques(),
    "L6": demo.l6_feuille_route(),
    "L7": demo.l7_rapport_final(),
    "L8": demo.l8_chiffrage(),
}

META = {
    "L1": {"statut": "valide", "progress": 100},
    "L2": {"statut": "redige", "progress": 85},
    "L3": {"statut": "redige", "progress": 80},
    "L4": {"statut": "redige", "progress": 82},
    "L5": {"statut": "redige", "progress": 78},
    "L6": {"statut": "redige", "progress": 75},
    "L7": {"statut": "en_cours", "progress": 70},
    "L8": {"statut": "redige", "progress": 90},
}


def main() -> None:
    payload = {
        "version": 2,
        "content": {k: v.strip() for k, v in CONTENT.items()},
        "meta": META,
    }
    js = (
        "/** Généré par export_demo_livrables_js.py — ne pas éditer à la main */\n"
        "window.PortiaDemoLivrablesData = "
        + json.dumps(payload, ensure_ascii=False)
        + ";\n"
    )
    OUT.write_text(js, encoding="utf-8")
    print(f"OK {OUT} ({OUT.stat().st_size} octets, {len(CONTENT)} livrables)")


if __name__ == "__main__":
    main()

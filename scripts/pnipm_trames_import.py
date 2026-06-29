#!/usr/bin/env python3
"""Import PNIPM_trames_a_ajouter.json — trames questionnaires + réaffectations entretiens."""
from __future__ import annotations

import json
import os
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_JSON = ROOT / "imports" / "questionnaires-2026" / "PNIPM_trames_a_ajouter.json"
PATCH_JS = ROOT / "questionnaires-pnipm-2026-patch.js"
CATALOG_JSON = ROOT / "questionnaires_catalog.json"
DB_PATH = Path(os.environ.get("PORTIA_DB", ROOT / "data" / "portia.db"))

PHASE_MAP = {
    "investigation": "invest",
    "confrontation": "confront",
    "co-construction": "coconstruct",
    "co construction": "coconstruct",
}

PREFIX_ALIASES = {
    "programme": "prg",
    "prog": "prg",
}

REASSIGN_FALLBACK: list[tuple[str, str, str]] = [
    ("ent_fs236bt", "Directeur des Ressources Humaines", "drh"),
    ("ent_h9w21r9", "Chef Service Gestion du Patrimoine", "flotte"),
    ("ent_6w1fetz", "Chef Cellule Passation des Marchés", "marches"),
    ("ent_3uio1nu", "Directeur des Affaires Financières", "daf"),
    ("ent_wb5irc5", "Directeur de la Planification", "dpsd"),
    ("ent_zmo1cx6", "Directeur Affaires Juridiques", "dajc"),
    ("ent_297ry5c", "Directeur Autonomisation des Jeunes", "dajip"),
    ("ent_dgeqx7n", "Coordonnateur Équipe Carte Jeunes", "carte_jeunes"),
]

SNOWBALL_TEXT = (
    "Qui d'autre devrions-nous impérativement interroger pour compléter ce cadrage "
    "(personnes, structures, points focaux) ?"
)

NEW_ENTITE = {
    "id": "ent_dcnat01",
    "n": "Point focal Datacenter National / Cloud Gouvernemental",
    "struct": "Hébergement souverain",
    "axe": "Technique",
    "couche": "Technique",
    "sem": 3,
    "j": 16,
    "heure": "11:00",
    "aud": "L",
    "trame": "technique",
    "statut": "planifie",
    "region": "Abidjan",
    "prenom": "",
    "nom": "",
    "mail": "",
    "tel": "",
    "cr": "",
    "qual": "",
    "obs": [],
    "docs": [],
    "media": [],
    "triang": 0,
    "questionnaire": {"invest": {}, "confront": {}, "coconstruct": {}},
}


def _norm_phase(name: str) -> str:
    key = (name or "").strip().lower()
    return PHASE_MAP.get(key, key)


def _fix_ref(ref: str, trame_key: str, prefix_confirmed: bool, prefix_ref: str) -> str:
    r = (ref or "").strip()
    if trame_key == "programme" and r.startswith("prog_"):
        r = "prg_" + r[5:]
    return r


def _q_item(ref: str, texte: str) -> dict[str, str]:
    return {"id": ref, "q": texte, "hint": ""}


def _section(title: str, items: list[dict[str, str]]) -> dict[str, Any]:
    return {"title": title, "items": items}


def json_trame_to_complet(entry: dict[str, Any]) -> dict[str, Any]:
    phases_out: dict[str, Any] = {}
    for ph in entry.get("phases") or []:
        pk = _norm_phase(ph.get("phase") or "")
        if pk not in ("invest", "confront", "coconstruct"):
            continue
        sections: list[dict[str, Any]] = []
        if ph.get("sections"):
            for sec in ph["sections"]:
                title = sec.get("titre") or f"Section {sec.get('lettre', '')}".strip()
                items = [_q_item(q["ref"], q["texte"]) for q in sec.get("questions") or []]
                if items:
                    sections.append(_section(title, items))
        elif ph.get("questions"):
            title = ph.get("titre") or pk.capitalize()
            items = [_q_item(q["ref"], q["texte"]) for q in ph["questions"]]
            sections.append(_section(title, items))
        dur = "45-55 min" if pk == "invest" else "15-20 min" if pk == "confront" else "10-15 min"
        phases_out[pk] = {"duration": dur, "sections": sections}
    return {
        "label": entry.get("titre") or entry.get("cle", ""),
        "dur": entry.get("duree_indicative") or "90 min",
        "phases": phases_out,
    }


def build_additions_payload(data: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for block in data.get("additions_trames_existantes") or []:
        trame = block.get("cle_trame") or ""
        prefix = block.get("prefixe_ref") or ""
        confirmed = bool(block.get("prefixe_confirme"))
        for aj in block.get("ajouts") or []:
            phase = _norm_phase(aj.get("phase") or "")
            entry: dict[str, Any] = {"trame": trame, "phase": phase}
            if aj.get("nouvelle_section"):
                ns = aj["nouvelle_section"]
                title = f"{ns.get('lettre', '')}. {ns.get('titre', '')}".strip(". ")
                items = []
                for q in ns.get("questions") or []:
                    ref = _fix_ref(q["ref"], trame, confirmed, prefix)
                    items.append(_q_item(ref, q["texte"]))
                entry["newSection"] = _section(title, items)
            if aj.get("questions_ajoutees"):
                items = []
                for q in aj["questions_ajoutees"]:
                    ref = _fix_ref(q["ref"], trame, confirmed, prefix)
                    items.append(_q_item(ref, q["texte"]))
                entry["appendQuestions"] = items
                entry["sectionMatch"] = (aj.get("section_existante") or "").split("(")[0].strip()
            out.append(entry)
    return out


def build_snowball_rules(data: dict[str, Any]) -> dict[str, str]:
    tc = data.get("tronc_commun") or {}
    q = tc.get("question_cloture_co_construction") or {}
    text = q.get("texte") or SNOWBALL_TEXT
    suffix = q.get("ref_suffixe") or "_cc_snowball"
    return {"suffix": suffix, "text": text}


def generate_patch_js(data: dict[str, Any]) -> str:
    new_trames = {
        t["cle"]: json_trame_to_complet(t) for t in (data.get("nouvelles_trames") or [])
    }
    additions = build_additions_payload(data)
    snowball = build_snowball_rules(data)
    new_keys = list(new_trames.keys())
    payload = {
        "meta": data.get("meta", {}),
        "newTrames": new_trames,
        "additions": additions,
        "snowball": snowball,
        "newTrameKeys": new_keys,
        "deprecated": (data.get("deprecation") or {}).get("trame"),
    }
    return (
        "/** Généré par scripts/pnipm_trames_import.py — ne pas éditer à la main */\n"
        "(function () {\n"
        "  \"use strict\";\n"
        f"  const PNIPM_PATCH = {json.dumps(payload, ensure_ascii=False, indent=2)};\n"
        + open(ROOT / "scripts" / "_pnipm_patch_runtime.js", encoding="utf-8").read()
        + "\n})();\n"
    )


def get_state(conn: sqlite3.Connection) -> dict[str, Any]:
    row = conn.execute("SELECT payload FROM mission_state WHERE id = 1").fetchone()
    return json.loads(row[0]) if row and row[0] else {}


def set_state(conn: sqlite3.Connection, state: dict[str, Any]) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "UPDATE mission_state SET payload = ?, updated_at = ? WHERE id = 1",
        (json.dumps(state, ensure_ascii=False), ts),
    )
    conn.commit()


def _deep_merge_section(tr: dict[str, Any], add: dict[str, Any]) -> None:
    ph = add.get("phase")
    phases = tr.get("phases") or {}
    if ph not in phases:
        return
    if add.get("newSection"):
        phases[ph].setdefault("sections", []).append(add["newSection"])
        return
    if not add.get("appendQuestions"):
        return
    secs = phases[ph].get("sections") or []
    match = (add.get("sectionMatch") or "").lower()
    target = secs[-1] if secs else None
    if match:
        for s in secs:
            if match in (s.get("title") or "").lower():
                target = s
                break
    if not target:
        return
    target.setdefault("items", [])
    existing = {it.get("id") for it in target["items"]}
    for q in add["appendQuestions"]:
        if q.get("id") not in existing:
            target["items"].append(q)


def update_catalog(data: dict[str, Any]) -> None:
    if not CATALOG_JSON.is_file():
        return
    catalog = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    trames = catalog.setdefault("trames", {})
    new_trames = {t["cle"]: json_trame_to_complet(t) for t in (data.get("nouvelles_trames") or [])}
    trames.update(new_trames)
    for add in build_additions_payload(data):
        tr = trames.get(add["trame"])
        if tr:
            _deep_merge_section(tr, add)
    dep = (data.get("deprecation") or {}).get("trame")
    if dep and dep in trames:
        del trames[dep]
    meta = catalog.setdefault("meta", {})
    meta["pnipmTramesRev"] = "20260619"
    CATALOG_JSON.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")


def migrate_entretiens(state: dict[str, Any], data: dict[str, Any]) -> dict[str, int]:
    stats = {"reassigned": 0, "entity_added": 0}
    by_id = {r["id"]: r["trame_cible"] for r in (data.get("reaffectations_entites") or [])}
    ents = state.get("entretiens") or []
    for ent in ents:
        eid = ent.get("id")
        if eid in by_id:
            ent["trame"] = by_id[eid]
            ent["updated"] = datetime.now(timezone.utc).isoformat()
            stats["reassigned"] += 1
        else:
            for fid, needle, trame in REASSIGN_FALLBACK:
                if eid == fid or (needle.lower() in (ent.get("n") or "").lower()):
                    if ent.get("trame") != trame:
                        ent["trame"] = trame
                        ent["updated"] = datetime.now(timezone.utc).isoformat()
                        stats["reassigned"] += 1
                    break

    if not any(e.get("id") == NEW_ENTITE["id"] for e in ents):
        ent = json.loads(json.dumps(NEW_ENTITE))
        ent["updated"] = datetime.now(timezone.utc).isoformat()
        ents.append(ent)
        state["entretiens"] = ents
        stats["entity_added"] = 1

    meta = state.setdefault("meta", {})
    meta["pnipmTramesRev"] = "20260619"
    meta["pnipmTramesSource"] = "PNIPM_trames_a_ajouter.json"
    return stats


def main() -> None:
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_JSON
    if not json_path.is_file():
        raise SystemExit(f"Fichier introuvable: {json_path}")
    data = json.loads(json_path.read_text(encoding="utf-8"))

    PATCH_JS.write_text(generate_patch_js(data), encoding="utf-8")
    update_catalog(data)
    print(f"OK — {PATCH_JS.name} généré ({len(data.get('nouvelles_trames') or [])} trames)")
    print(f"OK — {CATALOG_JSON.name} mis à jour")

    if DB_PATH.is_file():
        with sqlite3.connect(DB_PATH) as conn:
            state = get_state(conn)
            if state:
                stats = migrate_entretiens(state, data)
                set_state(conn, state)
                print(f"OK — base locale: {stats}")
    else:
        print("Note — pas de base locale, migration serveur via --db")


if __name__ == "__main__":
    main()

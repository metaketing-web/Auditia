"""Planning mission 4 semaines — modèle, génération, export ICS."""
from __future__ import annotations

import json
import secrets
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional


DEFAULT_WEEKS = [
    {
        "sem": 1,
        "titre": "Cadrage stratégique",
        "objectif": "Commande politique, sponsors, périmètre, Data Room initiale, COPIL de lancement.",
        "jalons": ["Lancement COPIL · Charte signée", "Entretiens Cabinet & stratégie", "Note de cadrage L1"],
        "startJ": 0,
        "endJ": 4,
        "color": "var(--axe-pol)",
    },
    {
        "sem": 2,
        "titre": "Deep-dive programmatique",
        "objectif": "Directions métiers, SIGFIP, programmatique / non-programmatique, lacunes données.",
        "jalons": ["Entretiens DPSD / DAF", "Grille qualité données", "Constats programmatiques"],
        "startJ": 7,
        "endJ": 11,
        "color": "var(--axe-prog)",
    },
    {
        "sem": 3,
        "titre": "Volet B & intégrations",
        "objectif": "RH, patrimoine, marchés, GED, DSI, RSSI/DPO, flux et interopérabilité.",
        "jalons": ["Volet B structuré", "Cartographie flux & écosystème", "Matrice d'écart consolidée"],
        "startJ": 14,
        "endJ": 18,
        "color": "var(--axe-tech)",
    },
    {
        "sem": 4,
        "titre": "Terrain régional",
        "objectif": "Directions régionales, démo SI, agents, focus groups — questionnaires terrain.",
        "jalons": ["Entretiens terrain S4", "Synthèse régionale", "Préparation restitution"],
        "startJ": 21,
        "endJ": 25,
        "color": "var(--sage)",
    },
    {
        "sem": 5,
        "titre": "Rendus & clôture",
        "objectif": "Finalisation des livrables, remise du rapport final et restitution au Comité Stratégique.",
        "jalons": ["Rapport final L7", "Remise des livrables — 3 août"],
        "startJ": 26,
        "endJ": 28,
        "color": "var(--gold)",
    },
]


def _uid(prefix: str = "ev") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def parse_j0(state: dict[str, Any]) -> date:
    j0 = (state.get("meta") or {}).get("j0") or "2026-07-06"
    try:
        return date.fromisoformat(str(j0)[:10])
    except ValueError:
        return date(2026, 7, 6)


def j_to_datetime(j0: date, mission_j: int, time_str: str = "09:00") -> datetime:
    h, m = (time_str or "09:00").split(":")[:2]
    d = j0 + timedelta(days=int(mission_j))
    return datetime(d.year, d.month, d.day, int(h), int(m), tzinfo=timezone.utc)


def default_planning(state: dict[str, Any]) -> dict[str, Any]:
    j0 = parse_j0(state).isoformat()
    return {
        "j0": j0,
        "spanDays": 29,
        "weeks": [dict(w) for w in DEFAULT_WEEKS],
        "events": [],
        "syncMeta": {
            "google": {"connected": False, "lastSync": None, "calendarId": "primary"},
            "outlook": {"connected": False, "lastSync": None, "calendarId": None},
        },
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def ensure_planning(state: dict[str, Any]) -> dict[str, Any]:
    p = state.get("planning4s")
    if not p or not p.get("weeks"):
        p = default_planning(state)
        state["planning4s"] = p
    else:
        p.setdefault("events", [])
        p.setdefault("syncMeta", {})
        meta_j0 = parse_j0(state).isoformat()
        if p.get("j0") != meta_j0:
            p["j0"] = meta_j0
    return p


def _norm_aud(aud: Any) -> str:
    legacy = {"B": "A", "T": "L", "B+T": "A+L"}
    s = str(aud or "A").strip().upper()
    return legacy.get(s, s) if s in legacy else legacy.get(str(aud or ""), str(aud or "A"))


def entretien_to_event(ent: dict[str, Any], j0: date) -> dict[str, Any]:
    ej = int(ent.get("j", 0))
    heure = (ent.get("heure") or "09:00").strip()
    end_h = heure
    try:
        h, m = map(int, heure.split(":"))
        end_h = f"{h+1:02d}:{m:02d}"
    except Exception:
        end_h = "10:00"
    ent_id = ent.get("id") or _uid("ent")
    return {
        "id": f"ent_{ent_id}" if not str(ent_id).startswith("ent_") else str(ent_id),
        "title": ent.get("n") or "Entretien",
        "type": "entretien",
        "sem": int(ent.get("sem", 1)),
        "startJ": ej,
        "endJ": ej,
        "startTime": heure,
        "endTime": end_h,
        "location": ent.get("struct") or "",
        "description": f"Auditeur {ent.get('aud','')} · {ent.get('trame','')}",
        "entretienId": ent.get("id"),
        "aud": _norm_aud(ent.get("aud") or "A"),
        "color": None,
        "external": {},
        "readonly": True,
    }


def sync_event_aud_to_entretiens(state: dict[str, Any]) -> None:
    """Aligne entretiens.aud depuis les événements planning liés."""
    ents = {e["id"]: e for e in state.get("entretiens") or [] if e.get("id")}
    legacy = {"B": "A", "T": "L", "B+T": "A+L"}
    for ev in (state.get("planning4s") or {}).get("events") or []:
        eid = ev.get("entretienId")
        aud = ev.get("aud")
        if not eid or eid not in ents or not aud:
            continue
        aud = legacy.get(str(aud).upper(), str(aud).upper())
        if aud in ("A", "L", "A+L"):
            ents[eid]["aud"] = aud


def blankify_entretien(ent: dict[str, Any]) -> None:
    """Remet un entretien à l'état vierge (planifié, sans saisie terrain)."""
    ent["statut"] = "planifie"
    ent["cr"] = ""
    ent["qual"] = ""
    ent["obs"] = []
    ent["triang"] = 0
    ent["updated"] = None
    ent["prenom"] = ""
    ent["nom"] = ""
    ent["mail"] = ""
    ent["tel"] = ""
    ent["docs"] = []
    ent["media"] = []
    ent["questionnaire"] = {"invest": {}, "confront": {}, "coconstruct": {}}
    ent.pop("leadAuditor", None)
    ent.pop("_offlineDraft", None)


def blankify_all_entretiens(state: dict[str, Any]) -> int:
    """Vide toutes les saisies des entretiens et reconstruit le planning."""
    ents = state.get("entretiens") or []
    for ent in ents:
        if isinstance(ent, dict):
            blankify_entretien(ent)
    rebuild_from_entretiens(state)
    return len(ents)


def sync_planning_events_to_entretiens(state: dict[str, Any]) -> int:
    """Crée ou met à jour les entretiens depuis les événements planning (type entretien)."""
    ents_list = state.get("entretiens")
    if ents_list is None:
        ents_list = []
        state["entretiens"] = ents_list
    by_id = {e["id"]: e for e in ents_list if e.get("id")}
    updated = 0
    p = ensure_planning(state)
    now = datetime.now(timezone.utc).isoformat()
    for ev in p.get("events") or []:
        if ev.get("type") != "entretien" and not ev.get("entretienId"):
            continue
        aud = _norm_aud(ev.get("aud") or "A")
        patch: dict[str, Any] = {
            "j": int(ev.get("startJ") or 0),
            "heure": (ev.get("startTime") or "09:00").strip(),
            "sem": int(ev.get("sem") or 1),
            "aud": aud,
            "updated": now,
        }
        if ev.get("location"):
            patch["struct"] = ev["location"]
        if ev.get("title"):
            patch["n"] = ev["title"]
        eid = ev.get("entretienId")
        if eid and eid in by_id:
            by_id[eid].update(patch)
            updated += 1
            continue
        if ev.get("type") == "entretien" and (ev.get("title") or "").strip():
            new_id = f"ent_{uuid.uuid4().hex[:10]}"
            ent = {
                "id": new_id,
                "n": ev["title"].strip(),
                "struct": ev.get("location") or "",
                "axe": "Programmatique",
                "couche": "Direction",
                "statut": "planifie",
                "region": "Abidjan",
                "trame": "direction",
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
                **patch,
            }
            ents_list.append(ent)
            by_id[new_id] = ent
            ev["entretienId"] = new_id
            ev["readonly"] = True
            ev["type"] = "entretien"
            updated += 1
    return updated


def sync_entretien_aud_to_events(state: dict[str, Any]) -> None:
    """Aligne planning.events.aud depuis entretiens (après bulk-assign)."""
    by_aud = {e["id"]: e.get("aud") for e in state.get("entretiens") or [] if e.get("id")}
    for ev in (state.get("planning4s") or {}).get("events") or []:
        eid = ev.get("entretienId")
        if eid and eid in by_aud and by_aud[eid]:
            ev["aud"] = by_aud[eid]


def rebuild_from_entretiens(state: dict[str, Any], *, keep_manual: bool = True) -> dict[str, Any]:
    p = ensure_planning(state)
    j0 = parse_j0(state)
    manual = [e for e in p.get("events", []) if keep_manual and not e.get("entretienId") and e.get("type") != "entretien"]
    from_ent = [entretien_to_event(e, j0) for e in state.get("entretiens") or [] if e.get("j") is not None]
    p["events"] = manual + from_ent
    p["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return p


def _ics_uid(event: dict[str, Any], j0: date) -> str:
    key = event.get("entretienId") or event.get("id") or _uid()
    return f"{key}@skydeen-{j0.strftime('%Y%m%d')}"


def event_to_ics(event: dict[str, Any], j0: date, mission_name: str) -> str:
    start = j_to_datetime(j0, event["startJ"], event.get("startTime", "09:00"))
    end_j = event.get("endJ", event["startJ"])
    end = j_to_datetime(j0, end_j, event.get("endTime", "10:00"))
    if end <= start:
        end = start + timedelta(hours=1)
    uid = _ics_uid(event, j0)
    desc = (event.get("description") or "").replace("\n", "\\n")
    loc = event.get("location") or ""
    return "\r\n".join(
        [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            f"DTSTART:{start.strftime('%Y%m%dT%H%M%SZ')}",
            f"DTEND:{end.strftime('%Y%m%dT%H%M%SZ')}",
            f"SUMMARY:{_ics_escape(event.get('title', 'Événement'))}",
            f"DESCRIPTION:{_ics_escape(desc)} — {mission_name}",
            f"LOCATION:{_ics_escape(loc)}",
            "END:VEVENT",
        ]
    )


def _ics_escape(s: str) -> str:
    return (s or "").replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")


def planning_to_ics(state: dict[str, Any]) -> str:
    p = ensure_planning(state)
    j0 = date.fromisoformat(p["j0"][:10])
    name = (state.get("settings") or {}).get("missionName") or "Audit PNIPM"
    cal_name = f"{name} — J0 {j0.strftime('%d/%m/%Y')}"
    updated = (p.get("updatedAt") or datetime.now(timezone.utc).isoformat())[:19]
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Skydeen Audit//Planning4S//FR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
        "X-PUBLISHED-TTL:PT1H",
        f"X-WR-CALNAME:{_ics_escape(cal_name)}",
        f"X-WR-CALDESC:{_ics_escape('Planning mission — mis à jour ' + updated)}",
    ]
    for ev in p.get("events", []):
        lines.append(event_to_ics(ev, j0, name))
    for w in p.get("weeks", []):
        if not w.get("jalons"):
            continue
        for j, jal in enumerate(w["jalons"]):
            fake = {
                "id": f"jal_s{w['sem']}_{j}",
                "title": f"[S{w['sem']}] {jal}",
                "startJ": w.get("startJ", 0),
                "endJ": w.get("startJ", 0),
                "startTime": "08:00",
                "endTime": "08:30",
                "description": w.get("objectif", ""),
                "location": "",
            }
            lines.append(event_to_ics(fake, j0, name))
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)

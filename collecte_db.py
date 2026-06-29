"""Collecte externe — liens par entretien, dossiers ministère 00→10, échéances J-14/J-7/J-3."""
from __future__ import annotations

import csv
import io
import re
import secrets
import sqlite3
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Optional
from zoneinfo import ZoneInfo

import dataroom_db as dr
import planning_core as pcore

ABIDJAN = ZoneInfo("Africa/Abidjan")
COLLECTE_SEND_DAYS = 14
COLLECTE_REMIND_DAYS = 7
COLLECTE_DEADLINE_DAYS = 3

MINISTRY_FOLDERS: list[dict[str, str]] = [
    {"id": "00", "name": "Pilotage de l'audit"},
    {"id": "01", "name": "Stratégique (Cabinet + DSI)"},
    {"id": "02", "name": "Directions centrales"},
    {"id": "03", "name": "Structures sous tutelle"},
    {"id": "04", "name": "Programmes"},
    {"id": "05", "name": "Directions régionales"},
    {"id": "06", "name": "Intégrations techniques"},
    {"id": "07", "name": "Bailleurs"},
    {"id": "08", "name": "Réglementaire"},
    {"id": "09", "name": "Livrables intermédiaires"},
    {"id": "10", "name": "Livrables finaux"},
]

STRUCT_FOLDER_RULES: list[tuple[str, str]] = [
    (r"^(AEJ|OSCN|BCP)", "03"),
    (r"^(PACE|USEP|PEJEDEC|UGP|Carte Jeunes|PNBV|C2D)", "04"),
    (r"^DR[\-\s]", "05"),
    (r"^(BAD|BM|AFD|PNUD|BOAD|BAILLEUR)", "07"),
    (r"^(SIGFIP|UXP|X-ROAD|NNI|ARTCI|ANSSI|NIIS|Hébergement)", "06"),
    (r"^(DAF|DRH|DSI|DPSD|DAJIP|DAJC|Patrimoine|Marchés|CABINET)", "02"),
]

STRUCT_REP_MAP: dict[str, str] = {
    "DAF": "R5",
    "DRH": "R6",
    "DSI": "R7",
    "DPSD": "R3",
    "DAJIP": "R4",
    "DAJC": "R9",
    "AEJ": "R4",
    "PEJEDEC": "R4",
    "USEP": "R4",
    "SIGFIP": "R5",
    "UXP": "R7",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_collecte_schema(db_path: Path) -> None:
    with _connect(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS ministry_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS collecte_tokens (
                id TEXT PRIMARY KEY,
                token TEXT NOT NULL UNIQUE,
                entretien_id TEXT NOT NULL UNIQUE,
                email TEXT,
                interview_j INTEGER,
                send_at TEXT,
                remind_at TEXT,
                deadline_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_collecte_token ON collecte_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_collecte_ent ON collecte_tokens(entretien_id);
            """
        )
        for i, f in enumerate(MINISTRY_FOLDERS):
            conn.execute(
                "INSERT OR IGNORE INTO ministry_folders (id, name, sort_order) VALUES (?, ?, ?)",
                (f["id"], f["name"], i),
            )
        cols = {r[1] for r in conn.execute("PRAGMA table_info(dataroom_documents)").fetchall()}
        for col, ddl in (
            ("entretien_id", "TEXT"),
            ("ministry_folder", "TEXT"),
            ("deposit_origin", "TEXT"),
        ):
            if col not in cols:
                conn.execute(f"ALTER TABLE dataroom_documents ADD COLUMN {col} {ddl}")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dr_docs_entretien ON dataroom_documents(entretien_id)"
        )
        tok_cols = {r[1] for r in conn.execute("PRAGMA table_info(collecte_tokens)").fetchall()}
        if "remind_notified_at" not in tok_cols:
            conn.execute("ALTER TABLE collecte_tokens ADD COLUMN remind_notified_at TEXT")
        conn.commit()


def ministry_folder_for_struct(struct: str, couche: str = "") -> str:
    s = (struct or "").strip().upper()
    for pattern, folder in STRUCT_FOLDER_RULES:
        if re.search(pattern, s, re.I):
            return folder
    c = (couche or "").lower()
    if c in ("programme",):
        return "04"
    if c in ("technique",):
        return "06"
    if c in ("direction",):
        return "02"
    return "02"


def rep_for_struct(struct: str, axe: str = "") -> str:
    key = (struct or "").strip().upper()
    for k, rep in STRUCT_REP_MAP.items():
        if key.startswith(k.upper()):
            return rep
    ax = (axe or "").strip()
    if ax == "Technique":
        return "R7"
    if ax == "Programmatique":
        return "R4"
    if ax == "Politique":
        return "R2"
    return "R2"


def _j0_from_state(state: dict[str, Any]) -> date:
    meta = state.get("meta") or {}
    j0s = (meta.get("j0") or state.get("planning4s", {}).get("j0") or "2026-07-06")[:10]
    return date.fromisoformat(j0s)


def schedule_for_entretien(ent: dict[str, Any], j0: date) -> dict[str, str]:
    j = int(ent.get("j") or 0)
    interview_day = j0 + timedelta(days=j)
    send_day = interview_day - timedelta(days=COLLECTE_SEND_DAYS)
    remind_day = interview_day - timedelta(days=COLLECTE_REMIND_DAYS)
    deadline_day = interview_day - timedelta(days=COLLECTE_DEADLINE_DAYS)
    send_at = datetime(send_day.year, send_day.month, send_day.day, 0, 0, 0, tzinfo=ABIDJAN)
    remind_at = datetime(remind_day.year, remind_day.month, remind_day.day, 0, 0, 0, tzinfo=ABIDJAN)
    deadline_at = datetime(
        deadline_day.year, deadline_day.month, deadline_day.day, 23, 59, 59, tzinfo=ABIDJAN
    )
    return {
        "sendAt": send_at.astimezone(timezone.utc).isoformat(),
        "remindAt": remind_at.astimezone(timezone.utc).isoformat(),
        "deadlineAt": deadline_at.astimezone(timezone.utc).isoformat(),
        "interviewDate": interview_day.isoformat(),
        "interviewJ": j,
    }


def sync_tokens_from_state(db_path: Path, state: dict[str, Any], *, base_url: str) -> dict[str, Any]:
    init_collecte_schema(db_path)
    j0 = _j0_from_state(state)
    created = 0
    updated = 0
    ents = state.get("entretiens") or []
    with _connect(db_path) as conn:
        for ent in ents:
            if not isinstance(ent, dict):
                continue
            eid = (ent.get("id") or "").strip()
            if not eid:
                continue
            sched = schedule_for_entretien(ent, j0)
            email = (ent.get("mail") or "").strip().lower()
            row = conn.execute(
                "SELECT id, token FROM collecte_tokens WHERE entretien_id = ?", (eid,)
            ).fetchone()
            ts = _now()
            if row:
                conn.execute(
                    """
                    UPDATE collecte_tokens SET email=?, interview_j=?, send_at=?, remind_at=?,
                        deadline_at=?, updated_at=? WHERE entretien_id=?
                    """,
                    (
                        email,
                        sched["interviewJ"],
                        sched["sendAt"],
                        sched["remindAt"],
                        sched["deadlineAt"],
                        ts,
                        eid,
                    ),
                )
                updated += 1
            else:
                tid = f"col_{secrets.token_hex(8)}"
                token = secrets.token_urlsafe(24)
                conn.execute(
                    """
                    INSERT INTO collecte_tokens
                    (id, token, entretien_id, email, interview_j, send_at, remind_at,
                     deadline_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        tid,
                        token,
                        eid,
                        email,
                        sched["interviewJ"],
                        sched["sendAt"],
                        sched["remindAt"],
                        sched["deadlineAt"],
                        ts,
                        ts,
                    ),
                )
                created += 1
        conn.commit()
    return {"created": created, "updated": updated, "total": len(ents), "baseUrl": base_url}


def get_token_row(db_path: Path, token: str) -> Optional[sqlite3.Row]:
    with _connect(db_path) as conn:
        return conn.execute(
            "SELECT * FROM collecte_tokens WHERE token = ?", (token.strip(),)
        ).fetchone()


def find_entretien(state: dict[str, Any], entretien_id: str) -> Optional[dict[str, Any]]:
    for e in state.get("entretiens") or []:
        if isinstance(e, dict) and e.get("id") == entretien_id:
            return e
    return None


def deposit_open(deadline_at: str) -> bool:
    if not deadline_at:
        return False
    try:
        dl = datetime.fromisoformat(deadline_at.replace("Z", "+00:00"))
        if dl.tzinfo is None:
            dl = dl.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) <= dl.astimezone(timezone.utc)
    except ValueError:
        return False


def collecte_public_info(
    db_path: Path,
    token: str,
    state: dict[str, Any],
) -> Optional[dict[str, Any]]:
    row = get_token_row(db_path, token)
    if not row:
        return None
    ent = find_entretien(state, row["entretien_id"])
    if not ent:
        return None
    j0 = _j0_from_state(state)
    sched = schedule_for_entretien(ent, j0)
    docs = list_docs_for_entretien(db_path, row["entretien_id"])
    name = ent.get("n") or "Interlocuteur"
    if ent.get("prenom") or ent.get("nom"):
        name = f"{ent.get('prenom', '').strip()} {ent.get('nom', '').strip()}".strip() or name
    return {
        "entretienId": row["entretien_id"],
        "interviewee": name,
        "structure": ent.get("struct") or "",
        "interviewDate": sched["interviewDate"],
        "interviewHeure": ent.get("heure") or "",
        "sendAt": row["send_at"],
        "remindAt": row["remind_at"],
        "deadlineAt": row["deadline_at"],
        "depositOpen": deposit_open(row["deadline_at"]),
        "ministryFolder": ministry_folder_for_struct(
            ent.get("struct") or "", ent.get("couche") or ""
        ),
        "documents": [
            {
                "id": d["id"],
                "name": d.get("normalizedName") or d.get("desc"),
                "originalName": d.get("file", {}).get("originalName") if isinstance(d.get("file"), dict) else "",
                "uploadedAt": d.get("updatedAt"),
                "statut": d.get("statut"),
            }
            for d in docs
        ],
    }


def list_docs_for_entretien(db_path: Path, entretien_id: str) -> list[dict[str, Any]]:
    init_collecte_schema(db_path)
    with _connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT d.*, f.id AS fid, f.original_name AS forig
            FROM dataroom_documents d
            LEFT JOIN dataroom_files f ON f.doc_id = d.id
            WHERE d.entretien_id = ?
            ORDER BY d.updated_at DESC
            """,
            (entretien_id,),
        ).fetchall()
    out = []
    for row in rows:
        d = dr.row_to_doc(row)
        if row["forig"]:
            d["file"] = {"originalName": row["forig"]}
        out.append(d)
    return out


def collecte_deposit(
    db_path: Path,
    upload_dir: Path,
    *,
    token: str,
    state: dict[str, Any],
    file_id: str,
    doc_id: str,
    content: bytes,
    original_name: str,
    mime_type: str,
    doc_type: str,
    description: str,
    fmt: str,
) -> dict[str, Any]:
    row = get_token_row(db_path, token)
    if not row:
        raise ValueError("Lien de collecte invalide")
    if not deposit_open(row["deadline_at"]):
        raise ValueError("Délai de dépôt expiré (J-3 avant l'entretien)")
    ent = find_entretien(state, row["entretien_id"])
    if not ent:
        raise ValueError("Entretien introuvable")
    struct = ent.get("struct") or "SOURCE"
    ministry = ministry_folder_for_struct(struct, ent.get("couche") or "")
    rep = rep_for_struct(struct, ent.get("axe") or "")
    uploaded_by = f"Collecte — {ent.get('n') or struct}"
    if ent.get("mail"):
        uploaded_by = f"Collecte — {ent.get('mail')}"
    result = dr.deposit_file(
        db_path,
        upload_dir,
        file_id=file_id,
        doc_id=doc_id,
        content=content,
        original_name=original_name,
        mime_type=mime_type,
        rep=rep,
        source=struct.upper().replace(" ", "-")[:32],
        doc_type=doc_type.upper(),
        description=description.lower().replace(" ", "-"),
        version="v1",
        fmt=fmt,
        mission_j=int(ent.get("j") or 0),
        uploaded_by=uploaded_by,
        entretien_id=row["entretien_id"],
        ministry_folder=ministry,
        deposit_origin="externe",
    )
    return result


def list_status(
    db_path: Path,
    state: dict[str, Any],
    base_url: str,
) -> list[dict[str, Any]]:
    init_collecte_schema(db_path)
    j0 = _j0_from_state(state)
    now = datetime.now(timezone.utc)
    out: list[dict[str, Any]] = []
    with _connect(db_path) as conn:
        tokens = conn.execute("SELECT * FROM collecte_tokens ORDER BY interview_j, entretien_id").fetchall()
    for row in tokens:
        ent = find_entretien(state, row["entretien_id"])
        if not ent:
            continue
        sched = schedule_for_entretien(ent, j0)
        docs = list_docs_for_entretien(db_path, row["entretien_id"])
        has_file = any(d.get("fileId") for d in docs)
        remind_due = False
        send_due = False
        try:
            if row["remind_at"]:
                rd = datetime.fromisoformat(row["remind_at"].replace("Z", "+00:00"))
                remind_due = now >= rd.astimezone(timezone.utc) and not has_file
            if row["send_at"]:
                sd = datetime.fromisoformat(row["send_at"].replace("Z", "+00:00"))
                send_due = now >= sd.astimezone(timezone.utc)
        except ValueError:
            pass
        link = f"{base_url.rstrip('/')}/collecte/{row['token']}"
        name = ent.get("n") or ""
        out.append(
            {
                "entretienId": row["entretien_id"],
                "token": row["token"],
                "link": link,
                "email": row["email"] or ent.get("mail") or "",
                "interviewee": name,
                "structure": ent.get("struct") or "",
                "auditeur": ent.get("aud") or "",
                "interviewDate": sched["interviewDate"],
                "interviewHeure": ent.get("heure") or "",
                "sendAt": row["send_at"],
                "remindAt": row["remind_at"],
                "deadlineAt": row["deadline_at"],
                "depositOpen": deposit_open(row["deadline_at"]),
                "depositCount": len(docs),
                "hasDeposit": has_file,
                "sendDue": send_due,
                "remindDue": remind_due,
                "ministryFolder": ministry_folder_for_struct(
                    ent.get("struct") or "", ent.get("couche") or ""
                ),
            }
        )
    return out


def export_csv(db_path: Path, state: dict[str, Any], base_url: str) -> str:
    rows = list_status(db_path, state, base_url)
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(
        [
            "entretien_id",
            "interlocuteur",
            "structure",
            "email",
            "auditeur",
            "date_entretien",
            "heure",
            "lien_collecte",
            "date_envoi_J14",
            "date_relance_J7",
            "date_limite_J3",
            "depots",
            "a_relancer_J7",
        ]
    )
    for r in rows:
        w.writerow(
            [
                r["entretienId"],
                r["interviewee"],
                r["structure"],
                r["email"],
                r["auditeur"],
                r["interviewDate"],
                r["interviewHeure"],
                r["link"],
                (r["sendAt"] or "")[:10],
                (r["remindAt"] or "")[:10],
                (r["deadlineAt"] or "")[:10],
                r["depositCount"],
                "oui" if r["remindDue"] else "non",
            ]
        )
    return buf.getvalue()


def email_template(
    row: dict[str, Any],
    *,
    kind: str = "initial",
) -> dict[str, str]:
    name = row.get("interviewee") or "Madame, Monsieur"
    struct = row.get("structure") or "votre direction"
    d_ent = row.get("interviewDate") or ""
    link = row.get("link") or ""
    deadline = (row.get("deadlineAt") or "")[:10]
    if kind == "relance":
        subject = f"[PNIPM] Rappel — documents à transmettre avant l'entretien du {d_ent}"
        body = f"""Bonjour {name},

Dans le cadre de l'audit PNIPM (MPJIPSC), nous n'avons pas encore reçu vos documents
(fiche de poste, outils, workflows, preuves de fonctionnement).

Merci de les déposer avant le {deadline} (3 jours avant votre entretien du {d_ent}) via votre lien personnel :

{link}

Formats acceptés : PDF, Word, Excel, images, ZIP.

Cordialement,
Équipe mission Skydeen — PNIPM
"""
    else:
        subject = f"[PNIPM] Préparation entretien audit — documents à transmettre ({struct})"
        body = f"""Bonjour {name},

Dans le cadre de l'audit de la Plateforme Numérique Intégrée de Pilotage Ministériel (PNIPM),
nous vous invitons à transmettre avant votre entretien du {d_ent} les éléments suivants :

• Fiche de poste et organigramme de votre périmètre
• Outils et applications utilisés au quotidien
• Workflows et schémas d'interconnexion
• Tout document illustrant votre fonctionnement (procédures, captures, exports…)

Dépôt sécurisé via votre lien personnel (sans création de compte) :

{link}

Date limite de dépôt : {deadline} (J-3 avant l'entretien).

Cordialement,
Équipe mission Skydeen — MPJIPSC / PNIPM
"""
    return {"subject": subject.strip(), "body": body.strip()}


def sync_remind_notifications(
    db_path: Path,
    state: dict[str, Any],
    base_url: str,
) -> tuple[list[dict[str, Any]], int]:
    """Crée des notifications pilotage pour les relances J-7 sans dépôt (une fois par entretien)."""
    init_collecte_schema(db_path)
    rows = list_status(db_path, state, base_url)
    due = [r for r in rows if r.get("remindDue")]
    if not due:
        return [], 0
    notifs = state.get("notifications")
    if not isinstance(notifs, list):
        notifs = []
        state["notifications"] = notifs
    existing = {
        n.get("entretienId")
        for n in notifs
        if n.get("type") == "collecte_relance_j7" and n.get("entretienId")
    }
    created: list[dict[str, Any]] = []
    ts = _now()
    with _connect(db_path) as conn:
        for row in due:
            eid = row["entretienId"]
            tok_row = conn.execute(
                "SELECT remind_notified_at FROM collecte_tokens WHERE entretien_id = ?", (eid,)
            ).fetchone()
            if tok_row and tok_row["remind_notified_at"]:
                continue
            if eid in existing:
                continue
            notif = {
                "id": f"notif_col_{eid}_{ts[:10].replace('-', '')}",
                "target": "pilotage",
                "type": "collecte_relance_j7",
                "title": f"Collecte J-7 — {row.get('interviewee') or eid}",
                "body": (
                    f"Aucun dépôt pour {row.get('structure') or '—'} "
                    f"(entretien {row.get('interviewDate') or ''}) — relance manuelle à envoyer."
                ),
                "entretienId": eid,
                "link": row.get("link") or "",
                "read": False,
                "createdAt": ts,
            }
            notifs.insert(0, notif)
            created.append(notif)
            conn.execute(
                "UPDATE collecte_tokens SET remind_notified_at = ?, updated_at = ? WHERE entretien_id = ?",
                (ts, ts, eid),
            )
        conn.commit()
    return created, len(created)


def get_token_for_entretien(db_path: Path, entretien_id: str, base_url: str) -> Optional[dict[str, Any]]:
    with _connect(db_path) as conn:
        row = conn.execute(
            "SELECT * FROM collecte_tokens WHERE entretien_id = ?", (entretien_id,)
        ).fetchone()
    if not row:
        return None
    return {
        "token": row["token"],
        "link": f"{base_url.rstrip('/')}/collecte/{row['token']}",
        "deadlineAt": row["deadline_at"],
        "sendAt": row["send_at"],
        "remindAt": row["remind_at"],
    }

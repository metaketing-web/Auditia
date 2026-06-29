"""Relances Data Room — e-mail, tâches auditeurs, notifications."""
from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Union

import dataroom_db as dr

AUDITOR_TARGETS = ("A", "L", "A+L", "all", "pilotage")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _parse_history(raw: Any) -> list[dict[str, Any]]:
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def ensure_relance_schema(db_path) -> None:
    with dr._connect(db_path) as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(dataroom_documents)").fetchall()}
        if "relance_count" not in cols:
            conn.execute("ALTER TABLE dataroom_documents ADD COLUMN relance_count INTEGER NOT NULL DEFAULT 0")
        if "last_relance_at" not in cols:
            conn.execute("ALTER TABLE dataroom_documents ADD COLUMN last_relance_at TEXT")
        if "relance_history" not in cols:
            conn.execute("ALTER TABLE dataroom_documents ADD COLUMN relance_history TEXT")
        if "checklist_item" not in cols:
            conn.execute("ALTER TABLE dataroom_documents ADD COLUMN checklist_item TEXT")
        conn.commit()


def enrich_doc_row(doc: dict[str, Any]) -> dict[str, Any]:
    doc["relanceCount"] = int(doc.get("relanceCount") or doc.get("relance_count") or 0)
    doc["lastRelanceAt"] = doc.get("lastRelanceAt") or doc.get("last_relance_at") or ""
    hist = doc.get("relanceHistory") or doc.get("relance_history")
    doc["relanceHistory"] = _parse_history(hist)
    doc["checklistItem"] = doc.get("checklistItem") or doc.get("checklist_item") or ""
    return doc


def row_to_doc_extended(row, file_row=None) -> dict[str, Any]:
    d = dr.row_to_doc(row, file_row)
    d["relanceCount"] = int(row["relance_count"] if "relance_count" in row.keys() else 0)
    d["lastRelanceAt"] = row["last_relance_at"] if "last_relance_at" in row.keys() else ""
    d["relanceHistory"] = _parse_history(row["relance_history"] if "relance_history" in row.keys() else None)
    d["checklistItem"] = row["checklist_item"] if "checklist_item" in row.keys() else ""
    return d


def get_repo(db_path, rep_id: str) -> Optional[dict[str, Any]]:
    repos = dr.list_repositories(db_path)
    for r in repos:
        if r["id"] == rep_id:
            return r
    return None


def match_checklist_item(state: dict[str, Any], checklist_id: str, doc_desc: str) -> str:
    if not checklist_id:
        return ""
    clists = state.get("checklists") or []
    block = next((c for c in clists if c.get("id") == checklist_id), None)
    if not block:
        return ""
    desc = (doc_desc or "").lower().replace("-", " ")
    best = ""
    best_score = 0
    for it in block.get("items") or []:
        text = (it.get("t") or "").lower()
        score = 0
        for tok in re.split(r"[\s_/]+", desc):
            if len(tok) >= 4 and tok in text:
                score += 1
        if score > best_score:
            best_score = score
            best = it.get("t") or ""
    if best:
        return best
    pending = [it.get("t") for it in block.get("items") or [] if not it.get("ok")]
    return pending[0] if pending else ""


def build_email(
    doc: dict[str, Any],
    repo: Optional[dict[str, Any]],
    checklist_item: str,
    relance_number: int,
    author_name: str,
    custom_note: str = "",
) -> dict[str, str]:
    rep_id = doc.get("rep") or "R?"
    rep_name = (repo or {}).get("name") or rep_id
    checklist_id = (repo or {}).get("checklistId") or "—"
    desc = doc.get("desc") or doc.get("description") or "document"
    source = doc.get("source") or "—"
    dt = datetime.now(timezone.utc).strftime("%d/%m/%Y à %H:%M UTC")
    subject = f"[PNIPM] Relance n°{relance_number} — Pièce Data Room {desc} ({rep_id})"
    body_lines = [
        "Madame, Monsieur,",
        "",
        "Dans le cadre de la mission d'audit de cadrage de la Plateforme Numérique Intégrée de Pilotage Ministériel (PNIPM — MPJIPSC), nous vous remercions de bien vouloir nous transmettre la pièce suivante :",
        "",
        f"• Répertoire Data Room : {rep_id} — {rep_name}",
        f"• Checklist documentaire : {checklist_id}" + (f" — {checklist_item}" if checklist_item else ""),
        f"• Document attendu : {desc}",
        f"• Source / structure : {source}",
        f"• Convention de nommage : AAAAMMJJ_REPERTOIRE_SOURCE_TYPE_description_version.ext",
        "",
        f"Relance n° {relance_number} — en date du {dt}",
        "",
        "Merci de verser la pièce sous 72 heures ouvrées via votre interlocuteur mission, ou de nous indiquer les contraintes eventuelles (delai, format, habilitation).",
    ]
    if custom_note.strip():
        body_lines += ["", "Précision :", custom_note.strip()]
    body_lines += [
        "",
        "Cordialement,",
        author_name or "Equipe audit Skydeen",
        "Cabinet Skydeen — Mission PNIPM",
        "",
        "---",
        "Document genere depuis le cockpit Skydeen Audit (Data Room).",
    ]
    body = "\n".join(body_lines)
    mailto = "mailto:?subject=" + _urlquote(subject) + "&body=" + _urlquote(body)
    return {"subject": subject, "body": body, "mailto": mailto}


def _urlquote(s: str) -> str:
    from urllib.parse import quote

    return quote(s, safe="")


def resolve_targets(assigned: Optional[Union[list[str], str]], user: dict[str, Any]) -> list[str]:
    if assigned is None:
        assigned = ["A", "L"]
    if isinstance(assigned, str):
        assigned = [assigned]
    out: list[str] = []
    for a in assigned:
        x = str(a).strip().upper()
        if x in ("ALL", "PILOTAGE", "ADMIN"):
            return ["A", "L"]
        if x in ("A", "L"):
            out.append(x)
        elif x == "A+L":
            out.extend(["A", "L"])
    if not out:
        sr = (user or {}).get("serverRole") or ""
        if sr == "auditeur_b":
            out = ["A"]
        elif sr == "auditeur_t":
            out = ["L"]
        else:
            out = ["A", "L"]
    return list(dict.fromkeys(out))


def create_relance(
    db_path,
    *,
    doc_id: str,
    user: dict[str, Any],
    get_state_fn,
    set_state_fn,
    assigned_to: Optional[Union[list[str], str]] = None,
    custom_note: str = "",
    checklist_item: str = "",
    notify_auditors: bool = True,
) -> dict[str, Any]:
    ensure_relance_schema(db_path)
    doc = dr.get_document(db_path, doc_id)
    if not doc:
        raise ValueError("Document introuvable")
    if doc.get("statut") in ("verse", "a_verifier"):
        raise ValueError("Document deja recu ou en cours de validation — relance non applicable")

    state = get_state_fn() or {}
    state.setdefault("tasks", [])
    state.setdefault("notifications", [])

    repo = get_repo(db_path, doc.get("rep") or "")
    cl_item = checklist_item.strip() or match_checklist_item(
        state, (repo or {}).get("checklistId") or "", doc.get("desc") or ""
    )

    with dr._connect(db_path) as conn:
        row = conn.execute("SELECT * FROM dataroom_documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise ValueError("Document introuvable")
        history = _parse_history(row["relance_history"] if "relance_history" in row.keys() else None)
        count = int(row["relance_count"] if "relance_count" in row.keys() else 0) + 1
        ts = _now()
        author = (user or {}).get("name") or (user or {}).get("email") or "Pilotage mission"
        targets = resolve_targets(assigned_to, user)
        email = build_email(doc, repo, cl_item, count, author, custom_note)

        entry = {
            "id": _uid("rl"),
            "at": ts,
            "by": author,
            "number": count,
            "assignedTo": targets,
            "checklistId": (repo or {}).get("checklistId") or "",
            "checklistItem": cl_item,
            "note": custom_note.strip(),
            "emailSubject": email["subject"],
        }
        history.append(entry)

        conn.execute(
            """
            UPDATE dataroom_documents SET
                statut = 'relance',
                relance_count = ?,
                last_relance_at = ?,
                relance_history = ?,
                checklist_item = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (count, ts, json.dumps(history, ensure_ascii=False), cl_item, ts, doc_id),
        )
        conn.commit()

    doc = dr.get_document(db_path, doc_id)
    if doc:
        doc = enrich_doc_row(doc)
        doc["relanceHistory"] = history

    tasks_created: list[dict[str, Any]] = []
    notifs_created: list[dict[str, Any]] = []

    for target in targets:
        task = {
            "id": _uid("task"),
            "type": "relance_doc",
            "title": f"Relance {count} — {doc.get('desc', doc_id)}",
            "docId": doc_id,
            "rep": doc.get("rep") or "",
            "source": doc.get("source") or "",
            "checklistId": (repo or {}).get("checklistId") or "",
            "checklistItem": cl_item,
            "assignedTo": target,
            "status": "open",
            "priority": "high" if count >= 2 else "normal",
            "relanceCount": count,
            "lastRelanceAt": ts,
            "createdAt": ts,
            "createdBy": author,
            "emailSubject": email["subject"],
            "emailBody": email["body"],
            "notes": custom_note.strip(),
            "relanceId": entry["id"],
        }
        state["tasks"].insert(0, task)
        tasks_created.append(task)

        if notify_auditors:
            notif = {
                "id": _uid("notif"),
                "target": target,
                "type": "relance_doc",
                "title": f"Relance Data Room — {doc.get('source', '')} / {doc.get('desc', '')}",
                "body": f"Relance n°{count} enregistree ({doc.get('rep', '')}). Suivi dans Mes taches.",
                "docId": doc_id,
                "taskId": task["id"],
                "read": False,
                "createdAt": ts,
            }
            state["notifications"].insert(0, notif)
            notifs_created.append(notif)

    set_state_fn(state, audit=False)
    dr.sync_state_docs(db_path, get_state_fn, lambda s: set_state_fn(s, audit=False))

    return {
        "ok": True,
        "doc": doc,
        "email": email,
        "relance": entry,
        "tasks": tasks_created,
        "notifications": notifs_created,
    }


def _task_due_date(task: dict[str, Any]) -> str:
    due = (task.get("dueAt") or task.get("due_at") or "").strip()
    return due[:10] if due else ""


def is_task_overdue(task: dict[str, Any]) -> bool:
    if (task.get("status") or "open") != "open":
        return False
    due = _task_due_date(task)
    if not due:
        return False
    try:
        today = datetime.now(timezone.utc).date()
        due_d = datetime.fromisoformat(due + "T00:00:00+00:00").date()
        return due_d < today
    except (ValueError, TypeError):
        return False


def create_mission_task(
    state: dict[str, Any],
    *,
    user: dict[str, Any],
    title: str,
    assigned_to: Optional[Union[list[str], str]] = None,
    due_at: str = "",
    priority: str = "normal",
    notes: str = "",
    source_view: str = "",
    notify_auditors: bool = True,
    task_type: str = "mission",
) -> dict[str, Any]:
    title = (title or "").strip()
    if not title:
        raise ValueError("Intitule obligatoire")
    if priority not in ("normal", "high"):
        priority = "normal"
    if task_type not in ("mission", "checklist_jour"):
        task_type = "mission"
    state.setdefault("tasks", [])
    state.setdefault("notifications", [])

    ts = _now()
    author = (user or {}).get("name") or (user or {}).get("email") or "Pilotage mission"
    targets = resolve_targets(assigned_to, user)
    due = (due_at or "").strip()[:10]
    tasks_created: list[dict[str, Any]] = []
    notifs_created: list[dict[str, Any]] = []
    notify = notify_auditors and task_type != "checklist_jour"

    for target in targets:
        task = {
            "id": _uid("task"),
            "type": task_type,
            "title": title,
            "assignedTo": target,
            "status": "open",
            "priority": priority,
            "dueAt": due,
            "notes": (notes or "").strip(),
            "sourceView": (source_view or "").strip(),
            "createdAt": ts,
            "createdBy": author,
        }
        state["tasks"].insert(0, task)
        tasks_created.append(task)

        if notify:
            body = "Nouvelle tache assignee — suivi dans Mes taches."
            if due:
                body += f" Echeance : {due}."
            notif = {
                "id": _uid("notif"),
                "target": target,
                "type": "mission_task",
                "title": f"Tache mission — {title}",
                "body": body,
                "taskId": task["id"],
                "read": False,
                "createdAt": ts,
            }
            state["notifications"].insert(0, notif)
            notifs_created.append(notif)

    return {"ok": True, "tasks": tasks_created, "notifications": notifs_created}


def patch_task(state: dict[str, Any], task_id: str, status: str) -> Optional[dict[str, Any]]:
    tasks = state.get("tasks") or []
    for t in tasks:
        if t.get("id") == task_id:
            t["status"] = status
            t["updatedAt"] = _now()
            if status == "open":
                t.pop("reopenedAt", None)
                t["reopenedAt"] = _now()
            return t
    return None


def patch_task_fields(
    state: dict[str, Any],
    task_id: str,
    *,
    title: Optional[str] = None,
    notes: Optional[str] = None,
    due_at: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    tasks = state.get("tasks") or []
    for t in tasks:
        if t.get("id") == task_id:
            if title is not None:
                title = title.strip()
                if not title:
                    raise ValueError("Intitule obligatoire")
                t["title"] = title
            if notes is not None:
                t["notes"] = notes.strip()
            if due_at is not None:
                t["dueAt"] = (due_at or "").strip()[:10]
            t["updatedAt"] = _now()
            return t
    return None


def user_is_pilot(user: dict[str, Any]) -> bool:
    role = (user or {}).get("role") or ""
    sr = (user or {}).get("serverRole") or ""
    return role == "admin" or sr in ("admin", "juliana")


def user_auditor_target(user: dict[str, Any]) -> Optional[str]:
    sr = (user or {}).get("serverRole") or ""
    if sr == "auditeur_b":
        return "A"
    if sr == "auditeur_t":
        return "L"
    return None


def user_can_edit_task(user: dict[str, Any], task: dict[str, Any]) -> bool:
    if not user_is_pilot(user):
        return False
    return (task.get("type") or "") in ("mission", "checklist_jour")


def user_can_patch_task(user: dict[str, Any], task: dict[str, Any], new_status: str) -> bool:
    if user_is_pilot(user):
        return True
    target = user_auditor_target(user)
    if not target:
        return False
    if (task.get("assignedTo") or "") not in (target, "A+L"):
        return False
    if (task.get("type") or "") == "checklist_jour":
        return new_status in ("open", "done")
    if new_status != "done":
        return False
    if (task.get("status") or "open") != "open":
        return False
    return True


def user_can_read_notification(user: dict[str, Any], notif: dict[str, Any]) -> bool:
    if user_is_pilot(user):
        return True
    target = user_auditor_target(user)
    tg = (notif.get("target") or "").strip()
    if target:
        return tg in (target, "all")
    if (user or {}).get("role") == "cabinet":
        return tg in ("all", "pilotage", "cabinet")
    return tg == "all"


def mark_notification_read(
    state: dict[str, Any], notif_id: str, user: Optional[dict[str, Any]] = None
) -> bool:
    for n in state.get("notifications") or []:
        if n.get("id") == notif_id:
            if user is not None and not user_can_read_notification(user, n):
                return False
            n["read"] = True
            n["readAt"] = _now()
            return True
    return False


def unread_notifications(state: dict[str, Any], target: Optional[str]) -> list[dict[str, Any]]:
    out = []
    for n in state.get("notifications") or []:
        if n.get("read"):
            continue
        tg = n.get("target") or ""
        if target and tg not in (target, "all", "pilotage"):
            continue
        if not target or tg == target or tg == "all":
            out.append(n)
    return out

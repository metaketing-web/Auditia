"""Data Room — persistance SQLite (répertoires, documents, fichiers)."""
from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

DOC_STATUTS = frozenset({"attendu", "relance", "a_verifier", "verse"})


REPOS_SEED: list[dict[str, str]] = [
    {"id": "R1", "name": "Stratégie & cadrage politique", "axe": "Politique", "checklist_id": "A"},
    {"id": "R2", "name": "Gouvernance & organisation", "axe": "Politique", "checklist_id": "B"},
    {"id": "R3", "name": "Données & référentiels", "axe": "Technique", "checklist_id": "E"},
    {"id": "R4", "name": "Programmes & dispositifs", "axe": "Programmatique", "checklist_id": "B"},
    {"id": "R5", "name": "Finances, budget & SIGFIP", "axe": "Technique", "checklist_id": "D"},
    {"id": "R6", "name": "Ressources humaines", "axe": "Programmatique", "checklist_id": "B"},
    {"id": "R7", "name": "Système d'information & sécurité", "axe": "Technique", "checklist_id": "C"},
    {"id": "R8", "name": "Patrimoine & flotte automobile", "axe": "Programmatique", "checklist_id": "B"},
    {"id": "R9", "name": "Juridique & conventions bailleurs", "axe": "Politique", "checklist_id": "F"},
    {"id": "R10", "name": "Reporting & indicateurs", "axe": "Technique", "checklist_id": "E"},
    {"id": "R11", "name": "Terrain & déploiement régional", "axe": "Programmatique", "checklist_id": "B"},
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_dataroom_schema(db_path: Path) -> None:
    with _connect(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS dataroom_repositories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                axe TEXT NOT NULL,
                checklist_id TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS dataroom_documents (
                id TEXT PRIMARY KEY,
                rep_id TEXT NOT NULL,
                source TEXT NOT NULL,
                doc_type TEXT NOT NULL,
                description TEXT NOT NULL,
                version TEXT NOT NULL DEFAULT 'v1',
                format TEXT NOT NULL DEFAULT 'pdf',
                statut TEXT NOT NULL DEFAULT 'attendu',
                mission_j INTEGER,
                size_label TEXT,
                uploaded_by TEXT,
                file_id TEXT,
                normalized_name TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (rep_id) REFERENCES dataroom_repositories(id)
            );

            CREATE TABLE IF NOT EXISTS dataroom_files (
                id TEXT PRIMARY KEY,
                doc_id TEXT NOT NULL,
                original_name TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                mime_type TEXT,
                size_bytes INTEGER NOT NULL,
                sha256 TEXT,
                uploaded_at TEXT NOT NULL,
                uploaded_by TEXT,
                FOREIGN KEY (doc_id) REFERENCES dataroom_documents(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_dr_docs_rep ON dataroom_documents(rep_id);
            CREATE INDEX IF NOT EXISTS idx_dr_docs_statut ON dataroom_documents(statut);
            CREATE INDEX IF NOT EXISTS idx_dr_files_doc ON dataroom_files(doc_id);
            """
        )
        conn.commit()


def seed_repositories(db_path: Path) -> None:
    with _connect(db_path) as conn:
        for i, r in enumerate(REPOS_SEED):
            conn.execute(
                """
                INSERT OR IGNORE INTO dataroom_repositories
                (id, name, axe, checklist_id, sort_order)
                VALUES (?, ?, ?, ?, ?)
                """,
                (r["id"], r["name"], r["axe"], r["checklist_id"], i),
            )
        conn.commit()


def migrate_legacy_uploads(db_path: Path, upload_dir: Path) -> None:
    """Reprend les entrées de l'ancienne table uploaded_files."""
    with _connect(db_path) as conn:
        try:
            rows = conn.execute(
                "SELECT id, original_name, stored_path, mime_type, size_bytes, doc_id, uploaded_at, uploaded_by FROM uploaded_files"
            ).fetchall()
        except sqlite3.OperationalError:
            return
        for row in rows:
            fid = row["id"]
            doc_id = row["doc_id"] or fid
            exists = conn.execute("SELECT 1 FROM dataroom_documents WHERE id = ?", (doc_id,)).fetchone()
            if not exists:
                conn.execute(
                    """
                    INSERT INTO dataroom_documents
                    (id, rep_id, source, doc_type, description, version, format, statut,
                     mission_j, size_label, uploaded_by, file_id, normalized_name, created_at, updated_at)
                    VALUES (?, 'R7', 'IMPORT', 'DOC', ?, 'v1', 'bin', 'verse',
                            NULL, '', ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id,
                        row["original_name"] or "import",
                        row["uploaded_by"] or "",
                        fid,
                        row["original_name"],
                        row["uploaded_at"],
                        row["uploaded_at"],
                    ),
                )
            conn.execute(
                """
                INSERT OR IGNORE INTO dataroom_files
                (id, doc_id, original_name, stored_path, mime_type, size_bytes, uploaded_at, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    fid,
                    doc_id,
                    row["original_name"],
                    row["stored_path"],
                    row["mime_type"],
                    row["size_bytes"],
                    row["uploaded_at"],
                    row["uploaded_by"],
                ),
            )
        conn.commit()


def import_docs_from_state(db_path: Path, docs: list[dict[str, Any]]) -> int:
    """Importe les métadonnées docs du JSON mission (sans écraser les versements serveur)."""
    n = 0
    with _connect(db_path) as conn:
        for d in docs:
            doc_id = d.get("id")
            if not doc_id:
                continue
            row = conn.execute("SELECT statut, file_id FROM dataroom_documents WHERE id = ?", (doc_id,)).fetchone()
            if row and row["file_id"]:
                continue
            ts = _now()
            conn.execute(
                """
                INSERT INTO dataroom_documents
                (id, rep_id, source, doc_type, description, version, format, statut,
                 mission_j, size_label, uploaded_by, file_id, normalized_name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    rep_id=excluded.rep_id,
                    source=excluded.source,
                    doc_type=excluded.doc_type,
                    description=excluded.description,
                    version=excluded.version,
                    format=excluded.format,
                    statut=CASE WHEN dataroom_documents.file_id IS NOT NULL AND dataroom_documents.file_id != ''
                        THEN dataroom_documents.statut ELSE excluded.statut END,
                    mission_j=excluded.mission_j,
                    size_label=excluded.size_label,
                    uploaded_by=excluded.uploaded_by,
                    file_id=COALESCE(NULLIF(dataroom_documents.file_id,''), excluded.file_id),
                    updated_at=excluded.updated_at
                """,
                (
                    doc_id,
                    d.get("rep") or "R1",
                    d.get("source") or "SOURCE",
                    d.get("type") or "DOC",
                    d.get("desc") or "document",
                    d.get("version") or "v1",
                    d.get("format") or "pdf",
                    d.get("statut") or "attendu",
                    d.get("j"),
                    d.get("taille") or "",
                    d.get("par") or "",
                    d.get("fileId") or "",
                    "",
                    ts,
                    ts,
                ),
            )
            n += 1
        conn.commit()
    return n


def row_to_doc(row: sqlite3.Row, file_row: Optional[sqlite3.Row] = None) -> dict[str, Any]:
    keys = row.keys()
    d = {
        "id": row["id"],
        "rep": row["rep_id"],
        "source": row["source"],
        "type": row["doc_type"],
        "desc": row["description"],
        "version": row["version"],
        "format": row["format"],
        "statut": row["statut"],
        "j": row["mission_j"],
        "taille": row["size_label"] or "",
        "par": row["uploaded_by"] or "",
        "fileId": row["file_id"] or "",
        "normalizedName": row["normalized_name"] or "",
        "notes": row["notes"] or "",
        "updatedAt": row["updated_at"],
        "createdAt": row["created_at"] if "created_at" in keys else row["updated_at"],
        "entretienId": (row["entretien_id"] or "") if "entretien_id" in keys else "",
        "ministryFolder": (row["ministry_folder"] or "") if "ministry_folder" in keys else "",
        "depositOrigin": (row["deposit_origin"] or "") if "deposit_origin" in keys else "",
        "relanceCount": int(row["relance_count"]) if "relance_count" in keys and row["relance_count"] is not None else 0,
        "lastRelanceAt": (row["last_relance_at"] or "") if "last_relance_at" in keys else "",
        "checklistItem": (row["checklist_item"] or "") if "checklist_item" in keys else "",
        "aiSummary": (row["ai_summary"] or "") if "ai_summary" in keys else "",
        "aiSummaryAt": (row["ai_summary_at"] or "") if "ai_summary_at" in keys else "",
    }
    if "relance_history" in keys and row["relance_history"]:
        try:
            d["relanceHistory"] = json.loads(row["relance_history"])
        except json.JSONDecodeError:
            d["relanceHistory"] = []
    else:
        d["relanceHistory"] = []
    if file_row:
        d["file"] = {
            "id": file_row["id"],
            "originalName": file_row["original_name"],
            "sizeBytes": file_row["size_bytes"],
            "mimeType": file_row["mime_type"],
            "sha256": file_row["sha256"],
            "uploadedAt": file_row["uploaded_at"],
        }
        if not d["fileId"]:
            d["fileId"] = file_row["id"]
    return d


def list_documents(
    db_path: Path,
    rep: Optional[str] = None,
    statut: Optional[str] = None,
    q: Optional[str] = None,
) -> list[dict[str, Any]]:
    sql = """
        SELECT d.*, f.id AS f_id, f.original_name AS f_name, f.size_bytes AS f_size,
               f.mime_type AS f_mime, f.sha256 AS f_sha, f.uploaded_at AS f_at
        FROM dataroom_documents d
        LEFT JOIN dataroom_files f ON f.doc_id = d.id
        WHERE 1=1
    """
    params: list[Any] = []
    if rep:
        sql += " AND d.rep_id = ?"
        params.append(rep)
    if statut:
        sql += " AND d.statut = ?"
        params.append(statut)
    if q:
        sql += " AND (d.description LIKE ? OR d.source LIKE ? OR d.normalized_name LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like, like])
    sql += " ORDER BY d.rep_id, d.statut, d.description"
    with _connect(db_path) as conn:
        rows = conn.execute(sql, params).fetchall()
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        if row["id"] in seen:
            continue
        seen.add(row["id"])
        doc = row_to_doc(row, None)
        if row["f_id"]:
            doc["file"] = {
                "id": row["f_id"],
                "originalName": row["f_name"],
                "sizeBytes": row["f_size"],
                "mimeType": row["f_mime"],
                "sha256": row["f_sha"],
                "uploadedAt": row["f_at"],
            }
            doc["fileId"] = row["f_id"]
        out.append(doc)
    return out


def list_repositories(db_path: Path) -> list[dict[str, Any]]:
    with _connect(db_path) as conn:
        repos = conn.execute(
            "SELECT * FROM dataroom_repositories ORDER BY sort_order"
        ).fetchall()
        out = []
        for r in repos:
            stats = conn.execute(
                """
                SELECT statut, COUNT(*) AS c FROM dataroom_documents
                WHERE rep_id = ? GROUP BY statut
                """,
                (r["id"],),
            ).fetchall()
            counts = {s["statut"]: s["c"] for s in stats}
            total = sum(counts.values())
            out.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "axe": r["axe"],
                    "checklistId": r["checklist_id"],
                    "counts": counts,
                    "total": total,
                    "versed": counts.get("verse", 0),
                }
            )
        return out


def get_document(db_path: Path, doc_id: str) -> Optional[dict[str, Any]]:
    with _connect(db_path) as conn:
        row = conn.execute("SELECT * FROM dataroom_documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            return None
        f = conn.execute(
            "SELECT * FROM dataroom_files WHERE doc_id = ? ORDER BY uploaded_at DESC LIMIT 1",
            (doc_id,),
        ).fetchone()
        return row_to_doc(row, f)


def format_size_label(size_bytes: int) -> str:
    kb = size_bytes / 1024
    if kb > 1024:
        return f"{kb / 1024:.1f} Mo"
    return f"{int(kb)} Ko"


def build_normalized_name(
    rep: str,
    source: str,
    doc_type: str,
    description: str,
    version: str,
    fmt: str,
    mission_j: Optional[int],
    j0: str = "2026-07-06",
) -> str:
    from datetime import date, timedelta

    if mission_j is not None:
        base = date.fromisoformat(j0)
        dt = base + timedelta(days=mission_j)
        ds = dt.strftime("%Y%m%d")
    else:
        ds = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"{ds}_{rep}_{source}_{doc_type}_{description}_{version}.{fmt}"


def deposit_file(
    db_path: Path,
    upload_dir: Path,
    *,
    file_id: str,
    doc_id: str,
    content: bytes,
    original_name: str,
    mime_type: str,
    rep: str,
    source: str,
    doc_type: str,
    description: str,
    version: str,
    fmt: str,
    mission_j: Optional[int],
    uploaded_by: str,
    existing_doc_id: Optional[str] = None,
    entretien_id: Optional[str] = None,
    ministry_folder: Optional[str] = None,
    deposit_origin: Optional[str] = None,
) -> dict[str, Any]:
    upload_dir.mkdir(parents=True, exist_ok=True)
    sha = hashlib.sha256(content).hexdigest()
    ext = Path(original_name).suffix or f".{fmt}"
    stored = upload_dir / f"{file_id}{ext}"
    stored.write_bytes(content)
    size_label = format_size_label(len(content))
    norm = build_normalized_name(rep, source, doc_type, description, version, fmt, mission_j)
    ts = _now()
    target_doc = existing_doc_id or doc_id

    with _connect(db_path) as conn:
        prev = conn.execute("SELECT id FROM dataroom_documents WHERE id = ?", (target_doc,)).fetchone()
        if prev:
            conn.execute(
                """
                UPDATE dataroom_documents SET
                    rep_id=?, source=?, doc_type=?, description=?, version=?, format=?,
                    statut='a_verifier', mission_j=?, size_label=?, uploaded_by=?,
                    file_id=?, normalized_name=?, updated_at=?,
                    entretien_id=COALESCE(?, entretien_id),
                    ministry_folder=COALESCE(?, ministry_folder),
                    deposit_origin=COALESCE(?, deposit_origin)
                WHERE id=?
                """,
                (
                    rep,
                    source,
                    doc_type,
                    description,
                    version,
                    fmt,
                    mission_j,
                    size_label,
                    uploaded_by,
                    file_id,
                    norm,
                    ts,
                    entretien_id,
                    ministry_folder,
                    deposit_origin,
                    target_doc,
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO dataroom_documents
                (id, rep_id, source, doc_type, description, version, format, statut,
                 mission_j, size_label, uploaded_by, file_id, normalized_name,
                 entretien_id, ministry_folder, deposit_origin, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'a_verifier', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    target_doc,
                    rep,
                    source,
                    doc_type,
                    description,
                    version,
                    fmt,
                    mission_j,
                    size_label,
                    uploaded_by,
                    file_id,
                    norm,
                    entretien_id,
                    ministry_folder,
                    deposit_origin,
                    ts,
                    ts,
                ),
            )
        conn.execute(
            """
            INSERT OR REPLACE INTO dataroom_files
            (id, doc_id, original_name, stored_path, mime_type, size_bytes, sha256, uploaded_at, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file_id,
                target_doc,
                original_name,
                str(stored),
                mime_type,
                len(content),
                sha,
                ts,
                uploaded_by,
            ),
        )
        conn.commit()

    doc = get_document(db_path, target_doc)
    return {"doc": doc, "fileId": file_id, "normalizedName": norm, "sizeLabel": size_label}


def patch_document_statut(db_path: Path, doc_id: str, statut: str) -> Optional[dict[str, Any]]:
    if statut not in DOC_STATUTS:
        return None
    with _connect(db_path) as conn:
        conn.execute(
            "UPDATE dataroom_documents SET statut=?, updated_at=? WHERE id=?",
            (statut, _now(), doc_id),
        )
        conn.commit()
    return get_document(db_path, doc_id)


def validate_document(db_path: Path, doc_id: str) -> Optional[dict[str, Any]]:
    """Passe un document déposé (a_verifier) en versé après contrôle auditeur."""
    with _connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT statut, file_id FROM dataroom_documents WHERE id = ?", (doc_id,)
        ).fetchone()
        if not row or row["statut"] != "a_verifier" or not (row["file_id"] or "").strip():
            return None
        conn.execute(
            "UPDATE dataroom_documents SET statut='verse', updated_at=? WHERE id=?",
            (_now(), doc_id),
        )
        conn.commit()
    return get_document(db_path, doc_id)


def _resolve_file_row(
    row: sqlite3.Row, upload_dir: Optional[Path]
) -> Optional[tuple[str, str, str]]:
    import enterprise_security as esec

    spath, name, mime = (
        row["stored_path"],
        row["original_name"],
        row["mime_type"] or "application/octet-stream",
    )
    if upload_dir is not None:
        safe = esec.safe_download_path(spath, upload_dir)
        if not safe:
            return None
        return str(safe), name, mime
    return spath, name, mime


def _lookup_file_row(conn: sqlite3.Connection, fid: str) -> Optional[sqlite3.Row]:
    row = conn.execute(
        "SELECT stored_path, original_name, mime_type FROM dataroom_files WHERE id = ?",
        (fid,),
    ).fetchone()
    if row:
        return row
    return conn.execute(
        "SELECT stored_path, original_name, mime_type FROM uploaded_files WHERE id = ?",
        (fid,),
    ).fetchone()


def get_file_for_download(
    db_path: Path, file_id: str, *, upload_dir: Optional[Path] = None
) -> Optional[tuple[str, str, str]]:
    with _connect(db_path) as conn:
        row = _lookup_file_row(conn, file_id)
        if row:
            return _resolve_file_row(row, upload_dir)

        doc = conn.execute(
            "SELECT file_id FROM dataroom_documents WHERE id = ?", (file_id,)
        ).fetchone()
        if doc and doc["file_id"]:
            row = _lookup_file_row(conn, doc["file_id"])
            if row:
                return _resolve_file_row(row, upload_dir)

        row = conn.execute(
            "SELECT stored_path, original_name, mime_type FROM dataroom_files WHERE doc_id = ?",
            (file_id,),
        ).fetchone()
        if row:
            return _resolve_file_row(row, upload_dir)
    return None


def user_can_access_file(db_path: Path, file_id: str, user: dict[str, Any]) -> bool:
    """Empêche l'IDOR : fichier mission (Data Room) ou upload personnel."""
    role = (user or {}).get("role") or ""
    if role in ("admin", "juliana", "cabinet"):
        return True
    uid = (user or {}).get("id") or ""
    email = ((user or {}).get("email") or "").strip().lower()
    name = ((user or {}).get("name") or "").strip().lower()
    with _connect(db_path) as conn:
        row = conn.execute(
            "SELECT doc_id FROM dataroom_files WHERE id = ?", (file_id,)
        ).fetchone()
        if row:
            return True
        row = conn.execute(
            "SELECT doc_id, uploaded_by FROM uploaded_files WHERE id = ?", (file_id,)
        ).fetchone()
        if row:
            if row["doc_id"]:
                doc = conn.execute(
                    "SELECT id FROM dataroom_documents WHERE id = ?", (row["doc_id"],)
                ).fetchone()
                if doc:
                    return True
            who = (row["uploaded_by"] or "").strip().lower()
            if who and (who == email or who == name or email in who or name in who):
                return True
            return False
        doc = conn.execute(
            "SELECT id FROM dataroom_documents WHERE id = ? OR file_id = ?",
            (file_id, file_id),
        ).fetchone()
        return doc is not None


def sync_state_docs(db_path: Path, get_state_fn, set_state_fn) -> None:
    """Met à jour mission_state.docs depuis la table dataroom."""
    state = get_state_fn()
    if not state:
        return
    docs = list_documents(db_path)
    state["docs"] = [
        {
            "id": d["id"],
            "rep": d["rep"],
            "source": d["source"],
            "type": d["type"],
            "desc": d["desc"],
            "version": d["version"],
            "format": d["format"],
            "statut": d["statut"],
            "j": d["j"],
            "taille": d["taille"],
            "par": d["par"],
            "fileId": d.get("fileId") or "",
            "relanceCount": d.get("relanceCount") or 0,
            "lastRelanceAt": d.get("lastRelanceAt") or "",
            "checklistItem": d.get("checklistItem") or "",
            "relanceHistory": d.get("relanceHistory") or [],
            "aiSummary": d.get("aiSummary") or "",
            "aiSummaryAt": d.get("aiSummaryAt") or "",
            "entretienId": d.get("entretienId") or "",
            "ministryFolder": d.get("ministryFolder") or "",
            "depositOrigin": d.get("depositOrigin") or "",
        }
        for d in docs
    ]
    set_state_fn(state)


def list_orphan_documents(db_path: Path) -> list[dict[str, Any]]:
    """Documents versés sans fichier attaché."""
    with _connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT d.* FROM dataroom_documents d
            LEFT JOIN dataroom_files f ON f.doc_id = d.id
            WHERE f.id IS NULL AND d.statut = 'verse'
            ORDER BY d.updated_at DESC
            """
        ).fetchall()
    return [row_to_doc(r) for r in rows]


def list_duplicate_groups(db_path: Path) -> list[dict[str, Any]]:
    """Groupes de doublons (même empreinte SHA256 ou même nom normalisé)."""
    groups: list[dict[str, Any]] = []
    with _connect(db_path) as conn:
        sha_rows = conn.execute(
            """
            SELECT sha256, COUNT(*) AS c
            FROM dataroom_files
            WHERE sha256 IS NOT NULL AND sha256 != ''
            GROUP BY sha256
            HAVING c > 1
            """
        ).fetchall()
        for sr in sha_rows:
            files = conn.execute(
                """
                SELECT f.*, d.rep_id, d.source, d.description, d.normalized_name, d.statut
                FROM dataroom_files f
                JOIN dataroom_documents d ON d.id = f.doc_id
                WHERE f.sha256 = ?
                ORDER BY f.uploaded_at DESC
                """,
                (sr["sha256"],),
            ).fetchall()
            groups.append(
                {
                    "kind": "sha256",
                    "key": sr["sha256"][:16] + "…",
                    "count": sr["c"],
                    "docs": [_file_row_to_trash_item(r) for r in files],
                }
            )

        name_rows = conn.execute(
            """
            SELECT normalized_name, COUNT(*) AS c
            FROM dataroom_documents
            WHERE normalized_name IS NOT NULL AND normalized_name != ''
            GROUP BY normalized_name
            HAVING c > 1
            """
        ).fetchall()
        seen_sha = {g["key"] for g in groups}
        for nr in name_rows:
            docs = conn.execute(
                """
                SELECT d.*, f.id AS f_id, f.original_name AS f_name, f.size_bytes AS f_size,
                       f.sha256 AS f_sha, f.uploaded_at AS f_at
                FROM dataroom_documents d
                LEFT JOIN dataroom_files f ON f.doc_id = d.id
                WHERE d.normalized_name = ?
                ORDER BY d.updated_at DESC
                """,
                (nr["normalized_name"],),
            ).fetchall()
            items = []
            for r in docs:
                item = row_to_doc(r)
                if r["f_id"]:
                    item["fileId"] = r["f_id"]
                    item["taille"] = format_size_label(r["f_size"] or 0)
                    item["fileName"] = r["f_name"]
                    item["sha256"] = r["f_sha"]
                items.append(item)
            if len(items) < 2:
                continue
            groups.append(
                {
                    "kind": "name",
                    "key": nr["normalized_name"],
                    "count": nr["c"],
                    "docs": items,
                }
            )
    return groups


def _file_row_to_trash_item(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["doc_id"],
        "fileId": row["id"],
        "rep": row["rep_id"],
        "source": row["source"],
        "desc": row["description"],
        "statut": row["statut"],
        "normalizedName": row["normalized_name"] or "",
        "taille": format_size_label(row["size_bytes"] or 0),
        "fileName": row["original_name"],
        "sha256": row["sha256"],
        "uploadedAt": row["uploaded_at"],
    }


def delete_document(
    db_path: Path, doc_id: str, *, upload_dir: Optional[Path] = None
) -> bool:
    import enterprise_security as esec

    with _connect(db_path) as conn:
        exists = conn.execute(
            "SELECT 1 FROM dataroom_documents WHERE id = ?", (doc_id,)
        ).fetchone()
        if not exists:
            return False
        files = conn.execute(
            "SELECT id, stored_path FROM dataroom_files WHERE doc_id = ?", (doc_id,)
        ).fetchall()
        for fr in files:
            if upload_dir is not None:
                safe = esec.safe_download_path(fr["stored_path"], upload_dir)
                if safe and safe.is_file():
                    safe.unlink(missing_ok=True)
            conn.execute("DELETE FROM dataroom_files WHERE id = ?", (fr["id"],))
        conn.execute("DELETE FROM uploaded_files WHERE doc_id = ?", (doc_id,))
        conn.execute("DELETE FROM dataroom_documents WHERE id = ?", (doc_id,))
        conn.commit()
    return True


def purge_orphan_documents(db_path: Path, *, upload_dir: Optional[Path] = None) -> int:
    orphans = list_orphan_documents(db_path)
    n = 0
    for d in orphans:
        if delete_document(db_path, d["id"], upload_dir=upload_dir):
            n += 1
    return n


def purge_test_documents(db_path: Path, *, upload_dir: Optional[Path] = None) -> int:
    import enterprise_security as esec

    n = 0
    for d in list_documents(db_path):
        if esec.is_test_document(d) and delete_document(db_path, d["id"], upload_dir=upload_dir):
            n += 1
    return n


def dataroom_stats(db_path: Path) -> dict[str, Any]:
    with _connect(db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM dataroom_documents").fetchone()[0]
        by_statut = {
            r["statut"]: r["c"]
            for r in conn.execute(
                "SELECT statut, COUNT(*) AS c FROM dataroom_documents GROUP BY statut"
            ).fetchall()
        }
        files = conn.execute("SELECT COUNT(*) FROM dataroom_files").fetchone()[0]
        bytes_sum = conn.execute("SELECT COALESCE(SUM(size_bytes),0) FROM dataroom_files").fetchone()[0]
    return {
        "documents": total,
        "byStatut": by_statut,
        "files": files,
        "totalBytes": bytes_sum,
    }

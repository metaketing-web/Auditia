"""Durcissement — rate limit, validation IDs/chemins, sanitization état mission."""
from __future__ import annotations

import os
import re
import time
from pathlib import Path
from typing import Any, Optional

SAFE_ID = re.compile(r"^[a-zA-Z0-9_\-]{1,80}$")

COLLECTIONS_WITH_IDS = (
    "entretiens",
    "docs",
    "constats",
    "gaps",
    "risques",
    "livrables",
    "gouv",
    "horsperim",
    "collecteLacunes",
    "dataQualitySources",
    "progNonProg",
)

WEAK_MISSION_CODES = frozenset(
    {
        "",
        "changez-moi-code-equipe",
        "portia",
        "mission",
        "123456",
        "password",
    }
)


def _slug_id(raw: str, prefix: str = "id") -> str:
    clean = re.sub(r"[^a-zA-Z0-9_\-]", "_", str(raw or ""))[:80]
    return clean or f"{prefix}_{int(time.time())}"


def sanitize_entity_ids(state: dict[str, Any]) -> dict[str, Any]:
    """Neutralise les IDs injectables dans onclick / DOM."""
    for coll in COLLECTIONS_WITH_IDS:
        for item in state.get(coll) or []:
            if not isinstance(item, dict):
                continue
            iid = item.get("id")
            if iid is None:
                continue
            if not SAFE_ID.match(str(iid)):
                item["id"] = _slug_id(iid, coll[:4])
    for item in state.get("ecoLinks") or []:
        if isinstance(item, dict) and item.get("id") and not SAFE_ID.match(str(item["id"])):
            item["id"] = _slug_id(item["id"], "eco")
    return state


def validate_entretien_id(entretien_id: str) -> str:
    eid = (entretien_id or "").strip()
    if not SAFE_ID.match(eid):
        raise ValueError("Identifiant entretien invalide")
    return eid


def safe_download_path(stored_path: str, upload_dir: Path) -> Optional[Path]:
    if not stored_path:
        return None
    try:
        base = upload_dir.resolve()
        candidate = Path(stored_path)
        if not candidate.is_absolute():
            candidate = (base / candidate).resolve()
        else:
            candidate = candidate.resolve()
        if base not in candidate.parents and candidate != base:
            return None
        return candidate if candidate.is_file() else None
    except (OSError, ValueError):
        return None


class LoginRateLimiter:
    """Limite les tentatives de connexion par IP (mémoire process)."""

    def __init__(self, max_attempts: int = 8, window_sec: int = 900, lockout_sec: int = 900):
        self.max_attempts = max_attempts
        self.window_sec = window_sec
        self.lockout_sec = lockout_sec
        self._fails: dict[str, list[float]] = {}
        self._locked_until: dict[str, float] = {}

    def check(self, ip: str) -> tuple[bool, str]:
        now = time.time()
        if self._locked_until.get(ip, 0) > now:
            wait = int(self._locked_until[ip] - now)
            return False, f"Trop de tentatives. Réessayez dans {wait}s."
        self._fails.setdefault(ip, [])
        self._fails[ip] = [t for t in self._fails[ip] if now - t < self.window_sec]
        if len(self._fails[ip]) >= self.max_attempts:
            self._locked_until[ip] = now + self.lockout_sec
            return False, "Compte temporairement verrouillé (trop d'échecs)."
        return True, ""

    def record_failure(self, ip: str) -> None:
        self._fails.setdefault(ip, []).append(time.time())

    def record_success(self, ip: str) -> None:
        self._fails.pop(ip, None)
        self._locked_until.pop(ip, None)


def _trust_proxy() -> bool:
    return os.environ.get("TRUST_PROXY", "1").lower() in ("1", "true", "yes")


def client_ip(request: Any) -> str:
    peer = request.client.host if request.client else ""
    if _trust_proxy() and peer in ("127.0.0.1", "::1"):
        forwarded = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
        if forwarded:
            return forwarded
    cf = (request.headers.get("cf-connecting-ip") or "").strip()
    if _trust_proxy() and cf:
        return cf
    if peer:
        return peer
    return "unknown"


def allowed_ips() -> Optional[frozenset[str]]:
    raw = os.environ.get("ALLOWED_IPS", "").strip()
    if not raw:
        return None
    ips = frozenset(p.strip() for p in raw.split(",") if p.strip())
    return ips or None


def ip_allowed(request: Any) -> bool:
    """Si ALLOWED_IPS est défini, n'autorise que ces IP (sauf /api/health)."""
    allow = allowed_ips()
    if not allow:
        return True
    path = getattr(getattr(request, "url", None), "path", "") or ""
    if path in ("/api/health", "/api/config/public"):
        return True
    if path.startswith("/api/collecte/") or path.startswith("/collecte/"):
        return True
    return client_ip(request) in allow


def verify_bootstrap_secret(request: Any, expected: str) -> bool:
    if not expected:
        return False
    got = (request.headers.get("x-portia-bootstrap-secret") or "").strip()
    import secrets

    return bool(got) and secrets.compare_digest(got, expected.strip())


def apply_sqlite_pragmas(conn: sqlite3.Connection) -> None:
    """WAL + clés étrangères pour meilleure concurrence et intégrité."""
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA synchronous=NORMAL")
    except sqlite3.Error:
        pass


def mission_code_is_weak(code: str) -> bool:
    c = (code or "").strip().lower()
    return c in WEAK_MISSION_CODES or len(c) < 12


_TEST_DOC_MARKERS = (
    "audit-platform-test",
    "audit_test",
    "audit-complet",
    "audit-rbac-test",
    "audit-deposit-test",
    "test-auditeur",
    "fiche-presentation-test",
)


def is_test_document(doc: dict[str, Any]) -> bool:
    """Documents de QA / tests RBAC à exclure de la Data Room mission."""
    if not isinstance(doc, dict):
        return False
    doc_id = str(doc.get("id") or "")
    if doc_id.startswith("doc_test"):
        return True
    blob = " ".join(
        str(doc.get(k) or "")
        for k in ("desc", "description", "source", "type", "par", "normalizedName", "name")
    ).lower()
    if any(m in blob for m in _TEST_DOC_MARKERS):
        return True
    fname = str(doc.get("file", {}).get("originalName") or doc.get("originalName") or "").lower()
    return any(m in fname for m in _TEST_DOC_MARKERS)


def purge_test_documents_from_state(state: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    docs = state.get("docs")
    if not isinstance(docs, list):
        return state, []
    removed = [d for d in docs if isinstance(d, dict) and is_test_document(d)]
    if not removed:
        return state, []
    keep_ids = {str(d.get("id")) for d in removed}
    state["docs"] = [d for d in docs if str(d.get("id") or "") not in keep_ids]
    return state, removed


def ai_rate_ok(user_id: str, max_per_hour: int = 60) -> bool:
    if max_per_hour <= 0:
        return True
    now = time.time()
    key = f"ai:{user_id}"
    bucket = getattr(ai_rate_ok, "_buckets", {})
    if not hasattr(ai_rate_ok, "_buckets"):
        ai_rate_ok._buckets = bucket  # type: ignore[attr-defined]
    times = [t for t in bucket.get(key, []) if now - t < 3600]
    if len(times) >= max_per_hour:
        return False
    times.append(now)
    bucket[key] = times
    return True

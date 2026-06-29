"""Synchronisation Google Calendar & Microsoft Outlook (Graph API)."""
from __future__ import annotations

import json
import os
import secrets
import urllib.parse
from datetime import date, datetime, timedelta, timezone
from typing import Any, Callable, Optional

import calendar_db as cdb
import planning_core as pc

GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar"]
MS_SCOPES = ["Calendars.ReadWrite", "offline_access", "User.Read"]


def public_base_url() -> str:
    return (os.environ.get("CALENDAR_PUBLIC_BASE_URL") or "http://127.0.0.1").rstrip("/")


def google_configured() -> bool:
    return bool(os.environ.get("GOOGLE_CLIENT_ID") and os.environ.get("GOOGLE_CLIENT_SECRET"))


def microsoft_configured() -> bool:
    return bool(os.environ.get("MICROSOFT_CLIENT_ID") and os.environ.get("MICROSOFT_CLIENT_SECRET"))


def oauth_state_store() -> dict[str, str]:
    if not hasattr(oauth_state_store, "_cache"):
        oauth_state_store._cache = {}  # type: ignore
    return oauth_state_store._cache  # type: ignore


def create_oauth_state(user_id: str, provider: str) -> str:
    st = secrets.token_urlsafe(24)
    oauth_state_store()[st] = json.dumps({"user_id": user_id, "provider": provider})
    return st


def pop_oauth_state(state: str) -> Optional[dict[str, str]]:
    raw = oauth_state_store().pop(state, None)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def google_auth_url(user_id: str) -> str:
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.environ["GOOGLE_CLIENT_ID"],
                "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{public_base_url()}/api/calendar/oauth/google/callback"],
            }
        },
        scopes=GOOGLE_SCOPES,
        state=create_oauth_state(user_id, "google"),
    )
    flow.redirect_uri = f"{public_base_url()}/api/calendar/oauth/google/callback"
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def google_handle_callback(db_path, state: str, code: str) -> dict[str, Any]:
    from google_auth_oauthlib.flow import Flow

    meta = pop_oauth_state(state)
    if not meta or meta.get("provider") != "google":
        raise ValueError("État OAuth invalide")
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.environ["GOOGLE_CLIENT_ID"],
                "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{public_base_url()}/api/calendar/oauth/google/callback"],
            }
        },
        scopes=GOOGLE_SCOPES,
        state=state,
    )
    flow.redirect_uri = f"{public_base_url()}/api/calendar/oauth/google/callback"
    flow.fetch_token(code=code)
    creds = flow.credentials
    cdb.save_connection(
        db_path,
        meta["user_id"],
        "google",
        creds.token,
        refresh_token=creds.refresh_token,
        expires_at=creds.expiry.isoformat() if creds.expiry else None,
        calendar_id="primary",
    )
    return {"ok": True, "provider": "google"}


def _google_creds(db_path, conn: dict[str, Any]):
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    creds = Credentials(
        token=conn["access_token"],
        refresh_token=conn.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        scopes=GOOGLE_SCOPES,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        cdb.save_connection(
            db_path,
            conn["user_id"],
            "google",
            creds.token,
            refresh_token=creds.refresh_token,
            expires_at=creds.expiry.isoformat() if creds.expiry else None,
            calendar_id=conn.get("calendar_id"),
            email=conn.get("email"),
        )
    return creds


def microsoft_auth_url(user_id: str) -> str:
    import msal

    app = msal.ConfidentialClientApplication(
        os.environ["MICROSOFT_CLIENT_ID"],
        authority="https://login.microsoftonline.com/common",
        client_credential=os.environ["MICROSOFT_CLIENT_SECRET"],
    )
    st = create_oauth_state(user_id, "outlook")
    url = app.get_authorization_request_url(
        scopes=MS_SCOPES,
        redirect_uri=f"{public_base_url()}/api/calendar/oauth/microsoft/callback",
        state=st,
    )
    return url


def microsoft_handle_callback(db_path, state: str, code: str) -> dict[str, Any]:
    import msal

    meta = pop_oauth_state(state)
    if not meta or meta.get("provider") != "outlook":
        raise ValueError("État OAuth invalide")
    app = msal.ConfidentialClientApplication(
        os.environ["MICROSOFT_CLIENT_ID"],
        authority="https://login.microsoftonline.com/common",
        client_credential=os.environ["MICROSOFT_CLIENT_SECRET"],
    )
    result = app.acquire_token_by_authorization_code(
        code,
        scopes=MS_SCOPES,
        redirect_uri=f"{public_base_url()}/api/calendar/oauth/microsoft/callback",
    )
    if "access_token" not in result:
        raise ValueError(result.get("error_description") or "Échec Microsoft OAuth")
    exp = datetime.now(timezone.utc) + timedelta(seconds=int(result.get("expires_in", 3600)))
    cdb.save_connection(
        db_path,
        meta["user_id"],
        "outlook",
        result["access_token"],
        refresh_token=result.get("refresh_token"),
        expires_at=exp.isoformat(),
        email=(result.get("id_token_claims") or {}).get("preferred_username"),
    )
    return {"ok": True, "provider": "outlook"}


def _event_google_body(event: dict[str, Any], j0) -> dict[str, Any]:
    start = pc.j_to_datetime(j0, event["startJ"], event.get("startTime", "09:00"))
    end = pc.j_to_datetime(j0, event.get("endJ", event["startJ"]), event.get("endTime", "10:00"))
    if end <= start:
        end = start + timedelta(hours=1)
    return {
        "summary": f"[Skydeen] {event.get('title', 'Événement')}",
        "description": event.get("description") or "",
        "location": event.get("location") or "",
        "start": {"dateTime": start.isoformat().replace("+00:00", "Z"), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat().replace("+00:00", "Z"), "timeZone": "UTC"},
    }


def push_google(db_path, user_id: str, state: dict[str, Any]) -> dict[str, Any]:
    from googleapiclient.discovery import build

    conn = cdb.get_connection(db_path, user_id, "google")
    if not conn:
        raise ValueError("Google Calendar non connecté")
    creds = _google_creds(db_path, conn)
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    cal_id = conn.get("calendar_id") or "primary"
    p = pc.ensure_planning(state)
    j0 = date.fromisoformat(p["j0"][:10])
    created = updated = 0
    for ev in p.get("events", []):
        body = _event_google_body(ev, j0)
        ext = (ev.get("external") or {}).get("google") or {}
        eid = ext.get("eventId")
        try:
            if eid:
                service.events().update(calendarId=cal_id, eventId=eid, body=body).execute()
                updated += 1
            else:
                res = service.events().insert(calendarId=cal_id, body=body).execute()
                ev.setdefault("external", {})["google"] = {"eventId": res["id"], "calendarId": cal_id}
                created += 1
        except Exception:
            continue
    p.setdefault("syncMeta", {})["google"] = {
        "connected": True,
        "lastSync": datetime.now(timezone.utc).isoformat(),
        "calendarId": cal_id,
    }
    return {"created": created, "updated": updated, "provider": "google"}


def push_outlook(db_path, user_id: str, state: dict[str, Any]) -> dict[str, Any]:
    import httpx

    conn = cdb.get_connection(db_path, user_id, "outlook")
    if not conn:
        raise ValueError("Outlook non connecté")
    p = pc.ensure_planning(state)
    j0 = date.fromisoformat(p["j0"][:10])
    headers = {"Authorization": f"Bearer {conn['access_token']}", "Content-Type": "application/json"}
    created = updated = 0
    with httpx.Client(timeout=60) as client:
        cal_id = conn.get("calendar_id")
        if not cal_id:
            r = client.get("https://graph.microsoft.com/v1.0/me/calendar", headers=headers)
            r.raise_for_status()
            cal_id = r.json()["id"]
            cdb.save_connection(
                db_path,
                user_id,
                "outlook",
                conn["access_token"],
                refresh_token=conn.get("refresh_token"),
                expires_at=conn.get("expires_at"),
                calendar_id=cal_id,
                email=conn.get("email"),
            )
        for ev in p.get("events", []):
            start = pc.j_to_datetime(j0, ev["startJ"], ev.get("startTime", "09:00"))
            end = pc.j_to_datetime(j0, ev.get("endJ", ev["startJ"]), ev.get("endTime", "10:00"))
            if end <= start:
                end = start + timedelta(hours=1)
            body = {
                "subject": f"[Skydeen] {ev.get('title', 'Événement')}",
                "body": {"contentType": "text", "content": ev.get("description") or ""},
                "start": {"dateTime": start.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": "UTC"},
                "end": {"dateTime": end.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": "UTC"},
                "location": {"displayName": ev.get("location") or ""},
            }
            ext = (ev.get("external") or {}).get("outlook") or {}
            eid = ext.get("eventId")
            try:
                if eid:
                    client.patch(
                        f"https://graph.microsoft.com/v1.0/me/events/{eid}",
                        headers=headers,
                        json=body,
                    ).raise_for_status()
                    updated += 1
                else:
                    res = client.post(
                        f"https://graph.microsoft.com/v1.0/me/calendars/{cal_id}/events",
                        headers=headers,
                        json=body,
                    )
                    res.raise_for_status()
                    data = res.json()
                    ev.setdefault("external", {})["outlook"] = {"eventId": data["id"], "calendarId": cal_id}
                    created += 1
            except Exception:
                continue
    p.setdefault("syncMeta", {})["outlook"] = {
        "connected": True,
        "lastSync": datetime.now(timezone.utc).isoformat(),
        "calendarId": cal_id,
    }
    return {"created": created, "updated": updated, "provider": "outlook"}


def sync_all(
    db_path,
    user_id: str,
    state: dict[str, Any],
    *,
    providers: Optional[list[str]] = None,
    direction: str = "push",
) -> dict[str, Any]:
    providers = providers or ["google", "outlook"]
    results: dict[str, Any] = {}
    if direction != "push":
        return {"ok": False, "error": "Seul le mode push est implémenté pour l'instant"}
    for prov in providers:
        if prov == "google" and google_configured() and cdb.get_connection(db_path, user_id, "google"):
            results["google"] = push_google(db_path, user_id, state)
        if prov == "outlook" and microsoft_configured() and cdb.get_connection(db_path, user_id, "outlook"):
            results["outlook"] = push_outlook(db_path, user_id, state)
    return {"ok": True, "results": results, "planning": state.get("planning4s")}

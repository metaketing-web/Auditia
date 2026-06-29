"""Fournisseurs IA — Anthropic (défaut) et OpenAI (contrôle / relecture)."""
from __future__ import annotations

import os
from typing import Any, Callable, Optional

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.4-mini").strip()
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929").strip()
AI_DEFAULT_PROVIDER = os.environ.get("AI_PROVIDER", "anthropic").strip().lower()
if AI_DEFAULT_PROVIDER not in ("anthropic", "openai"):
    AI_DEFAULT_PROVIDER = "anthropic" if ANTHROPIC_API_KEY else "openai"


def assert_anthropic_model_allowed(model: str = ANTHROPIC_MODEL) -> str:
    """Bloque Opus (coût ×10) — seuls les modèles Sonnet sont autorisés sur Skydeen."""
    m = (model or "").strip().lower()
    if not m:
        raise RuntimeError("ANTHROPIC_MODEL non configuré")
    if "opus" in m:
        raise RuntimeError(
            f"Modèle Opus interdit sur Skydeen ({model}). "
            "Utilisez un Sonnet, ex. claude-sonnet-4-5-20250929"
        )
    if "sonnet" not in m and not m.startswith("claude-sonnet"):
        raise RuntimeError(
            f"Modèle Anthropic non autorisé ({model}). Seuls les modèles Sonnet sont acceptés."
        )
    return model


def openai_ready() -> bool:
    return bool(OPENAI_API_KEY)


def anthropic_ready() -> bool:
    return bool(ANTHROPIC_API_KEY)


def ai_ready() -> bool:
    if AI_DEFAULT_PROVIDER == "anthropic":
        return anthropic_ready()
    return openai_ready()


def _norm_messages(messages: list[dict[str, str]]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for m in messages or []:
        role = m.get("role", "user")
        if role not in ("user", "assistant", "system"):
            role = "user"
        content = m.get("content", "")
        if content:
            out.append({"role": role, "content": content})
    return out


def complete_openai(
    *,
    system: str,
    messages: list[dict[str, str]],
    max_tokens: int = 1800,
    on_token: Optional[Callable[[str, str], None]] = None,
) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY non configurée")
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    msgs: list[dict[str, str]] = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.extend(_norm_messages(messages))

    model = OPENAI_MODEL
    kw: dict[str, Any] = {"model": model, "messages": msgs}
    if any(x in model for x in ("gpt-5", "o1", "o3", "o4")):
        kw["max_completion_tokens"] = max_tokens
    else:
        kw["max_tokens"] = max_tokens

    if on_token:
        stream = client.chat.completions.create(**kw, stream=True)
        full = ""
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full += delta
                on_token(delta, full)
        return full

    resp = client.chat.completions.create(**kw)
    return resp.choices[0].message.content or ""


def complete_anthropic(
    *,
    system: str,
    messages: list[dict[str, str]],
    max_tokens: int = 1800,
    on_token: Optional[Callable[[str, str], None]] = None,
) -> str:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY non configurée")
    model = assert_anthropic_model_allowed()
    import anthropic

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msgs = []
    for m in _norm_messages(messages):
        if m["role"] == "system":
            continue
        msgs.append({"role": m["role"], "content": m["content"]})

    if on_token:
        full = ""
        with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=system or anthropic.NOT_GIVEN,
            messages=msgs,
        ) as stream:
            for text in stream.text_stream:
                full += text
                on_token(text, full)
        return full

    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system or anthropic.NOT_GIVEN,
        messages=msgs,
    )
    parts = []
    for block in resp.content:
        if hasattr(block, "text"):
            parts.append(block.text)
    return "".join(parts)


def complete(
    *,
    provider: str,
    system: str,
    messages: list[dict[str, str]],
    max_tokens: int = 1800,
    on_token: Optional[Callable[[str, str], None]] = None,
) -> tuple[str, str]:
    p = (provider or AI_DEFAULT_PROVIDER).lower()
    if p == "anthropic":
        return complete_anthropic(system=system, messages=messages, max_tokens=max_tokens, on_token=on_token), "anthropic"
    return complete_openai(system=system, messages=messages, max_tokens=max_tokens, on_token=on_token), "openai"


def _parse_review_json(raw: str) -> dict[str, Any]:
    import json
    import re

    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {"summary": raw, "suggestions": []}
    if not isinstance(data, dict):
        return {"summary": raw, "suggestions": []}
    summary = str(data.get("summary") or "").strip() or raw
    suggestions = data.get("suggestions") or []
    if not isinstance(suggestions, list):
        suggestions = []
    clean: list[dict[str, Any]] = []
    for i, s in enumerate(suggestions):
        if not isinstance(s, dict):
            continue
        stype = str(s.get("type") or "replace").strip().lower()
        if stype not in ("replace", "append"):
            stype = "append" if not str(s.get("find") or "").strip() else "replace"
        clean.append(
            {
                "id": str(s.get("id") or i + 1),
                "title": str(s.get("title") or f"Suggestion {i + 1}").strip(),
                "comment": str(s.get("comment") or "").strip(),
                "type": stype,
                "find": str(s.get("find") or "").strip(),
                "replacement": str(s.get("replacement") or "").strip(),
            }
        )
    return {"summary": summary, "suggestions": clean}


def review_with_openai(*, text: str, context: str = "", question: str = "") -> dict[str, Any]:
    """OpenAI relit une réponse Claude et propose commentaires + améliorations applicables."""
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY requise pour le contrôle IA")
    system = (
        "Tu es un auditeur senior (cabinet) chargé du contrôle qualité des livrables IA. "
        "Analyse la réponse produite par une première IA : cohérence, zones grises, affirmations non sourcées, "
        "compléments utiles et risques d'interprétation. "
        "Réponds UNIQUEMENT en JSON valide (aucun markdown autour) avec ce schéma exact :\n"
        "{\n"
        '  "summary": "Synthèse en markdown : **Points solides** … **Réserves** … **Compléments** …",\n'
        '  "suggestions": [\n'
        "    {\n"
        '      "id": "1",\n'
        '      "title": "titre court de l\'amélioration",\n'
        '      "comment": "pourquoi cette modification est utile",\n'
        '      "type": "replace" ou "append",\n'
        '      "find": "extrait EXACT du texte original (obligatoire pour replace)",\n'
        '      "replacement": "texte corrigé ou section complète à ajouter"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Propose 2 à 6 suggestions actionnables. Pour replace, copie un extrait exact du texte source. "
        "Ton professionnel, concis, en français."
    )
    user = f"CONTEXTE MISSION :\n{context or 'Audit de cadrage PNIPM — MPJIPSC'}\n\n"
    if question:
        user += f"QUESTION INITIALE :\n{question}\n\n"
    user += f"RÉPONSE À CONTRÔLER :\n{text}"
    raw = complete_openai(system=system, messages=[{"role": "user", "content": user}], max_tokens=3000)
    return _parse_review_json(raw)

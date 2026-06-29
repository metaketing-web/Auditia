/**
 * Skydeen — dual IA : Anthropic (génération) + OpenAI (2ème contrôle + suggestions applicables).
 */
(function () {
  "use strict";

  const REVIEW_BTN_ID = "aiReview";
  const REVIEW_PANEL_ID = "aiReviewPanel";
  const REVIEW_STATUS_ID = "aiReviewStatus";

  function apiFetch(url, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    if (window.PortiaEnterprise && PortiaEnterprise.authHeaders) {
      Object.assign(headers, PortiaEnterprise.authHeaders(headers));
    }
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  function reviewReady() {
    const cfg = window._portiaServerConfig;
    return !!(cfg && cfg.openaiReady);
  }

  async function review(text, opts) {
    opts = opts || {};
    const res = await apiFetch("/api/ai/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: text || "",
        context: opts.context || "",
        question: opts.question || "",
      }),
    });
    if (!res.ok) {
      let t = "";
      try {
        t = await res.text();
      } catch (_) {}
      throw new Error("Contrôle IA (" + res.status + ") " + t.slice(0, 260));
    }
    const data = await res.json();
    return {
      text: data.text || "",
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    };
  }

  function getRawText(out) {
    if (!out) return "";
    return out.dataset.rawText || out.innerText || "";
  }

  function setRawText(out, text) {
    if (!out) return;
    out.dataset.rawText = text || "";
    out.innerHTML = typeof aiFormat === "function" ? aiFormat(text) : esc(text);
    const mb = out.closest(".modal-b");
    if (mb) mb.scrollTop = mb.scrollHeight;
  }

  function applySuggestion(text, sug) {
    if (!sug || !text) return { text, applied: false };
    const type = (sug.type || "replace").toLowerCase();
    const replacement = sug.replacement || "";
    if (type === "append" || !String(sug.find || "").trim()) {
      const sep = text.endsWith("\n") ? "\n" : "\n\n";
      return { text: text + sep + replacement, applied: !!replacement };
    }
    const find = sug.find;
    if (text.includes(find)) {
      return { text: text.replace(find, replacement), applied: true };
    }
    const idx = text.toLowerCase().indexOf(find.toLowerCase());
    if (idx >= 0) {
      return {
        text: text.slice(0, idx) + replacement + text.slice(idx + find.length),
        applied: true,
      };
    }
    return { text, applied: false };
  }

  function renderSuggestions(out, foot, suggestions, ctx) {
    ctx = ctx || {};
    let panel = document.getElementById(REVIEW_PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = REVIEW_PANEL_ID;
      const mb = out.closest(".modal-b");
      if (mb) mb.appendChild(panel);
      else out.parentNode.appendChild(panel);
    }
    panel.innerHTML = "";

    if (!suggestions.length) {
      panel.innerHTML =
        '<div class="note slate" style="margin-top:16px;border-left:3px solid var(--info)">' +
        '<div class="eyebrow" style="margin-bottom:6px">2ème IA (OpenAI)</div>' +
        '<div class="muted" style="font-size:12px">Aucune modification automatique proposée — relisez le résumé ci-dessus.</div></div>';
      return;
    }

    const head = document.createElement("div");
    head.className = "note slate";
    head.style.cssText = "margin-top:16px;border-left:3px solid var(--info)";
    head.innerHTML =
      '<div class="eyebrow" style="margin-bottom:6px">Améliorations proposées (' +
      suggestions.length +
      ')</div>' +
      '<div class="muted" style="font-size:12px;margin-bottom:10px">Cliquez « Appliquer » pour intégrer une suggestion au texte généré, puis enregistrez le brouillon si besoin.</div>';
    panel.appendChild(head);

    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-top:10px";
    panel.appendChild(list);

    const applied = new Set();

    function refreshApplyAll() {
      const allBtn = document.getElementById("aiReviewApplyAll");
      if (allBtn) allBtn.disabled = applied.size >= suggestions.length;
    }

    suggestions.forEach((sug, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "0";
      const sid = String(sug.id || i + 1);
      card.innerHTML =
        '<div class="card-b" style="padding:12px 14px">' +
        '<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
        '<b style="font-size:13px">' +
        esc(sug.title || "Suggestion " + sid) +
        "</b>" +
        (sug.comment ? '<div class="muted" style="font-size:12px;margin-top:4px">' + esc(sug.comment) + "</div>" : "") +
        (sug.replacement
          ? '<pre style="margin-top:8px;font-size:11px;white-space:pre-wrap;background:var(--slate-soft);padding:8px;border-radius:6px;max-height:120px;overflow:auto">' +
            esc((sug.replacement || "").slice(0, 800)) +
            (sug.replacement.length > 800 ? "…" : "") +
            "</pre>"
          : "") +
        "</div>" +
        '<button type="button" class="btn terra sm btn-apply-sug" data-sid="' +
        esc(sid) +
        '">Appliquer</button></div></div>';
      list.appendChild(card);

      const btn = card.querySelector(".btn-apply-sug");
      btn.onclick = () => {
        if (applied.has(sid)) return;
        const current = getRawText(out);
        const res = applySuggestion(current, sug);
        if (!res.applied) {
          toast && toast("Application", "Extrait introuvable — appliquez manuellement ou régénérez", "err");
          return;
        }
        setRawText(out, res.text);
        applied.add(sid);
        btn.disabled = true;
        btn.textContent = "Appliqué";
        btn.classList.remove("terra");
        btn.classList.add("ghost");
        refreshApplyAll();
        toast && toast("Appliqué", sug.title || "Modification intégrée", "ok");
        if (ctx.onTextChange) ctx.onTextChange(res.text);
      };
    });

    if (!document.getElementById("aiReviewApplyAll") && foot) {
      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "btn terra";
      allBtn.id = "aiReviewApplyAll";
      allBtn.innerHTML =
        (typeof svgI === "function"
          ? svgI('<path d="M20 6 9 17l-5-5"/>')
          : "") + " Appliquer toutes les améliorations";
      allBtn.onclick = () => {
        let current = getRawText(out);
        let count = 0;
        suggestions.forEach((sug, i) => {
          const sid = String(sug.id || i + 1);
          if (applied.has(sid)) return;
          const res = applySuggestion(current, sug);
          if (res.applied) {
            current = res.text;
            applied.add(sid);
            count++;
          }
        });
        if (!count) {
          toast && toast("Application", "Aucune suggestion n'a pu être appliquée automatiquement", "err");
          return;
        }
        setRawText(out, current);
        list.querySelectorAll(".btn-apply-sug").forEach((b) => {
          if (!b.disabled) {
            b.disabled = true;
            b.textContent = "Appliqué";
            b.classList.remove("terra");
            b.classList.add("ghost");
          }
        });
        allBtn.disabled = true;
        toast && toast("Appliqué", count + " amélioration(s) intégrée(s)", "ok");
        if (ctx.onTextChange) ctx.onTextChange(current);
      };
      const sv = document.getElementById("aiSave");
      foot.insertBefore(allBtn, sv || null);
    }
    refreshApplyAll();
  }

  function removeReviewUi() {
    const oldBtn = document.getElementById(REVIEW_BTN_ID);
    if (oldBtn) oldBtn.remove();
    const oldPanel = document.getElementById(REVIEW_PANEL_ID);
    if (oldPanel) oldPanel.remove();
    const oldAll = document.getElementById("aiReviewApplyAll");
    if (oldAll) oldAll.remove();
    const oldHint = document.getElementById("aiReviewHint");
    if (oldHint) oldHint.remove();
    const oldStatus = document.getElementById(REVIEW_STATUS_ID);
    if (oldStatus) oldStatus.remove();
  }

  function renderReviewPanel(out, foot, data, opts) {
    let panel = document.getElementById(REVIEW_PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = REVIEW_PANEL_ID;
      const mb = out.closest(".modal-b");
      if (mb) mb.appendChild(panel);
    }
    panel.innerHTML =
      '<div class="note slate" style="margin-top:16px;border-left:3px solid var(--info)">' +
      '<div class="eyebrow" style="margin-bottom:6px">Contrôle qualité — 2ème IA (OpenAI)</div>' +
      (typeof aiFormat === "function" ? aiFormat(data.text) : esc(data.text)) +
      "</div>";
    renderSuggestions(out, foot, data.suggestions, {
      onTextChange: opts.onTextChange,
    });
  }

  async function runReview(out, foot, opts) {
    opts = opts || {};
    const data = await review(getRawText(out), {
      context: opts.context || opts.intro || opts.title || "",
      question: opts.eyebrow || opts.title || "",
    });
    renderReviewPanel(out, foot, data, opts);
    return data;
  }

  async function autoReviewAfterGeneration(out, foot, opts) {
    opts = opts || {};
    if (!out || !foot) return;
    const text = getRawText(out);
    if (text.trim().length < 20) return;
    removeReviewUi();

    if (!reviewReady()) {
      const hint = document.createElement("div");
      hint.id = "aiReviewHint";
      hint.className = "muted";
      hint.style.cssText = "font-size:11px;margin-right:auto;padding:4px 0";
      hint.textContent = "2ème IA (OpenAI) : clé serveur non configurée";
      foot.insertBefore(hint, foot.firstChild);
      return;
    }

    const status = document.createElement("div");
    status.id = REVIEW_STATUS_ID;
    status.className = "muted";
    status.style.cssText = "font-size:11px;margin-right:auto;padding:4px 0";
    status.textContent = "2ème IA (OpenAI) : contrôle automatique en cours…";
    foot.insertBefore(status, foot.firstChild);

    try {
      await runReview(out, foot, opts);
      status.remove();
      toast && toast("2ème IA", "Contrôle OpenAI terminé — suggestions ci-dessous", "ok");
    } catch (e) {
      status.textContent = "Contrôle OpenAI échoué";
      showReviewButton(out, foot, opts);
      toast && toast("2ème IA", (e.message || String(e)).slice(0, 120), "err");
    }
  }

  function showReviewButton(out, foot, opts) {
    opts = opts || {};
    if (!out || !foot) return;
    const text = getRawText(out);
    if (text.trim().length < 20) return;
    removeReviewUi();

    if (!reviewReady()) {
      const hint = document.createElement("div");
      hint.id = "aiReviewHint";
      hint.className = "muted";
      hint.style.cssText = "font-size:11px;margin-right:auto;padding:4px 0";
      hint.textContent = "2ème IA (OpenAI) : clé serveur non configurée";
      foot.insertBefore(hint, foot.firstChild);
      return;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ai";
    btn.id = REVIEW_BTN_ID;
    btn.innerHTML =
      (typeof svgI === "function"
        ? svgI('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>')
        : "") + " Vérifier avec une 2ème IA";
    btn.onclick = async () => {
      btn.disabled = true;
      const prev = btn.innerHTML;
      btn.textContent = "Analyse OpenAI en cours…";
      try {
        await runReview(out, foot, opts);
        btn.style.display = "none";
        toast && toast("2ème IA", "Analyse et suggestions ajoutées", "ok");
      } catch (e) {
        toast && toast("2ème IA", (e.message || String(e)).slice(0, 120), "err");
        btn.disabled = false;
        btn.innerHTML = prev;
      }
    };

    const cp = document.getElementById("aiCopy");
    foot.insertBefore(btn, cp || foot.firstChild);
  }

  function attachReviewToModal(opts) {
    opts = opts || {};
    const out = opts.outEl || document.getElementById("aiOut");
    const foot = opts.footEl || document.querySelector(".modal-f");
    if (!out || !foot) return;
    if (opts.text != null) setRawText(out, opts.text);
    setTimeout(() => autoReviewAfterGeneration(out, foot, opts), 80);
  }

  function enhanceModalFooter() {
    const orig = window.aiRunModal;
    if (!orig || orig._dualFooter) return;
    window.aiRunModal = function (opts) {
      opts = opts || {};
      const userRunFn = opts.runFn;
      const wrapped = Object.assign({}, opts, {
        runFn: async (onT) => {
          const result = await userRunFn(onT);
          const out = document.getElementById("aiOut");
          if (out) {
            out.dataset.rawText = result || "";
            const foot = document.querySelector(".modal-f");
            autoReviewAfterGeneration(out, foot, {
              title: opts.title,
              eyebrow: opts.eyebrow,
              intro: opts.intro,
              context: opts.intro || opts.title || "",
              onTextChange: (txt) => {
                out.dataset.rawText = txt;
                const cp = document.getElementById("aiCopy");
                if (cp) {
                  cp.onclick = () => {
                    if (navigator.clipboard) navigator.clipboard.writeText(txt);
                    toast && toast("Copié", "Texte copié dans le presse-papier", "ok");
                  };
                }
                const sv = document.getElementById("aiSave");
                if (sv && opts.onSave) {
                  sv.onclick = () => {
                    opts.onSave(txt);
                    Modal.close();
                  };
                }
              },
            });
          }
          return result;
        },
      });
      removeReviewUi();
      orig(wrapped);
    };
    window.aiRunModal._dualFooter = true;
  }

  window.PortiaAiDual = {
    review,
    reviewReady,
    enhanceModalFooter,
    attachReviewToModal,
    showReviewButton,
    autoReviewAfterGeneration,
    runReview,
    applySuggestion,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceModalFooter);
  } else {
    enhanceModalFooter();
  }
})();

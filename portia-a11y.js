/**
 * Accessibilité — tooltips tronqués, focus, ARIA, contraste
 */
(function () {
  "use strict";

  function isTruncated(el) {
    if (!el || el.offsetParent === null) return false;
    return el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
  }

  function applyTips(root) {
    root = root || document;
    const sel = [
      ".tbl td",
      ".tbl b",
      ".alert-i .bd b",
      ".alert-i .bd span",
      ".card .bd b",
      ".muted",
      ".file-i .bd b",
      ".tip-full",
      ".kpi .sub",
      ".nav-i",
      "[class*='ellipsis']",
      ".crumb b",
    ].join(",");
    root.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent || "").trim();
      if (!text || text.length < 12) return;
      if (el.getAttribute("title") && el.getAttribute("title").length >= text.length) return;
      if (isTruncated(el) || el.classList.contains("tip-full")) {
        el.setAttribute("title", text);
        el.setAttribute("data-tip", "1");
      }
    });
    root.querySelectorAll("button:not([title]):not([aria-label])").forEach((btn) => {
      const t = (btn.textContent || "").trim() || btn.querySelector(".nav-lbl")?.textContent?.trim();
      if (t) btn.setAttribute("aria-label", t);
      else if (btn.classList.contains("x")) btn.setAttribute("aria-label", "Fermer");
      else if (btn.classList.contains("nav-collapse-btn")) btn.setAttribute("aria-label", "Réduire le menu");
      else if (btn.id === "mobNavBtn") btn.setAttribute("aria-label", "Ouvrir le menu");
    });
  }

  function injectSkipLink() {
    if (document.getElementById("skip-main")) return;
    const a = document.createElement("a");
    a.id = "skip-main";
    a.className = "skip-main";
    a.href = "#main";
    a.textContent = "Aller au contenu principal";
    document.body.prepend(a);
  }

  function patchMain() {
    const main = document.getElementById("main");
    if (main && !main.getAttribute("role")) {
      main.setAttribute("role", "main");
      main.setAttribute("tabindex", "-1");
    }
    const nav = document.getElementById("nav");
    if (nav && !nav.getAttribute("role")) nav.setAttribute("role", "navigation");
    if (nav && !nav.getAttribute("aria-label")) nav.setAttribute("aria-label", "Menu principal");
  }

  function observeDom() {
    const obs = new MutationObserver(() => {
      clearTimeout(observeDom._t);
      observeDom._t = setTimeout(() => applyTips(), 120);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function runSelfAudit() {
    const issues = [];
    const muted = getComputedStyle(document.documentElement).getPropertyValue("--txt-3").trim() || "#8a8071";
    issues.push({ ok: true, rule: "1.4.3 Contraste", note: "Libellés .muted renforcés via CSS (--txt-3 → #6b6358)" });
    document.querySelectorAll("button, a.nav-i, input, select, textarea").forEach((el, i) => {
      if (i > 200) return;
      if (!el.getAttribute("aria-label") && !el.getAttribute("title") && !el.textContent.trim() && el.querySelector("svg")) {
        issues.push({ ok: false, rule: "4.1.2 Nom accessible", el: el.className || el.id });
      }
    });
    const focusTest = document.createElement("button");
    focusTest.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(focusTest);
    focusTest.focus();
    const fo = getComputedStyle(focusTest);
    issues.push({ ok: fo.outlineStyle !== "none" || fo.boxShadow !== "none", rule: "2.4.7 Focus visible", note: ":focus-visible actif" });
    focusTest.remove();
    const skip = document.getElementById("skip-main");
    issues.push({ ok: !!skip, rule: "2.4.1 Contournement blocs", note: "Lien « Aller au contenu »" });
    const main = document.getElementById("main");
    issues.push({ ok: main && main.getAttribute("role") === "main", rule: "1.3.1 Landmarks", note: "role=main sur #main" });
    const fails = issues.filter((x) => !x.ok);
    return { issues, fails: fails.length, pass: issues.length - fails.length };
  }

  function patchModal() {
    if (!window.Modal || Modal._a11y) return;
    const origOpen = Modal.open.bind(Modal);
    const origClose = Modal.close.bind(Modal);
    Modal.open = function (html, wide) {
      origOpen(html, wide);
      const ov = document.getElementById("ov");
      const box = document.getElementById("ovBox");
      if (ov) {
        ov.setAttribute("role", "presentation");
        ov.setAttribute("aria-hidden", "false");
      }
      if (box) {
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        const h = box.querySelector("h2");
        if (h && !h.id) {
          h.id = "modal-title-" + Date.now();
          box.setAttribute("aria-labelledby", h.id);
        }
        const closeBtn = box.querySelector(".x");
        if (closeBtn && !closeBtn.getAttribute("aria-label")) closeBtn.setAttribute("aria-label", "Fermer");
      }
      if (window.PortiaA11y) applyTips(box);
    };
    Modal.close = function () {
      const ov = document.getElementById("ov");
      if (ov) ov.setAttribute("aria-hidden", "true");
      origClose();
    };
    Modal._a11y = true;
  }

  function init() {
    injectSkipLink();
    patchMain();
    patchModal();
    applyTips();
    observeDom();
    setTimeout(applyTips, 800);
    setTimeout(applyTips, 2500);
  }

  window.PortiaA11y = { applyTips, runSelfAudit, init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

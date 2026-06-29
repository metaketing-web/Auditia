/**
 * Sidebar réductible — pictos seuls + picto Skydeen en tête.
 */
(function () {
  "use strict";

  const KEY = "portia_nav_collapsed";

  function isCollapsed() {
    return localStorage.getItem(KEY) === "1";
  }

  function setCollapsed(on) {
    const app = document.getElementById("app");
    if (!app) return;
    app.classList.toggle("nav-collapsed", !!on);
    try {
      localStorage.setItem(KEY, on ? "1" : "0");
    } catch (_) {}
    const btn = document.getElementById("navCollapseBtn");
    if (btn) {
      btn.title = on ? "Déplier le menu" : "Réduire le menu";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.innerHTML =
        (typeof svgI === "function"
          ? svgI(
              on
                ? '<path d="m9 18 6-6-6-6"/><path d="M15 6l6 6-6 6"/>'
                : '<path d="m15 18-6-6 6-6"/><path d="M9 6l-6 6 6 6"/>'
            )
          : "") + (on ? "" : "");
    }
  }

  function toggle() {
    setCollapsed(!isCollapsed());
  }

  function ensureToggle() {
    const brand = document.querySelector(".brand");
    if (!brand || document.getElementById("navCollapseBtn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "navCollapseBtn";
    btn.className = "nav-collapse-btn";
    btn.title = "Réduire le menu";
    btn.setAttribute("aria-label", "Réduire ou déplier le menu");
    btn.onclick = toggle;
    brand.appendChild(btn);
    setCollapsed(isCollapsed());
  }

  function patchRenderNav() {
    if (!window.App || App._navCollapsePatched) return;
    const orig = App.renderNav.bind(App);
    App.renderNav = function () {
      orig();
      ensureMobileNav();
      document.querySelectorAll(".nav-i").forEach((a) => {
        const spans = a.querySelectorAll("span");
        let lbl = "";
        spans.forEach((s) => {
          if (!s.classList.contains("ct") && s.textContent) lbl = s.textContent.trim();
        });
        if (lbl) a.title = lbl;
      });
    };
    App._navCollapsePatched = true;
  }

  function openMobile() {
    const app = document.getElementById("app");
    if (app) app.classList.add("nav-open");
  }

  function closeMobile() {
    const app = document.getElementById("app");
    if (app) app.classList.remove("nav-open");
  }

  function ensureMobileNav() {
    const btn = document.getElementById("mobNavBtn");
    if (btn && !btn._bound) {
      btn._bound = true;
      btn.onclick = () => {
        const app = document.getElementById("app");
        if (app && app.classList.contains("nav-open")) closeMobile();
        else openMobile();
      };
    }
    document.querySelectorAll(".nav-i").forEach((a) => {
      if (a._mobBound) return;
      a._mobBound = true;
      a.addEventListener("click", () => closeMobile());
    });
  }

  function boot() {
    patchRenderNav();
    const origEnter = App.enter.bind(App);
    const origGo = App.go.bind(App);
    App.enter = function () {
      origEnter();
      ensureToggle();
      setCollapsed(isCollapsed());
      ensureMobileNav();
    };
    App.go = function (k, ctx) {
      origGo(k, ctx);
      closeMobile();
    };
    if (document.getElementById("app")?.classList.contains("on")) {
      ensureToggle();
      setCollapsed(isCollapsed());
      ensureMobileNav();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.PortiaNavCollapse = { toggle, setCollapsed, isCollapsed, openMobile, closeMobile };
})();

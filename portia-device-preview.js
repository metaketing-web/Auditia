/**
 * Aperçu iPad — cadre redimensionné pour prévisualiser le rendu tablette.
 */
(function () {
  "use strict";

  const KEY = "portia_ipad_preview";
  const MODES = {
    off: null,
    portrait: { w: 820, h: 1180, label: "iPad portrait" },
    landscape: { w: 1180, h: 820, label: "iPad paysage" },
  };

  let mode = "off";

  function loadMode() {
    try {
      mode = localStorage.getItem(KEY) || "off";
    } catch (_) {
      mode = "off";
    }
    if (!MODES[mode]) mode = "off";
  }

  function saveMode() {
    try {
      localStorage.setItem(KEY, mode);
    } catch (_) {}
  }

  function isLoginVisible() {
    const login = document.getElementById("login");
    const app = document.getElementById("app");
    return login && login.style.display !== "none" && (!app || !app.classList.contains("on"));
  }

  function ensureBar() {
    if (document.getElementById("ipadPreviewBar")) return;
    const bar = document.createElement("div");
    bar.id = "ipadPreviewBar";
    bar.className = "ipad-preview-bar";
    bar.innerHTML =
      '<span class="ipad-preview-lbl"></span>' +
      '<button type="button" class="btn ghost sm" id="ipadPreviewFlip">↻ Paysage / Portrait</button>' +
      '<button type="button" class="btn ghost sm" id="ipadPreviewExit">Quitter l\'aperçu</button>';
    document.body.appendChild(bar);
    bar.querySelector("#ipadPreviewFlip").onclick = () => {
      mode = mode === "portrait" ? "landscape" : "portrait";
      saveMode();
      apply();
    };
    bar.querySelector("#ipadPreviewExit").onclick = () => {
      mode = "off";
      saveMode();
      apply();
    };
  }

  function ensureLoginPreviewBtn() {
    if (document.getElementById("lgIpadPreview")) return;
    const card = document.querySelector("#login .login-card");
    if (!card) return;
    const foot = card.querySelector(".login-foot");
    if (!foot) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn ghost sm";
    b.id = "lgIpadPreview";
    b.style.cssText = "width:100%;margin-top:10px;justify-content:center";
    b.textContent = "Aperçu iPad (portrait / paysage)";
    b.onclick = cycle;
    foot.parentNode.insertBefore(b, foot);
  }

  function updateBtn() {
    const btn = document.getElementById("topIpadPreview");
    if (!btn) return;
    const on = mode !== "off";
    btn.classList.toggle("on", on);
    btn.title = on ? "Aperçu iPad actif — cliquer pour quitter" : "Aperçu iPad (portrait / paysage)";
    const lgBtn = document.getElementById("lgIpadPreview");
    if (lgBtn) {
      lgBtn.textContent = on
        ? "Aperçu iPad actif — cliquer pour quitter"
        : "Aperçu iPad (portrait / paysage)";
      lgBtn.classList.toggle("on", on);
    }
  }

  function resetFrame(el) {
    if (!el) return;
    el.style.width = "";
    el.style.height = "";
    el.style.transform = "";
    el.style.transformOrigin = "";
    el.style.margin = "";
    el.style.position = "";
    el.style.inset = "";
    const card = el.querySelector && el.querySelector(".login-card");
    if (card) {
      card.style.maxHeight = "";
      card.style.overflowY = "";
      card.style.margin = "";
    }
  }

  function frame(el, m, scale) {
    if (!el) return;
    el.style.width = m.w + "px";
    el.style.height = m.h + "px";
    el.style.transform = scale < 1 ? "scale(" + scale + ")" : "";
    el.style.transformOrigin = "top center";
    el.style.margin = "0 auto";
  }

  function apply() {
    ensureBar();
    ensureLoginPreviewBtn();
    const body = document.body;
    const app = document.getElementById("app");
    const login = document.getElementById("login");
    const bar = document.getElementById("ipadPreviewBar");
    const lbl = bar && bar.querySelector(".ipad-preview-lbl");

    if (!mode || mode === "off" || !MODES[mode]) {
      body.classList.remove("portia-ipad-preview");
      delete body.dataset.ipadPreview;
      resetFrame(app);
      resetFrame(login);
      if (bar) bar.style.display = "none";
      updateBtn();
      return;
    }

    const m = MODES[mode];
    body.classList.add("portia-ipad-preview");
    body.dataset.ipadPreview = mode;

    const pad = 88;
    const scale = Math.min(1, (window.innerWidth - 24) / m.w, (window.innerHeight - pad) / m.h);

    resetFrame(app);
    resetFrame(login);

    if (app && app.classList.contains("on")) {
      frame(app, m, scale);
    } else if (isLoginVisible()) {
      frame(login, m, scale);
      const card = login.querySelector(".login-card");
      if (card) {
        card.style.maxHeight = Math.max(320, m.h - 48) + "px";
        card.style.overflowY = "auto";
        card.style.margin = "16px auto";
      }
    }

    if (bar) bar.style.display = "flex";
    if (lbl) {
      lbl.textContent =
        m.label +
        " · " +
        m.w +
        "×" +
        m.h +
        (scale < 1 ? " · zoom " + Math.round(scale * 100) + "%" : "") +
        (isLoginVisible() ? " · connexion" : "");
    }
    updateBtn();
  }

  function cycle() {
    const order = ["off", "portrait", "landscape"];
    const i = order.indexOf(mode);
    mode = order[(i + 1) % order.length];
    saveMode();
    apply();
  }

  function patchAppLifecycle() {
    if (!window.App) return;

    if (!App._ipadPreviewEnter) {
      const origEnter = App.enter.bind(App);
      App.enter = function () {
        origEnter();
        const btn = document.getElementById("topIpadPreview");
        if (btn) btn.style.display = "";
        setTimeout(apply, 30);
      };
      App._ipadPreviewEnter = true;
    }

    if (!App._ipadPreviewLogout) {
      const origLogout = App.logout.bind(App);
      App.logout = function () {
        origLogout();
        ensureLoginPreviewBtn();
        setTimeout(apply, 30);
      };
      App._ipadPreviewLogout = true;
    }

    if (!App._ipadPreviewLogin) {
      const origLogin = App.login.bind(App);
      App.login = async function () {
        const r = origLogin.apply(this, arguments);
        if (r && typeof r.then === "function") {
          try {
            await r;
          } catch (_) {}
        }
        setTimeout(apply, 50);
      };
      App._ipadPreviewLogin = true;
    }
  }

  function patchEnterpriseLogin() {
    if (!window.PortiaEnterprise || PortiaEnterprise._ipadLoginPatched) return;
    const origBoot = PortiaEnterprise.boot;
    if (!origBoot) return;
    PortiaEnterprise.boot = async function () {
      await origBoot.apply(this, arguments);
      ensureLoginPreviewBtn();
      if (mode !== "off") apply();
    };
    PortiaEnterprise._ipadLoginPatched = true;
  }

  function init() {
    loadMode();
    const btn = document.getElementById("topIpadPreview");
    if (btn) btn.onclick = cycle;
    window.addEventListener("resize", () => {
      if (mode !== "off") apply();
    });
    patchAppLifecycle();
    patchEnterpriseLogin();
    ensureLoginPreviewBtn();
    if (window.App && App.user) {
      if (btn) btn.style.display = "";
    }
    if (mode !== "off") {
      setTimeout(apply, 40);
    }
    setTimeout(patchAppLifecycle, 800);
  }

  window.PortiaDevicePreview = { cycle, apply, getMode: () => mode };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

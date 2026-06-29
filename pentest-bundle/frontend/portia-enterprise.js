/**
 * Skydeen Enterprise — auth RBAC, journal, export ZIP, volet B, flux, workflows
 */
(function () {
  "use strict";

  const AUTH_KEY = "portia_auth_token";
  const USER_KEY = "portia_auth_user";
  let useCookieAuth = false;

  function migrateAuthFromLocalStorage() {
    try {
      const legacy = localStorage.getItem(AUTH_KEY);
      if (legacy && !sessionStorage.getItem(AUTH_KEY)) {
        sessionStorage.setItem(AUTH_KEY, legacy);
      }
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_) {}
  }
  migrateAuthFromLocalStorage();

  function getToken() {
    if (useCookieAuth) return window.PORTIA_AUTH_TOKEN || "";
    try {
      return sessionStorage.getItem(AUTH_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setSession(token, user, opts) {
    opts = opts || {};
    if (opts.cookieAuth || opts.sessionCookie) {
      useCookieAuth = true;
      window.PORTIA_AUTH_TOKEN = null;
      try {
        sessionStorage.removeItem(AUTH_KEY);
      } catch (_) {}
    } else if (token) {
      useCookieAuth = false;
      try {
        sessionStorage.setItem(AUTH_KEY, token);
      } catch (_) {}
      window.PORTIA_AUTH_TOKEN = token;
    }
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_) {}
    window.PORTIA_AUTH_USER = user;
  }

  let initDone = false;
  let unauthorizedHandled = false;

  function clearSession() {
    const tok = getToken();
    if (tok) {
      try {
        fetch("/api/auth/logout", {
          method: "POST",
          headers: { "X-Portia-Token": tok },
          keepalive: true,
        });
      } catch (_) {}
    }
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    try {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (_) {}
    try {
      localStorage.removeItem("portia_audit_user");
    } catch (_) {}
    window.PORTIA_AUTH_TOKEN = null;
    window.PORTIA_AUTH_USER = null;
    if (typeof App !== "undefined" && App) App.user = null;
  }

  function ensureSkydeenBranding() {
    if (document.title && /portia/i.test(document.title)) {
      document.title = document.title.replace(/Portia/gi, "Skydeen");
    }
    const foot = document.querySelector(".login-foot");
    if (foot && /portia/i.test(foot.textContent || "")) {
      foot.innerHTML = foot.innerHTML.replace(/Portia/gi, "Skydeen");
    }
    document.querySelectorAll(".login-brand img, .brand img").forEach((img) => {
      if (img.alt && /portia/i.test(img.alt)) img.alt = "Skydeen";
      const src = img.getAttribute("src") || "";
      if (/logo-portia/i.test(src)) {
        img.src = src.replace(/logo-portia[^?]*/i, "logo-skydeen-login.png?v=skydeen-20260622");
      }
    });
  }

  function showLoginScreen() {
    const app = document.getElementById("app");
    const login = document.getElementById("login");
    if (app) app.classList.remove("on");
    if (login) login.style.display = "flex";
    if (typeof App !== "undefined" && App.resetLoginUi) App.resetLoginUi();
    ensureSkydeenBranding();
  }

  function handleUnauthorized() {
    if (!initDone || unauthorizedHandled) return;
    unauthorizedHandled = true;
    setTimeout(() => {
      unauthorizedHandled = false;
    }, 4000);
    clearSession();
    showLoginScreen();
    if (typeof toast === "function") {
      toast("Session expirée", "Reconnectez-vous pour continuer", "warn");
    }
  }

  function authHeaders(extra) {
    const h = Object.assign({}, extra || {});
    const t = getToken();
    if (t) h["X-Portia-Token"] = t;
    return h;
  }

  function patchFetch() {
    const orig = window.fetch.bind(window);
    const apiFetch = function (url, opts) {
      opts = opts || {};
      const href = typeof url === "string" ? url : url && url.url ? url.url : "";
      const sameOrigin =
        !href ||
        href.startsWith("/") ||
        href.startsWith(window.location.origin);
      const noAuth =
        href.includes("/api/config/public") ||
        href.includes("/api/auth/login") ||
        href.includes("/api/health");
      if (sameOrigin && !noAuth) {
        opts.credentials = opts.credentials || "same-origin";
        opts.headers = authHeaders(opts.headers || {});
      }
      return orig(url, opts).then(async (res) => {
        if (
          res.status === 401 &&
          href.includes("/api/") &&
          !href.includes("/api/auth/login") &&
          !href.includes("/api/config/public")
        ) {
          handleUnauthorized();
        }
        if (res.status === 403 && href.includes("/api/")) {
          try {
            const clone = res.clone();
            const err = await clone.json();
            const code = err && err.detail && err.detail.code;
            if (code === "totp_setup_required") {
              window.PORTIA_TOTP_SETUP_REQUIRED = true;
              if (App.user) App.user.totpSetupRequired = true;
              if (window.PortiaTotp && PortiaTotp.enforceSetup) PortiaTotp.enforceSetup();
              else if (window.PortiaTotp && PortiaTotp.openSetupPanel) PortiaTotp.openSetupPanel();
              if (typeof toast === "function") {
                toast("2FA obligatoire", "Terminez la configuration de l'authentificateur pour continuer", "warn");
              }
            }
          } catch (_) {}
        }
        return res;
      });
    };
    window.fetch = apiFetch;
    window.portiaApi = window.portiaApi || {};
    window.portiaApi.fetch = apiFetch;
  }

  const ROLE_TO_APP = {
    admin: { role: "admin", label: "Pilotage" },
    juliana: { role: "admin", label: "Juliana · Pilotage" },
    auditeur_b: { role: "auditeur", label: "Asse · auditeur" },
    auditeur_t: { role: "auditeur", label: "Laetitia · auditeur" },
    cabinet: { role: "cabinet", label: "Cabinet · lecture seule" },
  };

  const WORKFLOW = {
    brouillon: { lbl: "Brouillon", cls: "neutral" },
    en_revue: { lbl: "En revue", cls: "warn" },
    valide: { lbl: "Validé", cls: "ok" },
  };

  const ROLE_PORTAL_LABELS = {
    admin: { title: "Administrateur", sub: "Pilotage mission · vue 360°" },
    auditeur: { title: "Auditeur", sub: "Collecte terrain · entretiens & preuves" },
    cabinet: { title: "Cabinet ministériel", sub: "MPJIPSC · lecture seule" },
  };

  function serverRoleMatchesPortal(serverRole, portalRole) {
    if (portalRole === "admin") return serverRole === "admin" || serverRole === "juliana";
    if (portalRole === "auditeur") return serverRole === "auditeur_b" || serverRole === "auditeur_t";
    if (portalRole === "cabinet") return serverRole === "cabinet";
    return false;
  }

  function updateLoginBadge() {
    const badge = document.getElementById("lgRoleBadge");
    const portal = (App && App.pendingRole) || "admin";
    const info = ROLE_PORTAL_LABELS[portal] || ROLE_PORTAL_LABELS.admin;
    if (badge) {
      badge.innerHTML = `<b>${info.title}</b><span>${info.sub}</span>`;
    }
    updateTotpFieldForPortal(portal);
  }

  function updateTotpFieldForPortal(portal) {
    const f = document.getElementById("lgTotpField");
    const hint = document.getElementById("lgTotpHint");
    if (!f) return;
    const show = f.dataset.required === "1";
    f.style.display = show ? "" : "none";
    if (hint) hint.style.display = show ? "" : "none";
  }

  function setupLoginFlow() {
    const offlineName = document.getElementById("loginOfflineName");
    const continueBtn = document.getElementById("lgContinue");
    const backBtn = document.getElementById("lgBack");
    const submitBtn = document.getElementById("lgSubmit");
    const credStep = document.getElementById("loginStepCred");

    if (window.PORTIA_REQUIRE_AUTH) {
      if (offlineName) offlineName.style.display = "none";
      if (continueBtn) {
        continueBtn.onclick = function (e) {
          e.preventDefault();
          updateLoginBadge();
          App.showLoginStep("cred");
          document.getElementById("lgEmail")?.focus();
        };
      }
      if (backBtn) {
        backBtn.onclick = function (e) {
          e.preventDefault();
          App.resetLoginUi();
        };
      }
      if (submitBtn) {
        submitBtn.onclick = async function (e) {
          e.preventDefault();
          await App.login();
        };
      }
      if (credStep) {
        ["lgCode", "lgEmail", "lgPass", "lgTotp"].forEach((id) => {
          const inp = document.getElementById(id);
          if (inp) {
            inp.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                App.login();
              }
            });
          }
        });
      }
    } else {
      if (credStep) credStep.style.display = "none";
      if (continueBtn) {
        continueBtn.innerHTML =
          'Accéder au cockpit <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
        continueBtn.onclick = function (e) {
          e.preventDefault();
          App.login();
        };
      }
      if (submitBtn) submitBtn.style.display = "none";
    }
    window.PortiaLoginUi = { updateBadge: updateLoginBadge };
    updateLoginBadge();
    ensureSkydeenBranding();
  }

  function showTotpField() {
    const f = document.getElementById("lgTotpField");
    if (f) {
      f.style.display = "";
      f.dataset.required = "1";
    }
    document.getElementById("lgTotp")?.focus();
  }

  async function apiLogin() {
    const email = document.getElementById("lgEmail")?.value?.trim();
    const password = document.getElementById("lgPass")?.value || "";
    const missionCode = document.getElementById("lgCode")?.value || "";
    const totpCode = document.getElementById("lgTotp")?.value?.trim() || "";
    if (!email || !password) {
      toast("Connexion", "Email et mot de passe requis", "err");
      return false;
    }
    if (!missionCode && window.PORTIA_SERVER_CONFIG && PORTIA_SERVER_CONFIG.missionAccessRequired !== false) {
      const codeEl = document.getElementById("lgCode");
      if (codeEl && !codeEl.value.trim()) {
        toast("Connexion", "Le code mission est requis", "err");
        codeEl.focus();
        return false;
      }
    }
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password, missionCode, totpCode }),
    });
    if (!r.ok) {
      let detail = null;
      try {
        const err = await r.json();
        detail = err && err.detail;
      } catch (_) {}
      const code = detail && typeof detail === "object" ? detail.code : null;
      if (r.status === 401 && code === "totp_required") {
        showTotpField();
        toast("2FA requise", "Saisissez le code de votre authentificateur", "warn");
        return false;
      }
      if (r.status === 401 && code === "totp_invalid") {
        showTotpField();
        toast("Code 2FA incorrect", "Le code a peut-être expiré — utilisez le code affiché maintenant dans votre authentificateur", "err");
        document.getElementById("lgTotp")?.focus();
        return false;
      }
      if (r.status === 429) {
        const msg = typeof detail === "string" ? detail : "Trop de tentatives — patientez quelques minutes";
        toast("Connexion bloquée", msg, "warn");
        return false;
      }
      toast("Connexion refusée", "Vérifiez email, mot de passe, code mission et 2FA", "err");
      return false;
    }
    const data = await r.json();
    const portalRole = App.pendingRole || "admin";
    if (!serverRoleMatchesPortal(data.user.role, portalRole)) {
      clearSession();
      const expected = ROLE_PORTAL_LABELS[portalRole]?.title || portalRole;
      toast(
        "Profil incorrect",
        `Ce compte n'est pas autorisé en mode « ${expected} ». Revenez en arrière et choisissez le bon profil.`,
        "err"
      );
      App.resetLoginUi();
      return false;
    }
    setSession(data.token, data.user, {
      cookieAuth: !!data.sessionCookie,
      sessionCookie: !!data.sessionCookie,
    });
    if (
      !data.sessionCookie &&
      window.PORTIA_SERVER_CONFIG &&
      PORTIA_SERVER_CONFIG.security &&
      PORTIA_SERVER_CONFIG.security.sessionCookieAuth
    ) {
      useCookieAuth = true;
      window.PORTIA_AUTH_TOKEN = null;
    }
    const map = ROLE_TO_APP[data.user.role] || { role: "admin", label: data.user.name };
    App.user = {
      id: data.user.id,
      name: data.user.name,
      role: map.role,
      serverRole: data.user.role,
      readOnly: data.user.readOnly !== undefined ? data.user.readOnly : data.user.role === "cabinet",
      email: data.user.email,
      permissions: data.user.permissions || [],
      canDeposit: userCanDeposit(data.user),
      totpSetupRequired: !!(data.totpSetupRequired || data.user.totpSetupRequired),
    };
    window.PORTIA_TOTP_SETUP_REQUIRED = App.user.totpSetupRequired;
    try {
      localStorage.setItem("portia_audit_user", JSON.stringify(App.user));
    } catch (_) {}
    if (window.PortiaPlanning && PortiaPlanning.loadPlanningFromServer) {
      PortiaPlanning.loadPlanningFromServer();
    }
    return true;
  }

  function userCanDeposit(user) {
    if (!user) return false;
    if (!user.readOnly) return true;
    const p = user.permissions || [];
    return p.includes("depot") || p.includes("write_collecte") || p.includes("*");
  }

  function patchApp() {
    const origLogin = App.login.bind(App);
    App.login = async function () {
      if (window.PORTIA_REQUIRE_AUTH) {
        const ok = await apiLogin();
        if (!ok) return;
        if (App.user && App.user.totpSetupRequired) {
          const login = document.getElementById("login");
          if (login) login.style.display = "none";
          if (window.PortiaTotp && PortiaTotp.openSetupPanel) PortiaTotp.openSetupPanel();
          else if (window.PortiaTotp && PortiaTotp.enforceSetup) PortiaTotp.enforceSetup();
          return;
        }
        if (window.portiaReloadServer) {
          try {
            await window.portiaReloadServer();
          } catch (_) {}
        }
        this.enter();
        return;
      }
      return origLogin();
    };

    const origAllowed = App.allowed.bind(App);
    App.allowed = function (k) {
      if (!this.user) return false;
      if (k === "journal" && this.user.serverRole && !["admin", "juliana"].includes(this.user.serverRole)) {
        return false;
      }
      if (k === "reglages" && this.user.readOnly) return true;
      if (this.user.role === "cabinet" || this.user.serverRole === "cabinet") {
        return ["cockpit", "constats", "eco", "carto_graph", "geo", "risques", "dataroom", "depot", "guide", "tuto_cabinet"].includes(k);
      }
      if (this.user.readOnly) {
        return ["cockpit", "constats", "eco", "carto_graph", "geo", "risques", "dataroom"].includes(k);
      }
      if (this.user.role === "admin" || this.user.serverRole === "admin" || this.user.serverRole === "juliana") {
        const pilotageTerrain = ["depot", "conduct", "agenda", "consaud", "hub_auditeur"];
        if (pilotageTerrain.includes(k)) return true;
        const missionViews = window.MISSION_VIEWS || [
          "rapports", "ref_pnipm", "cadrage", "charte", "cdc", "pilotage", "docs_mission",
          "affectations", "lacunes", "qualdata", "prognonprog", "voletb", "flux",
          "carto_graph", "eco", "geo", "corbeille",
          "guide", "tuto_admin", "cdc_tech", "journal", "planning", "taches", "taches_equipe",
        ];
        if (missionViews.includes(k)) return true;
      }
      if (this.user.serverRole === "auditeur_b" || this.user.serverRole === "auditeur_t") {
        const aud = [
          "hub_auditeur",
          "docs_mission",
          "cadrage",
          "charte",
          "cdc",
          "agenda",
          "conduct",
          "depot",
          "dataroom",
          "consaud",
          "assistant",
          "guide",
          "tuto_auditeur",
          "taches",
        "reglages",
          "lacunes",
          "qualdata",
          "prognonprog",
          "voletb",
          "ecart",
          "cdc_tech",
        ];
        return aud.includes(k);
      }
      return origAllowed(k);
    };

    const origEnter = App.enter.bind(App);
    App.enter = function () {
      origEnter();
      if (this.user && window.PortiaAuditors && PortiaAuditors.refreshUserHeader) {
        PortiaAuditors.refreshUserHeader(this.user);
      }
      if (this.user?.readOnly && !this.user.canDeposit) toast("Mode lecture seule", "Vue Cabinet — modifications désactivées", "ok");
      applyReadOnlyUi();
      if (this.user && (this.user.serverRole === "auditeur_b" || this.user.serverRole === "auditeur_t")) {
        const h = location.hash.replace("#", "");
        if (!h || h === "cockpit") App.go(App.allowed("hub_auditeur") ? "hub_auditeur" : "agenda");
      }
    };

    const origLogout = App.logout.bind(App);
    App.logout = function () {
      clearSession();
      origLogout();
    };
  }

  function applyReadOnlyUi() {
    if (!App.user?.readOnly) return;
    const canDep = userCanDeposit(App.user);
    document.querySelectorAll(".btn.terra, .btn.dark, #dpSave, #cdSave").forEach((b) => {
      if (canDep && b.id === "dpSave") return;
      b.disabled = true;
      b.style.opacity = "0.5";
    });
  }

  function registerViews() {
    VIEWS.voletb = function () {
      const v = el("div", { class: "view" });
      const vb = Store.state.voletB || {};
      let html = pageHead(
        "Analyse transversale",
        "Volet B — Non-programmatique",
        "RH, patrimoine & flotte, GED documentaire, passation des marchés.",
        ""
      );
      Object.keys(vb).forEach((key) => {
        const block = vb[key];
        if (!block?.items) return;
        html += `<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>${esc(block.label || key)}</h3></div><div class="card-b"><table class="tbl"><thead><tr><th>Élément</th><th>Source</th><th>Priorité</th><th>Statut</th></tr></thead><tbody>`;
        html += block.items
          .map(
            (it) =>
              `<tr><td>${esc(it.lib)}</td><td>${esc(it.source)}</td><td><span class="tag">${window.PortiaLabels ? PortiaLabels.fmtEnum(it.priorite) : esc(it.priorite)}</span></td><td>${window.PortiaLabels ? PortiaLabels.enumBadge(it.statut) : `<span class="bdg info">${esc(it.statut)}</span>`}</td></tr>`
          )
          .join("");
        html += `</tbody></table></div></div>`;
      });
      v.innerHTML = html;
      return v;
    };

    VIEWS.flux = function () {
      const v = el("div", { class: "view" });
      const flows = Store.get("dataFlows") || [];
      v.innerHTML =
        pageHead(
          "Cartographie",
          "Flux de données & applications",
          "Visualisation des flux actuels et cibles — cliquer pour filtrer par statut.",
          ""
        ) +
        `<div class="card"><div class="card-b"><div class="flux-grid" id="fluxGrid">${flows
          .map(
            (f) =>
              `<div class="card pad flux-node" data-st="${f.statut}" style="border-left:3px solid ${f.critique ? "var(--crit)" : "var(--info)"}"><div class="between"><b>${esc(f.from)}</b><span class="tag mono">${window.PortiaLabels ? PortiaLabels.fmtEnum(f.type) : esc(f.type)}</span></div><div style="text-align:center;margin:8px 0;color:var(--terra-deep)">${svgI('<path d="M12 5v14M5 12l7 7 7-7"/>')}</div><div><b>${esc(f.to)}</b></div><div class="muted" style="font-size:11px;margin-top:8px">${esc(f.protocol)} · PII: ${f.pii ? "oui" : "non"} · ${window.PortiaLabels ? PortiaLabels.enumBadge(f.statut) : `<span class="bdg ok">${esc(f.statut)}</span>`}</div></div>`
          )
          .join("")}</div></div></div>`;
      return v;
    };

    VIEWS.journal = function () {
      const v = el("div", { class: "view" });
      let allEntries = [];
      v.innerHTML =
        pageHead("Pilotage", "Journal d'audit", "Traçabilité des actions sur la plateforme.", "") +
        `<div class="card"><div class="card-b" id="jrBody">
          <div class="note slate" style="margin-bottom:12px;font-size:12px">Chargement du journal…</div>
          <div class="typing" id="jrLoad"><i></i><i></i><i></i></div>
        </div></div>`;
      const body = v.querySelector("#jrBody");
      const PL = window.PortiaLabels;
      const slow = setTimeout(() => {
        const ld = v.querySelector("#jrLoad");
        if (ld) ld.insertAdjacentHTML("afterend", '<div class="muted" style="font-size:11px;margin-top:8px">Connexion lente — chargement en cours…</div>');
      }, 2500);

      function renderJournal(entries) {
        const condensed = PL ? PL.condenseJournal(entries) : entries;
        const actions = [...new Set(condensed.map((e) => e.action))].sort();
        const users = [...new Set(condensed.map((e) => e.user_name).filter(Boolean))].sort();
        const fAction = v._jrAction || "all";
        const fUser = v._jrUser || "all";
        const hideAuto = v._jrHideAuto !== false;
        const filtered = condensed.filter((e) => {
          if (hideAuto && (e.action === "state_put" || e.action === "state_put_batch")) return false;
          if (fAction !== "all" && e.action !== fAction) return false;
          if (fUser !== "all" && e.user_name !== fUser) return false;
          return true;
        });
        const rows = filtered
          .map((e) => {
            const lbl = PL ? PL.actionLabel(e.action) : e.action;
            const detail = PL && PL.journalDetail ? PL.journalDetail(e) : e.detail_summary || [e.entity_type, e.entity_id].filter(Boolean).join(" ");
            const userCell = PL && PL.journalUserHtml ? PL.journalUserHtml(e) : `${esc(e.user_name || "—")} <span class="muted">(${esc(e.user_role || "")})</span>`;
            return `<tr><td class="mono" style="font-size:11px;white-space:nowrap">${esc((e.created_at || "").slice(0, 19).replace("T", " "))}</td><td>${userCell}</td><td><b>${esc(lbl)}</b></td><td class="muted">${esc(detail)}</td></tr>`;
          })
          .join("");
        body.innerHTML =
          `<div class="fbar" style="margin-bottom:12px;flex-wrap:wrap;gap:8px">
            <select class="fselect" id="jrFAction"><option value="all">Toutes les actions</option>${actions.map((a) => `<option value="${esc(a)}" ${fAction === a ? "selected" : ""}>${esc(PL ? PL.actionLabel(a) : a)}</option>`).join("")}</select>
            <select class="fselect" id="jrFUser"><option value="all">Tous les utilisateurs</option>${users.map((u) => `<option value="${esc(u)}" ${fUser === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>
            <label class="tag" style="cursor:pointer"><input type="checkbox" id="jrHideAuto" ${hideAuto ? "checked" : ""} style="margin-right:6px">Masquer sauvegardes auto</label>
            <span class="muted" style="font-size:11px;margin-left:auto">${filtered.length} / ${condensed.length} événement(s)</span>
          </div>
          <table class="tbl tbl-wrap"><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détail</th></tr></thead><tbody>${rows || "<tr><td colspan=4>Aucune entrée pour ces filtres</td></tr>"}</tbody></table>`;
        v.querySelector("#jrFAction").onchange = (ev) => {
          v._jrAction = ev.target.value;
          renderJournal(allEntries);
        };
        v.querySelector("#jrFUser").onchange = (ev) => {
          v._jrUser = ev.target.value;
          renderJournal(allEntries);
        };
        v.querySelector("#jrHideAuto").onchange = (ev) => {
          v._jrHideAuto = ev.target.checked;
          renderJournal(allEntries);
        };
      }

      fetch("/api/audit/journal")
        .then((r) => r.json())
        .then((data) => {
          clearTimeout(slow);
          allEntries = data.entries || [];
          renderJournal(allEntries);
        })
        .catch(() => {
          clearTimeout(slow);
          body.innerHTML =
            '<div class="note crit">Accès réservé au pilotage (administrateur)</div>';
        });
      return v;
    };

    CRUMB.voletb = "Volet B";
    CRUMB.flux = "Flux de données";
    CRUMB.journal = "Journal d'audit";

    if (NAV.admin) {
      if (!NAV.admin[1].items.some((i) => i.k === "voletb")) {
        NAV.admin[1].items.push({ k: "voletb", lbl: "Volet B", ic: "building" });
      }
      if (!NAV.admin[1].items.some((i) => i.k === "flux")) {
        NAV.admin[1].items.push({ k: "flux", lbl: "Flux données", ic: "flow" });
      }
      if (!NAV.admin[0].items.some((i) => i.k === "journal")) {
        NAV.admin[0].items.push({ k: "journal", lbl: "Journal audit", ic: "scroll" });
      }
      if (NAV.auditeur) {
        const sec =
          NAV.auditeur.find((s) => /analyse/i.test(s.sec || "")) || NAV.auditeur[1];
        const items = sec && sec.items;
        if (items && !items.some((i) => i.k === "voletb")) {
          const voletItem = { k: "voletb", lbl: "Volet B", ic: "building" };
          const aiIdx = items.findIndex((i) => i.k === "assistant");
          if (aiIdx >= 0) items.splice(aiIdx, 0, voletItem);
          else items.push(voletItem);
        }
      }
    }

    if (typeof VIEWS !== "undefined" && VIEWS.ecart && !VIEWS._auditorEcart) {
      const origEcart = VIEWS.ecart;
      VIEWS.ecart = function () {
        const v = origEcart();
        const aud =
          App.user &&
          (App.user.serverRole === "auditeur_b" || App.user.serverRole === "auditeur_t");
        if (aud) {
          setTimeout(() => {
            const note = document.createElement("div");
            note.className = "note slate";
            note.style.marginBottom = "14px";
            note.innerHTML =
              "<b>Lecture seule</b> — consultation de la matrice d'écart CDC. Les verdicts sont consolidés par le pilotage.";
            const anchor = v.querySelector(".kpis") || v.firstChild;
            if (anchor) v.insertBefore(note, anchor);
          }, 0);
        }
        return v;
      };
      VIEWS._auditorEcart = true;
    }
  }

  function patchStoreExport() {
    /* Export ZIP géré par portia-finalize.js (évite double prompt) */
  }

  function patchWorkflowConstats() {
    const origPatch = Store.patch.bind(Store);
    Store.patch = function (coll, id, fields) {
      if (coll === "constats" && fields.workflow && App.user && !App.user.readOnly) {
        fields.workflowBy = App.user.name;
        fields.workflowAt = new Date().toISOString();
      }
      if (coll === "livrables" && fields.workflow) {
        fields.workflowBy = App.user.name;
        fields.workflowAt = new Date().toISOString();
      }
      return origPatch(coll, id, fields);
    };
  }

  async function restoreUserFromServer() {
    window.PORTIA_AUTH_TOKEN = getToken() || null;
    const me = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!me.ok) return false;
    const data = await me.json();
    const map = ROLE_TO_APP[data.user.role] || { role: "admin" };
    App.user = {
      id: data.user.id,
      name: data.user.name,
      role: map.role,
      serverRole: data.user.role,
      readOnly: data.user.readOnly,
      email: data.user.email,
      permissions: data.user.permissions || [],
      canDeposit: userCanDeposit(data.user),
      totpSetupRequired: !!data.user.totpSetupRequired,
    };
    window.PORTIA_TOTP_SETUP_REQUIRED = App.user.totpSetupRequired;
    try {
      localStorage.setItem("portia_audit_user", JSON.stringify(App.user));
    } catch (_) {}
    try {
      const cr = await fetch("/api/config");
      if (cr.ok) window.PORTIA_SERVER_CONFIG = await cr.json();
    } catch (_) {}
    return true;
  }

  async function init() {
    patchFetch();
    let cfg = {};
    try {
      const pub = await fetch("/api/config/public");
      if (pub.ok) cfg = await pub.json();
    } catch (_) {}
    window.PORTIA_SERVER_CONFIG = cfg;
    window.PORTIA_REQUIRE_AUTH = !!cfg.requireAuth;

    setupLoginFlow();
    if (window.PORTIA_REQUIRE_AUTH) {
      patchApp();
      const ok = await restoreUserFromServer();
      if (!ok) clearSession();
    }

    registerViews();
    patchStoreExport();
    patchWorkflowConstats();
    initDone = true;
    if (window.PortiaPlanning && PortiaPlanning.loadPlanningFromServer) {
      PortiaPlanning.loadPlanningFromServer();
    }
  }

  async function boot() {
    await init();
    const orig = window.portiaStart;
    if (!orig) return;
    window.portiaStart = async function () {
      if (window.PORTIA_REQUIRE_AUTH) {
        const ok = await restoreUserFromServer();
        if (!ok) clearSession();
      }
      return orig();
    };
    await window.portiaStart();
  }

  window.PortiaEnterprise = {
    authHeaders,
    getToken,
    WORKFLOW,
    boot,
    clearSession,
    showLoginScreen,
    handleUnauthorized,
    userCanDeposit,
  };
})();

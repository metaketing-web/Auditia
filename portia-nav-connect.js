/**
 * Interconnexion des onglets — barre de liens contextuels, filtres partagés, navigation croisée
 */
(function () {
  "use strict";

  const GRAPH = {
    cockpit: [
      { k: "cadrage", l: "Cadrage" },
      { k: "charte", l: "Charte COPIL" },
      { k: "entretiens", l: "Entretiens" },
      { k: "dataroom", l: "Data Room" },
      { k: "constats", l: "Constats" },
      { k: "ecart", l: "Matrice CDC" },
      { k: "cabinet", l: "Vue Cabinet" },
      { k: "pilotage", l: "Explorateur" },
      { k: "rapports", l: "Rapports IA" },
    ],
    hub_auditeur: [
      { k: "agenda", l: "Agenda" },
      { k: "conduct", l: "Conduire" },
      { k: "depot", l: "Dépôt" },
      { k: "consaud", l: "Constats" },
      { k: "lacunes", l: "Lacunes" },
      { k: "charte", l: "Charte" },
      { k: "assistant", l: "Assistant IA" },
    ],
    cadrage: [
      { k: "docs_mission", l: "Consulter documents" },
      { k: "charte", l: "Charte" },
      { k: "cdc", l: "CDC" },
      { k: "agenda", l: "Agenda S1–S4" },
      { k: "gouv", l: "COPIL" },
      { k: "ref_pnipm", l: "Réf. AO" },
      { k: "cockpit", l: "Cockpit" },
    ],
    charte: [
      { k: "gouv", l: "Gouvernance" },
      { k: "cadrage", l: "Cadrage" },
      { k: "cabinet", l: "Vue Cabinet" },
      { k: "docs_mission", l: "Documents" },
    ],
    cdc: [
      { k: "ecart", l: "Matrice détaillée" },
      { k: "ref_pnipm", l: "Maquettes AO" },
      { k: "rapports", l: "Rapports" },
      { k: "lacunes", l: "Lacunes" },
      { k: "cockpit", l: "Cockpit" },
    ],
    docs_mission: [
      { k: "cadrage", l: "Vue cadrage" },
      { k: "charte", l: "Vue charte" },
      { k: "cdc", l: "Alignement CDC" },
    ],
    affectations: [
      { k: "entretiens", l: "Entretiens" },
      { k: "agenda", l: "Agenda" },
      { k: "hub_auditeur", l: "Hub auditeurs" },
    ],
    entretiens: [
      { k: "conduct", l: "Conduire" },
      { k: "dataroom", l: "Data Room" },
      { k: "depot", l: "Dépôt" },
      { k: "constats", l: "Constats" },
      { k: "eco", l: "Écosystème" },
      { k: "geo", l: "Géographie" },
      { k: "affectations", l: "Affectations" },
      { k: "agenda", l: "Agenda" },
    ],
    agenda: [
      { k: "conduct", l: "Conduire" },
      { k: "entretiens", l: "Liste entretiens" },
      { k: "geo", l: "Carte terrain" },
      { k: "lacunes", l: "Lacunes" },
    ],
    conduct: [
      { k: "agenda", l: "Agenda" },
      { k: "depot", l: "Dépôt pièces" },
      { k: "dataroom", l: "Data Room" },
      { k: "consaud", l: "Constats" },
      { k: "lacunes", l: "Lacunes" },
      { k: "assistant", l: "Assistant IA" },
    ],
    depot: [
      { k: "dataroom", l: "Data Room" },
      { k: "conduct", l: "Entretien en cours" },
      { k: "lacunes", l: "Lacunes collecte" },
    ],
    dataroom: [
      { k: "depot", l: "Mode dépôt" },
      { k: "entretiens", l: "Entretiens" },
      { k: "qualdata", l: "Qualité données" },
      { k: "cockpit", l: "Cockpit" },
    ],
    constats: [
      { k: "ecart", l: "Matrice CDC" },
      { k: "entretiens", l: "Entretiens" },
      { k: "risques", l: "Risques" },
      { k: "rapports", l: "Rapports IA" },
      { k: "consaud", l: "Vue auditeur" },
    ],
    consaud: [
      { k: "conduct", l: "Conduire" },
      { k: "constats", l: "Vue admin" },
      { k: "ecart", l: "Matrice CDC" },
      { k: "depot", l: "Dépôt" },
    ],
    ecart: [
      { k: "entretiens", l: "Entretiens" },
      { k: "dataroom", l: "Data Room" },
      { k: "cdc_tech", l: "Checklist technique" },
      { k: "cdc", l: "Synthèse CDC" },
      { k: "constats", l: "Constats" },
      { k: "rapports", l: "Rapports L7" },
      { k: "prognonprog", l: "Prog./Non-prog." },
      { k: "lacunes", l: "Lacunes" },
    ],
    eco: [
      { k: "carto_graph", l: "Carto interactive" },
      { k: "flux", l: "Flux données" },
      { k: "geo", l: "Géographie" },
      { k: "entretiens", l: "Entretiens" },
      { k: "pilotage", l: "Explorateur" },
      { k: "cdc", l: "CDC" },
    ],
    geo: [
      { k: "agenda", l: "Agenda S4" },
      { k: "conduct", l: "Terrain" },
      { k: "entretiens", l: "Entretiens" },
      { k: "eco", l: "Écosystème" },
    ],
    flux: [
      { k: "eco", l: "Écosystème" },
      { k: "voletb", l: "Volet B" },
      { k: "qualdata", l: "Qualité données" },
      { k: "ecart", l: "Matrice CDC" },
    ],
    voletb: [
      { k: "lacunes", l: "Lacunes" },
      { k: "flux", l: "Flux" },
      { k: "conduct", l: "Entretiens S3" },
      { k: "ecart", l: "Matrice CDC" },
    ],
    lacunes: [
      { k: "qualdata", l: "Grille qualité" },
      { k: "prognonprog", l: "Prog./Non-prog." },
      { k: "voletb", l: "Volet B" },
      { k: "conduct", l: "Conduire" },
      { k: "ecart", l: "Matrice CDC" },
    ],
    qualdata: [
      { k: "lacunes", l: "Lacunes" },
      { k: "dataroom", l: "Data Room" },
      { k: "prognonprog", l: "Prog./Non-prog." },
      { k: "ecart", l: "Matrice CDC" },
    ],
    prognonprog: [
      { k: "lacunes", l: "Lacunes" },
      { k: "qualdata", l: "Qualité données" },
      { k: "ecart", l: "Matrice CDC" },
      { k: "cabinet", l: "Vue Cabinet" },
    ],
    risques: [
      { k: "constats", l: "Constats" },
      { k: "gouv", l: "COPIL" },
      { k: "cockpit", l: "Cockpit" },
      { k: "cabinet", l: "Vue Cabinet" },
    ],
    livrables: [
      { k: "rapports", l: "Génération IA" },
      { k: "gouv", l: "COPIL" },
      { k: "cabinet", l: "Restitution" },
      { k: "charte", l: "Charte" },
    ],
    rapports: [
      { k: "livrables", l: "Suivi livrables" },
      { k: "cockpit", l: "Cockpit" },
      { k: "cabinet", l: "Vue Cabinet" },
      { k: "cdc", l: "CDC" },
      { k: "constats", l: "Constats" },
      { k: "docs_mission", l: "Documents" },
    ],
    gouv: [
      { k: "charte", l: "Charte" },
      { k: "cabinet", l: "Vue Cabinet" },
      { k: "livrables", l: "Livrables" },
      { k: "rapports", l: "Rapports" },
    ],
    cabinet: [
      { k: "cockpit", l: "Cockpit" },
      { k: "constats", l: "Constats" },
      { k: "eco", l: "Écosystème" },
      { k: "carto_graph", l: "Carto interactive" },
      { k: "geo", l: "Géographie" },
      { k: "risques", l: "Risques" },
      { k: "dataroom", l: "Data Room" },
    ],
    pilotage: [
      { k: "entretiens", l: "Entretiens" },
      { k: "constats", l: "Constats" },
      { k: "dataroom", l: "Data Room" },
      { k: "affectations", l: "Affectations" },
    ],
    ref_pnipm: [
      { k: "cdc", l: "Alignement CDC" },
      { k: "cockpit", l: "Cockpit" },
      { k: "cadrage", l: "Cadrage" },
    ],
    assistant: [
      { k: "cockpit", l: "Cockpit" },
      { k: "rapports", l: "Rapports IA" },
      { k: "constats", l: "Constats" },
    ],
    journal: [
      { k: "cockpit", l: "Cockpit" },
      { k: "reglages", l: "Réglages" },
    ],
    reglages: [
      { k: "cockpit", l: "Cockpit" },
      { k: "assistant", l: "Assistant IA" },
    ],
  };

  function allowed(k) {
    return App.user && App.allowed && App.allowed(k);
  }

  function injectNavBar(route) {
    const view = document.querySelector("#main .view");
    if (!view) return;
    let bar = view.querySelector(".nav-connect");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "nav-connect";
      view.insertBefore(bar, view.firstChild);
    }
    const links = (GRAPH[route] || []).filter((x) => x.k !== route && allowed(x.k));
    const ctx = App.navCtx || {};
    const chips = [];
    if (ctx.struct) chips.push({ k: "entretiens", l: "↳ " + ctx.struct, c: { struct: ctx.struct } });
    if (ctx.axe) chips.push({ k: "constats", l: "↳ axe " + ctx.axe, c: { axe: ctx.axe } });
    if (ctx.gapRef) chips.push({ k: "ecart", l: "↳ " + ctx.gapRef, c: { gapRef: ctx.gapRef } });
    if (ctx.rep) chips.push({ k: "dataroom", l: "↳ rép. " + ctx.rep, c: { rep: ctx.rep } });
    if (ctx.sem) chips.push({ k: "agenda", l: "↳ S" + ctx.sem, c: { sem: ctx.sem } });

    const back = ctx.from && ctx.from !== route && allowed(ctx.from);
    bar.innerHTML =
      '<span class="nav-connect-lbl">Navigation</span>' +
      (back ? `<button type="button" class="tag nav-back" data-go="${esc(ctx.from)}">← Retour</button>` : "") +
      links.map((x) => `<button type="button" class="tag nav-link" data-go="${esc(x.k)}">${esc(x.l)}</button>`).join("") +
      chips
        .map(
          (x) =>
            `<button type="button" class="tag nav-ctx" data-go="${esc(x.k)}" data-ctx="1">${esc(x.l)}</button>`
        )
        .join("");

    bar.querySelectorAll("[data-go]").forEach((btn) => {
      btn.onclick = () => {
        const dest = btn.dataset.go;
        const keep = btn.dataset.ctx ? { struct: ctx.struct, axe: ctx.axe, gapRef: ctx.gapRef, rep: ctx.rep, sem: ctx.sem } : {};
        App.go(dest, keep);
      };
    });
  }

  function applyNavCtx(route) {
    const ctx = App.navCtx || {};
    setTimeout(() => {
      if (route === "entretiens" || route === "pilotage") {
        if (ctx.struct) {
          const q = document.getElementById(route === "entretiens" ? "enQ" : "plQ");
          if (q) {
            q.value = ctx.struct;
            q.dispatchEvent(new Event("input"));
          }
          const ps = document.getElementById("plStruct");
          if (ps && route === "pilotage") {
            [...ps.options].forEach((o) => {
              if (o.value === ctx.struct || o.textContent === ctx.struct) ps.value = o.value;
            });
            ps.dispatchEvent(new Event("change"));
          }
        }
        if (ctx.axe) {
          const ax = document.getElementById(route === "entretiens" ? "enAxe" : "plAxe");
          if (ax) {
            ax.value = ctx.axe;
            ax.dispatchEvent(new Event("change"));
          }
        }
        if (ctx.sem) {
          const sm = document.getElementById("enSem");
          if (sm) {
            sm.value = String(ctx.sem);
            sm.dispatchEvent(new Event("change"));
          }
        }
      }
      if (route === "constats" || route === "consaud") {
        if (ctx.axe) {
          const ax = document.getElementById("csAxe");
          if (ax) {
            ax.value = ctx.axe;
            ax.dispatchEvent(new Event("change"));
          }
        }
        if (ctx.struct) {
          const q = document.getElementById("csQ");
          if (q) {
            q.value = ctx.struct;
            q.dispatchEvent(new Event("input"));
          }
        }
      }
      if (route === "dataroom" && ctx.rep) {
        const dr = document.getElementById("drRep");
        if (dr) {
          dr.value = ctx.rep;
          dr.dispatchEvent(new Event("change"));
        }
      }
      if (route === "ecart" && ctx.gapRef) {
        highlightGap(ctx.gapRef);
      }
      if (ctx.entretienId && route === "conduct") {
        App.conductId = ctx.entretienId;
      }
    }, 80);
  }

  function highlightGap(ref) {
    const rows = document.querySelectorAll("#ecBody tr");
    rows.forEach((tr) => {
      const mono = tr.querySelector(".mono");
      if (mono && mono.textContent.trim() === ref) {
        tr.style.background = "var(--terra-soft)";
        tr.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }

  function wrapAppGo() {
    if (App._navConnectGo) return;
    const orig = App.go.bind(App);
    App.go = function (route, ctx) {
      const prev = App.route;
      App.navCtx = Object.assign({}, App.navCtx || {}, ctx || {}, { from: prev });
      orig(route);
      injectNavBar(route);
      applyNavCtx(route);
    };
    const origRefresh = App.refresh.bind(App);
    App.refresh = function () {
      origRefresh();
      injectNavBar(App.route);
    };
    App._navConnectGo = true;
  }

  function modalNav(extraHtml) {
    const foot = document.querySelector("#ovBox .modal-f");
    if (!foot || foot.querySelector(".modal-nav")) return;
    const div = document.createElement("div");
    div.className = "modal-nav chiprow";
    div.style.cssText = "margin-right:auto;flex-wrap:wrap;gap:6px";
    div.innerHTML = extraHtml;
    foot.insertBefore(div, foot.firstChild);
    div.querySelectorAll("[data-mgo]").forEach((b) => {
      b.onclick = () => {
        Modal.close();
        App.go(b.dataset.mgo, JSON.parse(b.dataset.mctx || "{}"));
      };
    });
  }

  function patchModals() {
    if (window._navModalPatch) return;
    window._navModalPatch = true;

    const oE = window.openEntretien;
    window.openEntretien = function (id, editable) {
      oE(id, editable);
      const e = Store.find("entretiens", id);
      if (!e) return;
      setTimeout(
        () =>
          modalNav(
            `<button type="button" class="tag sm" data-mgo="conduct" data-mctx='${JSON.stringify({ entretienId: id })}'>Conduire</button>` +
              `<button type="button" class="tag sm" data-mgo="depot">Dépôt</button>` +
              `<button type="button" class="tag sm" data-mgo="dataroom">Data Room</button>` +
              `<button type="button" class="tag sm" data-mgo="constats" data-mctx='${JSON.stringify({ struct: e.struct })}'>Constats · ${esc(e.struct)}</button>` +
              `<button type="button" class="tag sm" data-mgo="eco">Écosystème</button>`
          ),
        60
      );
    };

    const oC = window.openConstat;
    window.openConstat = function (id) {
      oC(id);
      const c = Store.find("constats", id);
      if (!c) return;
      setTimeout(
        () =>
          modalNav(
            `<button type="button" class="tag sm" data-mgo="ecart">Matrice CDC</button>` +
              `<button type="button" class="tag sm" data-mgo="entretiens" data-mctx='${JSON.stringify({ struct: c.struct })}'>Entretiens · ${esc(c.struct)}</button>` +
              `<button type="button" class="tag sm" data-mgo="risques">Risques</button>` +
              `<button type="button" class="tag sm" data-mgo="rapports">Rapport IA</button>`
          ),
        60
      );
    };

    const oR = window.openRisque;
    if (oR) {
      window.openRisque = function (id) {
        oR(id);
        setTimeout(
          () =>
            modalNav(
              `<button type="button" class="tag sm" data-mgo="gouv">COPIL</button>` +
                `<button type="button" class="tag sm" data-mgo="constats">Constats</button>` +
                `<button type="button" class="tag sm" data-mgo="cockpit">Cockpit</button>`
            ),
          60
        );
      };
    }
  }

  function openGap(g) {
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${svgI(ICON.ecart)}</div><div><div class="eyebrow">${esc(g.ref)} · ${esc(g.theme || "")}</div><h2 style="font-size:15px">${esc(g.exig)}</h2></div><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:12px"><span class="bdg ${(window.VERDICTS && VERDICTS[g.verdict] && VERDICTS[g.verdict].cls) || "neutral"}">${esc((VERDICTS[g.verdict] || {}).lbl || g.verdict)}</span><span class="tag mono">${esc(g.cdc)}</span></div>
        <p style="font-size:13px;line-height:1.55;margin-bottom:12px"><b>Réalité :</b> ${esc(g.realite)}</p>
      </div>
      <div class="modal-f">
        <div class="modal-nav chiprow" style="margin-right:auto">
          <button type="button" class="tag sm" onclick="Modal.close();App.go('ecart',{gapRef:'${esc(g.ref)}'})">Voir dans matrice</button>
          <button type="button" class="tag sm" onclick="Modal.close();App.go('constats')">Constats</button>
          <button type="button" class="tag sm" onclick="Modal.close();App.go('rapports')">Rapport IA</button>
          <button type="button" class="tag sm" onclick="Modal.close();App.go('cdc')">Synthèse CDC</button>
        </div>
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`
    );
  }
  window.openGap = openGap;

  function patchEcart() {
    const orig = VIEWS.ecart;
    if (!orig || VIEWS._ecartNav) return;
    VIEWS.ecart = function () {
      const v = orig();
      setTimeout(() => {
        const body = v.querySelector("#ecBody");
        if (!body) return;
        body.querySelectorAll("tr").forEach((tr) => {
          tr.style.cursor = "pointer";
          tr.onclick = () => {
            const ref = tr.querySelector(".mono")?.textContent?.trim();
            const g = Store.get("gaps").find((x) => x.ref === ref);
            if (g) openGap(g);
          };
        });
      }, 50);
      return v;
    };
    VIEWS._ecartNav = true;
  }

  function patchCockpitAlerts() {
    const orig = VIEWS.cockpit;
    if (!orig || VIEWS._cockpitNav) return;
    VIEWS.cockpit = function () {
      const v = orig();
      setTimeout(() => {
        v.querySelectorAll(".alert-i.clk").forEach((el) => {
          const tm = el.querySelector(".tm")?.textContent?.trim() || "";
          const title = el.querySelector(".bd b")?.textContent || "";
          if (tm === "Constat") {
            const c = Store.get("constats").find((x) => title.startsWith(x.ref));
            if (c) {
              el.onclick = (e) => {
                e.stopPropagation();
                openConstat(c.id);
              };
            }
          } else if (tm.startsWith("R") && tm.length <= 3) {
            const d = Store.get("docs").find((x) => title.includes(x.desc) || title.includes(x.source));
            if (d) {
              el.onclick = () => App.go("dataroom", { rep: d.rep });
            }
          } else if (tm === "S1" || tm === "S2" || tm === "S3" || tm === "S4" || tm.startsWith("S")) {
            const e = Store.get("entretiens").find((x) => title.includes(x.n.slice(0, 20)) || title === x.n);
            if (e) {
              el.onclick = () => openEntretien(e.id, true);
            }
          } else if (tm && Store.get("risques").some((r) => title.startsWith(r.ref))) {
            const r = Store.get("risques").find((x) => title.startsWith(x.ref));
            if (r) el.onclick = () => openRisque(r.id);
          }
        });
        v.querySelectorAll(".alert-i.clk[onclick=\"App.go('entretiens')\"]").forEach((el) => {
          const title = el.querySelector(".bd b")?.textContent || "";
          const e = Store.get("entretiens").find((x) => title === x.n || title.startsWith(x.n.slice(0, 25)));
          if (e) {
            el.removeAttribute("onclick");
            el.onclick = () => openEntretien(e.id, true);
          }
        });
      }, 80);
      return v;
    };
    VIEWS._cockpitNav = true;
  }

  function patchEntretiensActions() {
    const orig = VIEWS.entretiens;
    if (!orig || VIEWS._entNav) return;
    VIEWS.entretiens = function () {
      const v = orig();
      setTimeout(() => {
        const body = v.querySelector("#enBody");
        if (!body) return;
        body.querySelectorAll("tr").forEach((tr) => {
          const on = tr.getAttribute("onclick") || "";
          const m = on.match(/openEntretien\('([^']+)'/);
          if (!m) return;
          const id = m[1];
          const td = document.createElement("td");
          td.style.textAlign = "right";
          td.innerHTML = `<button type="button" class="btn ghost sm" data-cid="${esc(id)}">Conduire</button>`;
          td.querySelector("button").onclick = (ev) => {
            ev.stopPropagation();
            App.conductId = id;
            App.go("conduct");
          };
          tr.appendChild(td);
        });
      }, 60);
      return v;
    };
    VIEWS._entNav = true;
  }

  function patchCabinetNav() {
    const orig = VIEWS.cabinet;
    if (!orig || VIEWS._cabNav) return;
    VIEWS.cabinet = function () {
      const v = orig();
      const ph = v.querySelector(".ph .actions");
      if (ph && !v.querySelector("#cabNavExtra")) {
        const d = document.createElement("div");
        d.id = "cabNavExtra";
        d.className = "chiprow";
        d.style.marginTop = "8px";
        d.innerHTML =
          ["cockpit", "ecart", "eco", "geo", "livrables", "charte", "dataroom"]
            .filter(allowed)
            .map((k) => `<button type="button" class="tag" onclick="App.go('${k}')">${esc(CRUMB[k] || k)}</button>`)
            .join("");
        ph.appendChild(d);
      }
      return v;
    };
    VIEWS._cabNav = true;
  }

  function patchLivrables() {
    const orig = VIEWS.livrables;
    if (!orig || VIEWS._livNav) return;
    VIEWS.livrables = function () {
      const v = orig();
      const actions = v.querySelector(".ph .actions");
      if (actions && !document.getElementById("livToRapports")) {
        const b = document.createElement("button");
        b.id = "livToRapports";
        b.className = "btn ghost";
        b.textContent = "Générer via Rapports IA";
        b.onclick = () => App.go("rapports");
        actions.prepend(b);
      }
      return v;
    };
    VIEWS._livNav = true;
  }

  function patchCartoModals() {
    const oEco = window.ecoNodeModal;
    if (oEco && !window._ecoModalNav) {
      window.ecoNodeModal = function (node) {
        oEco(node);
        setTimeout(
          () =>
            modalNav(
              `<button type="button" class="tag sm" data-mgo="flux">Flux</button>` +
                `<button type="button" class="tag sm" data-mgo="entretiens" data-mctx='${JSON.stringify({ struct: (window.NODE_STRUCT && NODE_STRUCT[node.id]) || "" })}'>Entretiens</button>`
            ),
          80
        );
      };
      window._ecoModalNav = true;
    }
    const oGeo = window.geoCityModal;
    if (oGeo && !window._geoModalNav) {
      window.geoCityModal = function (city) {
        oGeo(city);
        setTimeout(
          () =>
            modalNav(
              `<button type="button" class="tag sm" data-mgo="agenda" data-mctx='${JSON.stringify({ sem: "4" })}'>Agenda S4</button>` +
                `<button type="button" class="tag sm" data-mgo="conduct">Terrain</button>`
            ),
          80
        );
      };
      window._geoModalNav = true;
    }
  }

  function injectStyles() {
    if (document.getElementById("nav-connect-css")) return;
    const s = document.createElement("style");
    s.id = "nav-connect-css";
    s.textContent = `
      .nav-connect{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:18px;padding:12px 14px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm)}
      .nav-connect-lbl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);margin-right:4px}
      .nav-connect .tag.nav-link,.nav-connect .tag.nav-back,.nav-connect .tag.nav-ctx{cursor:pointer;border:1px solid var(--line-2);background:var(--surface-2)}
      .nav-connect .tag.nav-link:hover,.nav-connect .tag.nav-back:hover{border-color:var(--terra);background:var(--terra-soft)}
      .nav-connect .tag.nav-ctx{border-color:var(--terra);color:var(--terra-deep)}
      .modal-nav .tag{font-size:11px}
    `;
    document.head.appendChild(s);
  }

  function patchCabinetRoleNav() {
    /* Navigation cabinet figée dans index.html — pas d'entrées supplémentaires */
  }

  function init() {
    injectStyles();
    wrapAppGo();
    patchModals();
    patchEcart();
    patchCockpitAlerts();
    patchEntretiensActions();
    patchCabinetNav();
    patchLivrables();
    patchCabinetRoleNav();
    setTimeout(patchCartoModals, 300);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  window.PortiaNav = { go: (k, ctx) => App.go(k, ctx), GRAPH, init };
})();

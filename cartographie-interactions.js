/**
 * Cartographie écosystème — interactions services / tutelles / projets croisés
 */
(function () {
  "use strict";

  const LINK_TYPES = {
    tutelle: { lbl: "Tutelle / pilotage", color: "#6b4fa8", dash: "6 4" },
    data: { lbl: "Flux de données", color: "#2a6ebb", dash: "" },
    reporting: { lbl: "Reporting", color: "#c47a20", dash: "4 3" },
    projet: { lbl: "Gestion croisée projets", color: "#bf5b3e", dash: "" },
    finance: { lbl: "Finances / SIGFIP", color: "#4f7a54", dash: "2 2" },
    integration: { lbl: "Intégration SI", color: "#3d8b8f", dash: "" },
  };

  const ECO_LINKS = [
    { id: "lk1", from: "ct", to: "dajip", type: "tutelle", label: "Sponsor PNIPM · arbitrage programmatique" },
    { id: "lk2", from: "dc", to: "dsi", type: "tutelle", label: "Pilotage DSI & sécurité" },
    { id: "lk3", from: "daf", to: "sigfip", type: "finance", label: "Exécution budgétaire SIGFIP" },
    { id: "lk4", from: "dpsd", to: "cabinet", type: "reporting", label: "Consolidation indicateurs (Excel)" },
    { id: "lk5", from: "dajip", to: "aej", type: "tutelle", label: "Tutelle AEJ" },
    { id: "lk6", from: "dajip", to: "oscn", type: "tutelle", label: "Tutelle OSCN" },
    { id: "lk7", from: "dajip", to: "bcp", type: "tutelle", label: "Coordination BCP-Emploi" },
    { id: "lk8", from: "aej", to: "usep", type: "data", label: "Bases bénéficiaires non partagées" },
    { id: "lk9", from: "aej", to: "pejedec", type: "data", label: "Risque doublons inter-programmes" },
    { id: "lk10", from: "oscn", to: "pnbv", type: "data", label: "Parcours civisme / volontariat" },
    { id: "lk11", from: "usep", to: "pace", type: "projet", label: "Même bailleur BAD · publics jeunes" },
    { id: "lk12", from: "usep", to: "pejedec", type: "projet", label: "Chevauchement cibles emploi jeunes" },
    { id: "lk13", from: "carte", to: "aej", type: "projet", label: "Carte Jeunes ↔ dispositifs AEJ" },
    { id: "lk14", from: "psie", to: "dsi", type: "integration", label: "Innovation · dépendance DSI" },
    { id: "lk15", from: "dsi", to: "uxp", type: "integration", label: "Raccordement X-Road (absent)" },
    { id: "lk16", from: "dsi", to: "nni", type: "integration", label: "Identité NNI (non branchée)" },
    { id: "lk17", from: "dpsd", to: "nni", type: "data", label: "Référentiel / échantillons" },
    { id: "lk18", from: "bad", to: "usep", type: "reporting", label: "Reporting template BAD" },
    { id: "lk19", from: "bad", to: "pace", type: "reporting", label: "Reporting template BAD" },
    { id: "lk20", from: "bm", to: "pejedec", type: "reporting", label: "Supervision PEJEDEC" },
    { id: "lk21", from: "afd", to: "c2d", type: "reporting", label: "Financement C2D-EMPLOI" },
    { id: "lk22", from: "boad", to: "ugp", type: "reporting", label: "Centres Service Civique" },
    { id: "lk23", from: "drh", to: "dsi", type: "data", label: "Habilitations RH ↔ comptes SI" },
    { id: "lk24", from: "patri", to: "daf", type: "finance", label: "Flotte · ligne budgétaire" },
    { id: "lk25", from: "marche", to: "dsi", type: "tutelle", label: "Marchés SI PNIPM" },
    { id: "lk26", from: "ig", to: "dajip", type: "tutelle", label: "Contrôle primes / traçabilité" },
    { id: "lk27", from: "bcp", to: "aej", type: "projet", label: "Coordination dispositifs emploi" },
    { id: "lk28", from: "bcp", to: "oscn", type: "projet", label: "Coordination civisme" },
    { id: "lk29", from: "dcec", to: "oscn", type: "projet", label: "Engagement citoyen" },
    { id: "lk30", from: "dpj", to: "dise", type: "data", label: "Protection jeunesse · ISE" },
  ];

  const PROJECT_CROSS = [
    {
      id: "px1",
      titre: "Doublons bénéficiaires inter-programmes",
      niveau: "critique",
      programmes: ["usep", "pace", "pejedec", "aej", "carte"],
      tutelles: ["aej", "dajip"],
      dataShared: ["identité", "statut insertion"],
      constat: "C-02 / C-03",
      desc: "Absence d'identifiant unique (NNI) — un jeune peut être compté dans plusieurs dispositifs.",
      action: "Règles de déduplication + référentiel partagé PNIPM",
    },
    {
      id: "px2",
      titre: "Reporting bailleur BAD (USEP + PACE)",
      niveau: "eleve",
      programmes: ["usep", "pace"],
      tutelles: ["usep", "dajip"],
      bailleurs: ["BAD"],
      dataShared: ["indicateurs", "budget"],
      desc: "Deux coordinateurs, mêmes exigences BAD, formats distincts.",
      action: "Harmoniser templates · remontée consolidée Cabinet",
    },
    {
      id: "px3",
      titre: "Chaîne AEJ → Cabinet",
      niveau: "eleve",
      programmes: ["aej", "carte", "pnbv"],
      tutelles: ["aej", "bcp"],
      dataShared: ["bénéficiaires", "primes"],
      desc: "Données AEJ remontent par Excel, ressaisies au central.",
      action: "API ou batch sécurisé vers DPSD",
    },
    {
      id: "px4",
      titre: "OSCN & civisme transversal",
      niveau: "moyen",
      programmes: ["oscn", "pnbv", "dcec"],
      tutelles: ["oscn"],
      dataShared: ["missions", "volontaires"],
      desc: "Liens faibles entre OSCN, PNBV et direction civisme.",
      action: "Cartographie processus civisme unifiée",
    },
    {
      id: "px5",
      titre: "Innovation PSIE vs socle DSI",
      niveau: "moyen",
      programmes: ["psie"],
      tutelles: ["dsi"],
      dataShared: ["API", "hébergement"],
      desc: "Projet innovation dépendant du socle non unifié.",
      action: "Prérequis architecture cible avant PSIE scale",
    },
    {
      id: "px6",
      titre: "PEJEDEC / BM & données sensibles",
      niveau: "eleve",
      programmes: ["pejedec"],
      tutelles: ["dajip"],
      bailleurs: ["BM"],
      dataShared: ["bénéficiaires", "paiements"],
      desc: "Conventions BM + accès données à cadrer juridiquement.",
      action: "Cadre juridique NNI + anonymisation exports",
    },
    {
      id: "px7",
      titre: "C2D-EMPLOI (AFD) & SIGFIP",
      niveau: "moyen",
      programmes: ["c2d"],
      tutelles: ["daf"],
      bailleurs: ["AFD"],
      dataShared: ["budget", "engagements"],
      desc: "Lien financement AFD ↔ exécution SIGFIP non tracé bout en bout.",
      action: "Raccordement SIGFIP priorisé G-08",
    },
    {
      id: "px8",
      titre: "UGP-CSC (BOAD) & territoire",
      niveau: "moyen",
      programmes: ["ugp"],
      tutelles: ["oscn"],
      bailleurs: ["BOAD"],
      dataShared: ["centres", "indicateurs régionaux"],
      desc: "Données régionales hétérogènes pour centres SC.",
      action: "Référentiel territorial + mode offline S4",
    },
  ];

  if (typeof window !== "undefined") {
    window.ECO_LINKS = ECO_LINKS;
    window.PROJECT_CROSS = PROJECT_CROSS;
    window.ECO_LINK_TYPES = LINK_TYPES;
  }

  function ecoColumns() {
    return window.ECO_COLUMNS || [];
  }

  function allEcoNodes() {
    const cols = ecoColumns();
    if (!cols.length) return [];
    return cols.flatMap((c) => c.nodes.map((n) => ({ ...n, colKey: c.key, colTitle: c.title })));
  }

  function nodeById(id) {
    return allEcoNodes().find((n) => n.id === id);
  }

  function layoutNodes() {
    const cols = [
      { key: "cabinet", x: 90 },
      { key: "directions", x: 250 },
      { key: "tutelles", x: 410 },
      { key: "programmes", x: 570 },
      { key: "externe", x: 730 },
    ];
    const pos = {};
    cols.forEach((col) => {
      const nodes = allEcoNodes().filter((n) => n.colKey === col.key);
      const step = nodes.length > 1 ? 380 / (nodes.length - 1) : 0;
      nodes.forEach((n, i) => {
        pos[n.id] = { x: col.x, y: 50 + i * step, node: n };
      });
    });
    return pos;
  }

  function renderGraph(svg, filterType, highlightId) {
    const pos = layoutNodes();
    const w = 820,
      h = 430;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    let html = "";
    const links = getLinkData().filter((l) => !filterType || l.type === filterType);
    links.forEach((lk) => {
      const a = pos[lk.from],
        b = pos[lk.to];
      if (!a || !b) return;
      const t = LINK_TYPES[lk.type] || LINK_TYPES.data;
      const midX = (a.x + b.x) / 2;
      const hi = highlightId && (highlightId === lk.id || highlightId === lk.from || highlightId === lk.to);
      html += `<path class="eco-link${hi ? " on" : ""}" data-lid="${lk.id}" d="M${a.x + 8} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x - 8} ${b.y}" fill="none" stroke="${t.color}" stroke-width="${hi ? 2.5 : 1.5}" stroke-dasharray="${t.dash}" opacity="${hi ? 1 : 0.55}"/>`;
    });
    Object.values(pos).forEach((p) => {
      const n = p.node;
      const axe = window.AXES && AXES[n.axe] ? AXES[n.axe].c : "#666";
      const hi = highlightId === n.id;
      html += `<g class="eco-node${hi ? " on" : ""}" data-nid="${n.id}" transform="translate(${p.x},${p.y})" style="cursor:pointer">
        <circle r="${hi ? 11 : 9}" fill="${axe}" stroke="#fff" stroke-width="2"/>
        <text y="28" text-anchor="middle" font-size="10" fill="var(--ink)" font-weight="600">${escShort(n.n)}</text>
      </g>`;
    });
    svg.innerHTML = html;
  }

  function escShort(s) {
    return String(s).length > 22 ? String(s).slice(0, 20) + "…" : s;
  }

  function linkModal(lk) {
    const from = nodeById(lk.from),
      to = nodeById(lk.to);
    const t = LINK_TYPES[lk.type];
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.eco)}</div><div><div class="eyebrow">${esc(t.lbl)}</div><h2 style="font-size:15px">Interaction</h2></div><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:12px"><span class="tag">${esc(from ? from.n : lk.from)}</span><span>→</span><span class="tag">${esc(to ? to.n : lk.to)}</span></div>
        <p style="font-size:14px;line-height:1.55">${esc(lk.label)}</p>
      </div>      <div class="modal-f">
        ${window.PortiaFluxEdit && PortiaFluxEdit.canEditFlux() ? `<button class="btn terra sm" onclick="Modal.close();PortiaFluxEdit.linkForm('${lk.id}')">Modifier</button>` : ""}
        <button type="button" class="btn ghost sm" style="margin-right:auto" onclick="Modal.close();App.go('flux')">Flux données</button>
        <button type="button" class="btn ghost sm" onclick="Modal.close();App.go('eco')">Écosystème</button>
        <button type="button" class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`
    );
  }

  function projectModal(px) {
    const progs = (px.programmes || []).map((id) => nodeById(id)).filter(Boolean);
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">${svgI(ICON.eco)}</div><div><div class="eyebrow">Gestion croisée</div><h2 style="font-size:15px">${esc(px.titre)}</h2></div><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:12px"><span class="bdg ${px.niveau === "critique" ? "crit" : px.niveau === "eleve" ? "warn" : "info"}">${esc(px.niveau)}</span>${px.constat ? `<span class="tag mono">${esc(px.constat)}</span>` : ""}</div>
        <p style="font-size:13.5px;line-height:1.55;margin-bottom:14px">${esc(px.desc)}</p>
        <div class="eyebrow" style="margin-bottom:8px">Programmes concernés</div>
        <div class="chiprow" style="margin-bottom:12px">${progs.map((p) => `<span class="tag">${esc(p.n)}</span>`).join("")}</div>
        ${px.dataShared ? `<div class="kv"><span class="k">Données partagées</span><span class="v">${esc(px.dataShared.join(", "))}</span></div>` : ""}
        <div class="note sage" style="margin-top:14px"><b>Action :</b> ${esc(px.action)}</div>
      </div><div class="modal-f">
        <button type="button" class="btn ghost sm" style="margin-right:auto" onclick="Modal.close();App.go('prognonprog')">Prog./Non-prog.</button>
        <button type="button" class="btn ghost sm" onclick="Modal.close();App.go('lacunes')">Lacunes</button>
        <button type="button" class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`
    );
  }

  function getProjectData() {
    const st = window.Store && Store.state;
    return (st && st.projectMatrix && st.projectMatrix.length) ? st.projectMatrix : PROJECT_CROSS;
  }

  function getLinkData() {
    const st = window.Store && Store.state;
    return (st && st.ecoLinks && st.ecoLinks.length) ? st.ecoLinks : ECO_LINKS;
  }

  function patchEcoView() {
    const orig = VIEWS.eco;
    VIEWS.eco = function () {
      const v = el("div", { class: "view" });
      let tab = "org";
      function draw() {
        const links = getLinkData();
        const projects = getProjectData();
        const all = allEcoNodes();
        const NS = window.NODE_STRUCT || {};
        const nStat = window.nodeStatus || (() => "none");
        const mappable = all.filter((n) => NS[n.id]);
        const done = mappable.filter((n) => nStat(n) === "done").length;

        let body = "";
        if (tab === "org") {
          body = origOrgHtml(all, mappable, done);
        } else if (tab === "interactions") {
          body = `<div class="card"><div class="card-h"><h3>Interactions entre services</h3><div class="actions"><span class="muted" style="font-size:11px">${links.length} liens · cliquer un trait ou un nœud</span></div></div>
            <div class="card-b">
              <div class="chiprow" style="margin-bottom:12px" id="ecoFilters">
                <button class="tag on" data-f="">Tous</button>
                ${Object.keys(LINK_TYPES)
                  .map(
                    (k) =>
                      `<button class="tag" data-f="${k}"><span style="display:inline-block;width:10px;height:3px;background:${LINK_TYPES[k].color};vertical-align:middle;margin-right:4px"></span>${LINK_TYPES[k].lbl}</button>`
                  )
                  .join("")}
              </div>
              <div style="overflow-x:auto"><svg id="ecoSvg" class="eco-svg" style="width:100%;min-width:820px;height:430px"></svg></div>
            </div></div>`;
        } else {
          body = `<div class="card"><div class="card-h"><h3>Gestion croisée des projets & programmes</h3></div><div class="card-b">
            <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
            ${projects
              .map((px) => {
                const nc = px.niveau === "critique" ? "crit" : px.niveau === "eleve" ? "warn" : "info";
                const border = nc === "crit" ? "var(--crit)" : nc === "warn" ? "var(--warn)" : "var(--info)";
                return `<div class="card pad clk" data-px="${px.id}" style="cursor:pointer;border-left:3px solid ${border}">
                  <div class="between" style="margin-bottom:8px"><b style="font-size:13px">${esc(px.titre)}</b><span class="bdg ${nc}">${esc(px.niveau)}</span></div>
                  <p class="muted" style="font-size:12px;line-height:1.45">${esc(px.desc)}</p>
                  <div class="chiprow" style="margin-top:10px">${(px.programmes || [])
                    .slice(0, 4)
                    .map((pid) => {
                      const n = nodeById(pid);
                      return `<span class="tag mono" style="font-size:10px">${esc(n ? n.id : pid)}</span>`;
                    })
                    .join("")}${(px.programmes || []).length > 4 ? '<span class="tag">+' + ((px.programmes || []).length - 4) + "</span>" : ""}</div>
                </div>`;
              })
              .join("")}
            </div>
            <div class="note slate" style="margin-top:16px"><b>Lecture :</b> chaque carte décrit un point de gestion croisée (données, reporting, tutelle). Les liens « projet » sur l'onglet Interactions matérialisent les mêmes dépendances.</div>
          </div></div>`;
        }

        v.innerHTML =
          pageHead(
            "Cartographie · Écosystème",
            "Structures, interactions & projets",
            "Organigramme ministériel, flux d'interaction entre directions / tutelles / programmes, et gestion croisée des projets bailleurs.",
            `<span class="bdg ok">${done}/${mappable.length} entités couvertes</span>`
          ) +
          `<div class="seg" id="ecoTabs" style="margin-bottom:18px">
            <button data-t="org" class="${tab === "org" ? "on" : ""}">Organigramme</button>
            <button data-t="interactions" class="${tab === "interactions" ? "on" : ""}">Interactions (${links.length})</button>
            <button data-t="projets" class="${tab === "projets" ? "on" : ""}">Projets croisés (${projects.length})</button>
            <button type="button" class="btn ghost sm" style="margin-left:auto" onclick="App.go('carto_graph')">Carto interactive →</button>
          </div>` +
          body;

        v.querySelectorAll("#ecoTabs button").forEach((b) => {
          b.onclick = () => {
            tab = b.dataset.t;
            draw();
          };
        });

        if (tab === "interactions") {
          let f = "";
          const svg = v.querySelector("#ecoSvg");
          renderGraph(svg, f, null);
          v.querySelectorAll("#ecoFilters .tag").forEach((btn) => {
            btn.onclick = () => {
              v.querySelectorAll("#ecoFilters .tag").forEach((x) => x.classList.remove("on"));
              btn.classList.add("on");
              f = btn.dataset.f || "";
              renderGraph(svg, f, null);
              wireSvg(svg, f);
            };
          });
          wireSvg(svg, f);
        }

        if (tab === "projets") {
          v.querySelectorAll("[data-px]").forEach((card) => {
            card.onclick = () => {
              const px = projects.find((x) => x.id === card.dataset.px);
              if (px) projectModal(px);
            };
          });
        }
      }

      function wireSvg(svg, filterType) {
        if (!svg) return;
        svg.querySelectorAll(".eco-link").forEach((path) => {
          path.style.cursor = "pointer";
          path.onclick = () => {
            const lk = getLinkData().find((x) => x.id === path.dataset.lid);
            if (lk) linkModal(lk);
          };
        });
        svg.querySelectorAll(".eco-node").forEach((g) => {
          g.onclick = () => {
            const n = nodeById(g.dataset.nid);
            if (n && window.ecoNodeModal) ecoNodeModal(n);
          };
        });
      }

      draw();
      return v;
    };

    function origOrgHtml(all, mappable, done) {
      const NS = window.NODE_STRUCT || {};
      const nStat = window.nodeStatus || (() => "none");
      return `<div class="chiprow" style="margin-bottom:16px">
      <span class="tag"><span style="width:9px;height:9px;border-radius:50%;background:var(--ok);display:inline-block"></span> Couverte</span>
      <span class="tag"><span style="width:9px;height:9px;border-radius:50%;background:var(--terra);display:inline-block"></span> Planifiée</span>
      ${Object.keys(window.AXES || {})
        .map((a) => `<span class="tag" style="border-color:${AXES[a].c}"><span style="width:9px;height:9px;border-radius:2px;background:${AXES[a].c};display:inline-block"></span> ${a}</span>`)
        .join("")}
    </div><div style="overflow-x:auto;padding-bottom:8px"><div style="display:flex;gap:14px;min-width:880px">
      ${ecoColumns().map((col) => {
        return `<div style="flex:1;min-width:165px"><div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);padding:0 4px 10px;font-weight:600">${esc(col.title)}</div>
        <div class="stack" style="--space:9px">${col.nodes
          .map((n) => {
            const st = nStat(n);
            const dot = st === "done" ? "var(--ok)" : st === "planned" ? "var(--terra)" : "var(--line-2)";
            const clickable = NS[n.id];
            return `<div class="card${clickable ? " clk" : ""}" style="padding:11px 12px;border-left:3px solid ${AXES[n.axe].c};${clickable ? "cursor:pointer" : ""};margin-top:9px" ${clickable ? `onclick="ecoNodeModal(${JSON.stringify(n).replace(/"/g, "&quot;")})"` : ""}>
          <div style="display:flex;gap:8px;align-items:flex-start"><span style="width:8px;height:8px;border-radius:50%;background:${dot};flex:none;margin-top:4px"></span>
          <div style="min-width:0"><div style="font-size:12px;font-weight:600;color:var(--ink);line-height:1.3">${esc(n.n)}</div></div></div></div>`;
          })
          .join("")}</div></div>`;
      }).join("")}
    </div></div>`;
    }

    CRUMB.eco = "Écosystème & interactions";
  }

  function wrapStoreDefaults() {
    if (!window.Store || Store._cartoDefaults) return;
    const orig = Store.defaults.bind(Store);
    Store.defaults = function () {
      const d = orig();
      if (!d.ecoLinks || !d.ecoLinks.length) d.ecoLinks = JSON.parse(JSON.stringify(ECO_LINKS));
      if (!d.projectMatrix || !d.projectMatrix.length) d.projectMatrix = JSON.parse(JSON.stringify(PROJECT_CROSS));
      return d;
    };
    Store._cartoDefaults = true;
  }

  if (typeof document !== "undefined" && typeof VIEWS !== "undefined") {
    patchEcoView();
    wrapStoreDefaults();
  }

  if (typeof window !== "undefined") {
    window.PortiaCartographie = { ECO_LINKS, PROJECT_CROSS, layoutNodes };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ECO_LINKS, PROJECT_CROSS };
  }
})();

/**
 * Cartographie interactive — graphe force-directed (pôles, services, flux, ressources)
 */
(function () {
  "use strict";

  const CRIT = {
    critique: { lbl: "Critique", color: "#e05252", r: 10 },
    haute: { lbl: "Haute", color: "#e8a045", r: 9 },
    moyenne: { lbl: "Moyenne", color: "#d4b84a", r: 8 },
    basse: { lbl: "Basse", color: "#5a9e62", r: 7 },
  };

  const FLOW_MODES = {
    critique: { lbl: "Flux critique / absent", color: "#e05252", dash: "", width: 2.2 },
    auto: { lbl: "Automatisé / API", color: "#e8c547", dash: "", width: 1.8 },
    manuel: { lbl: "Manuel / batch", color: "#c8cdd8", dash: "7 5", width: 1.4 },
  };

  const CAT_COLORS = {
    cabinet: "#6b4fa8",
    directions: "#2a6ebb",
    tutelles: "#3d8b8f",
    programmes: "#c47a20",
    externe: "#4f7a54",
  };

  const RESOURCE_HINTS = {
    usep: "BAD · PA-PSGouv",
    pace: "BAD · Enable Youth",
    psie: "PNUD · innovation",
    ugp: "BOAD · centres SC",
    pejedec: "BM · données sensibles",
    c2d: "AFD · SIGFIP",
    carte: "National · Carte Jeunes",
    pnbv: "National · volontariat",
    dsi: "Socle SI · hébergement",
    daf: "Budget · SIGFIP",
    sigfip: "Finances publiques",
    uxp: "Interop · X-Road",
    nni: "Identité nationale",
  };

  function ecoColumns() {
    return window.ECO_COLUMNS || (typeof ECO_COLUMNS !== "undefined" ? ECO_COLUMNS : []);
  }

  function allNodes() {
    const cols = ecoColumns();
    if (!cols.length) return [];
    return cols.flatMap((c) =>
      c.nodes.map((n) => ({
        ...n,
        colKey: c.key,
        colTitle: c.title,
        resource: RESOURCE_HINTS[n.id] || (n.b ? "Bailleur " + n.b : ""),
      }))
    );
  }

  function getLinks() {
    const st = window.Store && Store.state;
    return st && st.ecoLinks && st.ecoLinks.length ? st.ecoLinks : window.ECO_LINKS || [];
  }

  function getProjects() {
    const st = window.Store && Store.state;
    return st && st.projectMatrix && st.projectMatrix.length ? st.projectMatrix : window.PROJECT_CROSS || [];
  }

  function getSavedLayout() {
    const st = window.Store && Store.state;
    return (st && st.cartoLayout) || { nodes: {} };
  }

  function saveLayoutPositions(nodes) {
    if (!window.Store) return;
    const layout = { nodes: {}, updated: new Date().toISOString() };
    nodes.forEach((n) => {
      layout.nodes[n.id] = { x: Math.round(n.x), y: Math.round(n.y) };
    });
    Store.state.cartoLayout = layout;
    Store.save();
    if (window.portiaApi && portiaApi.saveState) portiaApi.saveState().catch(() => {});
  }

  function clearSavedLayout() {
    if (!window.Store) return;
    delete Store.state.cartoLayout;
    Store.save();
    if (window.portiaApi && portiaApi.saveState) portiaApi.saveState().catch(() => {});
  }

  function positionNodes(nodes, links, w, h) {
    const saved = getSavedLayout().nodes || {};
    const positioned = nodes.map((n) => ({
      ...n,
      crit: nodeCriticality(n.id),
      vx: 0,
      vy: 0,
    }));
    const anySaved = positioned.some((n) => saved[n.id]);
    if (anySaved) {
      positioned.forEach((n) => {
        if (saved[n.id]) {
          n.x = saved[n.id].x;
          n.y = saved[n.id].y;
        }
      });
      const missing = positioned.filter((n) => !saved[n.id]);
      if (missing.length) {
        runLayout(missing, links, w, h);
        positioned.forEach((n) => {
          const m = missing.find((x) => x.id === n.id);
          if (m) {
            n.x = m.x;
            n.y = m.y;
          }
        });
      }
    } else {
      runLayout(positioned, links, w, h);
    }
    positioned.forEach((n) => {
      n.x = Math.max(36, Math.min(w - 36, n.x));
      n.y = Math.max(36, Math.min(h - 36, n.y));
    });
    return positioned;
  }

  function svgPoint(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function nodeCriticality(id) {
    const projects = getProjects();
    let score = 0;
    projects.forEach((px) => {
      const ids = (px.programmes || []).concat(px.tutelles || []);
      if (!ids.includes(id)) return;
      if (px.niveau === "critique") score += 3;
      else if (px.niveau === "eleve") score += 2;
      else score += 1;
    });
    const links = getLinks().filter((l) => l.from === id || l.to === id);
    links.forEach((l) => {
      const lbl = (l.label || "").toLowerCase();
      if (lbl.includes("absent") || lbl.includes("non branch") || lbl.includes("non partag") || lbl.includes("doublon"))
        score += 2;
    });
    if (window.nodeStatus) {
      const n = allNodes().find((x) => x.id === id);
      if (n && nodeStatus(n) === "planned") score += 1;
    }
    if (score >= 4) return "critique";
    if (score >= 2) return "haute";
    if (score >= 1) return "moyenne";
    return "basse";
  }

  function edgeMode(lk) {
    if (lk.flowMode && FLOW_MODES[lk.flowMode]) return lk.flowMode;
    const lbl = (lk.label || "").toLowerCase();
    const t = lk.type || "data";
    if (lbl.includes("absent") || lbl.includes("non branch") || lbl.includes("non partag") || lbl.includes("risque"))
      return "critique";
    if (t === "integration" && lbl.includes("absent")) return "critique";
    if (t === "integration" || (t === "data" && (lbl.includes("api") || lbl.includes("batch sécurisé")))) return "auto";
    if (t === "finance" && lbl.includes("sigfip")) return "auto";
    return "manuel";
  }

  function buildGraphState(filters) {
    const nodes = allNodes().filter((n) => {
      if (filters.categories.length && !filters.categories.includes(n.colKey)) return false;
      if (filters.structures.length && !filters.structures.includes(n.id)) return false;
      return true;
    });
    const ids = new Set(nodes.map((n) => n.id));
    const links = getLinks().filter((l) => ids.has(l.from) && ids.has(l.to));
    return { nodes, links };
  }

  function clusterCenters(nodes, w, h) {
    const keys = [...new Set(nodes.map((n) => n.colKey))];
    const map = {};
    keys.forEach((k, i) => {
      map[k] = { x: 80 + (i * (w - 160)) / Math.max(keys.length - 1, 1), y: h / 2 };
    });
    return map;
  }

  function runLayout(nodes, links, w, h) {
    const centers = clusterCenters(nodes, w, h);
    nodes.forEach((n, i) => {
      const c = centers[n.colKey] || { x: w / 2, y: h / 2 };
      n.x = c.x + (Math.random() - 0.5) * 80;
      n.y = c.y + (i % 5) * 36 - 72;
      n.vx = 0;
      n.vy = 0;
      n.crit = nodeCriticality(n.id);
    });
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    for (let tick = 0; tick < 140; tick++) {
      nodes.forEach((a) => {
        nodes.forEach((b) => {
          if (a.id >= b.id) return;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 42) {
            const f = (42 - dist) * 0.08;
            dx = (dx / dist) * f;
            dy = (dy / dist) * f;
            a.vx -= dx;
            a.vy -= dy;
            b.vx += dx;
            b.vy += dy;
          }
        });
      });
      links.forEach((l) => {
        const a = byId[l.from];
        const b = byId[l.to];
        if (!a || !b) return;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dist - 95) * 0.018;
        dx = (dx / dist) * f;
        dy = (dy / dist) * f;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      });
      nodes.forEach((n) => {
        const c = centers[n.colKey];
        if (c) {
          n.vx += (c.x - n.x) * 0.012;
          n.vy += (c.y - n.y) * 0.012;
        }
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(36, Math.min(w - 36, n.x));
        n.y = Math.max(36, Math.min(h - 36, n.y));
      });
    }
    return nodes;
  }

  function blockBounds(group, pad) {
    pad = pad || 34;
    const xs = group.map((n) => n.x);
    const ys = group.map((n) => n.y);
    return {
      x0: Math.min(...xs) - pad,
      y0: Math.min(...ys) - pad,
      x1: Math.max(...xs) + pad,
      y1: Math.max(...ys) + pad,
    };
  }

  function renderSvg(svg, graph, highlightId, flowFilter) {
    const w = 960;
    const h = 520;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const nodes = positionNodes(graph.nodes.slice(), graph.links.slice(), w, h);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const cols = [...new Set(nodes.map((n) => n.colKey))];
    let html = `<rect width="${w}" height="${h}" fill="#1c2230" rx="8"/>`;
    cols.forEach((ck) => {
      const group = nodes.filter((n) => n.colKey === ck);
      if (!group.length) return;
      const b = blockBounds(group, 40);
      const col = CAT_COLORS[ck] || "#555";
      const title = (ecoColumns().find((c) => c.key === ck) || {}).title || ck;
      const labelY = Math.max(28, b.y0 + 18);
      html += `<g class="cg-block" data-ck="${ck}">
        <rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" fill="${col}" fill-opacity="0.06" stroke="${col}" stroke-width="1.2" stroke-dasharray="4 3" rx="10" opacity="0.85"/>
        <title>${esc(title)}</title>
        <text class="cg-block-hint" pointer-events="none" x="${b.x0 + 10}" y="${labelY}" fill="${col}" font-size="10" font-weight="600" opacity="0.95">${esc(title)}</text>
      </g>`;
    });
    graph.links.forEach((lk) => {
      const mode = edgeMode(lk);
      if (flowFilter && flowFilter !== mode) return;
      const a = byId[lk.from];
      const b = byId[lk.to];
      if (!a || !b) return;
      const st = FLOW_MODES[mode];
      const hi = highlightId && (highlightId === lk.id || highlightId === lk.from || highlightId === lk.to);
      const mx = (a.x + b.x) / 2;
      html += `<path class="cg-link" data-lid="${lk.id}" d="M${a.x} ${a.y} Q ${mx} ${a.y} ${mx} ${(a.y + b.y) / 2} T ${b.x} ${b.y}" fill="none" stroke="${st.color}" stroke-width="${hi ? st.width + 1 : st.width}" stroke-dasharray="${st.dash}" opacity="${hi ? 1 : 0.72}"/>`;
    });
    nodes.forEach((n) => {
      const c = CRIT[n.crit] || CRIT.moyenne;
      const hi = highlightId === n.id;
      const axe = window.AXES && AXES[n.axe] ? AXES[n.axe].c : "#888";
      html += `<g class="cg-node" data-nid="${n.id}" transform="translate(${n.x},${n.y})" style="cursor:pointer">
        <title>${esc(n.n)}${n.resource ? " — " + esc(n.resource) : ""}</title>
        <circle r="${hi ? c.r + 3 : c.r + 1}" fill="none" stroke="${axe}" stroke-width="1.5" opacity="0.45"/>
        <circle r="${c.r}" fill="${c.color}" stroke="#fff" stroke-width="${hi ? 2.5 : 1.5}"/>
        <text pointer-events="none" y="${c.r + 14}" text-anchor="middle" fill="#e8ecf4" font-size="9.5" font-weight="600">${escShort(n.n)}</text>
      </g>`;
    });
    svg.innerHTML = html;
    return { nodes, byId, w, h, graph };
  }

  function refreshSvgGeometry(svg, layoutState, flowFilter) {
    const { nodes, byId, graph } = layoutState;
    const cols = [...new Set(nodes.map((n) => n.colKey))];
    cols.forEach((ck) => {
      const group = nodes.filter((n) => n.colKey === ck);
      const block = svg.querySelector(`.cg-block[data-ck="${ck}"]`);
      if (!group.length || !block) return;
      const b = blockBounds(group, 40);
      const rect = block.querySelector("rect");
      const label = block.querySelector("text");
      if (rect) {
        rect.setAttribute("x", b.x0);
        rect.setAttribute("y", b.y0);
        rect.setAttribute("width", b.x1 - b.x0);
        rect.setAttribute("height", b.y1 - b.y0);
      }
      if (label) {
        label.setAttribute("x", b.x0 + 10);
        label.setAttribute("y", Math.max(28, b.y0 + 18));
      }
    });
    graph.links.forEach((lk) => {
      const mode = edgeMode(lk);
      if (flowFilter && flowFilter !== mode) return;
      const a = byId[lk.from];
      const b = byId[lk.to];
      const path = svg.querySelector(`.cg-link[data-lid="${lk.id}"]`);
      if (!a || !b || !path) return;
      const mx = (a.x + b.x) / 2;
      path.setAttribute(
        "d",
        `M${a.x} ${a.y} Q ${mx} ${a.y} ${mx} ${(a.y + b.y) / 2} T ${b.x} ${b.y}`
      );
    });
    nodes.forEach((n) => {
      const g = svg.querySelector(`.cg-node[data-nid="${n.id}"]`);
      if (g) g.setAttribute("transform", `translate(${n.x},${n.y})`);
    });
  }

  function wireDrag(svg, layoutRef, flowRef) {
    if (svg._cgDragWired) return;
    svg._cgDragWired = true;
    let drag = null;
    window.__cgDragMoved = false;

    function finishDrag(save) {
      if (!drag) return;
      const ls = layoutRef.current;
      if (drag.moved && save && ls) saveLayoutPositions(ls.nodes);
      drag = null;
      svg.classList.remove("cg-dragging");
    }

    svg.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0) return;
        const ls = layoutRef.current;
        if (!ls) return;
        const block = e.target.closest(".cg-block");
        const nodeG = e.target.closest(".cg-node");
        const p = svgPoint(svg, e.clientX, e.clientY);
        window.__cgDragMoved = false;

        if (block) {
          const ck = block.dataset.ck;
          const ids = ls.nodes.filter((n) => n.colKey === ck).map((n) => n.id);
          const origins = {};
          ids.forEach((id) => {
            const n = ls.byId[id];
            if (n) origins[id] = { x: n.x, y: n.y };
          });
          drag = { type: "block", ck, ids, origins, sx: p.x, sy: p.y, moved: false };
          svg.classList.add("cg-dragging");
          block.setPointerCapture(e.pointerId);
          e.preventDefault();
          e.stopPropagation();
        } else if (nodeG) {
          const id = nodeG.dataset.nid;
          const n = ls.byId[id];
          if (!n) return;
          drag = { type: "node", id, sx: p.x, sy: p.y, ox: n.x, oy: n.y, moved: false };
          svg.classList.add("cg-dragging");
          nodeG.setPointerCapture(e.pointerId);
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const ls = layoutRef.current;
      if (!ls) return;
      const p = svgPoint(svg, e.clientX, e.clientY);
      const dx = p.x - drag.sx;
      const dy = p.y - drag.sy;
      if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) drag.moved = true;
      if (!drag.moved) return;
      window.__cgDragMoved = true;

      if (drag.type === "node") {
        const n = ls.byId[drag.id];
        if (n) {
          n.x = Math.max(36, Math.min(ls.w - 36, drag.ox + dx));
          n.y = Math.max(36, Math.min(ls.h - 36, drag.oy + dy));
        }
      } else if (drag.type === "block") {
        drag.ids.forEach((id) => {
          const n = ls.byId[id];
          const o = drag.origins[id];
          if (n && o) {
            n.x = Math.max(36, Math.min(ls.w - 36, o.x + dx));
            n.y = Math.max(36, Math.min(ls.h - 36, o.y + dy));
          }
        });
      }
      refreshSvgGeometry(svg, ls, flowRef.current);
    });

    svg.addEventListener("pointerup", () => {
      finishDrag(true);
      setTimeout(() => {
        window.__cgDragMoved = false;
      }, 50);
    });
    svg.addEventListener("pointercancel", () => {
      finishDrag(false);
      window.__cgDragMoved = false;
    });
  }

  function escShort(s) {
    const t = String(s || "");
    return t.length > 22 ? t.slice(0, 20) + "…" : t;
  }

  function nodeDetailModal(n) {
    const ents = window.nodeEnts ? nodeEnts(n) : [];
    const links = getLinks().filter((l) => l.from === n.id || l.to === n.id);
    const crit = CRIT[n.crit || nodeCriticality(n.id)];
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.eco)}</div><div><div class="eyebrow">${esc(n.colTitle)}</div><h2 style="font-size:15px">${esc(n.n)}</h2></div><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:12px"><span class="bdg" style="background:${crit.color}22;color:${crit.color};border-color:${crit.color}55">Criticité ${crit.lbl}</span>${n.resource ? `<span class="tag">${esc(n.resource)}</span>` : ""}${axeBadge(n.axe)}</div>
        <div class="eyebrow" style="margin-bottom:6px">Interconnexions (${links.length})</div>
        <div class="stack" style="max-height:160px;overflow:auto;margin-bottom:12px">${links
          .slice(0, 8)
          .map((l) => {
            const other = l.from === n.id ? l.to : l.from;
            const nd = allNodes().find((x) => x.id === other);
            const fm = FLOW_MODES[edgeMode(l)];
            return `<div class="note slate" style="font-size:12px;margin:0"><span style="color:${fm.color}">●</span> ${esc(nd ? nd.n : other)} — ${esc(l.label)}</div>`;
          })
          .join("")}${links.length > 8 ? `<div class="muted" style="font-size:11px">+ ${links.length - 8} autres liens</div>` : ""}</div>
        ${ents.length ? `<div class="eyebrow" style="margin-bottom:6px">Entretiens</div><div class="chiprow">${ents.slice(0, 4).map((e) => `<span class="tag clk" onclick="Modal.close();openEntretien('${e.id}',true)">${esc(e.n)}</span>`).join("")}</div>` : ""}
      </div>
      <div class="modal-f">
        <button class="btn ghost sm" style="margin-right:auto" onclick="Modal.close();App.go('flux')">Flux données</button>
        <button class="btn ghost sm" onclick="Modal.close();App.go('eco')">Écosystème</button>
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`
    );
  }

  function registerView() {
    VIEWS.carto_graph = function () {
      const v = el("div", { class: "view" });
      const filters = { categories: [], structures: [], flow: "" };
      const all = allNodes();

      function draw() {
        const graph = buildGraphState(filters);
        v.innerHTML =
          pageHead(
            "Cartographie · Interopérabilité",
            "Cartographie interactive",
            "Visualisation des interconnexions, flux de données et ressources entre pôles, services, tutelles, programmes et projets.",
            `<button class="btn ghost sm" id="cgReset" title="Effacer filtres">Filtres</button><button class="btn ghost sm" id="cgLayoutReset" title="Recalculer les positions">Réinit. positions</button><button class="btn ghost sm" id="cgFit">Ajuster</button>${window.PortiaFluxEdit && PortiaFluxEdit.canEditFlux() ? `<button class="btn terra sm" id="cgNewFlux">Nouveau flux</button>` : ""}<button class="btn terra sm" id="cgEco">Vue écosystème</button>`
          ) +
          `<div class="row carto-graph-layout" style="align-items:stretch;gap:14px">
            <div class="col card" style="flex:1;min-width:0;margin:0">
              <div class="card-h" style="flex-wrap:wrap;gap:8px">
                <h3>Graphe d'interopérabilité</h3>
                <div class="actions" style="flex-wrap:wrap">
                  <select class="fselect sm" id="cgCat" multiple size="1" title="Catégories" style="min-width:140px">
                    ${Object.keys(CAT_COLORS)
                      .map((k) => {
                        const t = (ecoColumns().find((c) => c.key === k) || {}).title || k;
                        return `<option value="${k}" ${!filters.categories.length || filters.categories.includes(k) ? "selected" : ""}>${esc(t)}</option>`;
                      })
                      .join("")}
                  </select>
                  <select class="fselect sm" id="cgStruct" style="min-width:160px">
                    <option value="">Toutes les structures</option>
                    ${all.map((n) => `<option value="${n.id}" ${filters.structures[0] === n.id ? "selected" : ""}>${esc(n.n)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="card-b" style="padding:0;overflow:hidden;border-radius:0 0 var(--r) var(--r)">
                <div class="chiprow" style="padding:10px 14px;margin:0;background:var(--surface-2)" id="cgFlowF">
                  <button class="tag on" data-f="">Tous flux</button>
                  ${Object.keys(FLOW_MODES)
                    .map(
                      (k) =>
                        `<button class="tag" data-f="${k}"><span style="display:inline-block;width:14px;height:3px;background:${FLOW_MODES[k].color};vertical-align:middle;margin-right:4px;border-radius:1px"></span>${FLOW_MODES[k].lbl}</button>`
                    )
                    .join("")}
                </div>
                <div style="overflow:auto"><svg id="cgSvg" class="carto-graph-svg" style="width:100%;min-width:960px;height:520px;display:block"></svg></div>
              </div>
            </div>
            <div class="col" style="width:240px;flex:none">
              <div class="card" style="margin-bottom:12px"><div class="card-h"><h3>Criticité</h3></div><div class="card-b stack" style="gap:8px;font-size:12px">
                ${Object.keys(CRIT)
                  .map((k) => `<div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;border-radius:50%;background:${CRIT[k].color}"></span>${CRIT[k].lbl}</div>`)
                  .join("")}
              </div></div>
              <div class="card" style="margin-bottom:12px"><div class="card-h"><h3>Types de flux</h3></div><div class="card-b stack" style="gap:8px;font-size:12px">
                ${Object.keys(FLOW_MODES)
                  .map(
                    (k) =>
                      `<div style="display:flex;align-items:center;gap:8px"><svg width="28" height="8"><line x1="0" y1="4" x2="28" y2="4" stroke="${FLOW_MODES[k].color}" stroke-width="2" stroke-dasharray="${FLOW_MODES[k].dash || "none"}"/></svg>${FLOW_MODES[k].lbl}</div>`
                  )
                  .join("")}
              </div></div>
              <div class="card"><div class="card-h"><h3>Structures</h3></div><div class="card-b" style="max-height:220px;overflow:auto;font-size:11px">
                ${Object.keys(CAT_COLORS)
                  .map((k) => {
                    const t = (ecoColumns().find((c) => c.key === k) || {}).title || k;
                    const cnt = all.filter((n) => n.colKey === k).length;
                    return `<label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;cursor:pointer"><input type="checkbox" class="cg-chk-cat" value="${k}" ${!filters.categories.length || filters.categories.includes(k) ? "checked" : ""}/> <span style="width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[k]}"></span> ${esc(t)} <span class="muted">(${cnt})</span></label>`;
                  })
                  .join("")}
              </div></div>
            </div>
          </div>
          <div class="note slate" style="margin-top:14px;font-size:12px"><b>Lecture :</b> ${graph.nodes.length} entités · ${graph.links.length} liens. <b>Glissez</b> un point ou un bloc (zone en pointillés) pour déplacer et dégager les superpositions — positions mémorisées. Clic = fiche détail.</div>`;

        const svg = v.querySelector("#cgSvg");
        let hi = null;
        const layoutRef = { current: null };
        const flowRef = { current: filters.flow };
        if (!svg._cgDragWired) wireDrag(svg, layoutRef, flowRef);
        function paint() {
          const g = buildGraphState(filters);
          if (!g.nodes.length) {
            layoutRef.current = null;
            svg.innerHTML = `<rect width="960" height="520" fill="#1c2230" rx="8"/>
              <text x="480" y="248" text-anchor="middle" fill="#9aa3b5" font-size="14">Aucune entité à afficher — vérifiez les filtres ou rechargez la page.</text>
              <text x="480" y="272" text-anchor="middle" fill="#6b7280" font-size="11">Données écosystème : ${ecoColumns().length ? ecoColumns().flatMap((c) => c.nodes).length + " entités" : "non chargées"}</text>`;
            svg.setAttribute("viewBox", "0 0 960 520");
            return;
          }
          flowRef.current = filters.flow;
          layoutRef.current = renderSvg(svg, g, hi, filters.flow);
          wireSvg();
        }
        function wireSvg() {
          svg.querySelectorAll(".cg-node").forEach((g) => {
            g.onclick = () => {
              if (window.__cgDragMoved) return;
              hi = g.dataset.nid;
              paint();
              const n = allNodes().find((x) => x.id === hi);
              if (n) nodeDetailModal(n);
            };
          });
          svg.querySelectorAll(".cg-link").forEach((p) => {
            p.style.cursor = "pointer";
            p.onclick = () => {
              if (window.__cgDragMoved) return;
              const lk = getLinks().find((x) => x.id === p.dataset.lid);
              if (lk && window.PortiaCartographie) {
                hi = lk.id;
                paint();
                const from = allNodes().find((x) => x.id === lk.from);
                const to = allNodes().find((x) => x.id === lk.to);
                const fm = FLOW_MODES[edgeMode(lk)];
                Modal.open(
                  `<div class="modal-h"><h2 style="font-size:14px">Flux · ${esc(fm.lbl)}</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
                  <div class="modal-b"><div class="chiprow" style="margin-bottom:10px"><span class="tag">${esc(from ? from.n : lk.from)}</span>→<span class="tag">${esc(to ? to.n : lk.to)}</span></div><p>${esc(lk.label)}</p></div>
                  <div class="modal-f">
                    ${window.PortiaFluxEdit && PortiaFluxEdit.canEditFlux() ? `<button class="btn terra sm" onclick="Modal.close();PortiaFluxEdit.linkForm('${lk.id}')">Modifier</button>` : ""}
                    <button class="btn ghost" onclick="Modal.close()">Fermer</button></div>`
                );
              }
            };
          });
        }
        paint();

        v.querySelectorAll("#cgFlowF .tag").forEach((btn) => {
          btn.onclick = () => {
            v.querySelectorAll("#cgFlowF .tag").forEach((x) => x.classList.remove("on"));
            btn.classList.add("on");
            filters.flow = btn.dataset.f || "";
            paint();
          };
        });
        v.querySelectorAll(".cg-chk-cat").forEach((chk) => {
          chk.onchange = () => {
            filters.categories = [...v.querySelectorAll(".cg-chk-cat:checked")].map((c) => c.value);
            paint();
          };
        });
        const stSel = v.querySelector("#cgStruct");
        if (stSel)
          stSel.onchange = () => {
            filters.structures = stSel.value ? [stSel.value] : [];
            if (stSel.value) {
              hi = stSel.value;
            }
            paint();
          };
        v.querySelector("#cgReset").onclick = () => {
          filters.categories = [];
          filters.structures = [];
          filters.flow = "";
          hi = null;
          draw();
        };
        v.querySelector("#cgLayoutReset").onclick = () => {
          clearSavedLayout();
          hi = null;
          toast("Cartographie", "Positions réinitialisées — disposition automatique", "ok");
          paint();
        };
        v.querySelector("#cgFit").onclick = () => paint();
        v.querySelector("#cgEco").onclick = () => App.go("eco");
        const nf = v.querySelector("#cgNewFlux");
        if (nf && window.PortiaFluxEdit) nf.onclick = () => PortiaFluxEdit.createLinkForm();
      }

      draw();
      return v;
    };
    CRUMB.carto_graph = "Cartographie interactive";
  }

  if (typeof document !== "undefined" && typeof VIEWS !== "undefined") {
    registerView();
  }

  window.PortiaCartoGraph = { nodeCriticality, edgeMode, allNodes, saveLayoutPositions, clearSavedLayout };
})();

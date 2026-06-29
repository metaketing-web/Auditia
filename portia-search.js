/**
 * Skydeen — recherche globale par mot-clé sur toute la plateforme.
 */
(function () {
  "use strict";

  let indexCache = null;

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function brandText(s) {
    return String(s || "").replace(/\bPortia\b/gi, "Skydeen");
  }

  function addEntry(entries, entry) {
    const text = brandText(String(entry.text || "").trim());
    if (!text) return;
    entries.push(
      Object.assign({}, entry, {
        text,
        title: brandText(entry.title),
        subtitle: brandText(entry.subtitle),
        norm: norm(text),
      })
    );
  }

  function joinParts(parts) {
    return parts.filter(Boolean).join(" ");
  }

  function questionLabel(e, phase, qid) {
    if (window.PortiaQuestionnaires && PortiaQuestionnaires.getTrameForEntretien) {
      const tr = PortiaQuestionnaires.getTrameForEntretien(e);
      const sections = tr && tr.phases && tr.phases[phase] && tr.phases[phase].sections;
      if (sections) {
        for (let i = 0; i < sections.length; i++) {
          const items = sections[i].items || [];
          for (let j = 0; j < items.length; j++) {
            if (items[j].id === qid) return items[j].q || qid;
          }
        }
      }
    }
    return qid;
  }

  function collectStrings(obj, parts, depth) {
    depth = depth || 0;
    if (depth > 7 || obj == null) return;
    if (typeof obj === "string") {
      if (obj.trim().length > 1) parts.push(obj);
      return;
    }
    if (typeof obj === "number" || typeof obj === "boolean") {
      parts.push(String(obj));
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((v) => collectStrings(v, parts, depth + 1));
      return;
    }
    if (typeof obj === "object") {
      Object.keys(obj).forEach((k) => {
        if (k === "id" || k === "fileId" || /^portia$/i.test(k)) return;
        collectStrings(obj[k], parts, depth + 1);
      });
    }
  }

  function buildIndex() {
    if (indexCache) return indexCache;
    const entries = [];
    if (!window.Store || !Store.state) {
      indexCache = entries;
      return entries;
    }

    Store.get("entretiens").forEach((e) => {
      addEntry(entries, {
        section: "Entretien",
        title: e.n || e.struct || "Entretien",
        subtitle: joinParts([e.struct, e.aud, "S" + e.sem]),
        action: "entretien",
        id: e.id,
        text: joinParts([e.n, e.struct, e.aud, e.region, e.cr, e.qual, e.trame, (e.obs || []).join(" ")]),
      });
      const q = e.questionnaire || {};
      ["invest", "confront", "coconstruct"].forEach((ph) => {
        const block = q[ph] || {};
        Object.keys(block).forEach((qid) => {
          const ans = block[qid];
          if (!String(ans || "").trim()) return;
          const label = questionLabel(e, ph, qid);
          addEntry(entries, {
            section: "Questionnaire",
            title: e.n || e.struct,
            subtitle: label.length > 90 ? label.slice(0, 90) + "…" : label,
            action: "entretien",
            id: e.id,
            text: joinParts([label, ans, e.n, e.struct]),
          });
        });
      });
    });

    Store.get("docs")
      .filter((d) => !window.isTestDoc || !isTestDoc(d))
      .forEach((d) => {
        const name = typeof docName === "function" ? docName(d) : d.desc;
        addEntry(entries, {
          section: "Data Room",
          title: d.desc || name || "Document",
          subtitle: joinParts([d.rep, d.source, d.statut]),
          action: "doc",
          id: d.id,
          rep: d.rep,
          text: joinParts([d.desc, name, d.rep, d.source, d.type, d.format, d.statut, d.par]),
        });
      });

    Store.get("constats").forEach((c) => {
      addEntry(entries, {
        section: "Constat",
        title: joinParts([c.ref, c.titre]),
        subtitle: c.axe || "",
        action: "constat",
        id: c.id,
        text: joinParts([c.ref, c.titre, c.desc, c.ecart, c.axe, c.struct, c.crit, (c.sources || []).join(" ")]),
      });
    });

    Store.get("gaps").forEach((g) => {
      addEntry(entries, {
        section: "Matrice CDC",
        title: joinParts([g.ref, g.theme]),
        subtitle: g.verdict || "",
        action: "gap",
        id: g.id,
        text: joinParts([g.ref, g.theme, g.exig, g.realite, g.cdc, g.verdict]),
      });
    });

    Store.get("risques").forEach((r) => {
      addEntry(entries, {
        section: "Risque",
        title: joinParts([r.ref, r.titre]),
        subtitle: r.cat || "",
        action: "risque",
        id: r.id,
        text: joinParts([r.ref, r.titre, r.desc, r.mitig, r.cat, r.statut]),
      });
    });

    Store.get("livrables").forEach((l) => {
      addEntry(entries, {
        section: "Livrable",
        title: joinParts([l.ref, l.titre]),
        subtitle: l.cadrage || "",
        action: "livrable",
        id: l.id,
        text: joinParts([l.ref, l.titre, l.desc, l.contenu, l.cadrage, l.statut]),
      });
    });

    Store.get("gouv").forEach((g) => {
      addEntry(entries, {
        section: "Gouvernance / COPIL",
        title: g.titre || g.ref,
        subtitle: g.ref || "",
        action: "gouv",
        id: g.id,
        text: joinParts([g.titre, g.ref, g.pv, (g.decisions || []).join(" "), (g.actions || []).join(" ")]),
      });
    });

    Store.get("horsperim").forEach((h) => {
      addEntry(entries, {
        section: "Hors périmètre",
        title: joinParts([h.ref, h.titre]),
        subtitle: h.decision || "",
        action: "view",
        view: "ref_pnipm",
        text: joinParts([h.ref, h.titre, h.desc, h.raison, h.decision]),
      });
    });

    const drafts = Store.state.reportDrafts || {};
    Object.keys(drafts).forEach((key) => {
      const d = drafts[key];
      if (!d || !d.text) return;
      addEntry(entries, {
        section: "Brouillon IA",
        title: key,
        subtitle: "Rapport / synthèse",
        action: "view",
        view: "rapports",
        text: joinParts([key, d.text]),
      });
    });

    (Store.state.chat || []).forEach((m, i) => {
      addEntry(entries, {
        section: "Assistant IA",
        title: m.role === "user" ? "Question" : "Réponse IA",
        subtitle: "Historique assistant",
        action: "view",
        view: "assistant",
        text: m.content || "",
      });
    });

    const nestedSources = [
      ["Lacunes collecte", "lacunes", "collecteLacunes"],
      ["Flux de données", "eco", "dataFlows"],
      ["Volet B", "volet_b", "voletB"],
      ["Prog. / Non-prog.", "prog_np", "progNonProg"],
      ["Qualité données", "lacunes", "dataQualitySources"],
      ["Checklists", "cdc_tech", "checklists"],
      ["Documents mission", "docs_mission", "missionDocs"],
      ["Gouvernance mission", "pilotage", "governanceTrack"],
      ["Écosystème", "eco", "ecoLinks"],
      ["Matrice projets", "carto_graph", "projectMatrix"],
    ];
    nestedSources.forEach(([label, view, key]) => {
      const data = Store.state && Store.state[key];
      if (!data) return;
      const parts = [];
      collectStrings(data, parts);
      if (!parts.length) return;
      addEntry(entries, {
        section: label,
        title: label,
        subtitle: "Vue " + view,
        action: "view",
        view: view,
        text: parts.join(" "),
      });
      if (Array.isArray(data)) {
        data.forEach((item, idx) => {
          const p = [];
          collectStrings(item, p);
          if (!p.length) return;
          const t = item.titre || item.title || item.label || item.nom || item.ref || label + " " + (idx + 1);
          addEntry(entries, {
            section: label,
            title: String(t),
            subtitle: item.ref || item.id || "",
            action: "view",
            view: view,
            text: p.join(" "),
          });
        });
      }
    });

    indexCache = entries;
    return entries;
  }

  function invalidateIndex() {
    indexCache = null;
  }

  function scoreEntry(entry, terms) {
    let score = 0;
    const titleN = norm(entry.title);
    const subN = norm(entry.subtitle);
    terms.forEach((t) => {
      if (titleN.includes(t)) score += 12;
      if (subN.includes(t)) score += 8;
      if (entry.norm.includes(t)) score += 4;
    });
    return score;
  }

  function search(query) {
    const q = norm(query).trim();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const index = buildIndex();
    const hits = [];
    index.forEach((entry) => {
      if (!terms.every((t) => entry.norm.includes(t))) return;
      hits.push({ entry, score: scoreEntry(entry, terms) });
    });
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, 80).map((h) => h.entry);
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightSnippet(text, rawQuery) {
    const raw = String(text || "");
    const terms = String(rawQuery || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const low = norm(raw);
    const normTerms = norm(rawQuery)
      .split(/\s+/)
      .filter(Boolean);
    let pos = -1;
    normTerms.forEach((t) => {
      const i = low.indexOf(t);
      if (i >= 0 && (pos < 0 || i < pos)) pos = i;
    });
    const start = pos >= 0 ? Math.max(0, pos - 55) : 0;
    let slice = raw.slice(start, start + 160);
    if (start > 0) slice = "…" + slice;
    if (start + 160 < raw.length) slice += "…";
    let html = esc(slice);
    terms.forEach((t) => {
      if (!t) return;
      html = html.replace(new RegExp("(" + escapeRe(t) + ")", "gi"), "<mark>$1</mark>");
    });
    return html;
  }

  function navigate(entry) {
    Modal.close();
    if (!entry) return;
    const readOnly = App.user && App.user.readOnly;
    if (entry.action === "entretien" && window.openEntretien) {
      openEntretien(entry.id, !readOnly);
      return;
    }
    if (entry.action === "constat" && window.openConstat) {
      openConstat(entry.id);
      return;
    }
    if (entry.action === "gap" && window.openGap) {
      openGap(entry.id);
      return;
    }
    if (entry.action === "risque" && window.openRisque) {
      openRisque(entry.id);
      return;
    }
    if (entry.action === "livrable" && window.openLivrable) {
      openLivrable(entry.id);
      return;
    }
    if (entry.action === "gouv" && window.openGouv) {
      openGouv(entry.id);
      return;
    }
    if (entry.action === "doc") {
      if (entry.rep) App.go("dataroom", { rep: entry.rep, from: "search" });
      else App.go("dataroom");
      return;
    }
    if (entry.action === "view" && entry.view) {
      App.go(entry.view);
    }
  }

  function renderResults(listEl, results, rawQuery) {
    if (!results.length) {
      listEl.innerHTML =
        '<div class="empty" style="padding:36px 20px">' +
        svgI('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>') +
        "<b>Aucun résultat</b><p>Essayez un autre mot-clé ou vérifiez l'orthographe.</p></div>";
      return;
    }
    listEl.innerHTML = results
      .map((entry, i) => {
        return (
          '<button type="button" class="portia-search-hit" data-idx="' +
          i +
          '">' +
          '<div class="portia-search-hit-top">' +
          '<span class="bdg neutral">' +
          esc(entry.section) +
          "</span>" +
          "<b>" +
          esc(entry.title) +
          "</b>" +
          "</div>" +
          (entry.subtitle ? '<div class="muted" style="font-size:12px;margin:2px 0 6px">' + esc(entry.subtitle) + "</div>" : "") +
          '<div class="portia-search-snippet">' +
          highlightSnippet(entry.text, rawQuery) +
          "</div>" +
          "</button>"
        );
      })
      .join("");
    listEl.querySelectorAll(".portia-search-hit").forEach((btn) => {
      btn.onclick = () => navigate(results[parseInt(btn.dataset.idx, 10)]);
    });
  }

  function open() {
    invalidateIndex();
    const total = buildIndex().length;
    Modal.open(
      '<div class="modal-h">' +
        '<div class="ic" style="background:var(--slate-soft);color:var(--info)">' +
        svgI('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>') +
        "</div>" +
        "<div><div class=\"eyebrow\">Recherche globale</div><h2>Explorer la plateforme</h2></div>" +
        '<button class="x" onclick="Modal.close()">' +
        svgI('<path d="M18 6 6 18M6 6l12 12"/>') +
        "</button></div>" +
        '<div class="modal-b portia-search-modal">' +
        '<input class="search" id="portiaSearchQ" placeholder="Mot-clé : entretien, SIGFIP, gouvernance, NNI…" autocomplete="off">' +
        '<div class="muted" style="font-size:11px;margin:8px 0 12px">' +
        esc(String(total)) +
        " éléments indexés · entretiens, questionnaires, Data Room, constats, matrice CDC, risques, livrables, COPIL, brouillons IA…" +
        "</div>" +
        '<div id="portiaSearchResults" class="portia-search-results"></div>' +
        "</div>" +
        '<div class="modal-f"><span class="muted" style="font-size:11px;margin-right:auto">Raccourci : ⌘K / Ctrl+K</span><button class="btn ghost" onclick="Modal.close()">Fermer</button></div>',
      true
    );
    const input = document.getElementById("portiaSearchQ");
    const list = document.getElementById("portiaSearchResults");
    let timer = null;
    const run = () => {
      const q = input.value.trim();
      if (!q || q.length < 2) {
        list.innerHTML =
          '<div class="empty" style="padding:30px 16px"><b>Saisissez au moins 2 caractères</b><p>La recherche parcourt toute la mission indexée.</p></div>';
        return;
      }
      renderResults(list, search(q), q);
    };
    input.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    setTimeout(() => input && input.focus(), 60);
  }

  function init() {
    if (window.Store && Store.save && !Store.save._portiaSearchPatch) {
      const orig = Store.save.bind(Store);
      Store.save = function () {
        invalidateIndex();
        return orig();
      };
      Store.save._portiaSearchPatch = true;
    }
    document.addEventListener("keydown", (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      if (!App.user) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
      e.preventDefault();
      open();
    });
    const topBtn = document.getElementById("topSearch");
    if (topBtn) topBtn.onclick = () => open();
  }

  window.PortiaSearch = {
    open,
    search,
    buildIndex,
    invalidateIndex,
    navigate,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

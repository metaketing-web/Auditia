/**
 * Construction HTML — Documents de mission (fallback client si pas encore servi par l'API)
 */
(function () {
  "use strict";

  const MIN_HTML = 400;

  const CHARTE_ENGAGEMENTS = [
    {
      cote: "MPJIPSC",
      items: [
        "Désigner les interlocuteurs et valider l'agenda sous 48 h",
        "Mettre à disposition les pièces listées dans la Data Room (checklists A→F)",
        "Faciliter l'accès graduel aux données sensibles (NNI, SIGFIP) selon cadre juridique",
        "Participer aux instances COPIL et valider les livrables intermédiaires",
      ],
    },
    {
      cote: "Skydeen (équipe audit)",
      items: [
        "Respecter la confidentialité et l'usage interne des données",
        "Partager l'avancement hebdomadaire via ce cockpit (vue Cabinet)",
        "Documenter chaque entretien (CR, qualification, pièces probantes)",
        "Signaler sans délai les blocages nécessitant arbitrage du COPIL",
      ],
    },
  ];

  const CDC_MODULES = [
    { n: "Pilotage Cabinet & drill-down", cdc: "§ Fonc. 3.1", themes: ["Fonctionnel", "Politique"] },
    { n: "Programmatique / non-programmatique", cdc: "§ Fonc. 3.2", themes: ["Fonctionnel", "Programmatique", "Collecte"] },
    { n: "Volet B (RH, flotte, GED, marchés)", cdc: "§ Fonc. 3.9", themes: ["Fonctionnel"] },
    { n: "Données & référentiels", cdc: "§ Données 2.x", themes: ["Données"] },
    { n: "Interopérabilité (SIGFIP, UXP, NNI)", cdc: "§ Interop 5.x", themes: ["Interop"] },
    { n: "Architecture & SI", cdc: "§ Tech 4.x", themes: ["Architecture", "Réseau"] },
    { n: "Sécurité & conformité", cdc: "§ Sécu 6.x", themes: ["Sécurité"] },
    { n: "Performance & exploitation", cdc: "§ Perf 7.x", themes: ["Performance"] },
  ];

  const AGENDA_SEMAINES = [
    { s: 1, titre: "Cadrage stratégique", objectif: "Commande politique, sponsors, périmètre, Data Room initiale, COPIL de lancement." },
    { s: 2, titre: "Deep-dive programmatique", objectif: "Directions métiers, SIGFIP, programmatique / non-programmatique, lacunes collecte." },
    { s: 3, titre: "Volet B & intégrations", objectif: "RH, patrimoine, marchés, GED, DSI, RSSI/DPO, flux et interopérabilité." },
    { s: 4, titre: "Terrain régional", objectif: "Directions régionales, démo SI, agents, focus groups — questionnaires terrain." },
  ];

  function docReady(d) {
    return d && d.html && d.html.length >= MIN_HTML && d.sections && d.sections.length > 0;
  }

  function slug(title, idx) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)
      .replace(/^-|-$/g, "");
    return "sec-" + idx + "-" + (base || "section");
  }

  function section(title, level, sections, idx) {
    const id = slug(title, idx);
    sections.push({ id, title: title.trim(), level });
    return { html: `<h${level} id="${id}">${esc(title.trim())}</h${level}>`, idx: idx + 1 };
  }

  function inlineMd(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function markdownToHtml(md) {
    if (!md || !md.trim()) return "";
    const out = [];
    let inUl = false;
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    function closeUl() {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
    }
    lines.forEach((raw) => {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) {
        closeUl();
        return;
      }
      if (line.trim() === "---") {
        closeUl();
        out.push("<hr>");
        return;
      }
      const hm = line.match(/^(#{1,4})\s+(.+)$/);
      if (hm) {
        closeUl();
        const lvl = Math.min(hm[1].length + 1, 4);
        out.push(`<h${lvl}>${inlineMd(hm[2])}</h${lvl}>`);
        return;
      }
      if (/^[-*•]\s+/.test(line.trim())) {
        if (!inUl) {
          out.push("<ul>");
          inUl = true;
        }
        out.push(`<li>${inlineMd(line.trim().replace(/^[-*•]\s+/, ""))}</li>`);
        return;
      }
      closeUl();
      out.push(`<p>${inlineMd(line)}</p>`);
    });
    closeUl();
    return out.join("");
  }

  function renderTable(rows) {
    if (!rows.length) return "";
    const ncol = Math.max(...rows.map((r) => r.length));
    let h = '<table class="md-tbl">';
    rows.forEach((row, i) => {
      const tag = i === 0 ? "th" : "td";
      h += "<tr>";
      for (let j = 0; j < ncol; j++) {
        h += `<${tag}>${esc(row[j] || "")}</${tag}>`;
      }
      h += "</tr>";
    });
    return h + "</table>";
  }

  function parseAgendaText(text) {
    if (!text || text.trim().length < 200) return null;
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const sections = [];
    const blocks = ['<article class="md-prose">'];
    let secIdx = 0;
    let tableRows = [];
    let inTable = false;
    let inUl = false;
    const dayRow = /^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim)\t/;
    const sectionLine = /^(Semaine \d+|Phase pré-lancement|J-?\d+\s+·|JOUR \d+\s+·)/i;

    function flushTable() {
      if (tableRows.length) blocks.push(renderTable(tableRows));
      tableRows = [];
      inTable = false;
    }
    function flushUl() {
      if (inUl) {
        blocks.push("</ul>");
        inUl = false;
      }
    }

    lines.forEach((raw, i) => {
      const line = raw.replace(/\s+$/, "");
      const stripped = line.trim();
      if (!stripped) {
        flushTable();
        flushUl();
        return;
      }
      if (i < 10 && stripped === stripped.toUpperCase() && stripped.length < 80 && stripped.indexOf("AGENDA") < 0) {
        if (i <= 5) {
          blocks.push(`<p class="md-cover">${esc(stripped)}</p>`);
          return;
        }
      }
      if (stripped.indexOf("AGENDA") === 0 || stripped.indexOf("MISSION D'AUDIT") === 0) {
        blocks.push(`<h1>${esc(stripped)}</h1>`);
        return;
      }
      if (stripped === "DOCUMENT DE TRAVAIL OPÉRATIONNEL" || stripped === "Légende des types d'activité" || stripped === "Code Auditeur") {
        flushTable();
        flushUl();
        const s = section(stripped, 2, sections, secIdx);
        secIdx = s.idx;
        blocks.push(s.html);
        return;
      }
      if (sectionLine.test(stripped)) {
        flushTable();
        flushUl();
        const s = section(stripped, stripped.indexOf("Semaine") === 0 ? 2 : 3, sections, secIdx);
        secIdx = s.idx;
        blocks.push(s.html);
        return;
      }
      if (stripped.indexOf("Jour\tDate\tCréneau") === 0) {
        flushUl();
        flushTable();
        tableRows = [stripped.split("\t")];
        inTable = true;
        return;
      }
      if (inTable && dayRow.test(stripped)) {
        tableRows.push(stripped.split("\t"));
        return;
      }
      if (inTable) flushTable();
      if (stripped.indexOf("Objectif :") === 0) {
        flushUl();
        blocks.push(`<p><strong>Objectif :</strong>${esc(stripped.slice(10).trim())}</p>`);
        return;
      }
      if (stripped.indexOf("Cibles prioritaires") === 0) {
        flushUl();
        const s = section(stripped, 3, sections, secIdx);
        secIdx = s.idx;
        blocks.push(s.html);
        return;
      }
      if (stripped.charAt(0) === "•" || stripped.charAt(0) === "\u2022") {
        if (!inUl) {
          blocks.push("<ul>");
          inUl = true;
        }
        blocks.push(`<li>${esc(stripped.replace(/^[•\u2022]\s*/, ""))}</li>`);
        return;
      }
      if (stripped.indexOf("\t") >= 0 && stripped.split("\t").length >= 2) {
        const rows = [stripped.split("\t")];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() && lines[j].indexOf("\t") >= 0) {
          rows.push(lines[j].trim().split("\t"));
          j++;
        }
        blocks.push(renderTable(rows));
        return;
      }
      flushUl();
      blocks.push(`<p>${esc(stripped)}</p>`);
    });

    flushTable();
    flushUl();
    blocks.push("</article>");
    const html = blocks.join("");
    const plain = html.replace(/<[^>]+>/g, " ");
    return {
      html,
      sections,
      plainText: plain,
      title: "Agenda détaillé — 4 semaines",
      charCount: plain.length,
      sourceFile: "Agenda 4 semaines (texte mission)",
      builtAt: "auto",
    };
  }

  function buildCadrage(state, md) {
    const cad = md.cadrage || {};
    if (docReady(cad) || cad.ingestedAt) return cad;
    const sections = [];
    const blocks = ['<article class="md-prose">'];
    let secIdx = 0;
    const l1 = (state.livrables || []).find((l) => l.ref === "L1");
    const l1Text = (l1 && l1.contenu) || "";
    if (l1Text.length > 500) {
      let s = section("Note de cadrage (L1)", 2, sections, secIdx);
      secIdx = s.idx;
      blocks.push(s.html, markdownToHtml(l1Text));
    } else {
      if (cad.finalite) {
        let s = section("Finalité de la mission", 2, sections, secIdx);
        secIdx = s.idx;
        blocks.push(s.html, `<p>${esc(cad.finalite)}</p>`);
      }
      if (cad.methode) {
        let s = section("Méthode", 2, sections, secIdx);
        secIdx = s.idx;
        blocks.push(s.html, `<p>${esc(cad.methode)}</p>`);
      }
    }
    let s = section("Agenda — 4 semaines (synthèse)", 2, sections, secIdx);
    secIdx = s.idx;
    blocks.push(
      s.html,
      "<ul>" +
        AGENDA_SEMAINES.map(
          (w) => `<li><strong>Semaine ${w.s} — ${esc(w.titre)}</strong> : ${esc(w.objectif)}</li>`
        ).join("") +
        "</ul>"
    );
    const hp = state.horsperim || [];
    if (hp.length) {
      s = section("Hors périmètre confirmé", 2, sections, secIdx);
      secIdx = s.idx;
      blocks.push(
        s.html,
        "<ul>" +
          hp
            .map(
              (item) =>
                `<li><strong>${esc(item.ref || "")}</strong> — ${esc(item.titre || "")} : ${esc(item.raison || "")}</li>`
            )
            .join("") +
          "</ul>"
      );
    }
    blocks.push("</article>");
    const html = blocks.join("");
    const plain = html.replace(/<[^>]+>/g, " ");
    return Object.assign({}, cad, {
      html,
      sections,
      plainText: plain,
      title: "Document de cadrage",
      charCount: plain.length,
      sourceFile: "Document de cadrage (cockpit)",
      builtAt: "auto",
    });
  }

  function buildAgenda(state, md) {
    const agenda = md.agenda || {};
    if (docReady(agenda) || agenda.ingestedAt) return agenda;
    const raw = (md.cadrage && md.cadrage.agendaComplement) || agenda.plainText || "";
    const parsed = parseAgendaText(raw);
    return parsed ? Object.assign({}, agenda, parsed) : agenda;
  }

  function buildCharte(state, md) {
    const ch = md.charte || {};
    if (docReady(ch) || ch.ingestedAt) return ch;
    const sections = [];
    const blocks = ['<article class="md-prose">'];
    let secIdx = 0;
    let s = section("Charte du COPIL — réciprocité des échanges", 2, sections, secIdx);
    secIdx = s.idx;
    blocks.push(
      s.html,
      "<p>Cadre d'engagement mutuel entre le MPJIPSC et l'équipe Skydeen pour la collecte, l'accès aux données et la restitution de la mission d'audit pré-déploiement PNIPM.</p>"
    );
    const lancement = (state.gouv || []).find((g) => g.ref === "LANCEMENT");
    const sig = lancement && lancement.signatureCopil;
    if (sig) {
      blocks.push(
        `<p><strong>Charte signée</strong> — ${esc((sig.signataires || []).join(" · "))} (${esc((sig.signedAt || "").slice(0, 10))})</p>`
      );
    } else {
      blocks.push("<p><em>Signature COPIL à confirmer lors de l'instance de lancement.</em></p>");
    }
    CHARTE_ENGAGEMENTS.forEach((block) => {
      let custom = null;
      if (block.cote === "MPJIPSC" && ch.mpjipsc) custom = ch.mpjipsc.split(/[\n;]+/).filter(Boolean);
      if (block.cote.indexOf("Skydeen") >= 0 && (ch.skydeen || ch.portia))
        custom = (ch.skydeen || ch.portia).split(/[\n;]+/).filter(Boolean);
      const items = custom || block.items;
      s = section(block.cote, 2, sections, secIdx);
      secIdx = s.idx;
      blocks.push(s.html, "<ul>" + items.map((it) => `<li>${esc(it)}</li>`).join("") + "</ul>");
    });
    const principes =
      ch.principes ||
      "Approche graduelle NNI/RGPD · traçabilité des pièces · triangulation des sources · transparence via la vue Cabinet.";
    s = section("Principes de collecte", 2, sections, secIdx);
    secIdx = s.idx;
    blocks.push(
      s.html,
      "<ul>" +
        principes
          .split(/[·;]\s*/)
          .filter(Boolean)
          .map((p) => `<li>${esc(p.trim())}</li>`)
          .join("") +
        "</ul>"
    );
    blocks.push("</article>");
    const html = blocks.join("");
    const plain = html.replace(/<[^>]+>/g, " ");
    return Object.assign({}, ch, {
      html,
      sections,
      plainText: plain,
      title: "Charte du COPIL",
      charCount: plain.length,
      sourceFile: "Charte COPIL (cockpit)",
      builtAt: "auto",
    });
  }

  function gapsForModule(gaps, themes) {
    return gaps.filter((g) => themes.some((t) => (g.theme || "").toLowerCase().indexOf(t.toLowerCase()) >= 0));
  }

  function buildCdc(state, md) {
    const cdc = md.cdc || {};
    if (docReady(cdc) || cdc.ingestedAt) return cdc;
    const gaps = state.gaps || [];
    const sections = [];
    const blocks = ['<article class="md-prose">'];
    let secIdx = 0;
    let s = section("Cahier des charges — synthèse mission", 2, sections, secIdx);
    secIdx = s.idx;
    const synthese =
      cdc.synthese ||
      "L'audit de cadrage ne remplace pas le marché plateforme (HP-01) : il alimente une feuille de route réaliste pour le dashboard Cabinet et le portail terrain.";
    blocks.push(s.html, `<p>${esc(synthese)}</p>`);
    s = section("Modules fonctionnels et techniques", 2, sections, secIdx);
    secIdx = s.idx;
    blocks.push(
      s.html,
      "<table class='md-tbl'><tr><th>Module</th><th>Réf. CDC</th><th>Exigences</th><th>Confirmées</th><th>À compléter</th><th>À ajuster</th></tr>" +
        CDC_MODULES.map((mod) => {
          const sub = gapsForModule(gaps, mod.themes);
          const conf = sub.filter((g) => g.verdict === "confirme").length;
          const comp = sub.filter((g) => g.verdict === "completer").length;
          const aj = sub.filter((g) => g.verdict === "ajuster").length;
          return `<tr><td><strong>${esc(mod.n)}</strong></td><td>${esc(mod.cdc)}</td><td>${sub.length}</td><td>${conf}</td><td>${comp}</td><td>${aj}</td></tr>`;
        }).join("") +
        "</table>"
    );
    s = section("Exigences prioritaires (aperçu)", 2, sections, secIdx);
    secIdx = s.idx;
    blocks.push(
      s.html,
      "<ul>" +
        gaps
          .slice(0, 25)
          .map(
            (g) =>
              `<li><strong>${esc(g.ref || "")}</strong> — ${esc(g.lib || g.titre || "")} <em>(${esc(g.verdict || "")})</em></li>`
          )
          .join("") +
        (gaps.length > 25 ? `<li><em>… et ${gaps.length - 25} autres exigences dans la matrice d'écart.</em></li>` : "") +
        "</ul>"
    );
    blocks.push("</article>");
    const html = blocks.join("");
    const plain = html.replace(/<[^>]+>/g, " ");
    return Object.assign({}, cdc, {
      html,
      sections,
      plainText: plain,
      title: "Cahier des charges PNIPM",
      charCount: plain.length,
      sourceFile: "Cahier des charges (cockpit + matrice)",
      builtAt: "auto",
    });
  }

  function ensure(md, state) {
    if (!md || !md.cadrage) return md;
    const out = Object.assign({}, md);
    let built = false;
    [["cadrage", buildCadrage], ["agenda", buildAgenda], ["charte", buildCharte], ["cdc", buildCdc]].forEach(([key, fn]) => {
      const cur = out[key] || {};
      if (cur.ingestedAt || docReady(cur)) return;
      const doc = fn(state, out);
      if (doc && doc.html) {
        out[key] = doc;
        built = true;
      }
    });
    if (built) out.builtAt = new Date().toISOString();
    return out;
  }

  window.PortiaMissionDocsBuild = { ensure, docReady, parseAgendaText };
})();

/**
 * Mission PNIPM — cadrage, charte COPIL, alignement CDC, hub auditeurs, rapports IA, référence AO
 */
(function () {
  "use strict";

  const REF_LINKS_DEF = [
    { k: "presentation", lbl: "Présentation AO", path: "/presentation", desc: "Réponse structurée au cahier des charges MPJIPSC." },
    { k: "dashboard", lbl: "Dashboard ministériel", path: "/dashboard", desc: "Vision ERP cible : pilotage Cabinet, indicateurs, drill-down." },
    { k: "portail", lbl: "Portail jeunes & opérateurs", path: "/portail", desc: "Parcours terrain, coordinateurs et opérateurs de programmes." },
  ];

  function getRefBase() {
    const c = window.PORTIA_SERVER_CONFIG || window._portiaServerConfig || {};
    return String(c.pnipmRefBase || "").trim().replace(/\/+$/, "");
  }

  function refLinks() {
    const base = getRefBase();
    if (!base) return [];
    return REF_LINKS_DEF.map((l) => ({ ...l, url: base + l.path }));
  }
    {
      s: 1,
      titre: "Cadrage stratégique",
      objectif: "Commande politique, sponsors, périmètre, Data Room initiale, COPIL de lancement.",
      jalons: ["Lancement COPIL · Charte signée", "Entretiens Cabinet & stratégie", "Note de cadrage L1"],
    },
    {
      s: 2,
      titre: "Deep-dive programmatique",
      objectif: "Directions métiers, SIGFIP, programmatique / non-programmatique, lacunes collecte.",
      jalons: ["Entretiens DPSD / DAF / directions", "Grille qualité données", "Constats programmatiques"],
    },
    {
      s: 3,
      titre: "Volet B & intégrations",
      objectif: "RH, patrimoine, marchés, GED, DSI, RSSI/DPO, flux et interopérabilité.",
      jalons: ["Volet B structuré", "Cartographie flux & écosystème", "Matrice d'écart consolidée"],
    },
    {
      s: 4,
      titre: "Terrain régional",
      objectif: "Directions régionales, démo SI, agents, focus groups — questionnaires terrain.",
      jalons: ["Entretiens terrain S4", "Synthèse régionale", "Préparation restitution"],
    },
  ];

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
    { id: "pilotage", n: "Pilotage Cabinet & drill-down", cdc: "§ Fonc. 3.1", themes: ["Fonctionnel", "Politique"] },
    { id: "prog", n: "Programmatique / non-programmatique", cdc: "§ Fonc. 3.2", themes: ["Fonctionnel", "Programmatique", "Collecte"] },
    { id: "voletb", n: "Volet B (RH, flotte, GED, marchés)", cdc: "§ Fonc. 3.9", themes: ["Fonctionnel"] },
    { id: "donnees", n: "Données & référentiels", cdc: "§ Données 2.x", themes: ["Données"] },
    { id: "interop", n: "Interopérabilité (SIGFIP, UXP, NNI)", cdc: "§ Interop 5.x", themes: ["Interop"] },
    { id: "archi", n: "Architecture & SI", cdc: "§ Tech 4.x", themes: ["Architecture", "Réseau"] },
    { id: "securite", n: "Sécurité & conformité", cdc: "§ Sécu 6.x", themes: ["Sécurité"] },
    { id: "perf", n: "Performance & exploitation", cdc: "§ Perf 7.x", themes: ["Performance"] },
  ];

  const AGENDA_SEMAINES = [
    if (window.PortiaAuditors) return PortiaAuditors.auditorCodeFromUser(App.user);
    const sr = App.user && App.user.serverRole;
    if (sr === "auditeur_b") return "A";
    if (sr === "auditeur_t") return "L";
    if (App.user && App.user.role === "auditeur") return "A";
    return null;
  }

  function myEntretiens() {
    if (window.PortiaMissionExt && window.PortiaMissionExt.myEntretiens) {
      return window.PortiaMissionExt.myEntretiens();
    }
    const code = auditorCode();
    const all = Store.get("entretiens");
    if (!code) return all;
    const match = window.PortiaAuditors
      ? (e) => PortiaAuditors.audMatches(e.aud, code)
      : (e) => e.aud === code || e.aud === "A+L";
    return all.filter(match);
  }

  function gapsByModule(mod) {
    const gaps = Store.get("gaps") || [];
    return gaps.filter((g) => mod.themes.some((t) => (g.theme || "").toLowerCase().includes(t.toLowerCase())));
  }

  function registerViews() {
    VIEWS.hub_auditeur = function () {
      const v = el("div", { class: "view" });
      const code = auditorCode();
      const mine = myEntretiens();
      const done = mine.filter((e) => e.statut === "realise").length;
      const plan = mine.filter((e) => e.statut === "planifie").sort((a, b) => a.j - b.j || a.heure.localeCompare(b.heure));
      const next = plan[0];
      const dm = metrics();
      v.innerHTML =
        pageHead(
          "Collecte terrain · MPJIPSC",
          code ? "Espace auditeur " + code : "Espace auditeur",
          "Questionnaires par service, dépôt de pièces, observations et comptes rendus — méthode type cabinet d'audit (investigation → confrontation → co-construction).",
          `<button class="btn terra" onclick="App.go('conduct')">${svgI(ICON.conduct)} Conduire un entretien</button>`
        ) +
        `<div class="kpis" style="margin-bottom:18px">
        <div class="kpi"><div class="top"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.entretiens)}</div><span class="lbl">Mes entretiens</span></div>
        <div class="val">${done}<small>/${mine.length}</small></div><div class="bar"><i style="width:${mine.length ? Math.round((done / mine.length) * 100) : 0}%;background:var(--terra)"></i></div></div>
        <div class="kpi"><div class="top"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${svgI(ICON.dataroom)}</div><span class="lbl">Pièces à verser</span></div>
        <div class="val">${dm.docCollecteTot - dm.docCollecteRecu}<small>/${dm.docCollecteTot}</small></div><div class="sub">Attendus ministère (hors annexes CDC)</div></div>
        <div class="kpi"><div class="top"><div class="ic" style="background:var(--sage-soft);color:var(--sage-deep)">${svgI(ICON.constats)}</div><span class="lbl">Constats saisis</span></div>
        <div class="val">${Store.get("constats").length}</div><div class="sub">Observations terrain</div></div>
      </div>
      ${next ? `<div class="note terra" style="margin-bottom:16px"><b>Prochain entretien</b> — ${esc(next.n)} · ${Store.fmtDate(next.j)} ${esc(next.heure)} · ${esc(next.struct)}<br>
        <button class="btn dark sm" style="margin-top:10px" id="hubNextBtn">Lancer la conduite</button></div>` : ""}
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:20px">
        <div class="card clk pad" onclick="App.go('agenda')"><b>Mon agenda</b><p class="muted" style="font-size:12px;margin-top:6px">Programme S1→S4 filtré</p></div>
        <div class="card clk pad" onclick="App.go('depot')"><b>Déposer des documents</b><p class="muted" style="font-size:12px;margin-top:6px">Répertoires R1→R11</p></div>
        <div class="card clk pad" onclick="App.go('lacunes')"><b>Lacunes collecte</b><p class="muted" style="font-size:12px;margin-top:6px">4 sujets suivis</p></div>
        <div class="card clk pad" onclick="App.go('voletb')"><b>Volet B</b><p class="muted" style="font-size:12px;margin-top:6px">RH · flotte · GED</p></div>
        <div class="card clk pad" onclick="App.go('consaud')"><b>Constats & obs.</b><p class="muted" style="font-size:12px;margin-top:6px">Formaliser les écarts</p></div>
        <div class="card clk pad" onclick="App.go('ecart')"><b>Matrice d'écart CDC</b><p class="muted" style="font-size:12px;margin-top:6px">Exigences vs réalité observée</p></div>
        <div class="card clk pad" onclick="App.go('cdc_tech')"><b>Checklist CDC tech.</b><p class="muted" style="font-size:12px;margin-top:6px">Preuves & démonstrations</p></div>
        <div class="card clk pad" onclick="App.go('cadrage')"><b>Cadrage mission</b><p class="muted" style="font-size:12px;margin-top:6px">Périmètre & méthode</p></div>
        <div class="card clk pad" onclick="App.go('docs_mission')"><b>Documents mission</b><p class="muted" style="font-size:12px;margin-top:6px">Cadrage · Agenda · Charte · CDC</p></div>
        <div class="card clk pad" onclick="App.go('charte')"><b>Charte COPIL</b><p class="muted" style="font-size:12px;margin-top:6px">Engagements réciproques</p></div>
        <div class="card clk pad" onclick="App.go('assistant')"><b>Assistant IA</b><p class="muted" style="font-size:12px;margin-top:6px">Aide à la rédaction</p></div>
      </div>
      <div class="card"><div class="card-h"><h3>Checklist du jour</h3><div class="actions"><button type="button" class="btn ghost sm" id="hubChkGo" style="display:none">Mes tâches</button></div></div><div class="card-b stack" id="hubChk"><p class="muted" style="font-size:13px">Chargement…</p></div></div>`;
      if (next) {
        const nb = v.querySelector("#hubNextBtn");
        if (nb) {
          nb.onclick = () => {
            App.conductId = next.id;
            App.go("conduct");
          };
        }
      }
      if (window.PortiaMissionTasks && PortiaMissionTasks.renderHubChecklist) {
        PortiaMissionTasks.renderHubChecklist(v.querySelector("#hubChk"), v.querySelector("#hubChkGo"));
      }
      return v;
    };

    VIEWS.cadrage = function () {
      const v = el("div", { class: "view" });
      const hp = Store.get("horsperim") || [];
      const cad =
        (window.PortiaMissionExt && PortiaMissionExt.getMissionDocs && PortiaMissionExt.getMissionDocs().cadrage) || {};
      const finalite =
        cad.finalite ||
        "Connaître l'infrastructure, les processus, les contraintes juridiques et les données disponibles pour concevoir la plateforme cible (dashboard Cabinet + portail terrain) sans risque de dérive au déploiement.";
      const methode =
        cad.methode ||
        "Trois axes (Politique · Programmatique · Technique), entretiens structurés, Data Room probante, matrice d'écart CDC, restitution COPIL.";
      const agendaNote =
        cad.agendaComplement && cad.agendaComplement.length < 400
          ? `<div class="note slate" style="margin-top:12px;font-size:13px"><b>Complément agenda :</b> ${esc(cad.agendaComplement)}</div>`
          : `<div class="note slate" style="margin-top:12px;font-size:13px"><b>Agenda détaillé :</b> consultez l'onglet <button class="btn ghost sm" type="button" onclick="App.navCtx={docTab:'agenda'};App.go('docs_mission')">Agenda S1–S4</button> dans Documents mission.</div>`;
      v.innerHTML =
        pageHead(
          "Document de cadrage",
          "Mission d'audit pré-Plateforme PNIPM",
          "Audit de cadrage (4 semaines) avant déploiement de l'ERP ministériel et du portail jeunes/opérateurs — collecte du contexte technique et métier.",
          `<button class="btn ghost" onclick="App.go('docs_mission')">${svgI(ICON.dataroom)} Consulter le cadrage</button><button class="btn ghost" onclick="App.go('ref_pnipm')">${svgI(ICON.cockpit)} Réf. AO</button>`
        ) +
        `<div class="card" style="margin-bottom:16px"><div class="card-b">
        <p style="font-size:14px;line-height:1.6;margin-bottom:12px"><b>Finalité :</b> ${esc(finalite)}</p>
        <p style="font-size:14px;line-height:1.6"><b>Méthode :</b> ${esc(methode)}</p>${agendaNote}
      </div></div>
      <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Agenda — 4 semaines</h3><span class="bdg neutral">J${Store.clockJ >= 0 ? "+" + Store.clockJ : Store.clockJ}</span></div><div class="card-b stack">
      ${AGENDA_SEMAINES.map(
        (w) =>
          `<div style="border-left:3px solid var(--terra);padding-left:14px"><div class="between" style="margin-bottom:6px"><b style="font-family:var(--font-display)">Semaine ${w.s} — ${esc(w.titre)}</b><button class="btn ghost sm" onclick="App.go('agenda')">Détail</button></div>
          <p class="muted" style="font-size:13px;margin-bottom:8px">${esc(w.objectif)}</p>
          <div class="chiprow">${w.jalons.map((j) => `<span class="tag">${esc(j)}</span>`).join("")}</div></div>`
      ).join("")}
      </div></div>
      <div class="card"><div class="card-h"><h3>Hors périmètre confirmé</h3></div><div class="card-b">
      ${hp.map((h) => `<div class="alert-i"><div class="bd"><b class="mono">${esc(h.ref)}</b> — ${esc(h.titre)}<span>${esc(h.raison)}</span></div></div>`).join("") || "<p class='muted'>—</p>"}
      </div></div>`;
      return v;
    };

    VIEWS.charte = function () {
      const v = el("div", { class: "view" });
      const lancement = (Store.get("gouv") || []).find((g) => g.ref === "LANCEMENT");
      const sig = lancement && lancement.signatureCopil;
      const ch =
        (window.PortiaMissionExt && PortiaMissionExt.getMissionDocs && PortiaMissionExt.getMissionDocs().charte) || {};
      const extraPrinc =
        ch.principes &&
        `<div class="card" style="margin-top:16px"><div class="card-h"><h3>Principes (texte mission)</h3></div><div class="card-b"><p style="font-size:13px;line-height:1.7;color:var(--txt-2)">${esc(ch.principes)}</p></div></div>`;
      v.innerHTML =
        pageHead(
          "Gouvernance",
          "Charte du COPIL — réciprocité des échanges",
          "Cadre d'engagement mutuel entre le MPJIPSC et l'équipe Skydeen pour la collecte, l'accès aux données et la restitution.",
          `<button class="btn ghost" onclick="App.go('docs_mission')">${svgI(ICON.dataroom)} Consulter la charte</button><button class="btn ghost" onclick="App.go('gouv')">${svgI(ICON.gouv)} Instances COPIL</button>`
        ) +
        (sig
          ? `<div class="note sage" style="margin-bottom:16px"><b>Charte signée</b> — ${esc((sig.signataires || []).join(" · "))} · ${esc((sig.signedAt || "").slice(0, 10))}</div>`
          : `<div class="note warn" style="margin-bottom:16px">Signature COPIL à confirmer dans l'instance de lancement.</div>`) +
        `        <div class="row">${CHARTE_ENGAGEMENTS.map((b) => {
          const custom =
            b.cote === "MPJIPSC" && ch.mpjipsc
              ? ch.mpjipsc.split(/\n+/).filter(Boolean)
              : b.cote.indexOf("Skydeen") >= 0 && (ch.skydeen || ch.portia)
                ? (ch.skydeen || ch.portia).split(/\n+/).filter(Boolean)
                : null;
          const items = custom || b.items;
          return `<div class="col card" style="min-width:280px"><div class="card-h"><h3>${esc(b.cote)}</h3></div><div class="card-b stack">${items
            .map((it) => `<div style="display:flex;gap:8px;font-size:13px"><span style="color:var(--terra)">▸</span><span>${esc(it)}</span></div>`)
            .join("")}</div></div>`;
        }).join("")}</div>
        ${extraPrinc || ""}
        <div class="card" style="margin-top:16px"><div class="card-h"><h3>Principes de collecte des données</h3></div><div class="card-b">
        <ul style="font-size:13px;line-height:1.7;padding-left:18px;color:var(--txt-2)">
        <li>Approche graduelle pour les données sensibles (NNI, données personnelles)</li>
        <li>Traçabilité : chaque pièce est versée avec source, répertoire et convention de nommage</li>
        <li>Triangulation : croiser déclarations, documents et observations terrain</li>
        <li>Transparence : vue Cabinet en lecture pour rendre compte de l'avancement</li>
        </ul></div></div>`;
      return v;
    };

    VIEWS.cdc = function () {
      const v = el("div", { class: "view" });
      const gaps = Store.get("gaps") || [];
      const gConf = gaps.filter((g) => g.verdict === "confirme").length;
      const gComp = gaps.filter((g) => g.verdict === "completer").length;
      const gAj = gaps.filter((g) => g.verdict === "ajuster").length;
      const gCad = gaps.filter((g) => g.verdict === "caduc").length;
      const rows = CDC_MODULES.map((mod) => {
        const sub = gapsByModule(mod);
        const conf = sub.filter((g) => g.verdict === "confirme").length;
        const comp = sub.filter((g) => g.verdict === "completer").length;
        const aj = sub.filter((g) => g.verdict === "ajuster").length;
        const uniq = new Set(sub.map((g) => g.ref)).size;
        return { mod, sub, conf, comp, aj, uniq };
      });
      const moduleLinks = rows.reduce((s, r) => s + r.sub.length, 0);
      v.innerHTML =
        pageHead(
          "Cahier des charges",
          "Alignement CDC ↔ audit de cadrage",
          "Lecture des exigences de la plateforme ministérielle cible à la lumière des constats et de la matrice d'écart (" +
          gaps.length +
          " exigences uniques G-01→G-" +
          String(gaps.length).padStart(2, "0") +
          ").",
          `<button class="btn ghost" onclick="App.navCtx={docTab:'cdc'};App.go('docs_mission')">${svgI(ICON.dataroom)} Consulter le CDC</button><button class="btn ghost" onclick="App.go('ecart')">${svgI(ICON.ecart)} Matrice détaillée</button>`
        ) +
        (function () {
          const syn = (window.PortiaMissionExt && PortiaMissionExt.getMissionDocs && PortiaMissionExt.getMissionDocs().cdc && PortiaMissionExt.getMissionDocs().cdc.synthese) || "";
          return syn
            ? `<div class="note slate" style="margin-bottom:16px;font-size:13px;line-height:1.6"><b>Synthèse mission :</b> ${esc(syn)}</div>`
            : "";
        })() +
        `<div class="kpis" style="margin-bottom:14px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">
          <div class="kpi"><div class="lbl">Exigences (matrice)</div><div class="val">${gaps.length}</div></div>
          <div class="kpi"><div class="lbl">Confirmés</div><div class="val" style="color:var(--ok)">${gConf}</div></div>
          <div class="kpi"><div class="lbl">À ajuster</div><div class="val" style="color:var(--warn)">${gAj}</div></div>
          <div class="kpi"><div class="lbl">À compléter</div><div class="val" style="color:var(--crit)">${gComp}</div></div>
          ${gCad ? `<div class="kpi"><div class="lbl">Caducs</div><div class="val">${gCad}</div></div>` : ""}
        </div>
        <div class="note slate" style="margin-bottom:16px;font-size:12.5px;line-height:1.55">Les cartes modules ci-dessous comptent les <b>rattachements thématiques</b> (${moduleLinks} liens) : une même exigence peut apparaître dans plusieurs modules CDC. La matrice d'écart reste la référence avec <b>${gaps.length} lignes uniques</b>.</div>
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:18px">
        ${rows
          .map(
            (r) =>
              `<div class="card pad" style="cursor:pointer;border-top:3px solid ${r.sub.length ? "var(--terra)" : "var(--line)"}" onclick="App.go('ecart')">
            <div class="mono" style="font-size:10px;color:var(--txt-3)">${esc(r.mod.cdc)}</div>
            <b style="font-family:var(--font-display);font-size:15px;display:block;margin:6px 0">${esc(r.mod.n)}</b>
            <div class="chiprow"><span class="tag">${r.uniq} exig. · ${r.sub.length} liens</span>
            <span class="bdg ok">${r.conf} confirmés</span><span class="bdg warn">${r.comp} à compléter</span></div>
          </div>`
          )
          .join("")}
        </div>
        <div class="card"><div class="card-h"><h3>Modules de la proposition cible (référence AO)</h3></div><div class="card-b">
        <p class="muted" style="font-size:13px;margin-bottom:12px">L'audit ne construit pas la plateforme (hors périmètre HP-01) : il qualifie le contexte pour sécuriser le déploiement du dashboard ministériel et du portail jeunes/opérateurs.</p>
        <button class="btn terra" onclick="App.go('ref_pnipm')">Ouvrir les maquettes de réponse AO</button>
        </div></div>`;
      return v;
    };

    VIEWS.rapports = function () {
      const v = el("div", { class: "view" });
      const livs = Store.get("livrables") || [];
      const prompts = {
        L1: "Rédige la Note de cadrage validée (L1) : périmètre, méthodologie, agenda 4 semaines, gouvernance COPIL, engagements réciproques. Ton formel, destiné au MPJIPSC.",
        L2: "Rédige la Note d'organisation de la mission (L2) : équipe, rôles auditeurs B/T, outils de collecte, Data Room, calendrier des instances.",
        L3: "Rédige le Rapport de la semaine 1 (cadrage stratégique) : synthèse entretiens Cabinet, constats politiques, zones grises.",
        L4: "Rédige le Rapport de la semaine 2 (programmatique) : SIGFIP, prog/non-prog, lacunes données.",
        L5: "Rédige le Rapport de la semaine 3 (volet B & SI) : RH, marchés, DSI, sécurité, flux.",
        L6: "Rédige le Rapport de la semaine 4 (terrain) : régions, focus groups, recommandations opérationnelles.",
        L7: "Rédige le Rapport final de cadrage (L7) : synthèse exécutive, matrice d'écart, feuille de route pré-déploiement plateforme PNIPM, risques résiduels.",
      };
      v.innerHTML =
        pageHead(
          "Livrables & restitution",
          "Atelier de génération des rapports",
          "L'IA propose des brouillons structurés à partir de l'état de la mission — relecture et validation humaine obligatoires avant diffusion COPIL.",
          ""
        ) +
        `<div class="note slate" style="margin-bottom:16px">Chaque livrable s'appuie sur les entretiens, constats, gaps et Data Room actuellement enregistrés dans le cockpit.</div>
        <div class="stack" id="repList"></div>
        <div class="card" style="margin-top:8px"><div class="card-h"><h3>Rapports transverses</h3></div><div class="card-b" style="display:flex;flex-wrap:wrap;gap:10px">
        <button class="btn ghost" id="rpAtelier">Note d'atelier COPIL (IA)</button>
        <button class="btn ghost" id="rpExec">Synthèse exécutive Cabinet (IA)</button>
        <button class="btn ghost" id="rpFeuille">Feuille de route pré-déploiement (IA)</button>
      </div></div>`;
      const list = v.querySelector("#repList");
      livs.forEach((l) => {
        const card = el("div", { class: "card", style: "margin-bottom:12px" });
        card.innerHTML = `<div class="card-b" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
          <div style="flex:1;min-width:200px"><b class="mono" style="color:var(--sage-deep)">${esc(l.ref)}</b> — ${esc(l.titre)}
          <div class="muted" style="font-size:12px;margin-top:4px">${esc(l.desc || "")}</div>
          <div class="pline" style="margin-top:8px;height:5px"><i style="width:${l.progress || 0}%"></i></div></div>
          <button class="btn ai">${svgI(ICON.assistant)} Brouillon IA</button>
          <span class="bdg ${(window.LIV_STATUTS && LIV_STATUTS[l.statut] && LIV_STATUTS[l.statut].cls) || "neutral"}">${esc(l.statut)}</span>
        </div>`;
        card.querySelector("button").onclick = () => {
          const pr = prompts[l.ref] || "Rédige un brouillon de livrable pour " + l.titre;
          aiRunModal({
            title: l.ref + " — " + l.titre,
            eyebrow: "Génération livrable",
            intro: "Brouillon généré automatiquement — à valider par le Directeur de Projet Audit.",
            runFn: (onT) => AI.chat([{ role: "user", content: pr }], onT),
            saveLabel: "Copier dans le presse-papier",
            onSave: (txt) => {
              navigator.clipboard && navigator.clipboard.writeText(txt);
              toast("Brouillon", "Texte copié — intégrez-le dans votre outil de rédaction", "ok");
            },
          });
        };
        list.appendChild(card);
      });
      v.querySelector("#rpAtelier").onclick = () =>
        aiRunModal({
          title: "Note d'atelier COPIL",
          eyebrow: "Restitution",
          runFn: (onT) =>
            AI.chat(
              [{ role: "user", content: "Prépare une note d'atelier COPIL : faits saillants, décisions attendues, points d'arbitrage, prochaines étapes." }],
              onT
            ),
        });
      v.querySelector("#rpExec").onclick = () =>
        aiRunModal({
          title: "Synthèse exécutive Cabinet",
          eyebrow: "Vue politique",
          runFn: (onT) =>
            AI.chat(
              [{ role: "user", content: "Rédige une synthèse exécutive pour le Cabinet (1 page) : avancement, 5 constats majeurs, risques, recommandations prioritaires pour la plateforme PNIPM." }],
              onT
            ),
        });
      v.querySelector("#rpFeuille").onclick = () =>
        aiRunModal({
          title: "Feuille de route pré-déploiement",
          eyebrow: "Vers la plateforme cible",
          runFn: (onT) =>
            AI.chat(
              [
                {
                  role: "user",
                  content:
                    "Propose une feuille de route pour passer de l'audit de cadrage au déploiement de la plateforme (dashboard ministériel + portail jeunes/opérateurs) : prérequis data, architecture, gouvernance, phasage.",
                },
              ],
              onT
            ),
        });
      return v;
    };

    VIEWS.pilotage = function () {
      const v = el("div", { class: "view" });
      const f = { axe: "all", struct: "all", sem: "all", q: "" };
      const structs = [...new Set(Store.get("entretiens").map((e) => e.struct))].sort();
      v.innerHTML =
        pageHead(
          "Pilotage transversal",
          "Explorateur par secteur & problématique",
          "Filtrez l'ensemble des entretiens, constats et documents collectés — vue 360° pour l'administration de mission.",
          ""
        ) +
        `<div class="fbar">
        <input class="search" id="plQ" placeholder="Rechercher structure, constat, document…">
        <select class="fselect" id="plAxe"><option value="all">Tous axes</option><option>Politique</option><option>Programmatique</option><option>Technique</option></select>
        <select class="fselect" id="plStruct"><option value="all">Toutes structures</option>${structs.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
        <select class="fselect" id="plSem"><option value="all">Toutes semaines</option><option value="1">S1</option><option value="2">S2</option><option value="3">S3</option><option value="4">S4</option></select>
      </div>
      <div class="row" style="margin-bottom:16px">
        <div class="col card" style="flex:1"><div class="card-h"><h3>Entretiens</h3></div><div class="card-b scroll" style="max-height:320px" id="plEnt"></div></div>
        <div class="col card" style="flex:1"><div class="card-h"><h3>Constats</h3></div><div class="card-b scroll" style="max-height:320px" id="plCons"></div></div>
        <div class="col card" style="flex:1"><div class="card-h"><h3>Documents</h3></div><div class="card-b scroll" style="max-height:320px" id="plDocs"></div></div>
      </div>`;
      function matchEnt(e) {
        if (f.axe !== "all" && e.axe !== f.axe) return false;
        if (f.struct !== "all" && e.struct !== f.struct) return false;
        if (f.sem !== "all" && String(e.sem) !== f.sem) return false;
        if (f.q) {
          const t = (e.n + e.struct + (e.cr || "")).toLowerCase();
          if (!t.includes(f.q.toLowerCase())) return false;
        }
        return true;
      }
      function render() {
        const ent = Store.get("entretiens").filter(matchEnt);
        const cons = Store.get("constats").filter((c) => {
          if (f.axe !== "all" && c.axe !== f.axe) return false;
          if (f.struct !== "all" && c.struct !== f.struct) return false;
          if (f.q && !(c.titre + c.desc).toLowerCase().includes(f.q.toLowerCase())) return false;
          return true;
        });
        const docs = Store.get("docs").filter((d) => {
          if (window.isTestDoc && isTestDoc(d)) return false;
          if (f.q && !(d.desc + d.source).toLowerCase().includes(f.q.toLowerCase())) return false;
          return true;
        });
        v.querySelector("#plEnt").innerHTML =
          ent
            .map(
              (e) =>
                `<div class="alert-i clk" data-eid="${esc(e.id)}"><div class="bd"><b>${esc(e.n)}</b><span>${esc(e.struct)} · ${statutBadge(e.statut)}</span></div></div>`
            )
            .join("") || "<p class='muted'>Aucun</p>";
        v.querySelector("#plCons").innerHTML =
          cons
            .map(
              (c) =>
                `<div class="alert-i clk" data-cid="${esc(c.id)}"><div class="bd"><b>${esc(c.ref)}</b><span>${esc(c.titre)}</span></div>${critBadge(c.crit)}</div>`
            )
            .join("") || "<p class='muted'>Aucun</p>";
        v.querySelector("#plDocs").innerHTML =
          docs
            .slice(0, 40)
            .map((d) => `<div class="file-i"><div class="bd"><b>${esc(docName(d))}</b><span>${esc(d.rep)} · ${window.PortiaLabels ? PortiaLabels.fmtEnum(d.statut) : esc(d.statut)}</span></div></div>`)
            .join("") || "<p class='muted'>Aucun</p>";
        v.querySelectorAll("[data-eid]").forEach((n) => {
          n.onclick = () => openEntretien(n.dataset.eid, !App.user?.readOnly);
        });
        v.querySelectorAll("[data-cid]").forEach((n) => {
          n.onclick = () => {
            if (window.openConstat) openConstat(n.dataset.cid);
            else App.go("constats");
          };
        });
      }
      ["#plQ", "#plAxe", "#plStruct", "#plSem"].forEach((sel) => {
        const elx = v.querySelector(sel);
        elx.addEventListener(sel === "#plQ" ? "input" : "change", (e) => {
          if (sel === "#plQ") f.q = e.target.value;
          else f[sel === "#plAxe" ? "axe" : sel === "#plStruct" ? "struct" : "sem"] = e.target.value;
          render();
        });
      });
      render();
      return v;
    };

    VIEWS.ref_pnipm = function () {
      const v = el("div", { class: "view" });
      const links = refLinks();
      const linksHtml = links.length
        ? `<div class="row" style="margin-bottom:18px">${links
            .map(
              (l) =>
                `<div class="col card pad" style="min-width:260px;flex:1;border-top:3px solid var(--gold)">
            <b style="font-family:var(--font-display);font-size:16px">${esc(l.lbl)}</b>
            <p class="muted" style="font-size:12px;margin:10px 0 14px;line-height:1.5">${esc(l.desc)}</p>
            <a class="btn terra" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a>
          </div>`
            )
            .join("")}</div>`
        : `<div class="note slate" style="margin-bottom:18px">Les maquettes AO en ligne ne sont pas configurées sur ce serveur (variable <code>PNIPM_REF_BASE</code>). Consultez les documents mission et le cadrage dans le cockpit.</div>`;
      v.innerHTML =
        pageHead(
          "Appel d'offres · MPJIPSC",
          "Référence — proposition Skydeen",
          "Maquettes de la réponse au cahier des charges : dashboard ministériel (ERP + IA) et portail jeunes / coordinateurs / opérateurs.",
          ""
        ) +
        linksHtml +
        `<div class="card"><div class="card-b">
        <p style="font-size:14px;line-height:1.65"><b>Lien avec cet audit cockpit :</b> la présentation AO décrit la cible. Ce cockpit documente l'état des lieux, les écarts et les prérequis avant construction. Les livrables L1→L7 alimentent la décision de lancement du marché plateforme.</p>
        </div></div>`;
      return v;
    };

    CRUMB.hub_auditeur = "Espace auditeur";
    CRUMB.cadrage = "Document de cadrage";
    CRUMB.charte = "Charte COPIL";
    CRUMB.cdc = "Alignement CDC";
    CRUMB.rapports = "Rapports & livrables";
    CRUMB.pilotage = "Explorateur pilotage";
    CRUMB.ref_pnipm = "Référence AO PNIPM";
  }

  function patchNav() {
    if (!window.NAV) return;
    const missionAdmin = [
      { k: "cadrage", lbl: "Cadrage mission", ic: "compass" },
      { k: "charte", lbl: "Charte COPIL", ic: "shield" },
      { k: "cdc", lbl: "Alignement CDC", ic: "scale" },
      { k: "pilotage", lbl: "Explorateur", ic: "layers" },
    ];
    const missionAnalyse = [
      { k: "rapports", lbl: "Rapports IA", ic: "sparkles" },
      { k: "ref_pnipm", lbl: "Référence AO", ic: "book" },
    ];
    if (NAV.admin && NAV.admin[0]) {
      NAV.admin[0].items = missionAdmin.concat(NAV.admin[0].items.filter((i) => !missionAdmin.some((m) => m.k === i.k)));
      if (NAV.admin[2]) NAV.admin[2].items = NAV.admin[2].items.concat(missionAnalyse.filter((m) => !NAV.admin[2].items.some((x) => x.k === m.k)));
    }
    if (NAV.auditeur && NAV.auditeur[0] && window.PortiaAuditorNav && PortiaAuditorNav.ensureAuditorNav) {
      PortiaAuditorNav.ensureAuditorNav();
    } else if (NAV.auditeur && NAV.auditeur[0]) {
      NAV.auditeur[0].items = [
        { k: "hub_auditeur", lbl: "Mon espace", ic: "home" },
        { k: "docs_mission", lbl: "Documents mission", ic: "library" },
        { k: "cdc", lbl: "Alignement CDC", ic: "scale" },
      ].concat(
        NAV.auditeur[0].items.filter(
          (i) =>
            !["hub_auditeur", "docs_mission", "charte", "cadrage", "cdc"].includes(i.k)
        )
      );
    }
  }

  function patchAppRoutes() {
    const origEnter = App.enter.bind(App);
    App.enter = function () {
      origEnter();
      const sr = App.user && App.user.serverRole;
      if (App.user && App.user.role === "auditeur") {
        if (window.PortiaAuditors && PortiaAuditors.refreshUserHeader) {
          PortiaAuditors.refreshUserHeader(App.user);
        }
        if (location.hash.replace("#", "") === "cockpit" || !location.hash) {
          const def = App.allowed("hub_auditeur") ? "hub_auditeur" : "agenda";
          if (App.route === "cockpit" || App.route === "agenda") App.go(def);
        }
      }
      if (App.user && (App.user.role === "cabinet" || App.user.serverRole === "cabinet")) {
        const h = location.hash.replace("#", "").trim();
        if (!h || !App.allowed(h)) App.go("cockpit");
      }
    };

    const origAgenda = VIEWS.agenda;
    if (origAgenda && !VIEWS._agendaAudPatch) {
      VIEWS.agenda = function () {
        const v = origAgenda();
        const code = auditorCode();
        if (code && v.querySelector("#agAud")) {
          v.querySelector("#agAud").value = code;
          v.querySelector("#agAud").dispatchEvent(new Event("change"));
        }
        return v;
      };
      VIEWS._agendaAudPatch = true;
    }
  }

  function init() {
    registerViews();
    patchNav();
    patchAppRoutes();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  window.PortiaMission = { init, AGENDA_SEMAINES, CDC_MODULES, getRefBase, refLinks };
})();

/**
 * Brouillons IA — persistance serveur (livrables.contenu + reportDrafts)
 */
(function () {
  "use strict";

  const TRANSVERSE = {
    copil_atelier: { lbl: "Note d'atelier COPIL", prompt: "Prépare une note d'atelier COPIL : faits saillants, décisions attendues, points d'arbitrage, prochaines étapes." },
    cabinet_exec: { lbl: "Synthèse exécutive Cabinet", prompt: "Rédige une synthèse exécutive pour le Cabinet (1 page) : avancement, 5 constats majeurs, risques, recommandations prioritaires pour la plateforme PNIPM." },
    feuille_route: { lbl: "Feuille de route pré-déploiement", prompt: "Propose une feuille de route pour passer de l'audit de cadrage au déploiement de la plateforme (dashboard ministériel + portail jeunes/opérateurs) : prérequis data, architecture, gouvernance, phasage." },
    weekly_copil: { lbl: "Note hebdomadaire COPIL", prompt: "Rédige la note hebdomadaire d'avancement de la mission destinée au COPIL : avancement des entretiens et de la Data Room par axe, constats clés de la semaine, zones grises, blocages, plan semaine suivante." },
  };

  function saveState() {
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    Store.save();
    return Promise.resolve();
  }

  function ensureDrafts() {
    if (!window.Store || !Store.state) return; // garde-fou: état pas encore hydraté
    if (!Store.state.reportDrafts || typeof Store.state.reportDrafts !== "object") {
      Store.state.reportDrafts = {};
    }
  }

  function draftMeta(key) {
    ensureDrafts();
    return Store.state.reportDrafts[key] || null;
  }

  function persistDraft(key, text, opts) {
    opts = opts || {};
    ensureDrafts();
    Store.state.reportDrafts[key] = {
      text,
      savedAt: new Date().toISOString(),
      by: (App.user && App.user.name) || "—",
    };
    if (opts.livrableRef) {
      const livs = Store.get("livrables") || [];
      const l = livs.find((x) => x.ref === opts.livrableRef);
      if (l) {
        const prog = Math.min(95, Math.max(l.progress || 0, 40));
        Store.patch("livrables", l.id, {
          contenu: text,
          progress: prog,
          statut: l.statut === "valide" ? "valide" : "en_cours",
          workflow: l.workflow === "valide" ? "valide" : l.workflow || "en_revue",
          updated: new Date().toISOString(),
        });
      }
    }
    return saveState().then(() => {
      toast("Brouillon enregistré", opts.livrableRef ? opts.livrableRef + " — synchronisé serveur" : key, "ok");
    });
  }

  function resolveDraft(key) {
    ensureDrafts();
    const d = Store.state.reportDrafts[key];
    if (d && d.text) return d;
    const liv = (Store.get("livrables") || []).find((x) => x.ref === key);
    if (liv && liv.contenu && String(liv.contenu).trim()) {
      return { text: liv.contenu, savedAt: liv.updated, by: "livrable" };
    }
    return null;
  }

  function syncDraftsFromLivrables() {
    if (!window.Store || !Store.state) return;
    ensureDrafts();
    (Store.get("livrables") || []).forEach((l) => {
      if (!l.ref || !l.contenu || !String(l.contenu).trim()) return;
      if (!Store.state.reportDrafts[l.ref] || !Store.state.reportDrafts[l.ref].text) {
        Store.state.reportDrafts[l.ref] = {
          text: l.contenu,
          savedAt: l.updated || new Date().toISOString(),
          by: "livrable",
        };
      }
    });
  }

  function openDraftPreview(key, title) {
    const d = resolveDraft(key);
    if (!d || !d.text) {
      toast("Brouillon", "Aucun brouillon enregistré pour cet élément", "err");
      return;
    }
    Modal.open(
      `<div class="modal-h"><h2>${esc(title || key)}</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b"><div class="muted" style="font-size:11px;margin-bottom:10px">Enregistré ${esc((d.savedAt || "").slice(0, 16).replace("T", " "))} · ${esc(d.by || "")}</div>
      <div class="ai-stream" style="white-space:pre-wrap">${aiFormat(d.text)}</div></div>
      <div class="modal-f"><button class="btn ghost" id="drClose">Fermer</button><button class="btn terra" id="drCopy">Copier</button></div>`,
      true
    );
    document.getElementById("drClose").onclick = () => Modal.close();
    document.getElementById("drCopy").onclick = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(d.text);
      toast("Copié", "", "ok");
    };
  }

  function runAiWithPersist({ title, eyebrow, intro, prompt, saveKey, livrableRef }) {
    aiRunModal({
      title,
      eyebrow: eyebrow || "Génération",
      intro,
      runFn: (onT) => AI.chat([{ role: "user", content: prompt }], onT),
      saveLabel: App.user && App.user.readOnly ? null : "Enregistrer le brouillon",
      onSave: (txt) => {
        if (App.user && App.user.readOnly) return;
        persistDraft(saveKey, txt, { livrableRef });
      },
    });
  }

  function patchRapports() {
    const orig = VIEWS.rapports;
    if (!orig || VIEWS._rapportsPersist) return;
    const prompts = {
      L1: "Rédige la Note de cadrage validée (L1) : périmètre, méthodologie, agenda 4 semaines, gouvernance COPIL, engagements réciproques. Ton formel, destiné au MPJIPSC.",
      L2: "Rédige la Note d'organisation de la mission (L2) : équipe, rôles auditeurs B/T, outils de collecte, Data Room, calendrier des instances.",
      L3: "Rédige le Rapport de la semaine 1 (cadrage stratégique) : synthèse entretiens Cabinet, constats politiques, zones grises.",
      L4: "Rédige le Rapport de la semaine 2 (programmatique) : SIGFIP, prog/non-prog, lacunes données.",
      L5: "Rédige le Rapport de la semaine 3 (volet B & SI) : RH, marchés, DSI, sécurité, flux.",
      L6: "Rédige le Rapport de la semaine 4 (terrain) : régions, focus groups, recommandations opérationnelles.",
      L7: "Rédige le Rapport final de cadrage (L7) : synthèse exécutive, matrice d'écart, feuille de route pré-déploiement plateforme PNIPM, risques résiduels.",
      L8: "Rédige l'Annexe chiffrage par scénario : trois scénarios (minimal / cible / accéléré) avec hypothèses, fourchettes de coûts et délais pour arbitrage Cabinet.",
    };

    VIEWS.rapports = function () {
      const v = orig();
      const list = v.querySelector("#repList");
      if (!list) return v;
      const ro = App.user && App.user.readOnly;
      const livs = Store.get("livrables") || [];
      list.innerHTML = "";
      livs.forEach((l) => {
        const d = resolveDraft(l.ref);
        const card = el("div", { class: "card", style: "margin-bottom:12px" });
        card.innerHTML = `<div class="card-b">
          <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <b class="mono" style="color:var(--sage-deep)">${esc(l.ref)}</b> — ${esc(l.titre)}
              <div class="muted" style="font-size:12px;margin-top:4px">${esc(l.desc || "")}</div>
              <div class="pline" style="margin-top:8px;height:5px"><i style="width:${l.progress || 0}%"></i></div>
              ${d && d.text ? `<div class="muted" style="font-size:11px;margin-top:8px">Brouillon · ${esc((d.savedAt || "").slice(0, 10))} · ${(d.text.length / 1000).toFixed(1)}k car.</div>` : ""}
              ${l.cadrage ? `<div class="muted" style="font-size:10px;margin-top:4px">Réf. cadrage : ${esc(l.cadrage)}</div>` : ""}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
              ${d && d.text ? `<button type="button" class="btn ghost sm btn-view-draft">Voir brouillon</button>` : ""}
              <button type="button" class="btn ghost sm" onclick="App.go('livrables')">Suivi livrable</button>
              <button type="button" class="btn ai btn-draft">${svgI(ICON.assistant)} Brouillon IA</button>
              <span class="bdg ${(window.LIV_STATUTS && LIV_STATUTS[l.statut] && LIV_STATUTS[l.statut].cls) || "neutral"}">${esc(l.statut)}</span>
            </div>
          </div></div>`;
        const viewBtn = card.querySelector(".btn-view-draft");
        if (viewBtn) viewBtn.onclick = () => openDraftPreview(l.ref, l.ref + " — " + l.titre);
        card.querySelector(".btn-draft").onclick = () =>
          runAiWithPersist({
            title: l.ref + " — " + l.titre,
            intro: "Brouillon généré automatiquement — enregistrez-le pour le retrouver dans le livrable et l'export ZIP.",
            prompt: prompts[l.ref] || "Rédige un brouillon de livrable pour " + l.titre,
            saveKey: l.ref,
            livrableRef: ro ? null : l.ref,
          });
        list.appendChild(card);
      });

      const note = v.querySelector(".note.slate");
      if (note && !ro) {
        note.innerHTML +=
          " Les brouillons enregistrés sont stockés sur le serveur (<code>reportDrafts</code> + contenu du livrable).";
      }

      const mapBtn = (id, key) => {
        const b = v.querySelector(id);
        if (!b || b.dataset.rpBound) return;
        b.dataset.rpBound = "1";
        const t = TRANSVERSE[key];
        const d = draftMeta(key);
        if (d && d.text) {
          const prev = document.createElement("button");
          prev.type = "button";
          prev.className = "btn ghost sm";
          prev.textContent = "Voir " + t.lbl.split(" ")[0] + "…";
          prev.onclick = () => openDraftPreview(key, t.lbl);
          b.parentNode.insertBefore(prev, b);
        }
        b.onclick = () =>
          runAiWithPersist({
            title: t.lbl,
            eyebrow: "Restitution",
            prompt: t.prompt,
            saveKey: key,
          });
      };
      mapBtn("#rpAtelier", "copil_atelier");
      mapBtn("#rpExec", "cabinet_exec");
      mapBtn("#rpFeuille", "feuille_route");
      return v;
    };
    VIEWS._rapportsPersist = true;
  }

  function patchCockpitWeekly() {
    const orig = VIEWS.cockpit;
    if (!orig || VIEWS._cockpitWeekly) return;
    VIEWS.cockpit = function () {
      const v = orig();
      const btn = v.querySelector("#ckWeekly");
      if (btn && !btn.dataset.rpBound) {
        btn.dataset.rpBound = "1";
        btn.onclick = () =>
          runAiWithPersist({
            title: "Note hebdomadaire d'avancement",
            eyebrow: "Synthèse COPIL",
            intro: "Projet de note hebdomadaire — enregistrez-la pour la réutiliser avant diffusion COPIL.",
            prompt: TRANSVERSE.weekly_copil.prompt,
            saveKey: "weekly_copil",
          });
      }
      return v;
    };
    VIEWS._cockpitWeekly = true;
  }

  function patchStoreDefaults() {
    const orig = Store.defaults.bind(Store);
    Store.defaults = function () {
      const d = orig();
      if (d.reportDrafts == null) d.reportDrafts = {};
      return d;
    };
  }

  function init() {
    patchStoreDefaults();
    syncDraftsFromLivrables();
    if (window.PortiaMission && !window.PortiaMission._reportsHooked) {
      const origInit = PortiaMission.init.bind(PortiaMission);
      PortiaMission.init = function () {
        origInit();
        patchRapports();
        patchCockpitWeekly();
      };
      PortiaMission._reportsHooked = true;
    } else {
      setTimeout(() => {
        patchRapports();
        patchCockpitWeekly();
      }, 400);
    }
  }

  window.PortiaReports = { persistDraft, draftMeta, init };
  // init() est appelé par portia-bridge.js après hydratation Store (évite state null)
})();

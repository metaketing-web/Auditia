/**
 * Libellés lisibles pour énumérations techniques + journal d'audit.
 */
(function () {
  "use strict";

  const ENUM = {
    active: { lbl: "Active", cls: "ok" },
    actif: { lbl: "Actif", cls: "ok" },
    inactive: { lbl: "Inactive", cls: "neutral" },
    inactif: { lbl: "Inactif", cls: "neutral" },
    absent: { lbl: "Absent", cls: "crit" },
    a_arbitrer: { lbl: "À arbitrer", cls: "warn" },
    a_documenter: { lbl: "À documenter", cls: "warn" },
    a_completer: { lbl: "À compléter", cls: "warn" },
    a_venir: { lbl: "À venir", cls: "neutral" },
    attendu: { lbl: "Attendu", cls: "info" },
    a_verifier: { lbl: "À valider", cls: "warn" },
    relance: { lbl: "En relance", cls: "warn" },
    planifie: { lbl: "Planifié", cls: "info" },
    realise: { lbl: "Réalisé", cls: "ok" },
    reporte: { lbl: "Reporté", cls: "warn" },
    annule: { lbl: "Annulé", cls: "crit" },
    verse: { lbl: "Versé", cls: "ok" },
    ecart: { lbl: "Écart", cls: "warn" },
    couvert: { lbl: "Couvert", cls: "ok" },
    en_cours: { lbl: "En cours", cls: "info" },
    en_revue: { lbl: "En revue", cls: "info" },
    brouillon: { lbl: "Brouillon", cls: "neutral" },
    valide: { lbl: "Validé", cls: "ok" },
    tenu: { lbl: "Tenu", cls: "ok" },
    batch: { lbl: "Batch", cls: "neutral" },
    sync: { lbl: "Synchronisation", cls: "info" },
  };

  const ACTIONS = {
    state_put: "Sauvegarde automatique (mission)",
    state_put_batch: "Sauvegardes automatiques regroupées",
    state_import: "Import de la mission",
    login: "Connexion",
    planning_put: "Mise à jour du planning",
    calendar_sync: "Synchronisation calendrier",
    bulk_assign: "Affectation des entretiens",
    questionnaire_save: "Enregistrement questionnaire",
    dataroom_deposit: "Versement Data Room",
    dataroom_validate: "Validation document Data Room",
    file_upload: "Téléversement fichier",
    import_zip: "Import ZIP",
    ingest_docx: "Import document Word",
    ingest_docx_batch: "Import documents Word (lot)",
    export_zip: "Export ZIP mission",
    export_entretien: "Export entretien",
    export_constat: "Export constat",
    export_constats_all: "Export tous les constats",
    export_gap: "Export écart CDC",
    export_gaps_all: "Export matrice CDC",
    export_livrable: "Export livrable",
    gap_consolidate: "Consolidation matrice CDC",
    risk_update: "Mise à jour risque",
    risk_create: "Création risque",
  };

  function fmtEnum(v, fallback) {
    if (v == null || v === "") return fallback != null ? fallback : "—";
    const key = String(v).trim();
    if (ENUM[key]) return ENUM[key].lbl;
    if (/^[a-z][a-z0-9_]*$/i.test(key)) {
      return key
        .replace(/_/g, " ")
        .replace(/\b(a) /i, "À ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return key;
  }

  function enumCls(v) {
    const key = String(v || "").trim();
    return (ENUM[key] && ENUM[key].cls) || "neutral";
  }

  function enumBadge(v) {
    const lbl = fmtEnum(v);
    return `<span class="bdg ${enumCls(v)}">${esc(lbl)}</span>`;
  }

  function actionLabel(action) {
    const a = String(action || "").trim();
    if (ACTIONS[a]) return ACTIONS[a];
    return fmtEnum(a, a || "—");
  }

  function roleLabel(role) {
    if (window.PortiaAuditors && PortiaAuditors.roleLabel) return PortiaAuditors.roleLabel(role);
    const r = String(role || "").trim();
    if (r === "auditeur_b") return "Asse · auditeur terrain (A)";
    if (r === "auditeur_t") return "Laetitia · auditeur terrain (L)";
    if (r === "admin") return "Directeur de Projet Audit";
    if (r === "juliana") return "Juliana · pilotage mission";
    return fmtEnum(r, r || "—");
  }

  function journalUserHtml(entry) {
    const name = (entry && entry.user_name) || "—";
    const role = roleLabel(entry && entry.user_role);
    return `${esc(name)} <span class="muted">(${esc(role)})</span>`;
  }

  function condenseJournal(entries) {
    const out = [];
    const buckets = new Map();
    (entries || []).forEach((e) => {
      if (e.action === "state_put") {
        const key = [(e.created_at || "").slice(0, 19), e.user_name || "", e.user_role || ""].join("|");
        if (buckets.has(key)) {
          buckets.get(key).count += 1;
          return;
        }
        const row = Object.assign({}, e, { count: 1, _bucket: key });
        buckets.set(key, row);
        out.push(row);
        return;
      }
      out.push(e);
    });
    return out.map((e) => {
      if (e.action === "state_put" && e.count > 1) {
        return Object.assign({}, e, {
          action: "state_put_batch",
          detail_summary: e.count + " sauvegardes regroupées",
        });
      }
      return e;
    });
  }

  function journalDetail(entry) {
    if (entry && entry.detail_summary) return entry.detail_summary;
    let d = entry && entry.detail;
    if (typeof d === "string" && d.trim().startsWith("{")) {
      try {
        d = JSON.parse(d);
      } catch (_) {
        d = null;
      }
    }
    if (entry && entry.action === "gap_consolidate" && d && typeof d === "object") {
      const parts = [d.ref || entry.entity_id || ""];
      if (d.verdictBefore && d.verdictAfter && d.verdictBefore !== d.verdictAfter) {
        parts.push(d.verdictBefore + " → " + d.verdictAfter);
      }
      if (d.note) parts.push(String(d.note).slice(0, 80));
      return parts.filter(Boolean).join(" · ");
    }
    if (entry && entry.action === "risk_update" && d && typeof d === "object") {
      const parts = [d.ref || entry.entity_id || ""];
      if (d.probBefore != null && d.impactBefore != null) {
        parts.push("P×I " + d.probBefore + "×" + d.impactBefore + " → " + d.probAfter + "×" + d.impactAfter);
      }
      if (d.statutBefore && d.statutAfter && d.statutBefore !== d.statutAfter) {
        parts.push(d.statutBefore + " → " + d.statutAfter);
      }
      if (d.note) parts.push(String(d.note).slice(0, 80));
      return parts.filter(Boolean).join(" · ");
    }
    if (entry && entry.action === "risk_create" && d && typeof d === "object") {
      return [d.ref, d.titre, d.note].filter(Boolean).join(" · ").slice(0, 120);
    }
    return [entry && entry.entity_type, entry && entry.entity_id].filter(Boolean).join(" ");
  }

  window.PortiaLabels = {
    ENUM,
    ACTIONS,
    fmtEnum,
    enumCls,
    enumBadge,
    actionLabel,
    roleLabel,
    journalUserHtml,
    journalDetail,
    condenseJournal,
  };
})();

/**
 * Export unitaire — entretien, constat, matrice CDC, livrable (Markdown + Word)
 */
(function () {
  "use strict";

  const FORMATS = [
    { k: "md", l: "Markdown (.md)" },
    { k: "doc", l: "Word (.doc)" },
  ];

  const MATRIX_FORMATS = FORMATS;

  function getToken() {
    return (
      (window.PortiaEnterprise && PortiaEnterprise.getToken && PortiaEnterprise.getToken()) ||
      (function () {
        try {
          return sessionStorage.getItem("portia_auth_token") || "";
        } catch (_) {
          return "";
        }
      })() ||
      window.PORTIA_AUTH_TOKEN ||
      ""
    );
  }

  function authHeaders() {
    if (window.PortiaEnterprise && PortiaEnterprise.authHeaders) {
      return PortiaEnterprise.authHeaders();
    }
    const h = {};
    const t = getToken();
    if (t) h["X-Portia-Token"] = t;
    return h;
  }

  function triggerDownload(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function slug(s) {
    return (s || "export")
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80);
  }

  function phaseLabel(ph) {
    return (
      { invest: "Phase 1 — Investigation", confront: "Phase 2 — Confrontation", coconstruct: "Phase 3 — Co-construction" }[
        ph
      ] || ph
    );
  }

  function mdEntretien(e, questionnaire) {
    const lines = [
      `# Entretien — ${e.n || ""}`,
      "",
      `| Champ | Valeur |`,
      `|-------|--------|`,
      `| Structure | ${e.struct || "—"} |`,
      `| Axe | ${e.axe || "—"} |`,
      `| Semaine | S${e.sem || "—"} |`,
      `| Date mission | J+${e.j ?? "—"} |`,
      `| Auditeur(s) | ${e.aud || "—"} |`,
      `| Statut | ${e.statut || "—"} |`,
      "",
    ];
    if (e.cr) lines.push("## Compte rendu", "", e.cr, "");
    if (e.obs && e.obs.length) {
      lines.push("## Observations", "");
      e.obs.forEach((o) => lines.push(`- ${o}`));
      lines.push("");
    }
    if (window.PortiaQuestionnaires && PortiaQuestionnaires.getTrameForEntretien) {
      const tr = PortiaQuestionnaires.getTrameForEntretien(e);
      const qmd = PortiaQuestionnaires.questionnaireToMarkdown
        ? PortiaQuestionnaires.questionnaireToMarkdown(tr, questionnaire || e.questionnaire)
        : "";
      if (qmd) {
        lines.push("## Questionnaire structuré", "", qmd, "");
        return lines.join("\n");
      }
    }
    const q = questionnaire || e.questionnaire || {};
    Object.keys(q).forEach((ph) => {
      const ans = q[ph];
      if (!ans || typeof ans !== "object") return;
      const keys = Object.keys(ans).filter((k) => ans[k]);
      if (!keys.length) return;
      lines.push(`## ${phaseLabel(ph)}`, "");
      keys.sort().forEach((k) => lines.push(`- **${k}** : ${ans[k]}`));
      lines.push("");
    });
    return lines.join("\n");
  }

  function mdConstat(c) {
    return [
      `# Constat ${c.ref || ""} — ${c.titre || ""}`,
      "",
      `| Criticité | ${c.crit || "—"} | Axe | ${c.axe || "—"} |`,
      "",
      "## Description",
      "",
      c.desc || "",
      "",
      c.ecart ? `## Écart / implication\n\n${c.ecart}\n` : "",
    ].join("\n");
  }

  function mdGap(g) {
    return [
      `# Matrice CDC — ${g.ref || ""}`,
      "",
      `**Thème :** ${g.theme || ""}`,
      `**Verdict :** ${g.verdict || ""}`,
      "",
      "## Exigence CDC",
      "",
      g.exig || "",
      "",
      "## Réalité observée",
      "",
      g.realite || "",
      "",
    ].join("\n");
  }

  function mdLivrable(l) {
    const lines = [
      `# Livrable ${l.ref || ""} — ${l.titre || ""}`,
      "",
      `**Avancement :** ${l.progress || 0}% · **Statut :** ${l.statut || "—"}`,
      "",
      "## Description",
      "",
      l.desc || "",
      "",
    ];
    if (l.contenu) lines.push("## Contenu", "", l.contenu, "");
    return lines.join("\n");
  }

  function mdGapsAll(gaps) {
    const lines = ["# Matrice d'écart CDC — export complet", ""];
    (gaps || []).forEach((g) => {
      lines.push(
        `## ${g.ref || ""} — ${g.theme || ""} (${g.verdict || ""})`,
        "",
        `**Exigence :** ${g.exig || ""}`,
        "",
        `**Réalité :** ${g.realite || ""}`,
        "",
        `**CDC :** ${g.cdc || ""}`,
        ""
      );
    });
    return lines.join("\n");
  }

  function mdConstatsAll(constats) {
    const lines = ["# Constats & observations — export complet", ""];
    (constats || []).forEach((c) => {
      lines.push(`## ${c.ref || ""} — ${c.titre || ""}`, "", c.desc || "", "");
      if (c.ecart) lines.push(`*Écart :* ${c.ecart}`, "");
    });
    return lines.join("\n");
  }

  function mdToWordHtml(title, md) {
    let body = String(md || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    body = body.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    body = body.replace(/^# (.+)$/gm, "<h1 style='color:#8b4513'>$1</h1>");
    body = body.replace(/^## (.+)$/gm, "<h2 style='color:#5c4033;margin-top:1.2em'>$1</h2>");
    body = body.replace(/^\- (.+)$/gm, "<li>$1</li>");
    body = body.replace(/\n\n/g, "</p><p>");
    return (
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>" +
      title +
      "</title>" +
      "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->" +
      "<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#1a1a1a;max-width:800px;margin:24px auto}" +
      "h1{font-size:18pt}h2{font-size:14pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px}</style></head>" +
      "<body><p>" +
      body +
      "</p></body></html>"
    );
  }

  function downloadText(text, base, format) {
    if (format === "doc") {
      const html = mdToWordHtml(base.replace(/_/g, " "), text);
      triggerDownload(new Blob([html], { type: "application/msword" }), base + ".doc");
      return;
    }
    triggerDownload(new Blob([text], { type: "text/markdown;charset=utf-8" }), base + ".md");
  }

  function localPayload(type, id) {
    if (type === "entretien") {
      const e = Store.find("entretiens", id);
      if (!e) return null;
      return { type: "entretien", entretien: e, questionnaire: e.questionnaire || {}, observations: e.obs || [] };
    }
    if (type === "constat") {
      const c = Store.find("constats", id);
      return c ? { type: "constat", constat: c } : null;
    }
    if (type === "gap") {
      const g = Store.get("gaps").find((x) => x.id === id || x.ref === id);
      return g ? { type: "gap", gap: g } : null;
    }
    if (type === "livrable") {
      const l = Store.find("livrables", id);
      return l ? { type: "livrable", livrable: l } : null;
    }
    return null;
  }

  function localExport(type, id, format) {
    const p = localPayload(type, id);
    if (!p) throw new Error("Élément introuvable");
    let text = "";
    let base = type + "_" + id;
    if (type === "entretien") {
      text = mdEntretien(p.entretien, p.questionnaire);
      base = slug("entretien_" + (p.entretien.struct || "") + "_" + (p.entretien.n || id));
    } else if (type === "constat") {
      text = mdConstat(p.constat);
      base = slug("constat_" + (p.constat.ref || id));
    } else if (type === "gap") {
      text = mdGap(p.gap);
      base = slug("matrice_" + (p.gap.ref || id));
    } else if (type === "livrable") {
      text = mdLivrable(p.livrable);
      base = slug("livrable_" + (p.livrable.ref || id));
    }
    downloadText(text, base, format);
  }

  function localExportAll(type, format) {
    let text = "";
    let base = "export";
    if (type === "gaps-all") {
      text = mdGapsAll(Store.get("gaps") || []);
      base = "matrice_ecart_cdc";
    } else if (type === "constats-all") {
      text = mdConstatsAll(Store.get("constats") || []);
      base = "constats_mission";
    } else {
      throw new Error("Export non supporté");
    }
    downloadText(text, base, format);
  }

  function serverUrl(type, id, format, opts) {
    const q = new URLSearchParams();
    q.set("format", format);
    if (opts && opts.anonymize) q.set("anonymize", "true");
    const path =
      type === "gaps-all"
        ? "/api/export/gaps"
        : type === "constats-all"
          ? "/api/export/constats"
          : `/api/export/${type}/${encodeURIComponent(id)}`;
    return path + "?" + q.toString();
  }

  function download(type, id, format, opts) {
    format = format || "md";
    opts = opts || {};
    const useServer = window.PORTIA_SERVER_MODE && getToken();
    if (useServer) {
      const url = serverUrl(type, id, format, opts);
      return fetch(url, { headers: authHeaders() })
        .then((r) => {
          if (!r.ok) throw new Error("Export " + r.status);
          const disp = r.headers.get("Content-Disposition") || "";
          const m = /filename="?([^";]+)"?/.exec(disp);
          const ext = format === "doc" ? "doc" : "md";
          const fname = m ? m[1] : type + "_" + id + "." + ext;
          return r.blob().then((b) => {
            triggerDownload(b, fname);
          });
        })
        .then(() => toast("Export", "Fichier téléchargé", "ok"));
    }
    try {
      if (type === "gaps-all" || type === "constats-all") {
        localExportAll(type, format);
      } else {
        localExport(type, id, format);
      }
      toast("Export", "Fichier généré", "ok");
    } catch (e) {
      toast("Export", e.message, "err");
    }
    return Promise.resolve();
  }

  function exportBtn(type, id, label) {
    const lid = esc(String(id)).replace(/'/g, "\\'");
    return `<button type="button" class="btn ghost sm" onclick="event.stopPropagation();PortiaExport.pick('${type}','${lid}')" title="Exporter">${svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>')}${label ? " " + label : ""}</button>`;
  }

  function pick(type, id, formatList) {
    const fmts = formatList || (type === "gaps-all" || type === "constats-all" ? MATRIX_FORMATS : FORMATS);
    Modal.open(
      `<div class="modal-h"><h2>Exporter</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack">
        <p class="muted" style="font-size:13px">Choisissez le format de fichier.</p>
        ${fmts.map((f) => `<button type="button" class="btn ghost" style="justify-content:flex-start" data-fmt="${f.k}">${esc(f.l)}</button>`).join("")}
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button></div>`,
      true
    );
    const box = document.getElementById("ovBox");
    if (!box) return;
    box.querySelectorAll("[data-fmt]").forEach((btn) => {
      btn.onclick = () => {
        const fmt = btn.dataset.fmt;
        Modal.close();
        download(type, id, fmt).catch((e) => toast("Export", e.message, "err"));
      };
    });
  }

  window.PortiaExport = {
    FORMATS,
    MATRIX_FORMATS,
    download,
    pick,
    exportBtn,
    mdEntretien,
    mdConstat,
    mdGap,
    mdLivrable,
  };
})();

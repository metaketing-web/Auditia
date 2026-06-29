/**
 * Lecteur interactif — Documents de mission (cadrage, agenda, charte, CDC)
 */
(function () {
  "use strict";

  const TABS = [
    { k: "cadrage", lbl: "Cadrage", icon: "agenda" },
    { k: "agenda", lbl: "Agenda S1–S4", icon: "agenda" },
    { k: "charte", lbl: "Charte COPIL", icon: "gouv" },
    { k: "cdc", lbl: "Cahier des charges", icon: "ecart" },
  ];

  const TAB_META = {
    cadrage: { title: "Document de cadrage", fallback: "finalite" },
    agenda: { title: "Agenda 4 semaines", fallback: "plainText" },
    charte: { title: "Charte du COPIL", fallback: "mpjipsc" },
    cdc: { title: "Cahier des charges PNIPM", fallback: "synthese" },
  };

  const MIN_HTML = 400;

  function docReady(d) {
    return d && d.html && d.html.length >= MIN_HTML && d.sections && d.sections.length > 0;
  }

  function ensureBuilt(md, state) {
    if (window.PortiaMissionDocsBuild && PortiaMissionDocsBuild.ensure) {
      return PortiaMissionDocsBuild.ensure(md, state || (window.Store && Store.state) || {});
    }
    return md;
  }

  function injectStyles() {
    if (document.getElementById("mission-docs-css")) return;
    const s = document.createElement("style");
    s.id = "mission-docs-css";
    s.textContent = `
      .md-layout{display:grid;grid-template-columns:minmax(200px,260px) 1fr;gap:16px;align-items:start}
      @media(max-width:860px){.md-layout{grid-template-columns:1fr}}
      .md-toc{position:sticky;top:12px;max-height:calc(100vh - 140px);overflow:auto;padding:12px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm)}
      .md-toc b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--txt-3);margin-bottom:10px}
      .md-toc a{display:block;font-size:12.5px;padding:5px 8px;border-radius:6px;color:var(--txt-2);text-decoration:none;line-height:1.35}
      .md-toc a:hover,.md-toc a.on{background:var(--terra-soft);color:var(--terra-deep)}
      .md-toc a.l2{padding-left:18px;font-size:12px}
      .md-toc a.l3{padding-left:28px;font-size:11.5px;color:var(--txt-3)}
      .md-main{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);min-height:420px}
      .md-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);background:var(--surface-2);border-radius:var(--r) var(--r) 0 0}
      .md-toolbar .search{flex:1;min-width:180px;max-width:320px}
      .md-body{padding:24px 28px 32px;max-height:calc(100vh - 220px);overflow:auto;scroll-behavior:smooth}
      .md-prose{font-size:14px;line-height:1.65;color:var(--txt)}
      .md-prose h1,.md-prose h2,.md-prose h3,.md-prose h4{font-family:var(--font-display);color:var(--ink);margin:1.4em 0 .55em;line-height:1.25}
      .md-prose h1{font-size:22px;margin-top:0}
      .md-prose h2{font-size:18px;border-left:3px solid var(--terra);padding-left:12px}
      .md-prose h3{font-size:15px;color:var(--terra-deep)}
      .md-prose p{margin:0 0 .85em}
      .md-prose table.md-tbl{width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px}
      .md-prose table.md-tbl th,.md-prose table.md-tbl td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
      .md-prose table.md-tbl th{background:var(--surface-2);font-weight:600}
      .md-prose mark.md-hit{background:var(--gold-soft);padding:0 2px;border-radius:2px}
      .md-meta{font-size:11px;color:var(--txt-3);margin-left:auto}
      .md-empty{padding:48px 24px;text-align:center;color:var(--txt-2)}
      .md-fallback{white-space:pre-wrap;font-size:14px;line-height:1.65}
    `;
    document.head.appendChild(s);
  }

  function docPayload(md, key) {
    return md[key] || {};
  }

  function hasContent(md, key) {
    return docReady(docPayload(md, key));
  }

  function highlightHtml(html, q) {
    if (!q || q.length < 2) return html;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return html.replace(re, (m) => `<mark class="md-hit">${m}</mark>`);
  }

  function renderReader(container, md, tabKey, opts) {
    injectStyles();
    opts = opts || {};
    md = ensureBuilt(md, opts.state);
    const doc = docPayload(md, tabKey);
    const meta = TAB_META[tabKey];
    const html = doc.html || "";
    const sections = doc.sections || [];
    const title = doc.title || meta.title;
    const source = doc.sourceFile || "";
    const chars = doc.charCount || (doc.plainText || "").length;

    if (!html || !docReady(doc)) {
      container.innerHTML = `<div class="md-empty">${svgI(ICON.dataroom, "")}<b>${esc(meta.title)}</b><p>Document non encore importé.</p>${
        opts.adminHint
          ? `<p class="muted" style="font-size:12px;margin-top:12px">Déposez les fichiers .docx dans <code>mission-docs/source/</code> puis exécutez <code>bash scripts/ingest-mission-docx.sh</code></p>`
          : ""
      }</div>`;
      return;
    }

    const toc =
      sections.length > 0
        ? `<div class="md-toc"><b>Sommaire</b>${sections
            .map((s) => {
              const cls = s.level === 2 ? "l2" : s.level >= 3 ? "l3" : "";
              return `<a href="#${esc(s.id)}" class="md-toc-link ${cls}" data-sec="${esc(s.id)}">${esc(s.title)}</a>`;
            })
            .join("")}</div>`
        : "";

    container.innerHTML = `<div class="md-layout">
      ${toc}
      <div class="md-main">
        <div class="md-toolbar">
          <input class="search" id="mdSearch" placeholder="Rechercher dans le document…">
          <button type="button" class="btn ghost sm" id="mdPrint">${svgI('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>')} Imprimer</button>
          ${tabKey === "agenda" ? `<button type="button" class="btn ghost sm" onclick="App.go('planning')">${svgI(ICON.agenda)} Planning interactif</button>` : ""}
          ${tabKey === "cdc" ? `<button type="button" class="btn ghost sm" onclick="App.go('ecart')">${svgI(ICON.ecart)} Matrice d'écart</button>` : ""}
          <span class="md-meta">${source ? esc(source) + " · " : ""}${chars ? Math.round(chars / 1000) + "k car." : ""}</span>
        </div>
        <div class="md-body" id="mdBody"><h1 style="font-family:var(--font-display);font-size:20px;margin:0 0 16px;color:var(--ink)">${esc(title)}</h1><div id="mdContent">${html}</div></div>
      </div>
    </div>`;

    const bodyEl = container.querySelector("#mdBody");
    const contentEl = container.querySelector("#mdContent");
    const rawHtml = html;

    container.querySelector("#mdPrint").onclick = () => {
      const w = window.open("", "_blank");
      w.document.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:0 24px;line-height:1.6}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px}h2{border-left:3px solid #8b4513;padding-left:10px}</style></head><body>${contentEl.innerHTML}</body></html>`
      );
      w.document.close();
      w.print();
    };

    container.querySelector("#mdSearch").addEventListener("input", (e) => {
      const q = e.target.value.trim();
      contentEl.innerHTML = highlightHtml(rawHtml, q);
    });

    container.querySelectorAll(".md-toc-link").forEach((a) => {
      a.onclick = (ev) => {
        ev.preventDefault();
        const id = a.dataset.sec;
        const target = container.querySelector("#" + CSS.escape(id));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          container.querySelectorAll(".md-toc-link").forEach((x) => x.classList.remove("on"));
          a.classList.add("on");
        }
      };
    });

    if (bodyEl && sections.length) {
      bodyEl.addEventListener(
        "scroll",
        () => {
          let active = sections[0].id;
          for (const s of sections) {
            const el = container.querySelector("#" + CSS.escape(s.id));
            if (el && el.getBoundingClientRect().top < 180) active = s.id;
          }
          container.querySelectorAll(".md-toc-link").forEach((a) => {
            a.classList.toggle("on", a.dataset.sec === active);
          });
        },
        { passive: true }
      );
    }
  }

  window.PortiaMissionDocs = {
    TABS,
    TAB_META,
    hasContent,
    renderReader,
  };
})();

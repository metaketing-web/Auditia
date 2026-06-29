/**
 * Collecte externe — liens par entretien, pilotage export, preuves liées.
 */
(function () {
  "use strict";

  function apiFetch(path, opts) {
    const fn = window.portiaApi && portiaApi.fetch ? portiaApi.fetch : fetch;
    return fn(path, opts || {});
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (_) {
      return String(iso).slice(0, 10);
    }
  }

  function isPilotage() {
    const u = App.user;
    return u && (u.serverRole === "admin" || u.serverRole === "juliana");
  }

  async function loadEntretienCollecte(entretienId) {
    if (!window.PORTIA_SERVER_MODE) return null;
    try {
      const r = await apiFetch("/api/collecte/entretien/" + encodeURIComponent(entretienId));
      if (!r.ok) return null;
      return r.json();
    } catch (_) {
      return null;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return Promise.resolve();
  }

  async function injectEntretienCollecte(entretienId, slotId) {
    const sid = slotId || "entCollecteSlot";
    const slot = document.getElementById(sid);
    if (!slot || !window.PORTIA_SERVER_MODE) return null;
    slot.innerHTML = '<p class="muted" style="font-size:12px">Chargement collecte…</p>';
    const data = await loadEntretienCollecte(entretienId);
    if (!data) {
      slot.innerHTML = "";
      return null;
    }
    const tok = data.token || {};
    const docs = data.documents || [];
    const link = tok.link || "";
    let html =
      '<div class="divider"></div>' +
      '<h4 style="font-family:var(--font-display);font-size:14px;margin-bottom:10px">Preuves & collecte externe</h4>';
    if (link) {
      html +=
        '<div class="note slate" style="font-size:12px;margin-bottom:10px">' +
        "<b>Lien de dépôt</b> (interviewé, sans compte)<br>" +
        '<code style="font-size:11px;word-break:break-all">' +
        esc(link) +
        "</code><br>" +
        "Limite : " +
        fmtDate(tok.deadlineAt) +
        " · Envoi suggéré : " +
        fmtDate(tok.sendAt) +
        " · Relance J-7 : " +
        fmtDate(tok.remindAt) +
        "</div>" +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
        '<button type="button" class="btn terra sm" id="entOpenDeposit">Déposer preuves</button>' +
        '<button type="button" class="btn ghost sm" id="entCopyLink">Copier le lien</button>';
      if (isPilotage()) {
        html +=
          '<button type="button" class="btn ghost sm" id="entCopyMail">Modèle mail initial</button>' +
          '<button type="button" class="btn ghost sm" id="entCopyRelance">Modèle relance J-7</button>';
      }
      html += "</div>";
    } else if (isPilotage()) {
      html +=
        '<p class="muted" style="font-size:12px">Aucun lien — ouvrez <b>Collecte interviewés</b> et synchronisez les liens.</p>';
    }
    if (docs.length) {
      html += '<div class="stack" style="gap:6px">';
      docs.forEach(function (d) {
        const st =
          d.statut === "verse"
            ? '<span class="bdg ok">Validé</span>'
            : '<span class="bdg warn">À valider</span>';
        html +=
          '<div class="alert-i" style="padding:8px 10px"><div class="bd" style="min-width:0"><b style="font-size:12px">' +
          esc(d.normalizedName || d.desc || "Document") +
          '</b><span style="font-size:11px">' +
          esc(d.par || "") +
          " · " +
          esc(d.taille || "") +
          "</span></div>" +
          st +
          (d.fileId
            ? ' <button type="button" class="btn terra sm ent-doc-open" data-id="' +
              esc(d.id) +
              '" data-fid="' +
              esc(d.fileId) +
              '">Voir</button>'
            : "") +
          "</div>";
      });
      html += "</div>";
    } else {
      html += '<p class="muted" style="font-size:12px">Aucune preuve reçue pour cet entretien.</p>';
    }
    slot.innerHTML = html;
    const openBtn = document.getElementById("entOpenDeposit");
    if (openBtn && link) {
      openBtn.onclick = function () {
        window.open(link, "_blank", "noopener,noreferrer");
      };
    }
    const copyBtn = document.getElementById("entCopyLink");
    if (copyBtn)
      copyBtn.onclick = function () {
        copyText(link).then(function () {
          toast("Lien copié", "À coller dans votre e-mail", "ok");
        });
      };
    async function copyMail(kind) {
      await copyCollecteMail(entretienId, kind);
    }
    const m1 = document.getElementById("entCopyMail");
    const m2 = document.getElementById("entCopyRelance");
    if (m1) m1.onclick = function () {
      copyMail("initial");
    };
    if (m2) m2.onclick = function () {
      copyMail("relance");
    };
    slot.querySelectorAll(".ent-doc-open").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        if (window.Files && Files.openDocument) {
          Files.openDocument({ id: btn.dataset.id, fileId: btn.dataset.fid });
        }
      };
    });
    return data;
  }

  function patchConductCollecte() {
    if (!window.VIEWS || VIEWS._conductCollecte) return;
    const orig = VIEWS.conduct;
    if (!orig) return;
    VIEWS.conduct = function () {
      const v = orig();
      setTimeout(function () {
        if (!App.conductId || !window.PORTIA_SERVER_MODE) return;
        let slot = v.querySelector("#conductCollecteSlot");
        if (!slot) {
          const plaud = v.querySelector("#conductPlaudSlot");
          if (plaud && plaud.parentNode) {
            slot = document.createElement("div");
            slot.id = "conductCollecteSlot";
            plaud.parentNode.insertBefore(slot, plaud.nextSibling);
          }
        }
        if (slot) {
          injectEntretienCollecte(App.conductId, "conductCollecteSlot").then(function (data) {
            if (!data || !data.token || !data.token.link) return;
            const headActions = v.querySelector(".ph .actions");
            if (headActions && !v.querySelector("#conductDepositBtn")) {
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "btn ghost";
              btn.id = "conductDepositBtn";
              btn.innerHTML = "Déposer preuves";
              btn.onclick = function () {
                window.open(data.token.link, "_blank", "noopener,noreferrer");
              };
              headActions.insertBefore(btn, headActions.firstChild);
            }
          });
        }
      }, 60);
      return v;
    };
    VIEWS._conductCollecte = true;
  }

  async function refreshRemindNotifications() {
    if (!isPilotage() || !window.PORTIA_SERVER_MODE) return;
    try {
      const r = await apiFetch("/api/collecte/status");
      if (!r.ok) return;
      const data = await r.json();
      if (data.notificationsCreated > 0) {
        const reload = window.portiaReloadServer || (window.portiaApi && portiaApi.loadFromServer);
        if (reload) await reload();
        if (window.PortiaRelances && PortiaRelances.updateNotifBadge) PortiaRelances.updateNotifBadge();
      }
    } catch (_) {}
  }

  function patchOpenEntretien() {
    if (!window.openEntretien || openEntretien._collectePatch) return;
    const orig = openEntretien;
    window.openEntretien = function (id, editable) {
      orig(id, editable);
      setTimeout(function () {
        const modal = document.querySelector(".modal-b");
        if (!modal || document.getElementById("entCollecteSlot")) return;
        const editBlock = modal.querySelector("#entPlaudSlot");
        const div = document.createElement("div");
        div.id = "entCollecteSlot";
        if (editBlock && editBlock.parentNode) {
          editBlock.parentNode.insertBefore(div, editBlock);
        } else {
          modal.appendChild(div);
        }
        injectEntretienCollecte(id);
      }, 40);
    };
    openEntretien._collectePatch = true;
  }

  async function copyCollecteMail(entretienId, kind) {
    const rr = await apiFetch(
      "/api/collecte/email/" + encodeURIComponent(entretienId) + "?kind=" + (kind || "initial")
    );
    if (!rr.ok) {
      toast("Erreur", "Synchronisez d'abord les liens collecte", "err");
      return false;
    }
    const t = await rr.json();
    await copyText("Objet : " + t.subject + "\n\n" + t.body);
    toast(
      kind === "relance" ? "Relance J-7 copiée" : "E-mail initial copié",
      "Collez dans votre messagerie",
      "ok"
    );
    return true;
  }

  function registerCollecteView() {
    if (!window.VIEWS || VIEWS.collecte_externe) return;
    VIEWS.collecte_externe = function () {
      const v = el("div", { class: "view" });
      const filter = { k: "all" };
      let allItems = [];
      v.innerHTML =
        pageHead(
          "Collecte interviewés",
          "Liens de dépôt & campagne e-mail",
          "Générez les liens personnels (49 entretiens), exportez le CSV pour envoi manuel J-14, suivez les relances J-7 et la date limite J-3.",
          '<a class="btn ghost" href="/api/collecte/export.csv" download="collecte-pnipm.csv">Exporter CSV</a> <button type="button" class="btn terra" id="colSync">Synchroniser les liens</button>'
        ) +
        '<div id="colKpis" class="kpis" style="margin-bottom:16px"></div>' +
        '<div class="fbar" style="margin-bottom:14px"><div class="seg" id="colFilter">' +
        [
          ["all", "Tous"],
          ["send", "À envoyer J-14"],
          ["remind", "À relancer J-7"],
          ["nodep", "Sans dépôt"],
        ]
          .map(function (pair, i) {
            return (
              '<button type="button" data-f="' +
              pair[0] +
              '" class="' +
              (i === 0 ? "on" : "") +
              '">' +
              pair[1] +
              "</button>"
            );
          })
          .join("") +
        "</div></div>" +
        '<div class="card"><div class="gantt"><table class="tbl"><thead><tr><th>Interlocuteur</th><th>Structure</th><th>Email</th><th>Entretien</th><th>Limite J-3</th><th>Dépôts</th><th>Relance J-7</th><th></th></tr></thead><tbody id="colBody"></tbody></table></div></div>' +
        '<div class="note slate" style="margin-top:14px;font-size:12.5px"><b>Calendrier :</b> envoi initial <b>J-14</b> · relance manuelle si vide à <b>J-7</b> · blocage dépôt à <b>J-3</b> (23h59 Abidjan). Les documents arrivent en statut <b>À valider</b> dans la Data Room.</div>';

      function filteredItems() {
        return allItems.filter(function (row) {
          if (filter.k === "send") return row.sendDue && !row.hasDeposit;
          if (filter.k === "remind") return row.remindDue;
          if (filter.k === "nodep") return !row.hasDeposit;
          return true;
        });
      }

      function wireTableRows(items) {
        const body = v.querySelector("#colBody");
        body.innerHTML = items.length
          ? items
              .map(function (row) {
                const rel = row.remindDue
                  ? '<span class="bdg warn">À relancer</span>'
                  : row.hasDeposit
                    ? '<span class="bdg ok">OK</span>'
                    : row.sendDue
                      ? '<span class="bdg info">J-14</span>'
                      : '<span class="muted">—</span>';
                const dep = row.depositCount
                  ? "<b>" + row.depositCount + "</b>"
                  : '<span class="muted">0</span>';
                const relBtn = row.remindDue
                  ? '<button type="button" class="btn terra sm col-relance" data-id="' +
                    esc(row.entretienId) +
                    '">Relance</button> '
                  : "";
                return (
                  '<tr class="clk col-row" data-eid="' +
                  esc(row.entretienId) +
                  '">' +
                  "<td><b>" +
                  esc(row.interviewee) +
                  "</b></td>" +
                  "<td>" +
                  esc(row.structure) +
                  "</td>" +
                  "<td" +
                  (row.email ? "" : ' class="muted"') +
                  ">" +
                  esc(row.email || "—") +
                  "</td>" +
                  "<td>" +
                  fmtDate(row.interviewDate) +
                  " " +
                  esc(row.interviewHeure || "") +
                  "</td>" +
                  "<td>" +
                  fmtDate(row.deadlineAt) +
                  "</td>" +
                  "<td>" +
                  dep +
                  "</td>" +
                  "<td>" +
                  rel +
                  "</td>" +
                  '<td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()">' +
                  '<button type="button" class="btn ghost sm col-copy" data-link="' +
                  esc(row.link) +
                  '">Lien</button> ' +
                  '<button type="button" class="btn ghost sm col-mail" data-id="' +
                  esc(row.entretienId) +
                  '">Mail</button> ' +
                  relBtn +
                  "</td></tr>"
                );
              })
              .join("")
          : '<tr><td colspan="8"><div class="empty" style="padding:24px">Aucun entretien pour ce filtre.</div></td></tr>';

        v.querySelectorAll(".col-copy").forEach(function (btn) {
          btn.onclick = function () {
            copyText(btn.dataset.link).then(function () {
              toast("Lien copié", "", "ok");
            });
          };
        });
        v.querySelectorAll(".col-mail").forEach(function (btn) {
          btn.onclick = function () {
            copyCollecteMail(btn.dataset.id, "initial");
          };
        });
        v.querySelectorAll(".col-relance").forEach(function (btn) {
          btn.onclick = function () {
            copyCollecteMail(btn.dataset.id, "relance");
          };
        });
        v.querySelectorAll(".col-row").forEach(function (tr) {
          tr.onclick = function () {
            if (window.openEntretien) openEntretien(tr.dataset.eid, !App.user?.readOnly);
          };
        });
      }

      function renderKpis() {
        const kpis = v.querySelector("#colKpis");
        const withDep = allItems.filter(function (x) {
          return x.hasDeposit;
        }).length;
        const remind = allItems.filter(function (x) {
          return x.remindDue;
        }).length;
        const send = allItems.filter(function (x) {
          return x.sendDue && !x.hasDeposit;
        }).length;
        kpis.innerHTML =
          '<div class="kpi clk" data-f="all" style="cursor:pointer"><div class="val">' +
          allItems.length +
          '</div><div class="lbl">Entretiens</div></div>' +
          '<div class="kpi clk" data-f="send" style="cursor:pointer"><div class="val">' +
          send +
          '</div><div class="lbl">À envoyer J-14</div></div>' +
          '<div class="kpi clk" data-f="remind" style="cursor:pointer"><div class="val">' +
          remind +
          '</div><div class="lbl">À relancer J-7</div></div>' +
          '<div class="kpi clk" data-f="nodep" style="cursor:pointer"><div class="val">' +
          (allItems.length - withDep) +
          '</div><div class="lbl">Sans dépôt</div></div>';
        kpis.querySelectorAll(".kpi[data-f]").forEach(function (k) {
          k.onclick = function () {
            filter.k = k.dataset.f;
            v.querySelectorAll("#colFilter button").forEach(function (b) {
              b.classList.toggle("on", b.dataset.f === filter.k);
            });
            wireTableRows(filteredItems());
          };
        });
      }

      async function load() {
        const body = v.querySelector("#colBody");
        body.innerHTML =
          '<tr><td colspan="8"><div class="empty" style="padding:24px">Chargement…</div></td></tr>';
        const r = await apiFetch("/api/collecte/status");
        if (!r.ok) {
          body.innerHTML =
            '<tr><td colspan="8"><div class="empty">Impossible de charger la collecte.</div></td></tr>';
          return;
        }
        const data = await r.json();
        allItems = data.items || [];
        if (data.notificationsCreated > 0) {
          const reload = window.portiaReloadServer;
          if (reload) await reload();
          if (window.PortiaRelances && PortiaRelances.updateNotifBadge) PortiaRelances.updateNotifBadge();
        }
        renderKpis();
        wireTableRows(filteredItems());
      }

      v.querySelector("#colFilter").onclick = function (e) {
        const b = e.target.closest("button[data-f]");
        if (!b) return;
        filter.k = b.dataset.f;
        v.querySelectorAll("#colFilter button").forEach(function (x) {
          x.classList.toggle("on", x === b);
        });
        wireTableRows(filteredItems());
      };

      v.querySelector("#colSync").onclick = async function () {
        const btn = v.querySelector("#colSync");
        btn.disabled = true;
        await apiFetch("/api/collecte/tokens/sync", { method: "POST" });
        btn.disabled = false;
        toast("Liens synchronisés", "Un lien par entretien", "ok");
        load();
      };
      load();
      return v;
    };
  }

  function patchNav() {
    if (!window.NAV || !isPilotage()) return;
    const admin = NAV.admin;
    if (!admin) return;
    for (let i = 0; i < admin.length; i++) {
      const sec = admin[i];
      if (sec.sec === "Pilotage mission" || sec.sec === "Mission") {
        const exists = (sec.items || []).some(function (it) {
          return it.k === "collecte_externe";
        });
        if (!exists) {
          sec.items = sec.items || [];
          sec.items.splice(1, 0, {
            k: "collecte_externe",
            lbl: "Collecte interviewés",
            ic: "dataroom",
          });
        }
        break;
      }
    }
    if (window.MISSION_VIEWS && MISSION_VIEWS.indexOf("collecte_externe") < 0) {
      MISSION_VIEWS.push("collecte_externe");
    }
    if (window.CRUMB) CRUMB.collecte_externe = "Collecte interviewés";
  }

  function patchBridgeDocs() {
    if (!window.portiaApi || portiaApi._collecteDocsPatch) return;
    const orig = portiaApi.loadDataroomDocs;
    if (!orig) return;
    portiaApi.loadDataroomDocs = async function () {
      const ok = await orig.apply(this, arguments);
      return ok;
    };
    portiaApi._collecteDocsPatch = true;
  }

  function init() {
    if (!window.PORTIA_REQUIRE_AUTH) return;
    patchOpenEntretien();
    setTimeout(patchConductCollecte, 0);
    registerCollecteView();
    patchNav();
    patchBridgeDocs();
    refreshRemindNotifications();
    const origEnter = App.enter && App.enter.bind(App);
    if (origEnter && !App.enter._collecteNav) {
      App.enter = function () {
        origEnter();
        patchNav();
      };
      App.enter._collecteNav = true;
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(init, 100);
      });
    } else {
      setTimeout(init, 100);
    }
  }

  window.PortiaCollecte = {
    init,
    injectEntretienCollecte,
    loadEntretienCollecte,
    copyCollecteMail,
  };
})();

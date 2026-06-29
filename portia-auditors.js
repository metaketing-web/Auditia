/**
 * Auditeurs mission — Asse (A) et Laetitia (L)
 */
(function () {
  "use strict";

  const LEGACY = { B: "A", T: "L", "B+T": "A+L" };

  const AUDITORS = {
    A: { code: "A", name: "Asse", serverRole: "auditeur_b" },
    L: { code: "L", name: "Laetitia", serverRole: "auditeur_t" },
  };

  const LEADS = ["Asse", "Laetitia"];
  const CODES = ["A", "L", "A+L"];

  function normAud(code) {
    if (code == null || code === "") return "";
    const s = String(code).trim();
    if (LEGACY[s]) return LEGACY[s];
    const up = s.toUpperCase();
    return LEGACY[up] || up;
  }

  function audMatches(entAud, code) {
    const n = normAud(entAud);
    const c = normAud(code);
    if (!c) return true;
    if (c === "A+L") return n === "A+L" || n === "A" || n === "L";
    return n === c || n === "A+L";
  }

  function audLabel(code, user) {
    const n = normAud(code);
    if (n === "A+L") return "Asse + Laetitia (A+L)";
    if (user) {
      const uc = auditorCodeFromUser(user);
      if (uc && normAud(uc) === n) {
        const name = auditorDisplayName(user);
        if (name) return `${name} (${n})`;
      }
    }
    const a = AUDITORS[n];
    return a ? `${a.name} (${n})` : n || "—";
  }

  function auditorCodeFromUser(user) {
    if (!user) return null;
    const sr = user.serverRole;
    if (sr === "auditeur_b") return "A";
    if (sr === "auditeur_t") return "L";
    if (user.role === "auditeur") return "A";
    return null;
  }

  function leadOptions(selected) {
    const sel = selected || "";
    return (
      `<option value="">—</option>` +
      LEADS.map((n) => `<option value="${n}" ${sel === n ? "selected" : ""}>${n}</option>`).join("")
    );
  }

  function audOptions(selected, user) {
    const n = normAud(selected) || (user ? auditorCodeFromUser(user) : null) || "A";
    return CODES.map((c) => {
      const lbl = audLabel(c, user);
      return `<option value="${c}" ${n === c ? "selected" : ""}>${lbl}</option>`;
    }).join("");
  }

  const ROLE_LABELS = {
    admin: "Directeur de Projet Audit",
    juliana: "Juliana · pilotage",
    auditeur_b: "Asse · auditeur terrain (A)",
    auditeur_t: "Laetitia · auditeur terrain (L)",
    cabinet: "Cabinet MPJIPSC (lecture)",
    auditeur: "Auditeur terrain",
  };

  function roleLabel(serverRole) {
    const r = String(serverRole || "").trim();
    return ROLE_LABELS[r] || r || "—";
  }

  function audFilterOptions(selected) {
    const sel = normAud(selected) || "all";
    return (
      `<option value="all">Tous auditeurs</option>` +
      CODES.map((c) => {
        const lbl = c === "A+L" ? "Asse + Laetitia (A+L)" : audLabel(c);
        return `<option value="${c}" ${sel === c ? "selected" : ""}>${lbl}</option>`;
      }).join("")
    );
  }

  function auditorDisplayName(user) {
    const raw = String((user && user.name) || "").trim();
    const short = raw.replace(/\s*·\s*auditeur.*$/i, "").trim();
    if (short) return short;
    if (user && user.id === "u_test_auditeur") return "Jean";
    if (user && user.id === "u_aud_b") return "Asse";
    if (user && user.id === "u_aud_t") return "Laetitia";
    return "";
  }

  function displayUser(user) {
    if (!user) return { name: "—", role: "—" };
    const sr = user.serverRole || user.role || "";
    if (sr === "auditeur_b") {
      const name = auditorDisplayName(user) || "Asse";
      return { name, role: name + " · auditeur terrain (A)" };
    }
    if (sr === "auditeur_t") {
      const name = auditorDisplayName(user) || "Laetitia";
      return { name, role: name + " · auditeur terrain (L)" };
    }
    if (sr === "admin") return { name: user.name || "Directeur de Projet Audit", role: "Directeur de Projet Audit" };
    if (sr === "juliana") return { name: user.name || "Juliana", role: "Juliana · pilotage" };
    if (sr === "cabinet") return { name: user.name || "Cabinet", role: "Cabinet MPJIPSC (lecture)" };
    return { name: user.name || "—", role: roleLabel(sr) };
  }

  function refreshUserHeader(user) {
    if (!user) return;
    const disp = displayUser(user);
    const un = document.getElementById("userName");
    const ur = document.getElementById("userRole");
    if (un) un.textContent = disp.name;
    if (ur) ur.textContent = disp.role;
    const av = document.getElementById("userAv");
    if (av) {
      const ini =
        disp.name
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "AU";
      av.textContent = ini;
      av.style.background =
        user.role === "admin" || user.serverRole === "admin" || user.serverRole === "juliana"
          ? "var(--axe-pol)"
          : "var(--terra-deep)";
    }
  }

  window.PortiaAuditors = {
    AUDITORS,
    LEADS,
    CODES,
    normAud,
    audMatches,
    audLabel,
    auditorCodeFromUser,
    leadOptions,
    audOptions,
    audFilterOptions,
    ROLE_LABELS,
    roleLabel,
    displayUser,
    refreshUserHeader,
  };
})();

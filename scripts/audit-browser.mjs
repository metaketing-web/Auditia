/**
 * Audit navigateur — parcourt les vues et détecte erreurs JS / vues vides.
 * Usage: PORTIA_TOKEN=xxx node scripts/audit-browser.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PORTIA_URL || "https://audit.skydeen.ai";
const TOKEN = process.env.PORTIA_TOKEN || "";
const LOGIN_EMAIL = process.env.PORTIA_EMAIL || "";
const LOGIN_PASSWORD = process.env.PORTIA_PASSWORD || "";
const MISSION_CODE = process.env.MISSION_CODE || "";

const ROLE_MAP = {
  admin: "admin",
  juliana: "admin",
  auditeur_b: "auditeur",
  auditeur_t: "auditeur",
  cabinet: "cabinet",
};

const ADMIN_ROUTES = [
  "cockpit", "planning", "entretiens", "dataroom", "collecte_externe", "ecart", "cdc_tech",
  "constats", "lacunes", "risques", "livrables", "gouv", "docs_mission", "affectations",
  "pilotage", "cadrage", "charte", "cdc", "rapports", "ref_pnipm", "hub_auditeur",
  "qualdata", "prognonprog", "voletb", "flux", "carto_graph", "eco", "geo", "corbeille",
  "guide", "tuto_admin", "journal", "taches", "taches_equipe", "reglages", "assistant",
  "cabinet", "agenda", "conduct", "depot", "consaud",
];

const HASH_ALIASES = ["documents", "explorateur", "prog_np"];

async function injectSession(page, role = "admin") {
  let data;
  if (TOKEN) {
    const meRes = await page.request.get(BASE + "/api/auth/me", {
      headers: { "X-Portia-Token": TOKEN },
    });
    if (!meRes.ok()) throw new Error("auth/me " + meRes.status());
    data = await meRes.json();
    data.token = TOKEN;
  } else if (LOGIN_EMAIL && LOGIN_PASSWORD && MISSION_CODE) {
    const loginRes = await page.request.post(BASE + "/api/auth/login", {
      data: { email: LOGIN_EMAIL, password: LOGIN_PASSWORD, missionCode: MISSION_CODE },
    });
    if (!loginRes.ok()) throw new Error("login " + loginRes.status() + " " + (await loginRes.text()));
    data = await loginRes.json();
    if (data.totpRequired) throw new Error("2FA requis — utiliser PORTIA_TOKEN");
  } else {
    throw new Error("PORTIA_TOKEN ou MISSION_CODE+PORTIA_EMAIL+PORTIA_PASSWORD requis");
  }

  await page.addInitScript((token) => {
    localStorage.setItem("portia_auth_token", token);
    window.PORTIA_AUTH_TOKEN = token;
  }, data.token);

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.App && window.portiaStart, null, { timeout: 90000 });
  await page.evaluate(
    async ({ data, roleMap, role }) => {
      const user = {
        name: data.user.name,
        role: roleMap[data.user.role] || role,
        serverRole: data.user.role,
        readOnly: data.user.role === "cabinet",
        email: data.user.email,
        canDeposit: data.user.role !== "cabinet",
      };
      localStorage.setItem("portia_auth_user", JSON.stringify(user));
      localStorage.setItem("portia_auth_user", JSON.stringify(user));
      window.PORTIA_AUTH_TOKEN = data.token;
      window.PORTIA_REQUIRE_AUTH = true;
      window.PORTIA_SERVER_MODE = true;
      window.App.user = user;
      if (window.portiaStart) await window.portiaStart();
      if (window.App.enter) await App.enter();
    },
    { data, roleMap: ROLE_MAP, role }
  );
  await page.waitForSelector("#app.on", { timeout: 90000 });
  await page.waitForTimeout(2500);
}

async function auditRoute(page, route) {
  const errors = [];
  const handler = (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  page.on("console", handler);
  try {
    await page.evaluate((r) => App.go(r), route);
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => {
      const main = document.getElementById("main");
      const view = main && main.querySelector(".view");
      const empty = view && view.querySelector(".empty");
      const errToast = document.querySelector(".toast.err");
      return {
        hasView: !!view,
        viewLen: view ? view.innerHTML.length : 0,
        empty: empty ? empty.textContent.slice(0, 80) : null,
        route: App.route,
        errToast: errToast ? errToast.textContent.slice(0, 80) : null,
      };
    });
    const ok = state.hasView && state.viewLen > 200 && !state.errToast;
    return { route, ok, state, errors: [...errors] };
  } finally {
    page.off("console", handler);
  }
}

async function main() {
  if (!TOKEN && !(LOGIN_EMAIL && LOGIN_PASSWORD && MISSION_CODE)) {
    console.error("PORTIA_TOKEN ou MISSION_CODE+PORTIA_EMAIL+PORTIA_PASSWORD requis");
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const fails = [];
  const oks = [];

  try {
    await injectSession(page, "admin");
    console.log("Session admin injectée\n=== VUES ADMIN ===");
    for (const route of ADMIN_ROUTES) {
      const r = await auditRoute(page, route);
      if (r.ok) {
        oks.push(route);
        console.log(`  OK ${route} (${r.state.viewLen} chars)`);
      } else {
        fails.push(r);
        console.log(`  FAIL ${route}`, r.state, r.errors[0] || "");
      }
    }
    console.log("\n=== ALIAS HASH ===");
    for (const alias of HASH_ALIASES) {
      await page.evaluate((h) => { location.hash = "#" + h; }, alias);
      await page.waitForTimeout(1200);
      const route = await page.evaluate(() => App.route);
      const ok = route !== "cockpit" || alias === "documents";
      console.log(`  ${ok ? "OK" : "FAIL"} #${alias} -> ${route}`);
      if (!ok && alias === "documents") fails.push({ route: alias, state: { route } });
    }
    console.log("\n=== BOUTONS COCKPIT (clic) ===");
    await page.evaluate(() => App.go("cockpit"));
    await page.waitForTimeout(1000);
    const tags = await page.$$eval(".ph .tag, .kpis + .card .tag", (els) =>
      els.slice(0, 8).map((e) => e.textContent.trim())
    );
    console.log("  tags:", tags.join(" | "));
    for (const label of ["Entretiens", "Data Room", "Matrice CDC"]) {
      const btn = page.locator(`button.tag:has-text("${label}")`).first();
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(1200);
        const route = await page.evaluate(() => App.route);
        console.log(`  OK clic "${label}" -> ${route}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n=== RÉSUMÉ NAVIGATEUR ===`);
  console.log(`OK: ${oks.length}/${ADMIN_ROUTES.length}  FAIL: ${fails.length}`);
  if (fails.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

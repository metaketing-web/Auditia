/**
 * Regénère les captures tutoriel (logo Skydeen) — admin + auditeur.
 * Usage: MISSION_CODE=xxx node scripts/capture-tutoriels.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.PORTIA_URL || "https://audit.skydeen.ai";
const OUT = path.join(ROOT, "tutoriels", "captures");
const MISSION = process.env.MISSION_CODE || "";
const PASSWORDS = {
  "admin@portia.local": process.env.PORTIA_PASSWORD_ADMIN || process.env.PORTIA_PASSWORD || "Portia2026!",
  "juliana@portia.local": process.env.PORTIA_PASSWORD_JULIANA || process.env.PORTIA_PASSWORD || "Portia2026!",
  "auditeur.b@portia.local": process.env.PORTIA_PASSWORD_B || process.env.PORTIA_PASSWORD || "Portia2026!",
  "auditeur.t@portia.local": process.env.PORTIA_PASSWORD_T || process.env.PORTIA_PASSWORD || "Portia2026!",
  "jeanmajax234@gmail.com": process.env.PORTIA_PASSWORD_JEAN || "JeanPNIPM2026!",
  "diopasse@hotmail.fr": process.env.PORTIA_PASSWORD_ASSE || "AssePNIPM2026!",
  "lbaoka@gmail.com": process.env.PORTIA_PASSWORD_LAETITIA || "LaetitiaPNIPM2026!",
};

const VIEWPORT = { width: 1800, height: 1125 };

async function waitApp(page) {
  await page.waitForSelector("#app.on", { timeout: 60000 });
  await page.waitForTimeout(1200);
}

const ROLE_MAP = {
  admin: "admin",
  juliana: "admin",
  auditeur_b: "auditeur",
  auditeur_t: "auditeur",
  cabinet: "cabinet",
};

async function login(page, email) {
  const res = await page.request.post(BASE + "/api/auth/login", {
    data: { email, password: PASSWORDS[email] || process.env.PORTIA_PASSWORD || "Portia2026!", missionCode: MISSION },
  });
  if (!res.ok()) throw new Error("login " + email + " → " + res.status());
  const data = await res.json();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.App && window.portiaStart, null, { timeout: 120000 });
  await page.evaluate(
    async ({ data, roleMap }) => {
      localStorage.setItem("portia_auth_token", data.token);
      localStorage.setItem("portia_auth_user", JSON.stringify(data.user));
      const role = roleMap[data.user.role] || "admin";
      const user = {
        name: data.user.name,
        role,
        serverRole: data.user.role,
        readOnly: data.user.role === "cabinet",
        email: data.user.email,
      };
      localStorage.setItem("portia_audit_user", JSON.stringify(user));
      window.PORTIA_AUTH_TOKEN = data.token;
      window.App.user = user;
      if (window.PortiaEnterprise && PortiaEnterprise.boot) await PortiaEnterprise.boot();
      else if (window.portiaStart) await window.portiaStart();
      if (window.App && App.user && App.enter) App.enter();
    },
    { data, roleMap: ROLE_MAP }
  );
  await waitApp(page);
}

async function go(page, route) {
  await page.evaluate((r) => {
    window.App.go(r);
  }, route);
  await page.waitForTimeout(1500);
}

async function shot(page, file) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: file, fullPage: false });
  console.log("✓", path.relative(ROOT, file));
}

async function captureAdmin(page) {
  await login(page, "admin@portia.local");
  const admin = path.join(OUT, "admin");

  await go(page, "cockpit");
  await shot(page, path.join(admin, "01-cockpit.png"));

  await go(page, "planning");
  await shot(page, path.join(admin, "02-planning.png"));

  await go(page, "entretiens");
  await shot(page, path.join(admin, "03-entretiens.png"));

  await go(page, "dataroom");
  await shot(page, path.join(admin, "04-dataroom.png"));

  await go(page, "ecart");
  await shot(page, path.join(admin, "05-matrice-ecart.png"));

  await page.evaluate(() => {
    const gaps = window.Store && Store.get ? Store.get("gaps") : [];
    if (gaps[0] && window.openGap) openGap(gaps[0]);
  });
  await page.waitForTimeout(1000);
  await shot(page, path.join(admin, "06-matrice-preuves.png"));
  await page.evaluate(() => window.Modal && Modal.close && Modal.close());
  await page.waitForTimeout(400);

  await go(page, "cdc_tech");
  await shot(page, path.join(admin, "07-checklist-cdc.png"));

  await go(page, "constats");
  await shot(page, path.join(admin, "08-constats.png"));

  await go(page, "lacunes");
  await shot(page, path.join(admin, "09-lacunes.png"));

  await go(page, "risques");
  await shot(page, path.join(admin, "10-risques.png"));

  await go(page, "livrables");
  await shot(page, path.join(admin, "11-livrables.png"));

  await go(page, "gouv");
  await shot(page, path.join(admin, "12-gouvernance.png"));

  await go(page, "docs_mission");
  await shot(page, path.join(admin, "13-documents-mission.png"));
}

async function captureLoginPortal(page, outFile, portalRole) {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("#loginStepRole", { timeout: 120000 });
  await page.waitForTimeout(600);
  await page.click(`.role-opt[data-role="${portalRole}"]`);
  await page.waitForTimeout(350);
  await page.click("#lgContinue");
  await page.waitForSelector("#loginStepCred", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);
  const placeholders = {
    auditeur: "jeanmajax234@gmail.com",
    admin: "ac@metaketing.io",
    cabinet: "rplurielles@gmail.com",
  };
  const email = placeholders[portalRole];
  if (email) {
    await page.fill("#lgEmail", email);
    await page.fill("#lgCode", "••••••••••••");
  }
  await shot(page, outFile);
}

async function captureAuditeur(page) {
  const aud = path.join(OUT, "auditeur");

  await captureLoginPortal(page, path.join(aud, "01-connexion.png"), "auditeur");

  await login(page, "jeanmajax234@gmail.com");

  await go(page, "agenda");
  await shot(page, path.join(aud, "02-menu-auditeur.png"));
  await shot(page, path.join(aud, "03-agenda.png"));

  await go(page, "conduct");
  await shot(page, path.join(aud, "04-conduire-liste.png"));

  await page.evaluate(() => {
    const ents = window.Store && Store.get ? Store.get("entretiens") : [];
    const e = ents.find((x) => x.statut === "planifie" || x.statut === "planifié") || ents[0];
    if (e) {
      window.App.conductId = e.id;
      window.App.go("conduct");
    }
  });
  await page.waitForTimeout(1500);
  await shot(page, path.join(aud, "05-questionnaire.png"));

  await go(page, "depot");
  await shot(page, path.join(aud, "06-depot.png"));

  await go(page, "consaud");
  await shot(page, path.join(aud, "07-constats.png"));

  await go(page, "assistant");
  await shot(page, path.join(aud, "08-assistant-ia.png"));
}

async function main() {
  if (!MISSION && !["login-auditeur", "login-cabinet"].includes(process.env.CAPTURE_ONLY || "")) {
    console.error("MISSION_CODE requis (code mission .env)");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: "fr-FR",
  });
  const page = await context.newPage();

  const only = process.env.CAPTURE_ONLY || "";
  try {
    if (!only || only === "admin") {
      console.log("Captures admin…");
      await captureAdmin(page);
    }
    if (!only || only === "auditeur") {
      console.log("Captures auditeur…");
      await captureAuditeur(page);
    }
    if (only === "login-auditeur") {
      const aud = path.join(OUT, "auditeur");
      fs.mkdirSync(aud, { recursive: true });
      console.log("Capture connexion auditeur…");
      await captureLoginPortal(page, path.join(aud, "01-connexion.png"), "auditeur");
    }
    if (only === "login-cabinet") {
      const cab = path.join(OUT, "cabinet");
      fs.mkdirSync(cab, { recursive: true });
      console.log("Capture connexion cabinet…");
      await captureLoginPortal(page, path.join(cab, "01-connexion.png"), "cabinet");
    }
  } finally {
    await browser.close();
  }
  console.log("Terminé —", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

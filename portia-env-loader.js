/** Charge /opt/portia-audit/.env dans process.env (scripts seed / install). */
const fs = require("fs");
const path = require("path");

function loadPortiaEnv(appDir) {
  const dir = appDir || process.env.PORTIA_APP_DIR || "/opt/portia-audit";
  const file = path.join(dir, ".env");
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

module.exports = { loadPortiaEnv };

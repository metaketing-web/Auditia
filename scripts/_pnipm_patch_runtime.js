
  const NEW_KEYS = PNIPM_PATCH.newTrameKeys || [];

  function snowballId(trameKey) {
    const prefixMap = {
      cabinet: "cab",
      dsi: "dsi",
      tutelle: "tut",
      programme: "prg",
      terrain_dr: "dr",
      flotte: "flot",
      drh: "drh",
      marches: "mp",
      daf: "daf",
      dpsd: "dps",
      dajc: "daj",
      carte_jeunes: "cj",
      dajip: "daji",
      technique: "tec",
      rssi: "rssi",
      dpo: "dpo",
    };
    const p = prefixMap[trameKey] || String(trameKey || "gen").slice(0, 4);
    return p + (PNIPM_PATCH.snowball.suffix || "_cc_snowball");
  }

  function ensureSnowball(tr) {
    if (!tr || !tr.phases || !tr.phases.coconstruct) return;
    const secs = tr.phases.coconstruct.sections;
    if (!secs.length) return;
    const last = secs[secs.length - 1];
    const sid = snowballId(tr._key);
    if ((last.items || []).some((it) => it.id === sid)) return;
    last.items.push({
      id: sid,
      q: PNIPM_PATCH.snowball.text,
      hint: "",
    });
  }

  function mergeAddition(trameKey, tr, add) {
    const ph = tr.phases[add.phase];
    if (!ph) return;
    if (add.newSection) {
      ph.sections.push(add.newSection);
      return;
    }
    if (add.appendQuestions && add.appendQuestions.length) {
      const match = (add.sectionMatch || "").toLowerCase();
      let target = ph.sections[ph.sections.length - 1];
      if (match) {
        target =
          ph.sections.find((s) => (s.title || "").toLowerCase().includes(match.toLowerCase())) ||
          target;
      }
      if (!target.items) target.items = [];
      add.appendQuestions.forEach((q) => {
        if (!target.items.some((it) => it.id === q.id)) target.items.push(q);
      });
    }
  }

  function patchTramesComplets() {
    if (!window.PortiaQuestionnairesComplets) return;
    const TC = PortiaQuestionnairesComplets.TRAMES_COMPLETS;
    if (!TC || TC._pnipmPatched) return;

    Object.keys(PNIPM_PATCH.newTrames || {}).forEach((k) => {
      const tr = JSON.parse(JSON.stringify(PNIPM_PATCH.newTrames[k]));
      tr._key = k;
      ensureSnowball(tr);
      TC[k] = tr;
    });

    (PNIPM_PATCH.additions || []).forEach((add) => {
      const tr = TC[add.trame];
      if (tr) mergeAddition(add.trame, tr, add);
    });

    Object.keys(TC).forEach((k) => {
      if (TC[k] && TC[k].phases) {
        TC[k]._key = k;
        ensureSnowball(TC[k]);
      }
    });

    if (PNIPM_PATCH.deprecated && TC[PNIPM_PATCH.deprecated]) {
      delete TC[PNIPM_PATCH.deprecated];
    }

    TC._pnipmPatched = true;
  }

  function patchTerrainTrames() {
    if (!window.TRAMES || !TRAMES.terrain_dr) return;
    const add = (PNIPM_PATCH.additions || []).find((a) => a.trame === "terrain_dr");
    if (!add || !add.appendQuestions) return;
    const tr = TRAMES.terrain_dr;
    if (!tr.phases || !tr.phases.invest) return;
    const secs = tr.phases.invest.sections || [];
    let target = secs.find((s) => /périmètre|organisation/i.test(s.title || "")) || secs[0];
    if (!target) return;
    if (!target.items) target.items = [];
    add.appendQuestions.forEach((q) => {
      if (!target.items.some((it) => it.id === q.id)) target.items.push(q);
    });
  }

  function patchResolve() {
    if (!window.PortiaQuestionnaires || !PortiaQuestionnaires.resolveTrameEntretien) return;
    if (PortiaQuestionnaires._pnipmResolvePatched) return;
    const orig =
      PortiaQuestionnaires._origResolveComplet ||
      PortiaQuestionnaires.resolveTrameEntretien.bind(PortiaQuestionnaires);

    PortiaQuestionnaires.resolveTrameEntretien = function (e) {
      const tr = e && e.trame;
      if (tr && NEW_KEYS.includes(tr)) return tr;
      const explicit = [
        "carte_jeunes",
        "daf",
        "dpsd",
        "dajc",
        "dajip",
        "flotte",
        "drh",
        "marches",
      ];
      if (explicit.includes(tr)) return tr;
      if (e.struct === "DRH") return "drh";
      if (e.struct === "Patrimoine") return "flotte";
      if (e.struct === "Marchés") return "marches";
      return orig(e);
    };
    PortiaQuestionnaires._pnipmResolvePatched = true;
  }

  function apply() {
    patchTramesComplets();
    patchTerrainTrames();
    patchResolve();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(apply, 50));
  } else {
    setTimeout(apply, 50);
  }

  window.PNIPMQuestionnairePatch = { apply, PNIPM_PATCH };

# Skydeen Audit Cockpit — Correctifs à appliquer sur le serveur (13.51.252.61)

## Méthode la plus simple
Remplacer **4 fichiers** dans le dossier servi (à côté de `server.py`), puis vider le cache navigateur (Ctrl/Cmd + Maj + R) :

- `index.html`
- `portia-finish.js`
- `portia-bridge.js`
- `portia-reports-persist.js`

Vérification : ouvrir `http://13.51.252.61/portia-finish.js` → la ligne 68 ne doit plus contenir `|| 0)}%` (parenthèse en trop).

---

## Détail des modifications (si tu préfères patcher à la main)

### 1. portia-finish.js — ligne 68 (BLOQUANT : tout le fichier ne se chargeait pas)
Erreur de syntaxe, parenthèse en trop dans le `width:`.

AVANT :
```
...<i style="width:${Math.round((m.verse / m.docTot) * 100) || 0)}%;background:var(--sage)"></i>...
```
APRÈS :
```
...<i style="width:${Math.round((m.verse / m.docTot) * 100) || 0}%;background:var(--sage)"></i>...
```
(supprimer la parenthèse `)` juste avant `}%`)

### 2. index.html — Store.get / Store.find null-safe (BLOQUANT : crash au boot)
Les modules s'initialisent avant l'hydratation de l'état ; `Store.state` peut être `null`.

AVANT :
```
  get(coll){ return this.state[coll]||[]; },
  find(coll,id){ return (this.state[coll]||[]).find(x=>x.id===id); },
```
APRÈS :
```
  get(coll){ return (this.state&&this.state[coll])||[]; },
  find(coll,id){ return ((this.state&&this.state[coll])||[]).find(x=>x.id===id); },
```

### 3. index.html — vue assistant, garde sur App.user.name
AVANT :
```
function bubble(role,content){const av=role==="user"?(App.user.name.split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase()):"IA";
```
APRÈS :
```
function bubble(role,content){const av=role==="user"?(((App.user&&App.user.name)||"Moi").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase()):"IA";
```

### 4. index.html — bloc diagnostic (affiche la vraie erreur au lieu de « Script error. »)
À insérer dans le `<head>`, juste après la ligne `<link rel="icon" ...>` :
```
<script>
/* Diagnostic : transforme "Script error." opaque en message lisible à l'écran. */
(function(){
  function show(title, detail){
    try{
      var b=document.getElementById("__portia_err");
      if(!b){ b=document.createElement("div"); b.id="__portia_err";
        b.style.cssText="position:fixed;z-index:99999;left:0;right:0;top:0;max-height:50vh;overflow:auto;background:#2a0f0f;color:#ffd9d2;font:12px/1.5 ui-monospace,Menlo,monospace;padding:12px 16px;border-bottom:2px solid #e0532f;white-space:pre-wrap;box-shadow:0 4px 18px rgba(0,0,0,.4)";
        var x=document.createElement("button"); x.textContent="×"; x.style.cssText="position:absolute;top:8px;right:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer"; x.onclick=function(){b.remove();};
        (document.body||document.documentElement).appendChild(b); b.appendChild(x);
      }
      var p=document.createElement("div"); p.textContent="⚠ "+title+"\n"+detail; b.appendChild(p);
    }catch(_){}
    try{ console.error("[SKYDEEN]", title, detail); }catch(_){}
  }
  window.addEventListener("error", function(e){
    var d=(e.filename||"")+(e.lineno?(":"+e.lineno+":"+(e.colno||0)):"")+"\n"+((e.error&&e.error.stack)||e.message||"(détail masqué — souvent CSP/ressource externe)");
    show("Erreur JS", d);
  });
  window.addEventListener("unhandledrejection", function(e){
    var r=e.reason; show("Promesse rejetée", (r&&(r.stack||r.message))||String(r));
  });
})();
</script>
```

### 5. portia-bridge.js — amorçage de l'état (défensif)
Juste après la ligne `async function portiaStart() {` (ligne 406), ajouter :
```
    if (!Store.state) Store.state = Store.defaults();  // garde-fou: jamais null avant init
```

### 6. portia-reports-persist.js — garde dans ensureDrafts (ligne 21)
Au tout début de la fonction `ensureDrafts()`, ajouter en première ligne :
```
    if (!window.Store || !Store.state) return; // garde-fou: état pas encore hydraté
```

---

## Après déploiement
1. Recharger en Ctrl/Cmd + Maj + R (le cache des `.js` est la cause n°1 de « ça plante encore après le fix »).
2. Si un bandeau rouge apparaît en haut : il contient désormais l'erreur réelle (message + fichier:ligne + pile). Me l'envoyer pour correction ciblée.

## Validé en headless (avant/après)
- Backend : toutes les routes OK (la seule 503 = feed.ics, volontaire car secret ICS non configuré).
- Frontend AVANT : crash au boot dans tous les cas. APRÈS : 0 erreur au boot (connecté / non connecté / sans backend), 35 vues rendues sans erreur, modales OK.

# PNIPM — Compléments d'audit : note d'intégration

**Fichier de données associé :** `PNIPM_trames_a_ajouter.json` (source de vérité, contient le texte exact de toutes les questions).

Ce package comble les angles morts identifiés entre les questionnaires existants et le cahier des charges PNIPM : un Volet B traité avec une trame générique, un module IA non probé, et un circuit de paiement des primes / SIGFIP insuffisamment creusé.

## Ce qui est livré

| Élément | Quantité |
|---|---|
| Nouvelles trames spécialisées | **8** |
| Questions des nouvelles trames | **104** |
| Questions ajoutées aux trames existantes | **15** |
| **Total questions ajoutées** | **119** |
| Réaffectations d'entités (changement de trame) | **8** |
| Nouvelle entité (interlocuteur) | **1** |

## Convention de référence (à respecter)

`{prefixe}_{phase}_{section}{num}`
- **phase** : `i` = Investigation, `c` = Confrontation, `cc` = Co-construction
- Confirmée d'après la trame `cabinet` (`cab_i_a1`, `cab_c_1`, `cab_cc_1`).
- Pour chaque nouvelle trame, le préfixe est fourni dans le JSON (`prefixe_ref`).

## 1. Nouvelles trames (à créer)

Même structure que les trames existantes (Investigation avec sections A/B/C → Confrontation → Co-construction). Détail complet des questions dans le JSON, clé `nouvelles_trames`.

| Clé trame | Préfixe | Couvre | Q |
|---|---|---|---|
| `flotte` | `flot` | Parc auto, maintenance préventive, carburant, TCO (CDC §5.1) | 14 |
| `drh` | `drh` | Effectifs, SIRH/paie, absences, évaluations (CDC §5.2) | 14 |
| `marches` | `mp` | Circuit passation, SIGOMAP, articulation budget | 11 |
| `daf` | `daf` | Budget interne, SIGFIP, **circuit de paiement des primes** (CDC §5.4) | 14 |
| `dpsd` | `dps` | Référentiels, dictionnaire d'indicateurs, GED/archivage (CDC §5.5) | 14 |
| `dajc` | `daj` | Instruments juridiques de partage, signature électronique, PI (CDC §9) | 12 |
| `carte_jeunes` | `cj` | Identité maître, relation NNI, écosystème d'avantages | 11 |
| `dajip` | `daji` | Dispositifs d'insertion + **captation marché du travail** (CDC §4.2) | 14 |

## 2. Ajouts aux trames existantes

Détail dans le JSON, clé `additions_trames_existantes`.

- **`cabinet`** : nouvelle section **D — IA & aide à la décision** (3 q), nouvelle section **E — Conduite du changement & antécédents** (3 q), + 1 question de Confrontation (`cab_c_4`, MVP vs calendrier accéléré). Préfixe `cab` **confirmé**.
- **`dsi`** : nouvelle section **E — IA, données d'entraînement & socle décisionnel** (4 q, dont datacenter national). Préfixe `dsi` **confirmé**.
- **`tutelle`** : 2 questions dans la section C existante (payeur de référence, réconciliation). Préfixe `tut` **à confirmer dans le code**.
- **`programme`** : 1 question dans la section C existante (canal de décaissement). Préfixe `prog` **à confirmer dans le code**.
- **`terrain_dr`** : 1 question dans la section A existante (réalité départementale). Préfixe `dr` **à confirmer dans le code**.

> ⚠️ Pour `tutelle`, `programme`, `terrain_dr` : je n'ai pas pu lire le préfixe exact dans les exports. Aligner les refs sur le préfixe réellement utilisé dans le code avant insertion.

## 3. Réaffectation d'entités

Mettre à jour le champ `trame` de ces entités (IDs repris du `manifest.json`). Détail dans le JSON, clé `reaffectations_entites`.

| ID entité | Entité | Trame actuelle | → Trame cible |
|---|---|---|---|
| `ent_fs236bt` | DRH | `volet_b_np` | `drh` |
| `ent_h9w21r9` | Chef Service Patrimoine (flotte) | `volet_b_np` | `flotte` |
| `ent_6w1fetz` | Chef Cellule Marchés | `volet_b_np` | `marches` |
| `ent_3uio1nu` | DAF | `direction` | `daf` |
| `ent_wb5irc5` | DPSD | `direction` | `dpsd` |
| `ent_zmo1cx6` | DAJC | `direction` | `dajc` |
| `ent_297ry5c` | DAJIP | `direction` | `dajip` |
| `ent_dgeqx7n` | Carte Jeunes | `programme` | `carte_jeunes` |

## 4. Nouvelle entité

Ajouter **Point focal Datacenter National / Cloud Gouvernemental** (structure « Hébergement souverain »), rattachée à la trame **`technique`** existante. Hébergement souverain exigé au CDC §6.1 mais aucun interlocuteur d'hébergement n'était prévu (à la différence d'UXP/X-Road, SIGFIP, NNI). ID suggéré `ent_dcnat01`.

## 5. Tronc commun (toutes trames)

- Ajouter en fin de Co-construction une question « snowball » : *« Qui d'autre devrions-nous impérativement interroger pour compléter ce cadrage ? »* (suffixe de ref suggéré `_cc_snowball`).
- Ajouter à la **fiche entretien** les champs : Nom de l'interviewé, Titre/fonction, Email, Téléphone (aujourd'hui seuls Structure/Axe/Semaine/Date/Heure/Auditeur(s)/Trame sont capturés).

## 6. Dépréciation

La trame **`volet_b_np`** devient orpheline une fois DRH/Patrimoine/Marchés réaffectés. La supprimer ou l'archiver.

---

## Prompt prêt à coller dans Cursor

> Contexte : outil d'export de questionnaires d'audit (trames + entités, ref `{prefixe}_{phase}_{num}`). Le fichier `PNIPM_trames_a_ajouter.json` décrit des compléments. Intègre-les en respectant le modèle de données existant :
> 1. Crée les 8 nouvelles trames (`nouvelles_trames`) au même format que les trames actuelles.
> 2. Applique les ajouts aux trames existantes (`additions_trames_existantes`) — pour `tutelle`, `programme`, `terrain_dr`, aligne le préfixe de ref sur celui réellement utilisé dans le code.
> 3. Réaffecte les 8 entités (`reaffectations_entites`) en changeant leur champ `trame`.
> 4. Crée la nouvelle entité (`nouvelles_entites`) sur la trame `technique`.
> 5. Applique le tronc commun (question snowball + champs fiche entretien).
> 6. Déprécie la trame `volet_b_np`.
> Mappe les noms de champs du JSON sur le schéma réel du projet, et signale-moi tout conflit de ref avant d'écrire.

## Checklist de recette

- [ ] 8 nouvelles trames visibles dans le sélecteur, export `.doc` OK
- [ ] Les 8 entités réaffectées génèrent le bon questionnaire (plus la trame générique)
- [ ] Aucune collision de ref (vérifier `cab_i_d*`, `cab_i_e*`, `cab_c_4`, `dsi_i_e*`)
- [ ] Préfixes `tut` / `prog` / `dr` alignés sur le code réel
- [ ] Question snowball présente dans toutes les trames
- [ ] Fiche entretien : 4 nouveaux champs interviewé
- [ ] `manifest.json` régénéré, `count` cohérent, nouvelle entité incluse
- [ ] Trame `volet_b_np` supprimée/archivée

# AI721_ASTRA_LUZ_2.0

Application web du secrétariat des évaluations du second cycle du Collège François-Xavier Vogt (Yaoundé), année scolaire 2026-2027 : planification des épreuves, répartition des élèves en salles, anonymat des copies par code-barres, saisie des notes à la douchette, levée d'anonymat contrôlée, relevés, statistiques et éditions PDF.

## Adresses

| Version | Adresse |
|---|---|
| Site web (GitHub Pages) | https://andje30.github.io/ai721-exam-management/ |
| Variante Render (site statique) | https://ai721-astra-luz.onrender.com (après création du Blueprint) |
| Version hors ligne | `livrables/AI721_ASTRA_LUZ_2.0_hors_ligne.html` |

## Contenu du dépôt

| Dossier | Contenu |
|---|---|
| `src/` | Code source : feuille de style, modules JavaScript, fichiers du site (`web/`), script de construction `build.py` |
| `site/` | Site construit, servi par Render ; la branche `gh-pages` en contient la même copie pour GitHub Pages |
| `docs/` | Générateurs du cahier des charges et du manuel (gabarit AI721), diagrammes UML Mermaid, captures d'écran |
| `livrables/` | Cahier des charges et manuel d'utilisation (Word et PDF), version hors ligne, exemples de PDF (données fictives) |
| `scripts/` | Téléchargement des bibliothèques, rendu des diagrammes UML |
| `render.yaml` | Configuration Render (site statique gratuit) |

## Mise en ligne

1. **GitHub Pages** : Settings › Pages › *Deploy from a branch* › branche `gh-pages`, dossier `/ (root)` › Save.
2. **Render** (variante) : dashboard.render.com › New › Blueprint › ce dépôt. Le fichier `render.yaml` publie le dossier `site/`.
3. **Base en ligne Firebase** (comptes nominatifs, données partagées) : suivre le chapitre 4 du manuel ou le fichier `src/web/README.md`. Les règles de sécurité sont dans `src/web/firestore.rules`.

Tant que la base Firebase n'est pas configurée, l'application fonctionne en base locale (données dans le navigateur de chaque poste).

## Reconstruire le site

```bash
bash scripts/fetch-libs.sh /tmp/libs
python3 src/build.py /tmp/libs
```

La construction produit `dist/web` (site), `dist/artifact.html` (version claude.ai) et `dist/AI721_ASTRA_LUZ_2.0_hors_ligne.html`. Copier ensuite `dist/web` dans `site/` et dans la branche `gh-pages`.

## Documents

```bash
cd docs && node cdc2.js && node manuel2.js && python3 convert.py AI721_ASTRA_LUZ_2.0_Cahier_des_charges.docx AI721_ASTRA_LUZ_2.0_Manuel_utilisation.docx
```

Les diagrammes se rendent avec `node scripts/render-uml.cjs /tmp/libs/mermaid-10.9.1/package/dist/mermaid.min.js`.

Commanditaire : M. ANDJE IBOT Georges, coordonnateur d'informatique du second cycle. Éditeur : AI721 TECH STUFF.

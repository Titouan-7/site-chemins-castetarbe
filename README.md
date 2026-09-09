# Au bout du chemin — Site statique Castétarbe

Site vitrine de l'association **Au bout du chemin** (entretien et promotion des chemins de Castétarbe).

## Mise en ligne

1. Renseigner les placeholders dans `index.html` (commentaire `SITE_URL`), `js/main.js` (`FORMSPREE_ID`) et `mentions-legales.html`.
2. Pousser le dossier sur GitHub et connecter le dépôt à **Netlify** (dossier racine = `.`, pas de commande de build).
3. Chaque `git push` sur la branche principale déclenche un déploiement automatique.

Fichiers de config : `netlify.toml`, `_redirects` (page 404), `robots.txt`, `sitemap.xml`.

## Ajouter un chemin

1. **Photos** — déposer les JPG dans `images/chemins/<Dossier>/` (convention `<Dossier>-01.jpg`, etc.).
2. **Optimisation** — `npm run images` (génère les variantes WebP/JPG dans `images/chemins-opt/`).
3. **Fiche** — ajouter une entrée dans `js/trails.js` (objet `TRAILS`).
4. **Carte HTML** — dupliquer une carte dans `index.html` section `#chemins` (`data-trail="slug"`, vignette, titre, description).

## Changer l'affiche d'un événement

1. Placer les fichiers dans `images/events/` (JPG + WebP, variante 600 px si possible).
2. Mettre à jour la carte dans `index.html` section `#evenements` (`<picture>`, `data-lightbox`, texte).
3. Actualiser le JSON-LD `Event` dans le `<head>` si la date ou le lieu change.

## Scripts npm

| Commande | Rôle |
|---|---|
| `npm run images` | Optimise les photos (chemins, legacy) |
| `npm run fetch-legacy` | Télécharge les images legacy depuis l'ancien site |
| `npm run build-gpx` | Régénère les tracés GPX et `js/trail-tracks.js` |
| `npm run download-fonts` | Retélécharge les polices locales (woff2) |
| `npm run generate-favicon` | Régénère `favicon.ico` depuis `images/logo.png` |

## Structure

- `index.html` — page principale
- `css/style.css` — styles (polices locales incluses)
- `js/` — scripts (carte Leaflet, chemins, balades, contact)
- `images/` — photos et visuels
- `parcours/` — fichiers GPX des balades
- `fonts/` — polices woff2 (RGPD)

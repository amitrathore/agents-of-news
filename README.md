# Agents of News

A self-contained static redesign of Agents of News, built for GitHub Pages.

## Local preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Project structure

- `index.html` — primary page content and accessible structure
- `profiles.html` — local archive of the featured agent profiles
- `styles.css` — responsive visual system and layout
- `script.js` — mobile navigation, local launch-brief generation, and the dynamic footer year
- `assets/` — all imagery and brand artwork, stored locally

The site has no runtime third-party dependencies, external fonts, or remote asset requests.

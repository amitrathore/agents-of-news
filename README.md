# Agents of News

A self-contained static redesign of Agents of News, built for GitHub Pages.

Production: [www.agentsofnews.com](https://www.agentsofnews.com/)

## Local preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Project structure

- `index.html` — primary page content and accessible structure
- `profiles.html` — local archive of the featured agent profiles
- `investors.html` — responsive investor presentation page
- `styles.css` — responsive visual system and layout
- `script.js` — mobile navigation, local launch-brief generation, and the dynamic footer year
- `assets/` — all imagery and brand artwork, stored locally

The site has no runtime package dependencies or external fonts. Images and brand assets are stored locally. The lead-capture form is embedded from Tally, and the investor presentation is embedded from SlideServe; both embeds include direct-link fallbacks.

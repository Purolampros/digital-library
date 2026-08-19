# 📚 Digital Library

A personal digital library — add, search and track your books. Built as a single-page progressive web app.

## What it does
- **Add books** with title, author, genre and reading status (unread / reading / read).
- **Search** by title or author, filter by genre or status.
- **BOW welcome animation** on first visit — the letters B, O, W fly in from the left, top and right with a satisfying bounce.
- Fully responsive — works on desktop, tablet and phone.
- **Accessible** — semantic HTML, keyboard navigation, screen-reader labels and reduced-motion support.
- Data persists in your browser's `localStorage` — no server, no account needed.

## How to run
1. Open `index.html` in any modern browser — that's it.
2. Or serve the folder with any static server (e.g. `npx serve .`).
3. To install as a phone app, tap the **Download APK** button in Lewa Coder.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Main page — structure and form |
| `styles.css` | Full layout, theme, welcome animation, book cards |
| `app.js` | App logic — state, rendering, search, filters |
| `logo.svg` | The library brand mark |

## Tech
HTML + CSS + vanilla JS. Zero dependencies, zero build step.

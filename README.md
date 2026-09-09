# 📚 Digital Library

A personal digital library — add, search and track your books. Built as a single-page progressive web app.

## What it does
- **Add books** with title, author, genre, reading status (unread / reading / read), and an optional PDF, EPUB, TXT, DOC, or DOCX file.
- **Search** by title or author, filter by genre or status.
- **BOW welcome animation** on first visit — the letters B, O, W fly in from the left, top and right with a satisfying bounce.
- Fully responsive — works on desktop, tablet and phone.
- **Accessible** — semantic HTML, keyboard navigation, screen-reader labels and reduced-motion support.
- With Supabase configured, book metadata and uploaded files are shared across devices. Without Supabase, metadata falls back to browser `localStorage`.

## How to run
1. Open `index.html` in any modern browser — that's it.
2. Or serve the folder with any static server (e.g. `npx serve .`).
3. To install as a phone app, tap the **Download APK** button in Lewa Coder.

## Supabase setup
1. Run `supabase-schema.sql` in the Supabase SQL Editor. This creates the `books` table, the public `books` Storage bucket, and the policies needed for catalog reads and file uploads.
2. Put the project URL and publishable key in `supabase-config.js`.
3. Open the Books page and choose **Add a book**. Uploaded files appear on the shelf with an **Open book file** link.

The current policies make the catalog and uploaded files public. Add authentication and tighter row-level security before storing private books.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Main page — structure and form |
| `styles.css` | Full layout, theme, welcome animation, book cards |
| `app.js` | App logic — state, rendering, search, filters |
| `logo.svg` | The library brand mark |

## Tech
HTML + CSS + vanilla JS. Zero dependencies, zero build step.

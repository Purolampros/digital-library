/* ===== Digital Library ===== */

const STORAGE_KEY = "digital-library.books";
const GENRES = [
  "Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Biography",
  "History",
  "Science",
  "Technology",
  "Self-Help",
  "Poetry",
  "Other",
];

const STATUS_LABELS = {
  unread: "Unread",
  reading: "Reading",
  read: "Read",
};

/* ---------- DOM helpers ---------- */
const $ = (id) => document.getElementById(id);

/* ---------- State ---------- */
let books = loadBooks() || [];

function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Could not parse saved books", e);
    return null;
  }
}

function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    console.warn("Could not save books", e);
  }
}

/* ---------- Welcome animation (BOW) ---------- */
function setupWelcome() {
  const overlay = document.getElementById("welcome");
  const skipBtn = document.getElementById("skipWelcome");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Build the B-O-W scene dynamically inside .welcome-inner
  const inner = overlay.querySelector(".welcome-inner");

  // Create the BOW scene container
  const bowScene = document.createElement("div");
  bowScene.className = "bow-scene";

  const letters = [
    { char: "B", cls: "bow-letter bow-letter--b", delay: 0.2 },
    { char: "O", cls: "bow-letter bow-letter--o", delay: 0.7 },
    { char: "W", cls: "bow-letter bow-letter--w", delay: 1.2 },
  ];

  letters.forEach(({ char, cls }) => {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = char;
    bowScene.appendChild(span);
  });

  // Insert BOW scene before the welcome-title
  const titleEl = inner.querySelector(".welcome-title");
  inner.insertBefore(bowScene, titleEl);

  // Wrap each letter of the title in a span with staggered delays
  const titleText = titleEl.textContent;
  titleEl.textContent = "";
  [...titleText].forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.animationDelay = (1.6 + i * 0.06) + "s";
    titleEl.appendChild(span);
  });

  function close() {
    overlay.classList.add("done");
    setTimeout(() => overlay.classList.add("hidden"), reduced ? 0 : 800);
  }

  if (reduced) {
    close();
  } else {
    window.addEventListener("pointerdown", () => close(), { once: true });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "Enter") close();
    }, { once: true });
    skipBtn.addEventListener("click", close);
    setTimeout(close, 3800);
  }
}

/* ---------- Rendering ---------- */
function populateSelects() {
  const genreSelects = [document.getElementById("genre"), document.getElementById("filterGenre")];
  genreSelects.forEach((select) => {
    select.innerHTML =
      '<option value="">' +
      (select.id === "genre" ? "Genre…" : "All genres") +
      "</option>";
    GENRES.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      select.appendChild(opt);
    });
  });
}

function renderStats(visible) {
  const total = books.length;
  const read = books.filter((b) => b.status === "read").length;
  document.getElementById("stats").textContent = total
    ? `${visible} of ${total} books shown · ${read} read`
    : "No books yet";
}

function renderBooks() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const genre = document.getElementById("filterGenre").value;
  const status = document.getElementById("filterStatus").value;

  const filtered = books.filter((b) => {
    const matchQuery =
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query);
    const matchGenre = !genre || b.genre === genre;
    const matchStatus = !status || b.status === status;
    return matchQuery && matchGenre && matchStatus;
  });

  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  grid.innerHTML = "";

  filtered.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book";

    const title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = book.title;

    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = "by " + book.author;

    const meta = document.createElement("div");
    meta.className = "book-meta";
    const genreTag = document.createElement("span");
    genreTag.className = "tag tag-genre";
    genreTag.textContent = book.genre || "No genre";
    const statusTag = document.createElement("span");
    statusTag.className = "tag tag-status-" + book.status;
    statusTag.textContent = STATUS_LABELS[book.status] || "Unread";
    meta.append(genreTag, statusTag);

    const actions = document.createElement("div");
    actions.className = "book-actions";

    const cycleBtn = document.createElement("button");
    cycleBtn.type = "button";
    cycleBtn.textContent = nextStatusLabel(book.status);
    cycleBtn.addEventListener("click", () => {
      book.status = nextStatus(book.status);
      saveBooks();
      renderBooks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Remove";
    deleteBtn.addEventListener("click", () => {
      if (window.confirm(`Remove "${book.title}" from your library?`)) {
        books = books.filter((b) => b !== book);
        saveBooks();
        renderBooks();
      }
    });

    actions.append(cycleBtn, deleteBtn);
    card.append(title, author, meta, actions);
    grid.appendChild(card);
  });

  empty.classList.toggle("hidden", filtered.length > 0);
  renderStats(filtered.length);
}

function nextStatus(status) {
  const order = ["unread", "reading", "read"];
  const i = order.indexOf(status);
  return order[(i + 1) % order.length];
}
function nextStatusLabel(status) {
  const next = nextStatus(status);
  return "Mark " + (next === "read" ? "read" : next);
}

/* ---------- Events ---------- */
function setupEvents() {
  document.getElementById("addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const status = document.getElementById("status").value;

    if (!title || !author) return;

    books.unshift({ title, author, genre, status });
    saveBooks();
    renderBooks();

    document.getElementById("addForm").reset();
    document.getElementById("title").focus();
  });

  document.getElementById("search").addEventListener("input", renderBooks);
  document.getElementById("filterGenre").addEventListener("change", renderBooks);
  document.getElementById("filterStatus").addEventListener("change", renderBooks);
}

/* ---------- Init ---------- */
setupWelcome();
populateSelects();
setupNavigation();
setupEvents();
renderBooks();

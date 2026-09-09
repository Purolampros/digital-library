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

/* ---------- Sound effects ---------- */
class SoundFX {
  constructor() {
    this.enabled = true;
  }

  // Create simple beep sounds using Web Audio API
  beep(freq = 400, duration = 100, volume = 0.3) {
    if (!this.enabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
      // Audio context not available
    }
  }

  logoAppear() {
    this.beep(520, 150, 0.2);
  }

  letterBounce(letterIndex) {
    const frequencies = [330, 440, 550]; // B, O, W
    this.beep(frequencies[letterIndex], 120, 0.25);
  }

  complete() {
    this.beep(600, 200, 0.3);
  }
}

const soundFX = new SoundFX();

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

  // Hide skip button
  if (skipBtn) skipBtn.style.display = 'none';

  // Build the B-O-W scene dynamically inside .welcome-inner
  const inner = overlay.querySelector(".welcome-inner");

  // Hide title and tagline during BOW animation (keep logo visible in front)
  const titleEl = inner.querySelector(".welcome-title");
  const tagline = inner.querySelector(".welcome-tag");
  if (titleEl) titleEl.classList.add("hidden");
  if (tagline) tagline.classList.add("hidden");

  // Create the BOW scene container (positioned below logo)
  const bowScene = document.createElement("div");
  bowScene.className = "bow-scene";

  const letters = [
    { char: "B", cls: "bow-letter bow-letter--b" },
    { char: "O", cls: "bow-letter bow-letter--o" },
    { char: "W", cls: "bow-letter bow-letter--w" },
  ];

  letters.forEach(({ char, cls }) => {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = char;
    bowScene.appendChild(span);
  });

  // Insert BOW scene after the logo
  const logo = inner.querySelector(".welcome-logo");
  logo.insertAdjacentElement("afterend", bowScene);

  // Track timers so they can be cleared when skipping
  const timers = [];
  let closed = false;

  function cleanupTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers.length = 0;
  }

  function finishClose() {
    overlay.classList.add("hidden");
    // Show main app immediately
    document.getElementById("loginOverlay").classList.add("hidden");
    document.getElementById("mainHeader").classList.remove("hidden");
    document.getElementById("mainApp").classList.remove("hidden");
    document.getElementById("mainFooter").classList.remove("hidden");
    isLoggedIn = true;
    // Initialize the rest of the app after welcome animation
    populateSelects();
    setupNavigation();
    setupEvents();
    renderBooks();
  }

  function close() {
    if (closed) return;
    closed = true;
    cleanupTimers();
    overlay.classList.add("done");
    soundFX.complete();
    // small delay to allow 'done' transition
    const t = setTimeout(() => finishClose(), reduced ? 0 : 300);
    timers.push(t);
    // remove dblclick listener
    overlay.removeEventListener('dblclick', onDblClick);
  }

  function onDblClick() {
    close();
  }

  // Play sounds at key moments (store timers so they can be cancelled)
  if (!reduced) {
    // Logo appears (0.1s)
    timers.push(setTimeout(() => soundFX.logoAppear(), 100));

    // B lands (0.94s + animation duration)
    timers.push(setTimeout(() => soundFX.letterBounce(0), 940 + 940));

    // O lands (3.29s + animation duration)
    timers.push(setTimeout(() => soundFX.letterBounce(1), 3290 + 1645));

    // W lands (5.65s + animation duration)
    timers.push(setTimeout(() => soundFX.letterBounce(2), 5650 + 940));
  }

  // Final close timer
  if (reduced) {
    // If reduced motion, skip animation and show immediately
    close();
  } else {
    timers.push(setTimeout(close, 8000)); // Total duration
  }

  // Allow double-click anywhere on the overlay to skip animation
  overlay.addEventListener('dblclick', onDblClick);
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
  const reading = books.filter((b) => b.status === "reading").length;
  const genres = new Set(books.map((b) => b.genre)).size;
  
  document.getElementById("stats").textContent = total
    ? `${visible} of ${total} books shown · ${read} read`
    : "No books yet";
  
  // Update home page stats
  if (document.getElementById("totalBooksCount")) {
    document.getElementById("totalBooksCount").textContent = total;
    document.getElementById("booksReadCount").textContent = read;
    document.getElementById("readingNowCount").textContent = reading;
    document.getElementById("genresCount").textContent = genres;
  }
}

let currentBookPage = 1;
const BOOKS_PER_PAGE = 6;

function coverClass(book) {
  const genreIndex = Math.max(0, GENRES.indexOf(book.genre));
  return "cover-" + (genreIndex % 5 + 1);
}

function renderBooks() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const genre = document.getElementById("filterGenre").value;
  const status = document.getElementById("filterStatus").value;
  const sort = document.getElementById("sortBooks").value;

  const filtered = books.filter((b) => {
    const matchQuery =
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query);
    const matchGenre = !genre || b.genre === genre;
    const matchStatus = !status || b.status === status;
    return matchQuery && matchGenre && matchStatus;
  });

  filtered.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "author") return a.author.localeCompare(b.author);
    if (sort === "status") return a.status.localeCompare(b.status);
    return books.indexOf(a) - books.indexOf(b);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE));
  currentBookPage = Math.min(currentBookPage, pageCount);
  const visibleBooks = filtered.slice((currentBookPage - 1) * BOOKS_PER_PAGE, currentBookPage * BOOKS_PER_PAGE);
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  grid.innerHTML = "";

  visibleBooks.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book";

    const cover = document.createElement("div");
    cover.className = "book-cover " + coverClass(book);
    cover.textContent = book.title.slice(0, 1).toUpperCase();

    const coverLabel = document.createElement("span");
    coverLabel.textContent = book.genre || "Wisdom";
    cover.appendChild(coverLabel);

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

    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.textContent = "Details";
    detailsBtn.addEventListener("click", () => openBookModal(book));

    actions.append(detailsBtn, cycleBtn, deleteBtn);
    card.append(cover, title, author, meta, actions);
    grid.appendChild(card);
  });

  empty.classList.toggle("hidden", filtered.length > 0);
  renderStats(filtered.length);
  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  if (pageCount <= 1) return;
  for (let page = 1; page <= pageCount; page += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = page;
    button.className = page === currentBookPage ? "active" : "";
    button.setAttribute("aria-label", "Go to page " + page);
    button.addEventListener("click", () => {
      currentBookPage = page;
      renderBooks();
    });
    pagination.appendChild(button);
  }
}

function openBookModal(book) {
  document.getElementById("bookModalCover").className = "modal-cover book-cover " + coverClass(book);
  document.getElementById("bookModalCover").textContent = book.title.slice(0, 1).toUpperCase();
  document.getElementById("bookModalTitle").textContent = book.title;
  document.getElementById("bookModalAuthor").textContent = "by " + book.author;
  document.getElementById("bookModalMeta").textContent = `${book.genre || "No genre"} · ${STATUS_LABELS[book.status] || "Unread"}`;
  document.getElementById("modalStatusButton").textContent = nextStatusLabel(book.status);
  document.getElementById("modalStatusButton").onclick = () => {
    book.status = nextStatus(book.status);
    saveBooks();
    renderBooks();
    openBookModal(book);
  };
  document.getElementById("bookModal").classList.remove("hidden");
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
  const addForm = document.getElementById("addForm");
  if (addForm) addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const genre = document.getElementById("genre").value;
    const status = document.getElementById("status").value;

    if (!title || !author) return;

    books.unshift({ title, author, genre, status });
    saveBooks();
    if (window.bookDatabase && window.bookDatabase.enabled) {
      window.bookDatabase.insert({ title, author, genre, status }).catch((error) => {
        console.error("Could not save the book to the shared catalog.", error);
      });
    }
    renderBooks();

    document.getElementById("addForm").reset();
    document.getElementById("title").focus();
  });

  document.getElementById("search").addEventListener("input", renderBooks);
  document.getElementById("filterGenre").addEventListener("change", renderBooks);
  document.getElementById("filterStatus").addEventListener("change", renderBooks);
  document.getElementById("sortBooks").addEventListener("change", () => {
    currentBookPage = 1;
    renderBooks();
  });
  document.getElementById("closeBookModal").addEventListener("click", () => {
    document.getElementById("bookModal").classList.add("hidden");
  });
  document.getElementById("bookModal").addEventListener("click", (event) => {
    if (event.target.id === "bookModal") event.currentTarget.classList.add("hidden");
  });
}

/* ---------- Init ---------- */
let isLoggedIn = false;

if (window.bookDatabase && window.bookDatabase.auth) {
  window.bookDatabase.auth.restoreSession().catch((error) => {
    console.error("Could not restore the OAuth session.", error);
  });
}

function checkAuth() {
  const savedAuth = localStorage.getItem("auth.token");
  return !!savedAuth;
}

function setLoadingState(button, isLoading) {
  if (isLoading) {
    button.classList.add("loading");
    button.disabled = true;
  } else {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

function setupLogin() {
  const loginOverlay = document.getElementById("loginOverlay");
  const loginSubmit = document.getElementById("loginSubmit");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("loginError");
  const loginGoogle = document.getElementById("loginGoogle");
  const loginApple = document.getElementById("loginApple");
  const loginTwitter = document.getElementById("loginTwitter");
  const signInButton = document.getElementById("signInButton");
  const mobileSignInButton = document.getElementById("mobileSignInButton");

  function showError(msg) {
    loginError.textContent = msg;
    loginError.style.display = msg ? "block" : "none";
  }

  function openLogin() {
    if (checkAuth()) {
      logout();
      return;
    }
    showError("");
    usernameInput.value = "";
    passwordInput.value = "";
    loginOverlay.classList.remove("hidden");
  }

  function updateAuthControls() {
    const signedIn = checkAuth();
    signInButton.textContent = signedIn ? "Sign out" : "Sign in";
    mobileSignInButton.textContent = signedIn ? "Sign out" : "Sign in";
    signInButton.setAttribute("aria-label", signedIn ? "Sign out of your account" : "Sign in");
    mobileSignInButton.setAttribute("aria-label", signedIn ? "Sign out of your account" : "Sign in");
  }

  loginGoogle.addEventListener("click", () => {
    showError("");
    setLoadingState(loginGoogle, true);
    window.bookDatabase.auth.signInWithProvider("google").catch((error) => {
      console.error("Could not start Google sign-in.", error);
      setLoadingState(loginGoogle, false);
      showError("Google sign-in is not configured yet.");
    });
  });

  function startProviderSignIn(button, provider, label) {
    showError("");
    setLoadingState(button, true);
    window.bookDatabase.auth.signInWithProvider(provider).catch((error) => {
      console.error(`Could not start ${label} sign-in.`, error);
      setLoadingState(button, false);
      showError(`${label} sign-in is not configured yet.`);
    });
  }

  function simulateAuth(provider) {
    setLoadingState(loginSubmit, true);
    setTimeout(() => {
      localStorage.setItem("auth.token", provider + "_" + Date.now());
      isLoggedIn = true;
      loginOverlay.classList.add("hidden");
      document.getElementById("mainHeader").classList.remove("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      document.getElementById("mainFooter").classList.remove("hidden");
      setupNavigation();
      populateSelects();
      setupEvents();
      renderBooks();
      updateAuthControls();
      setLoadingState(loginSubmit, false);
      showError("");
    }, 2000);
  }

  loginApple.addEventListener("click", () => {
    startProviderSignIn(loginApple, "apple", "Apple");
  });

  loginTwitter.addEventListener("click", () => {
    startProviderSignIn(loginTwitter, "twitter", "X");
  });

  signInButton.addEventListener("click", openLogin);
  mobileSignInButton.addEventListener("click", openLogin);

  loginSubmit.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      showError("Please enter your username or email and password");
      return;
    }
    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }
    showError("");
    setLoadingState(loginSubmit, true);
    setTimeout(() => {
      localStorage.setItem("auth.token", "account_" + Date.now());
      isLoggedIn = true;
      loginOverlay.classList.add("hidden");
      document.getElementById("mainHeader").classList.remove("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      document.getElementById("mainFooter").classList.remove("hidden");
      setupNavigation();
      populateSelects();
      setupEvents();
      renderBooks();
      setLoadingState(loginSubmit, false);
      updateAuthControls();
    }, 2000);
  });

  updateAuthControls();
}

let navigationInitialized = false;

function setupNavigation() {
  if (navigationInitialized) return;
  navigationInitialized = true;

  const navLinks = document.querySelectorAll(".nav-link[data-page]");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link[data-page]");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  function switchPage(page) {
    if (page === "exit") {
      // Exit leaves the current page.
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "about:blank";
      }
      return;
    }
    if (page === "home") {
      window.location.href = "index.html";
      return;
    }
    document.querySelectorAll(".page").forEach((p) => p.setAttribute("hidden", ""));
    document.querySelector(`[data-page="${page}"]`).removeAttribute("hidden");
    navLinks.forEach((l) => l.classList.remove("active"));
    mobileNavLinks.forEach((l) => l.classList.remove("active"));
    document.querySelector(`.nav-link[data-page="${page}"]`).classList.add("active");
    document.querySelector(`.mobile-nav-link[data-page="${page}"]`).classList.add("active");
    closeMobileMenu();
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      switchPage(page);
    });
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      switchPage(page);
    });
  });

  function closeMobileMenu() {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("show");
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
  }

  hamburger.addEventListener("click", () => {
    if (mobileMenu.classList.contains("show")) {
      closeMobileMenu();
    } else {
      mobileMenu.classList.remove("hidden");
      mobileMenu.classList.add("show");
      hamburger.classList.add("active");
      hamburger.setAttribute("aria-expanded", "true");
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".app-header")) {
      closeMobileMenu();
    }
  });

  navLinks[0].classList.add("active");
  mobileNavLinks[0].classList.add("active");
}

function logout() {
  localStorage.removeItem("auth.token");
  localStorage.removeItem("supabase.access_token");
  localStorage.removeItem("supabase.refresh_token");
  const signInButton = document.getElementById("signInButton");
  const mobileSignInButton = document.getElementById("mobileSignInButton");
  if (signInButton) signInButton.textContent = "Sign in";
  if (mobileSignInButton) mobileSignInButton.textContent = "Sign in";
  isLoggedIn = false;
  document.getElementById("mainHeader").classList.add("hidden");
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("mainFooter").classList.add("hidden");
  document.getElementById("loginOverlay").classList.remove("hidden");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  if (usernameInput) usernameInput.value = "";
  if (passwordInput) passwordInput.value = "";
  document.getElementById("loginError").textContent = "";
}

setupLogin();
setupNavigation();
setupWelcome();

// Bank of Wisdom - Digital Library JavaScript

// Sample book data
const books = [
    {
        id: 1,
        title: "The Wisdom of Insecurity",
        author: "Alan Watts",
        genre: "philosophy",
        description: "A profound exploration of how we can find security in uncertainty."
    },
    {
        id: 2,
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        genre: "history",
        description: "A groundbreaking journey through the history of our species."
    },
    {
        id: 3,
        title: "The Selfish Gene",
        author: "Richard Dawkins",
        genre: "science",
        description: "The classic book on evolutionary biology and gene-centered evolution."
    },
    {
        id: 4,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "fiction",
        description: "A novel of profound moral significance and enduring relevance."
    },
    {
        id: 5,
        title: "The Power of Now",
        author: "Eckhart Tolle",
        genre: "spirituality",
        description: "A guide to spiritual enlightenment and living in the present moment."
    },
    {
        id: 6,
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        genre: "science",
        description: "An internationally acclaimed volume in the history of science."
    }
];

// DOM Elements
const featuredBooksGrid = document.getElementById('featured-books');

// Initialize when DOM is loaded
function init() {
    displayBooks(books);
    setupEventListeners();
}

// Display books in the grid
function displayBooks(bookList) {
    if (!featuredBooksGrid) return;

    featuredBooksGrid.innerHTML = '';

    if (bookList.length === 0) {
        featuredBooksGrid.innerHTML = '<p class="no-results">No books found in this category.</p>';
        return;
    }

    bookList.forEach(book => {
        const card = document.createElement('div');
        card.classList.add('book-card');
        card.innerHTML =
            `<h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Genre:</strong> ${book.genre.charAt(0).toUpperCase() + book.genre.slice(1)}</p>
            <p>${book.description}</p>`;
        featuredBooksGrid.appendChild(card);
    });
}

// Filter books by genre
function filterByGenre(genre) {
    const filteredBooks = books.filter(book => book.genre === genre);
    displayBooks(filteredBooks);
}

// Search books
function searchBooks(query) {
    const searchTerm = query.toLowerCase();
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.genre.toLowerCase().includes(searchTerm)
    );
    displayBooks(filteredBooks);
}

// Setup event listeners
function setupEventListeners() {
    // You can add search functionality or other interactive features here
    console.log('Bank of Wisdom Digital Library initialized successfully!');
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

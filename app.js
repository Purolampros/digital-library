// Storage management - persists across sessions
let files = [];
let currentUsername = localStorage.getItem('currentUser') || '';
let previewFileData = null;

// Load files for current user
function loadFiles() {
    if (currentUsername) {
        const userFiles = localStorage.getItem('user_' + currentUsername);
        files = userFiles ? JSON.parse(userFiles) : [];
    } else {
        files = [];
    }
}

// Save files for current user
function saveFiles() {
    if (currentUsername) {
        localStorage.setItem('user_' + currentUsername, JSON.stringify(files));
    }
}

// Get file category based on extension
function getFileCategory(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
    const mediaExts = ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'wav', 'mp3'];

    if (imageExts.includes(ext) || mediaExts.includes(ext)) return 'media';
    if (docExts.includes(ext)) return 'documents';
    return 'books';
}

// Get icon for file category
function getFileIcon(filename) {
    const category = getFileCategory(filename);
    const icons = {
        books: '📚',
        documents: '📄',
        media: '🎬'
    };
    return icons[category] || '📁';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format file size
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Update stats
function updateStats() {
    document.getElementById('totalFiles').textContent = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    document.getElementById('totalSize').textContent = formatSize(totalSize);

    // Update category counts
    const counts = { all: files.length, books: 0, documents: 0, media: 0 };
    files.forEach(f => {
        const cat = f.category || getFileCategory(f.name);
        counts[cat]++;
    });

    document.getElementById('cat-all').textContent = counts.all;
    document.getElementById('cat-books').textContent = counts.books;
    document.getElementById('cat-docs').textContent = counts.documents;
    document.getElementById('cat-media').textContent = counts.media;
}

// Render files
function renderFiles(filterCategory = '', filterSearch = '', filterAuthor = '') {
    const grid = document.getElementById('filesGrid');

    const filteredFiles = files.filter(f => {
        const cat = f.category || getFileCategory(f.name);
        const matchesCategory = !filterCategory || cat === filterCategory;
        const matchesSearch = !filterSearch || f.name.toLowerCase().includes(filterSearch.toLowerCase());
        const matchesAuthor = !filterAuthor || (f.author && f.author.toLowerCase().includes(filterAuthor.toLowerCase()));
        return matchesCategory && matchesSearch && matchesAuthor;
    });

    if (filteredFiles.length === 0) {
        grid.innerHTML = '<div class="no-files"><p>No files found</p></div>';
        return;
    }

    grid.innerHTML = filteredFiles.map(f => `
        <div class="file-card">
            <div class="file-header">
                <span class="file-icon">' + getFileIcon(f.name) + '</span>
                <div class="file-actions">
                    <button onclick="previewFile(' + JSON.stringify(f).replace(/'/g, "\\'") + ')">ℹ️</button>
                    <button onclick="downloadFile(' + JSON.stringify(f).replace(/'/g, "\\'") + ')">⬇️</button>
                </div>
            </div>
            <div class="file-name" title="' + escapeHtml(f.name) + '">' + escapeHtml(f.name) + '</div>
            <div class="file-meta">' + formatSize(f.size) + '</div>
            <div class="file-meta">Category: ' + escapeHtml(f.category || getFileCategory(f.name)) + '</div>' + (f.author ? '<div class="file-meta">Author: ' + escapeHtml(f.author) + '</div>' : '') + '
        </div>
    ').join('');
}

// Preview file
function previewFile(file) {
    if (typeof file === 'string') {
        file = JSON.parse(file.replace(/\\'/g, "'"));
    }
    previewFileData = file;
    document.getElementById('modalTitle').textContent = file.name;
    document.getElementById('modalInfo').innerHTML = '
        <strong>Filename:</strong> ' + escapeHtml(file.name) + '<br/>
        <strong>Size:</strong> ' + formatSize(file.size) + '<br/>
        <strong>Category:</strong> ' + escapeHtml(file.category || getFileCategory(file.name)) + '<br/>
        <strong>Author:</strong> ' + escapeHtml(file.author || 'N/A') + '<br/>
        <strong>Uploaded:</strong> ' + new Date(file.uploadDate).toLocaleString() +
    '';
    document.getElementById('downloadModalBtn').onclick = () => downloadFile(file);
    document.getElementById('previewModal').classList.add('active');
}

// Download file
function downloadFile(file) {
    if (typeof file === 'string') {
        file = JSON.parse(file.replace(/\\'/g, "'"));
    }
    if (file.content) {
        const blob = new Blob([file.content], { type: file.type || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Init app
function initApp() {
    loadFiles();
    updateStats();
    renderFiles();
}

// Event listeners
document.getElementById('loginBtn').addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    if (!username) return;
    
    currentUsername = username;
    localStorage.setItem('currentUser', username);
    loadFiles();
    initApp();
    
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userName').textContent = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
});

document.getElementById('username').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    currentUsername = '';
    localStorage.removeItem('currentUser');
    files = [];
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('userName').textContent = '';
});

document.getElementById('fileInput').addEventListener('change', function(e) {
    const filesSelected = Array.from(e.target.files);
    filesSelected.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const fileObj = {
                name: file.name,
                size: file.size,
                type: file.type,
                category: getFileCategory(file.name),
                author: prompt('Enter author (optional):') || 'Unknown',
                uploadDate: new Date().toISOString(),
                content: evt.target.result
            };
            files.push(fileObj);
            saveFiles();
            updateStats();
            renderFiles(
                document.getElementById('categoryFilter').value,
                document.getElementById('searchInput').value,
                document.getElementById('authorFilter').value
            );
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
});

document.getElementById('searchBtn').addEventListener('click', function() {
    renderFiles(
        document.getElementById('categoryFilter').value,
        document.getElementById('searchInput').value,
        document.getElementById('authorFilter').value
    );
});

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});

document.getElementById('categoryFilter').addEventListener('change', function() {
    renderFiles(
        this.value,
        document.getElementById('searchInput').value,
        document.getElementById('authorFilter').value
    );
});

document.getElementById('authorFilter').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        renderFiles(
            document.getElementById('categoryFilter').value,
            document.getElementById('searchInput').value,
            this.value
        );
    }
});

document.getElementById('categoriesGrid').addEventListener('click', function(e) {
    const card = e.target.closest('.category-card');
    if (!card) return;
    
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    renderFiles(
        card.dataset.category,
        document.getElementById('searchInput').value,
        document.getElementById('authorFilter').value
    );
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('previewModal').classList.remove('active');
});

document.getElementById('previewModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// Welcome animation
window.addEventListener('load', function() {
    setTimeout(() => {
        const welcome = document.getElementById('welcomeScreen');
        welcome.style.opacity = '0';
        welcome.style.pointerEvents = 'none';
        setTimeout(() => {
            welcome.style.display = 'none';
        }, 2000);
    }, 1500);
});
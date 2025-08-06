// Admin Panel JavaScript

// Global variables
let currentUser = null;
let portfolioData = [];
let productsData = [];
let currentEditingItem = null;
let currentEditingType = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize default data
function initializeData() {
    // Load data from localStorage or set defaults
    portfolioData = JSON.parse(localStorage.getItem('portfolioData')) || [
        {
            id: 1,
            title: 'Ilustrasi Digital 1',
            description: 'Karya ilustrasi digital dengan teknik painting',
            image: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Digital+Art',
            size: 'tall',
            category: 'illustration'
        },
        {
            id: 2,
            title: 'Character Design',
            description: 'Desain karakter untuk game mobile',
            image: 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Character',
            size: 'normal',
            category: 'character'
        },
        {
            id: 3,
            title: 'Brand Illustration',
            description: 'Ilustrasi untuk brand identity',
            image: 'https://via.placeholder.com/600x300/f093fb/ffffff?text=Branding',
            size: 'wide',
            category: 'branding'
        }
    ];

    productsData = JSON.parse(localStorage.getItem('productsData')) || [
        {
            id: 1,
            name: 'Custom Brush Collection',
            description: 'Set lengkap brush untuk digital painting dan ilustrasi',
            price: 150000,
            image: 'https://via.placeholder.com/300x200/f093fb/ffffff?text=Brush+Pack',
            type: 'brush',
            status: 'active'
        },
        {
            id: 2,
            name: 'Custom Font Family',
            description: 'Font unik untuk branding dan desain editorial',
            price: 200000,
            image: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Font+Pack',
            type: 'font',
            status: 'active'
        },
        {
            id: 3,
            name: 'Action Photoshop Pack',
            description: 'Kumpulan action untuk efek dan editing cepat',
            price: 100000,
            image: 'https://via.placeholder.com/300x200/764ba2/ffffff?text=PS+Actions',
            type: 'action',
            status: 'active'
        }
    ];

    saveData();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Add buttons
    document.getElementById('addPortfolioBtn').addEventListener('click', () => openPortfolioModal());
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
    
    // Forms
    document.getElementById('portfolioForm').addEventListener('submit', handlePortfolioSubmit);
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    
    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication (in real app, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
        currentUser = { username: 'admin', role: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
        showMessage('Login berhasil!', 'success');
    } else {
        showMessage('Username atau password salah!', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLogin();
    showMessage('Logout berhasil!', 'success');
}

function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    loadPortfolioList();
    loadProductsList();
    loadSettings();
}

// Tab switching
function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'portfolio') {
        loadPortfolioList();
    } else if (tabName === 'products') {
        loadProductsList();
    }
}

// Portfolio management
function loadPortfolioList() {
    const container = document.getElementById('portfolioList');
    
    if (portfolioData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>Belum ada karya portfolio</h3>
                <p>Klik tombol "Tambah Karya" untuk menambahkan karya pertama Anda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = portfolioData.map(item => `
        <div class="portfolio-item">
            <div class="item-image">
                <img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:#f0f0f0; color:#666;">
                    ${item.title}
                </div>
            </div>
            <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-meta">
                    <span class="item-category">${getCategoryName(item.category)}</span>
                    <span class="item-category">${getSizeName(item.size)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-primary btn-small" onclick="editPortfolioItem(${item.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger btn-small" onclick="deletePortfolioItem(${item.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openPortfolioModal(item = null) {
    currentEditingItem = item;
    currentEditingType = 'portfolio';
    
    const modal = document.getElementById('portfolioModal');
    const title = document.getElementById('portfolioModalTitle');
    const form = document.getElementById('portfolioForm');
    
    if (item) {
        title.textContent = 'Edit Karya Portfolio';
        document.getElementById('portfolioTitle').value = item.title;
        document.getElementById('portfolioDescription').value = item.description;
        document.getElementById('portfolioImage').value = item.image;
        document.getElementById('portfolioSize').value = item.size;
        document.getElementById('portfolioCategory').value = item.category;
    } else {
        title.textContent = 'Tambah Karya Portfolio';
        form.reset();
    }
    
    modal.classList.add('active');
}

function handlePortfolioSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('portfolioTitle').value,
        description: document.getElementById('portfolioDescription').value,
        image: document.getElementById('portfolioImage').value,
        size: document.getElementById('portfolioSize').value,
        category: document.getElementById('portfolioCategory').value
    };
    
    if (currentEditingItem) {
        // Update existing item
        const index = portfolioData.findIndex(item => item.id === currentEditingItem.id);
        portfolioData[index] = { ...currentEditingItem, ...formData };
        showMessage('Karya portfolio berhasil diupdate!', 'success');
    } else {
        // Add new item
        const newItem = {
            id: Date.now(),
            ...formData
        };
        portfolioData.push(newItem);
        showMessage('Karya portfolio berhasil ditambahkan!', 'success');
    }
    
    saveData();
    loadPortfolioList();
    closeModal('portfolioModal');
}

function editPortfolioItem(id) {
    const item = portfolioData.find(item => item.id === id);
    if (item) {
        openPortfolioModal(item);
    }
}

function deletePortfolioItem(id) {
    if (confirm('Apakah Anda yakin ingin menghapus karya ini?')) {
        portfolioData = portfolioData.filter(item => item.id !== id);
        saveData();
        loadPortfolioList();
        showMessage('Karya portfolio berhasil dihapus!', 'success');
    }
}

// Products management
function loadProductsList() {
    const container = document.getElementById('productsList');
    
    if (productsData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>Belum ada produk digital</h3>
                <p>Klik tombol "Tambah Produk" untuk menambahkan produk pertama Anda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productsData.map(item => `
        <div class="product-item">
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:#f0f0f0; color:#666;">
                    ${item.name}
                </div>
            </div>
            <div class="item-content">
                <div class="item-title">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-meta">
                    <span class="item-type">${getProductTypeName(item.type)}</span>
                    <span class="item-status ${item.status === 'active' ? 'status-active' : 'status-inactive'}">
                        ${item.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                </div>
                <div class="item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
                <div class="item-actions">
                    <button class="btn-primary btn-small" onclick="editProductItem(${item.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger btn-small" onclick="deleteProductItem(${item.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openProductModal(item = null) {
    currentEditingItem = item;
    currentEditingType = 'product';
    
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    if (item) {
        title.textContent = 'Edit Produk Digital';
        document.getElementById('productName').value = item.name;
        document.getElementById('productDescription').value = item.description;
        document.getElementById('productPrice').value = item.price;
        document.getElementById('productImage').value = item.image;
        document.getElementById('productType').value = item.type;
        document.getElementById('productStatus').value = item.status;
    } else {
        title.textContent = 'Tambah Produk Digital';
        form.reset();
    }
    
    modal.classList.add('active');
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseInt(document.getElementById('productPrice').value),
        image: document.getElementById('productImage').value,
        type: document.getElementById('productType').value,
        status: document.getElementById('productStatus').value
    };
    
    if (currentEditingItem) {
        // Update existing item
        const index = productsData.findIndex(item => item.id === currentEditingItem.id);
        productsData[index] = { ...currentEditingItem, ...formData };
        showMessage('Produk berhasil diupdate!', 'success');
    } else {
        // Add new item
        const newItem = {
            id: Date.now(),
            ...formData
        };
        productsData.push(newItem);
        showMessage('Produk berhasil ditambahkan!', 'success');
    }
    
    saveData();
    loadProductsList();
    closeModal('productModal');
}

function editProductItem(id) {
    const item = productsData.find(item => item.id === id);
    if (item) {
        openProductModal(item);
    }
}

function deleteProductItem(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        productsData = productsData.filter(item => item.id !== id);
        saveData();
        loadProductsList();
        showMessage('Produk berhasil dihapus!', 'success');
    }
}

// Settings management
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('siteSettings')) || {};
    
    document.getElementById('siteName').value = settings.siteName || 'Portfolio Ilustrator';
    document.getElementById('heroTitle').value = settings.heroTitle || 'Ilustrator & Desainer';
    document.getElementById('heroSubtitle').value = settings.heroSubtitle || 'Menciptakan karya visual yang menginspirasi dan bermakna';
    document.getElementById('whatsappNumber').value = settings.whatsappNumber || '6281234567890';
    document.getElementById('aboutText').value = settings.aboutText || 'Saya adalah seorang ilustrator dan desainer grafis...';
}

function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        heroTitle: document.getElementById('heroTitle').value,
        heroSubtitle: document.getElementById('heroSubtitle').value,
        whatsappNumber: document.getElementById('whatsappNumber').value,
        aboutText: document.getElementById('aboutText').value
    };
    
    localStorage.setItem('siteSettings', JSON.stringify(settings));
    showMessage('Pengaturan berhasil disimpan!', 'success');
}

// Utility functions
function saveData() {
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
    localStorage.setItem('productsData', JSON.stringify(productsData));
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    currentEditingItem = null;
    currentEditingType = null;
}

function showMessage(message, type) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type} show`;
    messageEl.textContent = message;
    
    // Add to body
    document.body.appendChild(messageEl);
    
    // Position at top
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '9999';
    messageEl.style.maxWidth = '300px';
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

function getCategoryName(category) {
    const categories = {
        illustration: 'Ilustrasi',
        character: 'Character Design',
        editorial: 'Editorial',
        branding: 'Branding',
        concept: 'Concept Art'
    };
    return categories[category] || category;
}

function getSizeName(size) {
    const sizes = {
        normal: 'Normal',
        wide: 'Lebar',
        tall: 'Tinggi'
    };
    return sizes[size] || size;
}

function getProductTypeName(type) {
    const types = {
        brush: 'Custom Brush',
        font: 'Font',
        action: 'Action PS',
        texture: 'Texture Pack',
        template: 'Template',
        other: 'Lainnya'
    };
    return types[type] || type;
}

// Export data function (for backup)
function exportData() {
    const data = {
        portfolio: portfolioData,
        products: productsData,
        settings: JSON.parse(localStorage.getItem('siteSettings') || '{}')
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'portfolio-backup.json';
    link.click();
}

// Import data function (for restore)
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.portfolio) portfolioData = data.portfolio;
            if (data.products) productsData = data.products;
            if (data.settings) localStorage.setItem('siteSettings', JSON.stringify(data.settings));
            
            saveData();
            loadPortfolioList();
            loadProductsList();
            loadSettings();
            
            showMessage('Data berhasil diimport!', 'success');
        } catch (error) {
            showMessage('Error importing data: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

console.log('Admin panel loaded successfully!');
console.log('Default login: admin / admin123');
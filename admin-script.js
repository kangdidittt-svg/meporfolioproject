// Admin Panel JavaScript

// Global variables
let currentUser = null;
let portfolioData = [];
let productsData = [];
let currentEditingItem = null;
let currentEditingType = null;
let cropper = null;
let currentImageTarget = null; // 'profile', 'portfolio', 'product', 'portfolio-thumbnail'
let currentOriginalImage = null; // Store original image for thumbnail creation
let additionalImages = [];
let thumbnailSizes = {
    normal: { width: 300, height: 225, ratio: 4/3 },
    wide2x: { width: 600, height: 225, ratio: 8/3 },
    tall2x: { width: 300, height: 450, ratio: 2/3 }
}

// Function to render portfolio items for frontend
function renderPortfolioItems() {
    const container = document.getElementById('portfolioItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    portfolioData.forEach(item => {
        const portfolioCard = document.createElement('div');
        portfolioCard.className = 'portfolio-card';
        
        // Use thumbnail if available, otherwise use original image
        const displayImage = item.thumbnail || item.image;
        
        portfolioCard.innerHTML = `
            <img src="${displayImage}" alt="${item.title}" class="portfolio-image">
            <div class="portfolio-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <span class="portfolio-category">${item.category}</span>
            </div>
        `;
        
        // Add click event to show original image
        const img = portfolioCard.querySelector('.portfolio-image');
        img.addEventListener('click', function() {
            // Create modal to show original image
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                cursor: pointer;
            `;
            
            const originalImg = document.createElement('img');
            originalImg.src = item.image; // Always show original image
            originalImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
            `;
            
            modal.appendChild(originalImg);
            document.body.appendChild(modal);
            
            // Close modal on click
            modal.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
        
        container.appendChild(portfolioCard);
    });
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    setupEventListeners();
    checkAuthStatus();
    setupAdditionalImageHandlers();
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
        // Size property removed - all items use 4:3 aspect ratio
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
        // Size property removed - all items use 4:3 aspect ratio
        category: document.getElementById('portfolioCategory').value
    };
    
    // Collect additional images
    const additionalImageUrls = [];
    for (let i = 1; i <= 3; i++) {
        const url = document.getElementById(`additionalImageUrl${i}`)?.value;
        if (url) {
            additionalImageUrls.push(url);
        }
    }
    
    // Get thumbnail image
    const thumbnailImg = document.getElementById('portfolioThumbnailImg');
    const thumbnail = thumbnailImg && thumbnailImg.src && !thumbnailImg.src.includes('placeholder') ? thumbnailImg.src : null;
    
    // Add thumbnail data and additional images
    formData.thumbnail = thumbnail;
    formData.hasCustomThumbnail = thumbnail !== null;
    formData.additionalImages = additionalImageUrls;
    formData.original = currentOriginalImage || formData.image;
    
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
        currentOriginalImage = item.image; // Set original image
        
        // Show original image preview
        if (item.image) {
            document.getElementById('portfolioPreviewImg').src = item.image;
            document.getElementById('portfolioImagePreview').style.display = 'block';
        }
        
        // Show thumbnail if exists
        if (item.thumbnail) {
            document.getElementById('portfolioThumbnailImg').src = item.thumbnail;
            document.getElementById('portfolioThumbnailPreview').style.display = 'block';
            document.getElementById('portfolioAutoThumbnail').style.display = 'none';
        } else {
            // Generate auto thumbnail
            generateAutoThumbnail('portfolio');
        }
        
        // Load additional images
        additionalImages = item.additionalImages || [];
        for (let i = 1; i <= 3; i++) {
            const urlInput = document.getElementById(`additionalImageUrl${i}`);
            const preview = document.getElementById(`additionalPreview${i}`);
            
            if (additionalImages[i - 1]) {
                urlInput.value = additionalImages[i - 1];
                showAdditionalImagePreview(additionalImages[i - 1], i);
            } else {
                urlInput.value = '';
                if (preview) preview.style.display = 'none';
            }
        }
        
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
    
    // Load profile image if exists
    if (settings.profileImage) {
        const profileImageElement = document.getElementById('profileImage');
        if (profileImageElement) {
            profileImageElement.src = settings.profileImage;
            const previewElement = document.getElementById('profileImagePreview');
            if (previewElement) {
                previewElement.style.display = 'block';
            }
        }
    }
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
    
    // Reset portfolio modal specific states
    if (modalId === 'portfolioModal') {
        currentOriginalImage = null;
        additionalImages = [];
        
        // Hide previews
        document.getElementById('portfolioImagePreview').style.display = 'none';
        
        // Reset additional images
        for (let i = 1; i <= 3; i++) {
            const urlInput = document.getElementById(`additionalImageUrl${i}`);
            const fileInput = document.getElementById(`additionalImage${i}`);
            const preview = document.getElementById(`additionalPreview${i}`);
            
            if (urlInput) urlInput.value = '';
            if (fileInput) fileInput.value = '';
            if (preview) preview.style.display = 'none';
        }
        
        // Display size removed - all items use 4:3 aspect ratio
        
        // Close cropper modal if open
        if (document.getElementById('cropperModal').style.display === 'block') {
            closeCropperModal();
        }
    }
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

// Image Upload and Cropper Functions
function handleImageUpload(event, target) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Silakan pilih file gambar yang valid!');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 2MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageDataURL = e.target.result;
        
        // For product images, validate dimensions and use original aspect ratio
        if (target === 'product') {
            const img = new Image();
            img.onload = function() {
                if (img.width < 300 || img.height < 200) {
                    alert('Ukuran gambar terlalu kecil!\nMinimal: 300x200 piksel\nUkuran saat ini: ' + img.width + 'x' + img.height + ' piksel');
                    return;
                }
                
                // Use the original aspect ratio of the uploaded image
                const aspectRatio = img.width / img.height;
                console.log('Menggunakan rasio aspek asli gambar:', aspectRatio.toFixed(2), '(' + img.width + 'x' + img.height + ')');
                
                // Proceed with cropper using original aspect ratio
                currentImageTarget = target;
                document.getElementById('cropperImage').src = imageDataURL;
                document.getElementById('cropperModal').style.display = 'block';
                initializeCropper(aspectRatio); // Use original aspect ratio
            };
            img.src = imageDataURL;
            
        } else if (target === 'portfolio') {
            // Store original image
            currentOriginalImage = imageDataURL;
            document.getElementById('portfolioImage').value = imageDataURL;
            document.getElementById('portfolioPreviewImg').src = imageDataURL;
            document.getElementById('portfolioImagePreview').style.display = 'block';
            
            // Auto-generate thumbnail based on selected size
            generateAutoThumbnail('portfolio');
            
        } else if (target === 'profile') {
            // For profile, use cropper as before
            currentImageTarget = target;
            document.getElementById('cropperImage').src = imageDataURL;
            document.getElementById('cropperModal').style.display = 'block';
            initializeCropper(1); // 1:1 for profile
        }
    };
    reader.readAsDataURL(file);
}

function initializeCropper(aspectRatio) {
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        
        const image = document.getElementById('cropperImage');
        cropper = new Cropper(image, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
    }, 100);
}

function generateAutoThumbnail(type) {
    if (type === 'portfolio' && currentOriginalImage) {
        // Always use 4:3 aspect ratio for all portfolio items
        const sizeConfig = { width: 300, height: 225, ratio: 4/3 };
        
        // Create canvas for auto thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = sizeConfig.width;
            canvas.height = sizeConfig.height;
            
            // Calculate crop area to maintain aspect ratio
            const imgRatio = img.width / img.height;
            const targetRatio = sizeConfig.ratio;
            
            let sx, sy, sw, sh;
            
            if (imgRatio > targetRatio) {
                // Image is wider, crop width
                sh = img.height;
                sw = sh * targetRatio;
                sx = (img.width - sw) / 2;
                sy = 0;
            } else {
                // Image is taller, crop height
                sw = img.width;
                sh = sw / targetRatio;
                sx = 0;
                sy = (img.height - sh) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            
            const thumbnailDataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Show thumbnail preview
            document.getElementById('portfolioThumbnailImg').src = thumbnailDataURL;
            document.getElementById('portfolioThumbnailPreview').style.display = 'block';
            document.getElementById('portfolioAutoThumbnail').style.display = 'none';
        };
        
        img.src = currentOriginalImage;
    }
}

function rotateCropper(degree) {
    if (cropper) {
        cropper.rotate(degree);
    }
}

function applyCrop() {
    if (!cropper) return;
    
    let canvasOptions = {
        maxWidth: 800,
        maxHeight: 600,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    };
    
    // For thumbnail, use 4:3 aspect ratio
    if (currentImageTarget === 'portfolio-thumbnail') {
        const sizeConfig = { width: 300, height: 225, ratio: 4/3 };
        canvasOptions = {
            width: sizeConfig.width,
            height: sizeConfig.height,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        };
    }
    
    const canvas = cropper.getCroppedCanvas(canvasOptions);
    const croppedImageDataURL = canvas.toDataURL('image/jpeg', 0.8);
    
    // Apply cropped image based on target
    if (currentImageTarget === 'profile') {
        document.getElementById('profileImage').src = croppedImageDataURL;
        document.getElementById('profileImagePreview').style.display = 'block';
        
        // Save to localStorage
        const settings = JSON.parse(localStorage.getItem('websiteSettings')) || {};
        settings.profileImage = croppedImageDataURL;
        localStorage.setItem('websiteSettings', JSON.stringify(settings));
        
    } else if (currentImageTarget === 'product') {
        document.getElementById('productImage').value = croppedImageDataURL;
        document.getElementById('productPreviewImg').src = croppedImageDataURL;
        document.getElementById('productImagePreview').style.display = 'block';
        
    } else if (currentImageTarget === 'portfolio-thumbnail') {
        document.getElementById('portfolioThumbnailImg').src = croppedImageDataURL;
        document.getElementById('portfolioThumbnailPreview').style.display = 'block';
        document.getElementById('portfolioAutoThumbnail').style.display = 'none';
    }
    
    closeCropperModal();
}

function closeCropperModal() {
    document.getElementById('cropperModal').style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // Re-enable aspect ratio selector
    const aspectRatioSelect = document.getElementById('aspectRatio');
    if (aspectRatioSelect) {
        aspectRatioSelect.disabled = false;
    }
    
    currentImageTarget = null;
}

function editProfileImage() {
    const profileImageElement = document.getElementById('profileImage');
    if (!profileImageElement) {
        showMessage('Element foto profil tidak ditemukan!', 'error');
        return;
    }
    
    currentImageTarget = 'profile';
    const currentSrc = profileImageElement.src;
    
    // Check if it's a default SVG placeholder
    if (currentSrc.includes('data:image/svg+xml')) {
        showMessage('Silakan upload foto profil terlebih dahulu!', 'warning');
        return;
    }
    
    const cropperImageElement = document.getElementById('cropperImage');
    const cropperModalElement = document.getElementById('cropperModal');
    
    if (!cropperImageElement || !cropperModalElement) {
        showMessage('Element cropper tidak ditemukan!', 'error');
        return;
    }
    
    cropperImageElement.src = currentSrc;
    cropperModalElement.style.display = 'block';
    
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        
        try {
            cropper = new Cropper(cropperImageElement, {
                aspectRatio: 1, // Square for profile
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false
            });
        } catch (error) {
            console.error('Error initializing cropper:', error);
            showMessage('Gagal menginisialisasi editor gambar!', 'error');
        }
    }, 100);
}

function editProductImage() {
    currentImageTarget = 'product';
    const currentSrc = document.getElementById('productPreviewImg').src;
    document.getElementById('cropperImage').src = currentSrc;
    document.getElementById('cropperModal').style.display = 'block';
    
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        
        const image = document.getElementById('cropperImage');
        cropper = new Cropper(image, {
            aspectRatio: 1.33, // 4:3 for products
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
    }, 100);
}

function viewOriginalImage(type) {
    if (type === 'portfolio' && currentOriginalImage) {
        // Create modal to show original image
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90%; max-height: 90%;">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>Gambar Asli</h2>
                <div style="text-align: center; padding: 20px;">
                    <img src="${currentOriginalImage}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" alt="Original Image">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function editPortfolioThumbnail() {
    if (!currentOriginalImage) {
        alert('Silakan upload gambar asli terlebih dahulu!');
        return;
    }
    
    const selectedSize = document.getElementById('portfolioDisplaySize').value;
    const sizeConfig = thumbnailSizes[selectedSize];
    
    currentImageTarget = 'portfolio-thumbnail';
    document.getElementById('cropperImage').src = currentOriginalImage;
    document.getElementById('cropperModal').style.display = 'block';
    
    // Initialize cropper with fixed aspect ratio based on selected size
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        
        const image = document.getElementById('cropperImage');
        cropper = new Cropper(image, {
            aspectRatio: sizeConfig.ratio, // Fixed aspect ratio based on size
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
        
        // Update aspect ratio selector to match
        const aspectRatioSelect = document.getElementById('aspectRatio');
        if (aspectRatioSelect) {
            aspectRatioSelect.value = sizeConfig.ratio.toString();
            aspectRatioSelect.disabled = true; // Disable changing aspect ratio
        }
    }, 100);
}

function deletePortfolioThumbnail() {
    if (confirm('Apakah Anda yakin ingin menghapus thumbnail? Thumbnail otomatis akan dibuat kembali.')) {
        document.getElementById('portfolioThumbnailPreview').style.display = 'none';
        document.getElementById('portfolioAutoThumbnail').style.display = 'block';
        
        // Regenerate auto thumbnail
        if (currentOriginalImage) {
            generateAutoThumbnail('portfolio');
        }
    }
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
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-backup.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

// Additional event listeners for image handling
document.addEventListener('DOMContentLoaded', function() {
    // Aspect ratio change handler
    const aspectRatioSelect = document.getElementById('aspectRatio');
    if (aspectRatioSelect) {
        aspectRatioSelect.addEventListener('change', function() {
            if (cropper) {
                const value = this.value;
                if (value === 'free') {
                    cropper.setAspectRatio(NaN);
                } else {
                    cropper.setAspectRatio(parseFloat(value));
                }
            }
        });
    }
    
    // File upload handlers
    const profileImageFile = document.getElementById('profileImageFile');
    if (profileImageFile) {
        profileImageFile.addEventListener('change', function(e) {
            handleImageUpload(e, 'profile');
        });
    }
    
    const productImageFile = document.getElementById('productImageFile');
    if (productImageFile) {
        productImageFile.addEventListener('change', function(e) {
            handleImageUpload(e, 'product');
        });
    }
    
    const portfolioImageFile = document.getElementById('portfolioImageFile');
    if (portfolioImageFile) {
        portfolioImageFile.addEventListener('change', function(e) {
            handleImageUpload(e, 'portfolio');
        });
    }
    
    // Portfolio display size handler removed - all items use 4:3 aspect ratio
    // Auto thumbnail generation removed since all items use same 4:3 ratio
    
    // Setup additional image handlers
    setupAdditionalImageHandlers();
});

// Additional images handlers
function setupAdditionalImageHandlers() {
    for (let i = 1; i <= 3; i++) {
        const fileInput = document.getElementById(`additionalImage${i}`);
        const urlInput = document.getElementById(`additionalImageUrl${i}`);
        
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                handleAdditionalImageUpload(e, i);
            });
        }
        
        if (urlInput) {
            urlInput.addEventListener('change', function(e) {
                if (e.target.value) {
                    showAdditionalImagePreview(e.target.value, i);
                }
            });
        }
    }
}

function handleAdditionalImageUpload(event, index) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            document.getElementById(`additionalImageUrl${index}`).value = imageUrl;
            showAdditionalImagePreview(imageUrl, index);
        };
        reader.readAsDataURL(file);
    }
}

function showAdditionalImagePreview(imageUrl, index) {
    const preview = document.getElementById(`additionalPreview${index}`);
    if (preview) {
        const img = preview.querySelector('img');
        if (img) {
            img.src = imageUrl;
            preview.style.display = 'block';
        }
    }
    
    // Store in additionalImages array
    additionalImages[index - 1] = imageUrl;
}

function removeAdditionalImage(index) {
    const preview = document.getElementById(`additionalPreview${index}`);
    const urlInput = document.getElementById(`additionalImageUrl${index}`);
    const fileInput = document.getElementById(`additionalImage${index}`);
    
    if (preview) preview.style.display = 'none';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    additionalImages[index - 1] = null;
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
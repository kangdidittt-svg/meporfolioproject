import { StorageKeys } from './types.js';
import { debounce, SafeStorage, DOMUtils, AnimationUtils, ImageUtils, ValidationUtils, PerformanceUtils, FormatUtils, ErrorUtils } from './utils.js';
class AdminApp {
    constructor() {
        this.portfolioData = [];
        this.productsData = [];
        this.currentUser = null;
        this.cropper = null;
        this.currentImageTarget = 'portfolio';
        this.currentEditingId = null;
        this.isInitialized = false;
        this.thumbnailSizes = [];
        this.tempImageData = {};
        this.sidebarAutoHide = false;
        this.elements = {};
        this.siteSettings = this.getDefaultSettings();
        this.thumbnailSizes = this.getDefaultThumbnailSizes();
        this.bindMethods();
    }
    bindMethods() {
        this.handleTabSwitch = this.handleTabSwitch.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleImageUpload = this.handleImageUpload.bind(this);
        this.handleCropperSave = this.handleCropperSave.bind(this);
        this.handleDeleteItem = this.handleDeleteItem.bind(this);
        this.handleEditItem = this.handleEditItem.bind(this);
        this.handlePreviewItem = this.handlePreviewItem.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
        this.showProductModal = this.showProductModal.bind(this);
        this.closeProductModal = this.closeProductModal.bind(this);
        this.showPortfolioModal = this.showPortfolioModal.bind(this);
        this.closePortfolioModal = this.closePortfolioModal.bind(this);
    }
    async init() {
        if (this.isInitialized)
            return;
        PerformanceUtils.mark('admin-init-start');
        try {
            this.cacheElements();
            this.checkAuthStatus();
            await this.loadData();
            this.setupEventListeners();
            await this.renderContent();
            this.setupFormValidation();
            this.setupImageHandlers();
            this.restorePageState();
            this.isInitialized = true;
            PerformanceUtils.measure('Admin Initialization', 'admin-init-start');
            console.log('🔧 Admin panel initialized with TypeScript!');
        }
        catch (error) {
            console.error('❌ Failed to initialize admin panel:', error);
            this.showMessage('Failed to load admin panel', 'error');
        }
    }
    cacheElements() {
        this.elements = {
            portfolioGrid: DOMUtils.getElementById('portfolioList'),
            productsGrid: DOMUtils.getElementById('productsList'),
            cropperModal: DOMUtils.getElementById('cropperModal'),
            cropperImage: DOMUtils.getElementById('cropperImage'),
            profileImage: DOMUtils.getElementById('profileImage'),
            tabButtons: DOMUtils.querySelectorAll('.nav-tab'),
            tabContents: DOMUtils.querySelectorAll('.tab-content'),
            forms: DOMUtils.querySelectorAll('form')
        };
    }
    async loadData() {
        PerformanceUtils.mark('admin-data-load-start');
        this.portfolioData = SafeStorage.get(StorageKeys.PORTFOLIO_DATA, this.getDefaultPortfolio());
        this.productsData = SafeStorage.get(StorageKeys.PRODUCTS_DATA, this.getDefaultProducts());
        this.siteSettings = SafeStorage.get(StorageKeys.SITE_SETTINGS, this.getDefaultSettings());
        this.currentUser = SafeStorage.get(StorageKeys.USER_DATA, null);
        const orders = this.getOrders();
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        this.updateOrderNotificationBadge(pendingOrders);
        if (!SafeStorage.get(StorageKeys.PORTFOLIO_DATA, null)) {
            SafeStorage.set(StorageKeys.PORTFOLIO_DATA, this.portfolioData);
        }
        if (!SafeStorage.get(StorageKeys.PRODUCTS_DATA, null)) {
            SafeStorage.set(StorageKeys.PRODUCTS_DATA, this.productsData);
        }
        if (!SafeStorage.get(StorageKeys.SITE_SETTINGS, null)) {
            SafeStorage.set(StorageKeys.SITE_SETTINGS, this.siteSettings);
        }
        PerformanceUtils.measure('Admin Data Loading', 'admin-data-load-start');
    }
    setupEventListeners() {
        const loginForm = DOMUtils.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin);
        }
        const logoutBtn = DOMUtils.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout);
        }
        if (this.elements.tabButtons) {
            DOMUtils.addEventListeners(this.elements.tabButtons, 'click', this.handleTabSwitch);
        }
        if (this.elements.forms) {
            this.elements.forms.forEach(form => {
                form.addEventListener('submit', this.handleFormSubmit);
            });
        }
        const imageInputs = DOMUtils.querySelectorAll('input[type="file"]');
        DOMUtils.addEventListeners(imageInputs, 'change', this.handleImageUpload);
        this.setupCropperHandlers();
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        this.setupAutoSave();
        this.setupProductModalHandlers();
        this.setupPortfolioModalHandlers();
        this.setupEventDelegation();
        this.setupCustomerModalHandlers();
        const sidebarToggle = DOMUtils.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.handleSidebarToggle.bind(this));
        }
        this.setupSidebarHoverHandlers();
    }
    setupEventDelegation() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('preview-btn') || target.closest('.preview-btn')) {
                const button = target.classList.contains('preview-btn') ? target : target.closest('.preview-btn');
                if (button) {
                    this.handlePreviewItem(event, button);
                }
            }
            if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
                const button = target.classList.contains('edit-btn') ? target : target.closest('.edit-btn');
                if (button) {
                    this.handleEditItem(event, button);
                }
            }
            if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
                const button = target.classList.contains('delete-btn') ? target : target.closest('.delete-btn');
                if (button) {
                    this.handleDeleteItem(event, button);
                }
            }
        });
    }
    setupCropperHandlers() {
        const cropperModal = this.elements.cropperModal;
        if (!cropperModal)
            return;
        const saveBtn = cropperModal.querySelector('.cropper-save');
        saveBtn?.addEventListener('click', this.handleCropperSave);
        const cancelBtn = cropperModal.querySelector('.cropper-cancel');
        cancelBtn?.addEventListener('click', () => this.closeCropperModal());
        const overlay = cropperModal.querySelector('.modal-overlay');
        overlay?.addEventListener('click', () => this.closeCropperModal());
    }
    setupProductModalHandlers() {
        const modal = DOMUtils.getElementById('productModal');
        const closeBtn = DOMUtils.getElementById('closeProductModal');
        const cancelBtn = DOMUtils.getElementById('cancelProductModal');
        const addBtn = DOMUtils.getElementById('addProductBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.closeProductModal.bind(this));
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.closeProductModal.bind(this));
        }
        if (addBtn) {
            addBtn.addEventListener('click', this.showProductModal.bind(this));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal)
                    this.closeProductModal();
            });
        }
    }
    setupPortfolioModalHandlers() {
        const modal = DOMUtils.getElementById('portfolioModal');
        const closeBtn = DOMUtils.getElementById('closePortfolioModal');
        const cancelBtn = DOMUtils.getElementById('cancelPortfolioModal');
        const addBtn = DOMUtils.getElementById('addPortfolioBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.closePortfolioModal.bind(this));
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.closePortfolioModal.bind(this));
        }
        if (addBtn) {
            addBtn.addEventListener('click', this.showPortfolioModal.bind(this));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal)
                    this.closePortfolioModal();
            });
        }
    }
    setupFormValidation() {
        const forms = this.elements.forms;
        if (!forms)
            return;
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', debounce(() => this.validateField(input), 300));
            });
        });
    }
    setupImageHandlers() {
        const profileImage = this.elements.profileImage;
        if (profileImage) {
            const editBtn = document.querySelector('.edit-profile-image');
            editBtn?.addEventListener('click', () => this.editProfileImage());
        }
        const backgroundUpload = DOMUtils.getElementById('backgroundUpload');
        if (backgroundUpload) {
            backgroundUpload.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        }
        const removeBackgroundBtn = DOMUtils.getElementById('removeBackgroundBtn');
        if (removeBackgroundBtn) {
            removeBackgroundBtn.addEventListener('click', () => this.removeBackgroundImage());
        }
        const imageInputs = DOMUtils.querySelectorAll('input[type="file"][accept*="image"]');
        imageInputs.forEach(input => {
            input.addEventListener('change', (e) => this.previewImage(e.target));
        });
        this.setupAdditionalImageHandlers();
    }
    setupAdditionalImageHandlers() {
        for (let i = 1; i <= 3; i++) {
            const fileInput = DOMUtils.getElementById(`additionalImage${i}`);
            const urlInput = DOMUtils.getElementById(`additionalImageUrl${i}`);
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleAdditionalImageUpload(e, i);
                });
            }
            if (urlInput) {
                urlInput.addEventListener('change', (e) => {
                    const target = e.target;
                    if (target.value) {
                        this.showAdditionalImagePreview(target.value, i);
                    }
                });
            }
        }
        const removeButtons = DOMUtils.querySelectorAll('.remove-additional-image');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target;
                const index = parseInt(target.dataset.index || '0');
                if (index > 0) {
                    this.removeAdditionalImage(index);
                }
            });
        });
    }
    async handleAdditionalImageUpload(event, index) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file)
            return;
        try {
            const imageUrl = await ImageUtils.fileToDataURL(file);
            const urlInput = DOMUtils.getElementById(`additionalImageUrl${index}`);
            if (urlInput) {
                urlInput.value = imageUrl;
                this.showAdditionalImagePreview(imageUrl, index);
            }
        }
        catch (error) {
            this.showMessage('Error uploading additional image', 'error');
        }
    }
    showAdditionalImagePreview(imageUrl, index) {
        const preview = DOMUtils.getElementById(`additionalPreview${index}`);
        if (preview) {
            const img = preview.querySelector('img');
            if (img) {
                img.src = imageUrl;
                preview.style.display = 'block';
            }
        }
    }
    removeAdditionalImage(index) {
        if (!this.requireAuth())
            return;
        const preview = DOMUtils.getElementById(`additionalPreview${index}`);
        const urlInput = DOMUtils.getElementById(`additionalImageUrl${index}`);
        const fileInput = DOMUtils.getElementById(`additionalImage${index}`);
        if (preview)
            preview.style.display = 'none';
        if (urlInput)
            urlInput.value = '';
        if (fileInput)
            fileInput.value = '';
    }
    setupAutoSave() {
        const autoSaveInterval = 30000;
        setInterval(() => {
            this.autoSave();
        }, autoSaveInterval);
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });
    }
    async renderContent() {
        PerformanceUtils.mark('admin-render-start');
        await Promise.all([
            this.renderPortfolioItems(),
            this.renderProductItems(),
            this.loadSettings(),
            this.updateStatistics()
        ]);
        this.updateDashboardStats();
        this.renderCustomerTable();
        PerformanceUtils.measure('Admin Content Rendering', 'admin-render-start');
    }
    async renderPortfolioItems() {
        const container = this.elements.portfolioGrid;
        if (!container)
            return;
        container.innerHTML = '';
        if (this.portfolioData.length === 0) {
            container.innerHTML = '<div class="empty-state">No portfolio items yet. Add your first item!</div>';
            return;
        }
        const fragment = document.createDocumentFragment();
        for (const item of this.portfolioData) {
            const card = this.createPortfolioAdminCard(item);
            fragment.appendChild(card);
        }
        container.appendChild(fragment);
    }
    createPortfolioAdminCard(item) {
        const card = DOMUtils.createElement('div', 'portfolio-item');
        card.innerHTML = `
      <div class="item-image">
        <img src="${item.thumbnail || item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="item-content">
        <h4 class="item-title">${item.title}</h4>
        <p class="item-description">${item.description || 'Tidak ada deskripsi'}</p>
        <div class="item-meta">
          <span class="item-category">${this.getCategoryName(item.category)}</span>
          <span class="item-status status-${item.status || 'active'}">
            ${(item.status || 'active').toUpperCase()}
          </span>
        </div>
        <div class="item-actions">
          <button class="btn btn-small btn-secondary preview-btn" data-id="${item.id}" data-type="portfolio">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button class="btn btn-small btn-primary edit-btn" data-id="${item.id}" data-type="portfolio">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-small btn-danger delete-btn" data-id="${item.id}" data-type="portfolio">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
        return card;
    }
    async renderProductItems() {
        const container = this.elements.productsGrid;
        if (!container)
            return;
        container.innerHTML = '';
        if (this.productsData.length === 0) {
            container.innerHTML = '<div class="empty-state">No products yet. Add your first product!</div>';
            return;
        }
        const fragment = document.createDocumentFragment();
        for (const product of this.productsData) {
            const card = this.createProductAdminCard(product);
            fragment.appendChild(card);
        }
        container.appendChild(fragment);
    }
    createProductAdminCard(product) {
        const card = DOMUtils.createElement('div', 'product-item');
        let priceDisplay = FormatUtils.formatPrice(product.price);
        if (product.promoPrice && product.isOnPromo) {
            priceDisplay = `
        <div class="price-container">
          <span class="original-price">${FormatUtils.formatPrice(product.price)}</span>
          <span class="current-price">${FormatUtils.formatPrice(product.promoPrice)}</span>
        </div>
      `;
        }
        const labels = [];
        if (product.isNew)
            labels.push('<span class="product-label label-new">NEW</span>');
        if (product.isBestSeller)
            labels.push('<span class="product-label label-bestseller">TERLARIS</span>');
        if (product.isOnPromo)
            labels.push('<span class="product-label label-promo">PROMO</span>');
        const labelsDisplay = labels.length > 0 ? `<div class="product-labels">${labels.join('')}</div>` : '';
        const categoryDisplay = product.category ? `<span class="item-category">${this.getCategoryDisplayName(product.category)}</span>` : '';
        const typeDisplay = product.type ? `<span class="item-type ${product.type}">${product.type.toUpperCase()}</span>` : '';
        const soldDisplay = product.soldCount ? `<span class="sold-count"><i class="fas fa-shopping-cart"></i> ${product.soldCount} terjual</span>` : '';
        card.innerHTML = `
      <div class="item-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${labelsDisplay}
      </div>
      <div class="item-content">
        <h4 class="item-title">${product.name}</h4>
        <p class="item-description">${product.description}</p>
        <div class="item-price">${priceDisplay}</div>
        ${soldDisplay ? `<div class="item-sold">${soldDisplay}</div>` : ''}
        <div class="item-meta">
          ${categoryDisplay}
          ${typeDisplay}
          <span class="item-status status-${product.status}">
            ${product.status.toUpperCase()}
          </span>
        </div>
        <div class="item-actions">
          <button class="btn btn-small btn-primary edit-btn" data-id="${product.id}" data-type="product">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-small btn-danger delete-btn" data-id="${product.id}" data-type="product">
            <i class="fas fa-trash"></i> Delete
          </button>
          ${product.downloadLink ? `<button class="btn btn-small btn-success download-btn" onclick="window.open('${product.downloadLink}', '_blank')">
            <i class="fas fa-download"></i> Download
          </button>` : ''}
        </div>
      </div>
    `;
        return card;
    }
    async loadSettings() {
        const { siteName, heroTitle, heroSubtitle, aboutText, whatsappNumber, profileImage, backgroundImage } = this.siteSettings;
        this.setFormValue('siteName', siteName);
        this.setFormValue('heroTitle', heroTitle);
        this.setFormValue('heroSubtitle', heroSubtitle);
        this.setFormValue('aboutText', aboutText);
        this.setFormValue('whatsappNumber', whatsappNumber);
        if (profileImage && this.elements.profileImage) {
            this.elements.profileImage.src = profileImage;
        }
        if (backgroundImage) {
            this.updateBackgroundPreview(backgroundImage);
            const removeBtn = DOMUtils.getElementById('removeBackgroundBtn');
            if (removeBtn) {
                removeBtn.style.display = 'inline-flex';
            }
        }
    }
    async updateStatistics() {
        const stats = {
            totalPortfolio: this.portfolioData.length,
            totalProducts: this.productsData.length,
            activeProducts: this.productsData.filter(p => p.status === 'active').length,
            totalCategories: new Set(this.portfolioData.map(p => p.category)).size
        };
        this.updateStatElement('totalPortfolio', stats.totalPortfolio);
        this.updateStatElement('totalProducts', stats.totalProducts);
        this.updateStatElement('activeProducts', stats.activeProducts);
        this.updateStatElement('totalCategories', stats.totalCategories);
    }
    handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');
        if (username === 'admin' && password === 'admin123') {
            this.currentUser = { username: 'admin', password: 'admin123' };
            SafeStorage.set(StorageKeys.USER_DATA, this.currentUser);
            this.showDashboard();
            this.showMessage('Login berhasil!', 'success');
        }
        else {
            this.showMessage('Username atau password salah!', 'error');
        }
    }
    handleLogout() {
        this.currentUser = null;
        SafeStorage.remove(StorageKeys.USER_DATA);
        this.showLogin();
        this.showMessage('Logout berhasil!', 'success');
    }
    setupSidebarHoverHandlers() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');
        if (sidebar && main) {
            sidebar.addEventListener('mouseenter', () => {
                if (this.sidebarAutoHide) {
                    DOMUtils.addClass(sidebar, 'sidebar-visible');
                    DOMUtils.addClass(main, 'sidebar-visible');
                }
            });
            sidebar.addEventListener('mouseleave', () => {
                if (this.sidebarAutoHide) {
                    DOMUtils.removeClass(sidebar, 'sidebar-visible');
                    DOMUtils.removeClass(main, 'sidebar-visible');
                }
            });
        }
    }
    handleSidebarToggle() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');
        const toggleBtn = DOMUtils.getElementById('sidebarToggle');
        if (sidebar && main && toggleBtn) {
            if (!sidebar.classList.contains('collapsed') && !this.sidebarAutoHide) {
                DOMUtils.addClass(sidebar, 'collapsed');
                DOMUtils.addClass(main, 'sidebar-collapsed');
                DOMUtils.removeClass(toggleBtn, 'auto-hide-active');
            }
            else if (sidebar.classList.contains('collapsed') && !this.sidebarAutoHide) {
                DOMUtils.removeClass(sidebar, 'collapsed');
                DOMUtils.addClass(sidebar, 'auto-hide');
                DOMUtils.removeClass(main, 'sidebar-collapsed');
                DOMUtils.addClass(main, 'auto-hide');
                DOMUtils.addClass(toggleBtn, 'auto-hide-active');
                this.sidebarAutoHide = true;
            }
            else {
                DOMUtils.removeClass(sidebar, 'auto-hide');
                DOMUtils.removeClass(sidebar, 'sidebar-visible');
                DOMUtils.removeClass(main, 'auto-hide');
                DOMUtils.removeClass(main, 'sidebar-visible');
                DOMUtils.removeClass(toggleBtn, 'auto-hide-active');
                this.sidebarAutoHide = false;
            }
            SafeStorage.set(StorageKeys.SIDEBAR_STATE, {
                collapsed: sidebar.classList.contains('collapsed'),
                autoHide: this.sidebarAutoHide
            });
        }
    }
    restoreSidebarState() {
        const defaultState = { collapsed: false, autoHide: false };
        const savedState = SafeStorage.get(StorageKeys.SIDEBAR_STATE, defaultState);
        if (savedState && (savedState.autoHide || savedState.collapsed)) {
            const sidebar = document.querySelector('.admin-sidebar');
            const main = document.querySelector('.admin-main');
            const toggleBtn = DOMUtils.getElementById('sidebarToggle');
            if (sidebar && main && toggleBtn) {
                if (savedState.autoHide) {
                    DOMUtils.addClass(sidebar, 'auto-hide');
                    DOMUtils.addClass(main, 'auto-hide');
                    DOMUtils.addClass(toggleBtn, 'auto-hide-active');
                    this.sidebarAutoHide = true;
                }
                else if (savedState.collapsed) {
                    DOMUtils.addClass(sidebar, 'collapsed');
                    DOMUtils.addClass(main, 'sidebar-collapsed');
                }
            }
        }
    }
    checkAuthStatus() {
        try {
            const item = localStorage.getItem(StorageKeys.USER_DATA);
            if (item) {
                const savedUser = JSON.parse(item);
                this.currentUser = savedUser;
                this.showDashboard();
            }
            else {
                this.showLogin();
            }
        }
        catch (error) {
            console.error('Error checking auth status:', error);
            this.showLogin();
        }
    }
    showLogin() {
        const loginModal = DOMUtils.getElementById('loginModal');
        const adminDashboard = DOMUtils.getElementById('adminDashboard');
        if (loginModal)
            DOMUtils.addClass(loginModal, 'active');
        if (adminDashboard)
            DOMUtils.removeClass(adminDashboard, 'active');
    }
    showDashboard() {
        const loginModal = DOMUtils.getElementById('loginModal');
        const adminDashboard = DOMUtils.getElementById('adminDashboard');
        if (loginModal)
            DOMUtils.removeClass(loginModal, 'active');
        if (adminDashboard)
            DOMUtils.addClass(adminDashboard, 'active');
        this.renderPortfolioItems();
        this.renderProductItems();
        this.loadSettings();
        this.restoreSidebarState();
    }
    isAuthenticated() {
        return this.currentUser !== null;
    }
    requireAuth() {
        if (!this.isAuthenticated()) {
            this.showMessage('Anda harus login terlebih dahulu untuk mengakses fitur ini', 'error');
            this.showLogin();
            return false;
        }
        return true;
    }
    handleTabSwitch(event, element) {
        event.preventDefault();
        if (!this.requireAuth())
            return;
        const targetTab = element.dataset.tab;
        if (!targetTab)
            return;
        this.elements.tabButtons?.forEach(btn => DOMUtils.removeClass(btn, 'active'));
        DOMUtils.addClass(element, 'active');
        this.elements.tabContents?.forEach(content => DOMUtils.removeClass(content, 'active'));
        const targetContent = DOMUtils.getElementById(`${targetTab}Tab`);
        if (targetContent) {
            DOMUtils.addClass(targetContent, 'active');
        }
        this.savePageState(targetTab);
        this.loadTabData(targetTab);
    }
    async handleFormSubmit(event) {
        event.preventDefault();
        if (!this.requireAuth())
            return;
        const form = event.target;
        const formData = new FormData(form);
        const formType = form.dataset.type;
        try {
            switch (formType) {
                case 'portfolio':
                    await this.handlePortfolioSubmit(formData);
                    this.closePortfolioModal();
                    break;
                case 'product':
                    await this.handleProductSubmit(formData);
                    this.closeProductModal();
                    break;
                case 'settings':
                    await this.handleSettingsSubmit(formData);
                    break;
                default:
                    throw new Error('Unknown form type');
            }
            this.showMessage('Data saved successfully!', 'success');
            form.reset();
        }
        catch (error) {
            console.error('Form submission error:', error);
            this.showMessage('Failed to save data', 'error');
        }
    }
    async handlePortfolioSubmit(formData) {
        const portfolioItem = {
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            status: (formData.get('status') || 'active')
        };
        const imageInput = DOMUtils.getElementById('portfolioImage');
        const imageUrl = this.tempImageData.portfolio || imageInput?.value || '';
        const additionalImageUrls = [];
        for (let i = 1; i <= 3; i++) {
            const urlInput = DOMUtils.getElementById(`additionalImageUrl${i}`);
            if (urlInput?.value) {
                additionalImageUrls.push(urlInput.value);
            }
        }
        if (!portfolioItem.title || !portfolioItem.category) {
            throw new Error('Title and category are required');
        }
        if (this.currentEditingId) {
            const index = this.portfolioData.findIndex(item => item.id === this.currentEditingId);
            if (index !== -1) {
                const existingItem = this.portfolioData[index];
                if (existingItem) {
                    this.portfolioData[index] = {
                        ...existingItem,
                        ...portfolioItem,
                        image: imageUrl || existingItem.image,
                        additionalImages: additionalImageUrls,
                        id: existingItem.id
                    };
                }
            }
            this.currentEditingId = null;
        }
        else {
            const newItem = {
                ...portfolioItem,
                id: this.generateId(),
                image: imageUrl || ImageUtils.createPlaceholder(400, 300, portfolioItem.title || 'Portfolio Item'),
                additionalImages: additionalImageUrls
            };
            this.portfolioData.push(newItem);
        }
        delete this.tempImageData.portfolio;
        await this.savePortfolioData();
        await this.renderPortfolioItems();
    }
    async handleProductSubmit(formData) {
        const price = parseInt(formData.get('price'));
        const originalPrice = formData.get('originalPrice') ? parseInt(formData.get('originalPrice')) : undefined;
        const discount = formData.get('discount') ? parseInt(formData.get('discount')) : undefined;
        let calculatedDiscount = discount;
        if (originalPrice && originalPrice > price) {
            calculatedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        const productItem = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: price,
            status: (formData.get('status') || 'active')
        };
        if (originalPrice !== undefined) {
            productItem.originalPrice = originalPrice;
        }
        if (calculatedDiscount !== undefined) {
            productItem.discount = calculatedDiscount;
        }
        if (formData.get('category')) {
            productItem.category = formData.get('category');
        }
        if (formData.get('type')) {
            productItem.type = formData.get('type');
        }
        if (formData.get('downloadLink')) {
            productItem.downloadLink = formData.get('downloadLink');
        }
        const imageInput = DOMUtils.getElementById('productImage');
        const imageUrl = this.tempImageData.product || imageInput?.value || '';
        if (!productItem.name || !productItem.price) {
            throw new Error('Name and price are required');
        }
        if (this.currentEditingId) {
            const index = this.productsData.findIndex(item => item.id === this.currentEditingId);
            if (index !== -1) {
                const existingItem = this.productsData[index];
                if (existingItem) {
                    this.productsData[index] = {
                        ...existingItem,
                        ...productItem,
                        image: imageUrl || existingItem.image,
                        id: existingItem.id
                    };
                }
            }
            this.currentEditingId = null;
        }
        else {
            const newItem = {
                ...productItem,
                id: this.generateId(),
                image: imageUrl || ImageUtils.createPlaceholder(300, 200, productItem.name || 'Product')
            };
            this.productsData.push(newItem);
        }
        delete this.tempImageData.product;
        await this.saveProductsData();
        await this.renderProductItems();
    }
    async handleSettingsSubmit(formData) {
        const settings = {
            siteName: formData.get('siteName'),
            heroTitle: formData.get('heroTitle'),
            heroSubtitle: formData.get('heroSubtitle'),
            aboutText: formData.get('aboutText'),
            whatsappNumber: formData.get('whatsappNumber'),
            gridLayout: formData.get('gridLayout'),
            itemsPerPage: parseInt(formData.get('itemsPerPage')) || 9,
            showCategories: formData.get('showCategories') === 'on',
            enableAnimations: formData.get('enableAnimations') === 'on'
        };
        if (settings.whatsappNumber && !ValidationUtils.isValidPhoneNumber(settings.whatsappNumber)) {
            throw new Error('Invalid WhatsApp number format');
        }
        this.siteSettings = { ...this.siteSettings, ...settings };
        await this.saveSiteSettings();
        this.showMessage('Pengaturan berhasil disimpan!', 'success');
    }
    async handleImageUpload(event, element) {
        if (!this.requireAuth())
            return;
        const file = element.files?.[0];
        if (!file)
            return;
        if (!ValidationUtils.isValidImageFile(file)) {
            this.showMessage('Please select a valid image file', 'error');
            return;
        }
        if (!ValidationUtils.isValidFileSize(file, 5 * 1024 * 1024)) {
            this.showMessage('File size must be less than 5MB', 'error');
            return;
        }
        try {
            const imageUrl = await ImageUtils.fileToDataURL(file);
            const targetType = element.dataset.target;
            this.currentImageTarget = targetType || 'portfolio';
            const useDirectly = await this.showConfirmDialog('Upload Gambar', 'Apakah Anda ingin menggunakan gambar ini langsung atau ingin mengeditnya terlebih dahulu?');
            if (useDirectly) {
                if (this.currentImageTarget === 'profile') {
                    await this.applyCroppedImage(imageUrl);
                }
                else {
                    this.tempImageData[this.currentImageTarget] = imageUrl;
                    if (this.currentImageTarget === 'portfolio') {
                        this.updatePortfolioImagePreview(imageUrl);
                    }
                    else if (this.currentImageTarget === 'product') {
                        this.updateProductImagePreview(imageUrl);
                    }
                }
                this.showMessage('Image uploaded successfully!', 'success');
            }
            else {
                this.showCropperModal(imageUrl);
            }
        }
        catch (error) {
            console.error('Image upload error:', error);
            this.showMessage('Failed to process image', 'error');
        }
    }
    async handleCropperSave() {
        if (!this.requireAuth())
            return;
        if (!this.cropper)
            return;
        try {
            const canvas = this.cropper.getCroppedCanvas({
                width: 800,
                height: 600,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
            await this.applyCroppedImage(croppedImageUrl);
            this.closeCropperModal();
            this.showMessage('Image updated successfully!', 'success');
        }
        catch (error) {
            console.error('Cropper save error:', error);
            this.showMessage('Failed to save image', 'error');
        }
    }
    async handleDeleteItem(event, element) {
        if (!this.requireAuth())
            return;
        const id = parseInt(element.dataset.id || '0');
        const type = element.dataset.type;
        if (!id || !type)
            return;
        const confirmed = await this.showConfirmDialog('Delete Item', `Are you sure you want to delete this ${type} item? This action cannot be undone.`);
        if (!confirmed)
            return;
        try {
            if (type === 'portfolio') {
                await this.deletePortfolioItem(id);
            }
            else {
                await this.deleteProductItem(id);
            }
            this.showMessage('Item deleted successfully!', 'success');
        }
        catch (error) {
            console.error('Delete error:', error);
            this.showMessage('Failed to delete item', 'error');
        }
    }
    async handleEditItem(event, element) {
        if (!this.requireAuth())
            return;
        const id = parseInt(element.dataset.id || '0');
        const type = element.dataset.type;
        if (!id || !type)
            return;
        try {
            if (type === 'portfolio') {
                await this.editPortfolioItem(id);
            }
            else {
                await this.editProductItem(id);
            }
        }
        catch (error) {
            console.error('Edit error:', error);
            this.showMessage('Failed to load item for editing', 'error');
        }
    }
    handlePreviewItem(event, element) {
        const id = parseInt(element.dataset.id || '0');
        const type = element.dataset.type;
        if (!id || !type)
            return;
        if (type === 'portfolio') {
            const item = this.portfolioData.find(p => p.id === id);
            if (item) {
                this.showImagePreview(item.image, item.title, item.additionalImages);
            }
        }
        else {
            const item = this.productsData.find(p => p.id === id);
            if (item) {
                this.showImagePreview(item.image, item.name);
            }
        }
    }
    showImagePreview(imageUrl, title, additionalImages) {
        let modal = DOMUtils.getElementById('imagePreviewModal');
        if (!modal) {
            modal = this.createImagePreviewModal();
            document.body.appendChild(modal);
        }
        const modalImage = modal.querySelector('.preview-image');
        const modalTitle = modal.querySelector('.preview-title');
        const additionalContainer = modal.querySelector('.additional-images');
        if (modalImage)
            modalImage.src = imageUrl;
        if (modalTitle)
            modalTitle.textContent = title;
        if (additionalContainer) {
            additionalContainer.innerHTML = '';
            if (additionalImages && additionalImages.length > 0) {
                additionalImages.forEach((imgUrl, index) => {
                    const img = DOMUtils.createElement('img', 'additional-preview');
                    img.src = imgUrl;
                    img.alt = `${title} - Image ${index + 2}`;
                    img.addEventListener('click', () => {
                        if (modalImage)
                            modalImage.src = imgUrl;
                    });
                    additionalContainer.appendChild(img);
                });
            }
        }
        modal.style.display = 'flex';
    }
    createImagePreviewModal() {
        const modal = DOMUtils.createElement('div', 'modal');
        modal.id = 'imagePreviewModal';
        modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content image-preview-content">
        <div class="modal-header">
          <h3 class="preview-title">Image Preview</h3>
          <button class="modal-close" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="main-preview">
            <img class="preview-image" src="" alt="Preview" />
          </div>
          <div class="additional-images"></div>
        </div>
      </div>
    `;
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        closeBtn?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        overlay?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        return modal;
    }
    savePageState(currentTab) {
        const pageState = {
            currentTab,
            timestamp: Date.now()
        };
        localStorage.setItem('adminPageState', JSON.stringify(pageState));
    }
    restorePageState() {
        try {
            const savedState = localStorage.getItem('adminPageState');
            if (!savedState)
                return;
            const pageState = JSON.parse(savedState);
            const { currentTab, timestamp } = pageState;
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - timestamp > oneHour) {
                localStorage.removeItem('adminPageState');
                return;
            }
            const tabButton = DOMUtils.querySelector(`[data-tab="${currentTab}"]`);
            if (tabButton) {
                this.elements.tabButtons?.forEach(btn => DOMUtils.removeClass(btn, 'active'));
                DOMUtils.addClass(tabButton, 'active');
                this.elements.tabContents?.forEach(content => DOMUtils.removeClass(content, 'active'));
                const targetContent = DOMUtils.getElementById(`${currentTab}Tab`);
                if (targetContent) {
                    DOMUtils.addClass(targetContent, 'active');
                }
                this.loadTabData(currentTab);
            }
        }
        catch (error) {
            console.error('Failed to restore page state:', error);
            localStorage.removeItem('adminPageState');
        }
    }
    handleKeyboardShortcuts(event) {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.saveAllData();
            this.showMessage('Data saved!', 'success');
        }
        if (event.key === 'Escape') {
            this.closeCropperModal();
            const previewModal = DOMUtils.getElementById('imagePreviewModal');
            if (previewModal) {
                previewModal.style.display = 'none';
            }
        }
    }
    showCropperModal(imageUrl) {
        const modal = this.elements.cropperModal;
        const image = this.elements.cropperImage;
        if (!modal || !image) {
            console.error('Cropper modal elements not found');
            return;
        }
        image.src = imageUrl;
        DOMUtils.addClass(modal, 'active');
        this.initializeCropper();
    }
    closeCropperModal() {
        const modal = this.elements.cropperModal;
        if (!modal)
            return;
        DOMUtils.removeClass(modal, 'active');
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }
    initializeCropper() {
        const image = this.elements.cropperImage;
        if (!image || typeof Cropper === 'undefined') {
            console.error('Cropper not available or image element not found');
            return;
        }
        const config = this.getCropperConfig();
        image.onload = () => {
            this.cropper = new Cropper(image, config);
        };
    }
    getCropperConfig() {
        const baseConfig = {
            aspectRatio: 4 / 3,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        };
        switch (this.currentImageTarget) {
            case 'profile':
                return { ...baseConfig, aspectRatio: 1 };
            case 'product':
                return { ...baseConfig, aspectRatio: 3 / 2 };
            case 'portfolio':
            default:
                return { ...baseConfig, aspectRatio: 4 / 3 };
        }
    }
    async applyCroppedImage(imageUrl) {
        switch (this.currentImageTarget) {
            case 'profile':
                await this.updateProfileImage(imageUrl);
                break;
            case 'portfolio':
                if (this.currentEditingId) {
                    await this.updatePortfolioImage(imageUrl);
                }
                else {
                    this.tempImageData.portfolio = imageUrl;
                    this.updatePortfolioImagePreview(imageUrl);
                }
                break;
            case 'product':
                if (this.currentEditingId) {
                    await this.updateProductImage(imageUrl);
                }
                else {
                    this.tempImageData.product = imageUrl;
                    this.updateProductImagePreview(imageUrl);
                }
                break;
        }
    }
    async updateProfileImage(imageUrl) {
        this.siteSettings.profileImage = imageUrl;
        if (this.elements.profileImage) {
            this.elements.profileImage.src = imageUrl;
        }
        await this.saveSiteSettings();
    }
    async updatePortfolioImage(imageUrl) {
        if (!this.currentEditingId)
            return;
        const item = this.portfolioData.find(p => p.id === this.currentEditingId);
        if (item) {
            item.image = imageUrl;
            item.thumbnail = await ImageUtils.createThumbnail(imageUrl, 300, 200);
            await this.savePortfolioData();
            await this.renderPortfolioItems();
        }
    }
    async updateProductImage(imageUrl) {
        if (!this.currentEditingId)
            return;
        const item = this.productsData.find(p => p.id === this.currentEditingId);
        if (item) {
            item.image = imageUrl;
            await this.saveProductsData();
            await this.renderProductItems();
        }
    }
    updatePortfolioImagePreview(imageUrl) {
        const previewImg = DOMUtils.getElementById('portfolioPreviewImg');
        const previewContainer = DOMUtils.getElementById('portfolioImagePreview');
        const imageInput = DOMUtils.getElementById('portfolioImage');
        if (previewImg)
            previewImg.src = imageUrl;
        if (previewContainer)
            previewContainer.style.display = 'block';
        if (imageInput)
            imageInput.value = imageUrl;
    }
    updateProductImagePreview(imageUrl) {
        const previewImg = DOMUtils.getElementById('productPreviewImg');
        const previewContainer = DOMUtils.getElementById('productImagePreview');
        const imageInput = DOMUtils.getElementById('productImage');
        if (previewImg)
            previewImg.src = imageUrl;
        if (previewContainer)
            previewContainer.style.display = 'block';
        if (imageInput)
            imageInput.value = imageUrl;
    }
    editProfileImage() {
        const profileImage = this.elements.profileImage;
        const cropperImage = this.elements.cropperImage;
        const cropperModal = this.elements.cropperModal;
        if (!profileImage || !cropperImage || !cropperModal) {
            this.showMessage('Profile image editing is not available', 'error');
            return;
        }
        if (profileImage.src.startsWith('data:image/svg+xml')) {
            this.showMessage('Please upload a profile image first', 'warning');
            return;
        }
        this.currentImageTarget = 'profile';
        this.showCropperModal(profileImage.src);
    }
    async editPortfolioItem(id) {
        const item = this.portfolioData.find(p => p.id === id);
        if (!item)
            return;
        this.currentEditingId = id;
        this.setFormValue('title', item.title);
        this.setFormValue('category', item.category);
        this.setFormValue('description', item.description || '');
        this.setFormValue('status', item.status || 'active');
        if (item.image) {
            const imageInput = DOMUtils.getElementById('portfolioImage');
            if (imageInput)
                imageInput.value = item.image;
            this.updatePortfolioImagePreview(item.image);
        }
        for (let i = 1; i <= 3; i++) {
            const urlInput = DOMUtils.getElementById(`additionalImageUrl${i}`);
            const preview = DOMUtils.getElementById(`additionalPreview${i}`);
            if (item.additionalImages && item.additionalImages[i - 1]) {
                const imageUrl = item.additionalImages[i - 1];
                if (urlInput && imageUrl)
                    urlInput.value = imageUrl;
                if (imageUrl)
                    this.showAdditionalImagePreview(imageUrl, i);
            }
            else {
                if (urlInput)
                    urlInput.value = '';
                if (preview)
                    preview.style.display = 'none';
            }
        }
        const modal = DOMUtils.getElementById('portfolioModal');
        if (modal) {
            modal.style.display = 'flex';
            const title = modal.querySelector('#portfolioModalTitle');
            if (title)
                title.textContent = 'Edit Karya Portfolio';
        }
        this.switchToTab('portfolio');
    }
    async editProductItem(id) {
        const item = this.productsData.find(p => p.id === id);
        if (!item)
            return;
        this.currentEditingId = id;
        this.setFormValue('name', item.name);
        this.setFormValue('description', item.description);
        this.setFormValue('price', item.price.toString());
        this.setFormValue('originalPrice', item.originalPrice?.toString() || '');
        this.setFormValue('discount', item.discount?.toString() || '');
        this.setFormValue('category', item.category || '');
        this.setFormValue('type', item.type || 'digital');
        this.setFormValue('downloadLink', item.downloadLink || '');
        this.setFormValue('status', item.status);
        this.switchToTab('products');
        const modal = DOMUtils.querySelector('#productModal');
        if (modal) {
            modal.style.display = 'flex';
            const title = modal.querySelector('#productModalTitle');
            if (title)
                title.textContent = 'Edit Produk Digital';
        }
    }
    async deletePortfolioItem(id) {
        const index = this.portfolioData.findIndex(item => item.id === id);
        if (index === -1)
            return;
        this.portfolioData.splice(index, 1);
        await this.savePortfolioData();
        await this.renderPortfolioItems();
        await this.updateStatistics();
    }
    async deleteProductItem(id) {
        const index = this.productsData.findIndex(item => item.id === id);
        if (index === -1)
            return;
        this.productsData.splice(index, 1);
        await this.saveProductsData();
        await this.renderProductItems();
        await this.updateStatistics();
    }
    switchToTab(tabName) {
        const tabButton = DOMUtils.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }
    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.updateStatistics();
                break;
            case 'portfolio':
                await this.renderPortfolioItems();
                break;
            case 'products':
                await this.renderProductItems();
                break;
            case 'orders':
                await this.renderOrderItems();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }
    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        const required = input.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';
        if (required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        if (value && !isValid) {
            switch (type) {
                case 'email':
                    isValid = ValidationUtils.isValidEmail(value);
                    errorMessage = 'Please enter a valid email address';
                    break;
                case 'tel':
                    isValid = ValidationUtils.isValidPhoneNumber(value);
                    errorMessage = 'Please enter a valid phone number';
                    break;
                case 'url':
                    isValid = ValidationUtils.isValidURL(value);
                    errorMessage = 'Please enter a valid URL';
                    break;
                case 'number':
                    const num = parseFloat(value);
                    isValid = !isNaN(num) && num >= 0;
                    errorMessage = 'Please enter a valid positive number';
                    break;
            }
        }
        DOMUtils.toggleClass(input, 'invalid', !isValid);
        DOMUtils.toggleClass(input, 'valid', isValid && !!value);
        this.showFieldError(input, isValid ? '' : errorMessage);
        return isValid;
    }
    showFieldError(input, message) {
        let errorElement = input.parentElement?.querySelector('.field-error');
        if (!errorElement) {
            errorElement = DOMUtils.createElement('div', 'field-error');
            input.parentElement?.appendChild(errorElement);
        }
        errorElement.textContent = message;
        DOMUtils.toggleClass(errorElement, 'visible', !!message);
    }
    async handleBackgroundUpload(event) {
        if (!this.requireAuth())
            return;
        const input = event.target;
        const file = input.files?.[0];
        if (!file)
            return;
        if (file.size > 2 * 1024 * 1024) {
            this.showMessage('Ukuran file terlalu besar. Maksimal 2MB.', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            this.showMessage('File harus berupa gambar.', 'error');
            return;
        }
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target?.result;
                this.siteSettings.backgroundImage = imageData;
                await this.saveSiteSettings();
                this.updateBackgroundPreview(imageData);
                const removeBtn = DOMUtils.getElementById('removeBackgroundBtn');
                if (removeBtn) {
                    removeBtn.style.display = 'inline-flex';
                }
                this.applyBackgroundToPage(imageData);
                this.showMessage('Background berhasil diupload!', 'success');
            };
            reader.readAsDataURL(file);
        }
        catch (error) {
            console.error('Error uploading background:', error);
            this.showMessage('Gagal mengupload background.', 'error');
        }
    }
    updateBackgroundPreview(imageData) {
        const preview = DOMUtils.getElementById('backgroundPreview');
        if (preview) {
            preview.style.backgroundImage = `url(${imageData})`;
            const textElement = preview.querySelector('.background-preview-text');
            if (textElement) {
                textElement.textContent = 'Background Aktif';
            }
        }
    }
    async removeBackgroundImage() {
        if (!this.requireAuth())
            return;
        try {
            delete this.siteSettings.backgroundImage;
            await this.saveSiteSettings();
            const preview = DOMUtils.getElementById('backgroundPreview');
            if (preview) {
                preview.style.backgroundImage = 'none';
                const textElement = preview.querySelector('.background-preview-text');
                if (textElement) {
                    textElement.textContent = 'Preview Background';
                }
            }
            const removeBtn = DOMUtils.getElementById('removeBackgroundBtn');
            if (removeBtn) {
                removeBtn.style.display = 'none';
            }
            this.applyBackgroundToPage('');
            this.showMessage('Background berhasil dihapus!', 'success');
        }
        catch (error) {
            console.error('Error removing background:', error);
            this.showMessage('Gagal menghapus background.', 'error');
        }
    }
    applyBackgroundToPage(imageData) {
        const body = document.body;
        if (imageData) {
            body.style.backgroundImage = `url(${imageData})`;
        }
        else {
            body.style.backgroundImage = 'none';
        }
    }
    previewImage(input) {
        const file = input.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = input.parentElement?.querySelector('.image-preview');
            if (previewContainer) {
                previewContainer.innerHTML = `<img src="${e.target?.result}" alt="Preview">`;
            }
        };
        reader.readAsDataURL(file);
    }
    async autoSave() {
        try {
            await this.saveAllData();
            console.log('📁 Auto-save completed');
        }
        catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    async saveAllData() {
        await Promise.all([
            this.savePortfolioData(),
            this.saveProductsData(),
            this.saveSiteSettings()
        ]);
    }
    async savePortfolioData() {
        SafeStorage.set(StorageKeys.PORTFOLIO_DATA, this.portfolioData);
    }
    async saveProductsData() {
        SafeStorage.set(StorageKeys.PRODUCTS_DATA, this.productsData);
    }
    async saveSiteSettings() {
        SafeStorage.set(StorageKeys.SITE_SETTINGS, this.siteSettings);
    }
    setFormValue(name, value) {
        const input = DOMUtils.querySelector(`[name="${name}"]`);
        if (input) {
            input.value = value;
        }
    }
    updateStatElement(id, value) {
        const element = DOMUtils.getElementById(id);
        if (element) {
            AnimationUtils.animateNumber(element, value, 1000);
        }
    }
    showMessage(message, type = 'info') {
        const messageContainer = DOMUtils.getElementById('messageContainer') || this.createMessageContainer();
        const messageElement = DOMUtils.createElement('div', `message message-${type}`);
        messageElement.innerHTML = `
      <span class="message-text">${message}</span>
      <button class="message-close">&times;</button>
    `;
        const closeBtn = messageElement.querySelector('.message-close');
        closeBtn?.addEventListener('click', () => {
            AnimationUtils.fadeOut(messageElement, 300).then(() => {
                messageElement.remove();
            });
        });
        messageContainer.appendChild(messageElement);
        setTimeout(() => {
            if (messageElement.parentElement) {
                AnimationUtils.fadeOut(messageElement, 300).then(() => {
                    messageElement.remove();
                });
            }
        }, 5000);
        AnimationUtils.fadeIn(messageElement, 300);
    }
    createMessageContainer() {
        const container = DOMUtils.createElement('div', 'message-container');
        container.id = 'messageContainer';
        document.body.appendChild(container);
        return container;
    }
    async showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = this.createConfirmDialog(title, message, resolve);
            document.body.appendChild(dialog);
            requestAnimationFrame(() => {
                DOMUtils.addClass(dialog, 'active');
            });
        });
    }
    createConfirmDialog(title, message, callback) {
        const dialog = DOMUtils.createElement('div', 'confirm-dialog');
        const isImageUpload = title === 'Upload Gambar';
        const buttonsHtml = isImageUpload ? `
      <button class="btn btn-secondary dialog-cancel">Edit Gambar</button>
      <button class="btn btn-primary dialog-confirm">Gunakan Langsung</button>
    ` : `
      <button class="btn btn-secondary dialog-cancel">Cancel</button>
      <button class="btn btn-danger dialog-confirm">Confirm</button>
    `;
        dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <h3 class="dialog-title">${title}</h3>
        <p class="dialog-message">${message}</p>
        <div class="dialog-actions">
          ${buttonsHtml}
        </div>
      </div>
    `;
        const closeDialog = (result) => {
            DOMUtils.removeClass(dialog, 'active');
            setTimeout(() => {
                dialog.remove();
                callback(result);
            }, 300);
        };
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const confirmBtn = dialog.querySelector('.dialog-confirm');
        const overlay = dialog.querySelector('.dialog-overlay');
        cancelBtn?.addEventListener('click', () => closeDialog(false));
        confirmBtn?.addEventListener('click', () => closeDialog(true));
        overlay?.addEventListener('click', () => closeDialog(false));
        return dialog;
    }
    generateId() {
        const allIds = [
            ...this.portfolioData.map(item => item.id),
            ...this.productsData.map(item => item.id)
        ];
        return Math.max(0, ...allIds) + 1;
    }
    getCategoryName(category) {
        const categoryNames = {
            'ilustrasi': 'Ilustrasi',
            'character': 'Character Design',
            'branding': 'Branding',
            'editorial': 'Editorial'
        };
        return categoryNames[category] || category;
    }
    getCategoryDisplayName(category) {
        const categoryMap = {
            'brush': 'Custom Brush',
            'font': 'Font',
            'action': 'Action Photoshop',
            'texture': 'Texture Pack',
            'template': 'Template',
            'other': 'Lainnya'
        };
        return categoryMap[category] || category;
    }
    showProductModal() {
        if (!this.requireAuth())
            return;
        const modal = DOMUtils.getElementById('productModal');
        if (modal) {
            modal.style.display = 'flex';
            const form = modal.querySelector('form');
            if (form)
                form.reset();
            const title = modal.querySelector('#productModalTitle');
            if (title)
                title.textContent = 'Tambah Produk Digital';
            this.currentEditingId = null;
        }
    }
    closeProductModal() {
        const modal = DOMUtils.getElementById('productModal');
        if (modal) {
            modal.style.display = 'none';
            this.currentEditingId = null;
        }
    }
    showPortfolioModal() {
        if (!this.requireAuth())
            return;
        const modal = DOMUtils.getElementById('portfolioModal');
        if (modal) {
            modal.style.display = 'flex';
            const form = modal.querySelector('form');
            if (form)
                form.reset();
            const title = modal.querySelector('#portfolioModalTitle');
            if (title)
                title.textContent = 'Tambah Karya Portfolio';
            this.currentEditingId = null;
        }
    }
    closePortfolioModal() {
        const modal = DOMUtils.getElementById('portfolioModal');
        if (modal) {
            modal.style.display = 'none';
            this.currentEditingId = null;
        }
    }
    getDefaultPortfolio() {
        return [
            {
                id: 1,
                title: "Digital Art Sample",
                category: "ilustrasi",
                image: ImageUtils.createPlaceholder(400, 300, "Digital Art"),
                description: "Sample digital artwork",
                status: "active"
            }
        ];
    }
    getDefaultProducts() {
        return [
            {
                id: 1,
                name: "Brush Pack Premium",
                price: 150000,
                promoPrice: 120000,
                description: "Koleksi 50+ brush digital untuk ilustrasi",
                image: ImageUtils.createPlaceholder(300, 200, "Brush Pack"),
                status: "active",
                soldCount: 89,
                isNew: false,
                isBestSeller: true,
                isOnPromo: true
            },
            {
                id: 2,
                name: "Font Collection",
                price: 200000,
                description: "10 font unik untuk branding dan desain",
                image: ImageUtils.createPlaceholder(300, 200, "Font Pack"),
                status: "active",
                soldCount: 56,
                isNew: true,
                isBestSeller: false,
                isOnPromo: false
            },
            {
                id: 3,
                name: "Photoshop Actions",
                price: 100000,
                promoPrice: 75000,
                description: "25 action untuk efek foto profesional",
                image: ImageUtils.createPlaceholder(300, 200, "PS Actions"),
                status: "active",
                soldCount: 134,
                isNew: false,
                isBestSeller: true,
                isOnPromo: true
            },
            {
                id: 4,
                name: "Texture Pack",
                price: 120000,
                description: "Koleksi tekstur high-res untuk desain",
                image: ImageUtils.createPlaceholder(300, 200, "Textures"),
                status: "active",
                soldCount: 78,
                isNew: false,
                isBestSeller: false,
                isOnPromo: false
            },
            {
                id: 5,
                name: "Icon Pack Bundle",
                price: 180000,
                promoPrice: 149000,
                description: "Paket lengkap 500+ ikon untuk UI/UX design",
                image: ImageUtils.createPlaceholder(300, 200, "Icons"),
                status: "active",
                soldCount: 92,
                isNew: true,
                isBestSeller: true,
                isOnPromo: true
            }
        ];
    }
    getDefaultSettings() {
        return {
            siteName: 'Portfolio Admin',
            heroTitle: 'Ilustrator & Desainer',
            heroSubtitle: 'Menciptakan karya visual yang menginspirasi',
            whatsappNumber: '6281234567890',
            aboutText: 'Professional illustrator and graphic designer with 5+ years of experience.'
        };
    }
    getDefaultThumbnailSizes() {
        return [
            { name: 'small', width: 150, height: 100 },
            { name: 'medium', width: 300, height: 200 },
            { name: 'large', width: 600, height: 400 }
        ];
    }
    previewPortfolioImageUrl() {
        if (!this.requireAuth())
            return;
        const input = DOMUtils.getElementById('portfolioImage');
        const url = input?.value.trim();
        if (!url) {
            this.showMessage('Masukkan URL gambar terlebih dahulu!', 'warning');
            return;
        }
        this.validateAndPreviewImage(url, 'portfolio');
    }
    previewProductImageUrl() {
        if (!this.requireAuth())
            return;
        const input = DOMUtils.getElementById('productImage');
        const url = input?.value.trim();
        if (!url) {
            this.showMessage('Masukkan URL gambar terlebih dahulu!', 'warning');
            return;
        }
        this.validateAndPreviewImage(url, 'product');
    }
    clearPortfolioImage() {
        if (!this.requireAuth())
            return;
        const input = DOMUtils.getElementById('portfolioImage');
        const preview = DOMUtils.getElementById('portfolioImagePreview');
        if (input)
            input.value = '';
        if (preview)
            preview.style.display = 'none';
        this.showMessage('Gambar portfolio dibersihkan!', 'success');
    }
    clearProductImage() {
        if (!this.requireAuth())
            return;
        const input = DOMUtils.getElementById('productImage');
        const preview = DOMUtils.getElementById('productImagePreview');
        if (input)
            input.value = '';
        if (preview)
            preview.style.display = 'none';
        this.showMessage('Gambar produk dibersihkan!', 'success');
    }
    validateAndPreviewImage(url, type) {
        try {
            new URL(url);
        }
        catch {
            this.showMessage('URL tidak valid!', 'error');
            return;
        }
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
        if (!imageExtensions.test(url)) {
            this.showMessage('URL harus mengarah ke file gambar (jpg, png, gif, webp, svg)!', 'warning');
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.showUrlImagePreview(url, type);
            this.showMessage('Preview gambar berhasil dimuat!', 'success');
        };
        img.onerror = () => {
            this.showMessage('Gagal memuat gambar dari URL. Pastikan URL valid dan dapat diakses!', 'error');
        };
        this.showMessage('Memuat preview gambar...', 'info');
        img.src = url;
    }
    showUrlImagePreview(url, type) {
        const previewId = type === 'portfolio' ? 'portfolioImagePreview' : 'productImagePreview';
        const imgId = type === 'portfolio' ? 'portfolioPreviewImg' : 'productPreviewImg';
        const preview = DOMUtils.getElementById(previewId);
        const img = DOMUtils.getElementById(imgId);
        if (preview && img) {
            img.src = url;
            preview.style.display = 'block';
        }
    }
    updateDashboardStats() {
        const totalPortfolio = this.portfolioData.length;
        const totalProducts = this.productsData.length;
        const soldProducts = this.getSoldProductsCount();
        const monthlyRevenue = this.getMonthlyRevenue();
        this.updateStatElement('totalPortfolio', totalPortfolio);
        this.updateStatElement('totalProducts', totalProducts);
        this.updateStatElement('soldProducts', soldProducts);
        this.updateStatElement('monthlyRevenue', monthlyRevenue);
        this.loadRecentActivity();
    }
    getSoldProductsCount() {
        return this.productsData.reduce((total, product) => {
            return total + (product.soldCount || 0);
        }, 0);
    }
    getMonthlyRevenue() {
        const orders = this.getOrders();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const orderRevenue = orders
            .filter(order => {
            if (order.status !== 'completed' || !order.completedDate)
                return false;
            const completedDate = new Date(order.completedDate);
            return completedDate.getMonth() === currentMonth &&
                completedDate.getFullYear() === currentYear;
        })
            .reduce((total, order) => total + order.totalAmount, 0);
        const customers = this.getCustomersData();
        const customerRevenue = customers
            .filter(customer => {
            const purchaseDate = new Date(customer.date);
            return purchaseDate.getMonth() === currentMonth &&
                purchaseDate.getFullYear() === currentYear;
        })
            .reduce((total, customer) => total + customer.amount, 0);
        return orderRevenue + customerRevenue;
    }
    getCustomersData() {
        const defaultCustomers = [
            {
                id: 1,
                name: 'Ahmad Rizki',
                email: 'ahmad.rizki@email.com',
                phone: '+62 812-3456-7890',
                product: 'Beat Trap "Dark Vibes"',
                amount: 75000,
                date: '2024-02-20',
                status: 'new',
                createdAt: '2024-01-15T10:30:00.000Z'
            },
            {
                id: 2,
                name: 'Siti Nurhaliza',
                email: 'siti.nurhaliza@email.com',
                phone: '+62 813-9876-5432',
                product: 'Beat Hip-Hop "Street Flow"',
                amount: 85000,
                date: '2024-02-15',
                status: 'returning',
                createdAt: '2024-02-01T14:20:00.000Z'
            },
            {
                id: 3,
                name: 'Budi Santoso',
                email: 'budi.santoso@email.com',
                phone: '+62 814-5555-1234',
                product: 'Chill Beats Pack',
                amount: 120000,
                date: '2024-02-25',
                status: 'vip',
                createdAt: '2023-12-10T09:15:00.000Z'
            },
            {
                id: 4,
                name: 'Maya Sari',
                email: 'maya.sari@email.com',
                phone: '+62 815-7777-8888',
                product: 'Beat R&B "Smooth Vibes"',
                amount: 90000,
                date: '2024-02-18',
                status: 'new',
                createdAt: '2024-02-10T16:45:00.000Z'
            },
            {
                id: 5,
                name: 'Dedi Kurniawan',
                email: 'dedi.kurniawan@email.com',
                phone: '+62 816-9999-0000',
                product: 'Beat Drill "Hard Bass"',
                amount: 95000,
                date: '2024-02-22',
                status: 'returning',
                createdAt: '2024-01-20T11:30:00.000Z'
            }
        ];
        return SafeStorage.get(StorageKeys.CUSTOMERS_DATA, defaultCustomers);
    }
    saveCustomersData(customers) {
        SafeStorage.set(StorageKeys.CUSTOMERS_DATA, customers);
    }
    showCustomerModal() {
        if (!this.requireAuth())
            return;
        const modal = document.getElementById('customerModal');
        if (modal) {
            modal.classList.add('active');
            this.resetCustomerForm();
        }
    }
    closeCustomerModal() {
        if (!this.requireAuth())
            return;
        const modal = document.getElementById('customerModal');
        if (modal) {
            modal.classList.remove('active');
            this.resetCustomerForm();
        }
    }
    resetCustomerForm() {
        const form = document.getElementById('customerForm');
        if (form) {
            form.reset();
            const dateInput = document.getElementById('customerDate');
            if (dateInput && dateInput.type === 'date') {
                const today = new Date().toISOString().split('T')[0];
                if (today) {
                    dateInput.setAttribute('value', today);
                }
            }
        }
    }
    async handleCustomerSubmit(formData) {
        if (!this.requireAuth())
            return;
        try {
            const customerData = {
                id: this.generateId(),
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                product: formData.get('product'),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                status: formData.get('status'),
                createdAt: new Date().toISOString()
            };
            const customers = this.getCustomersData();
            customers.push(customerData);
            this.saveCustomersData(customers);
            this.renderCustomerTable();
            this.updateDashboardStats();
            this.closeCustomerModal();
            this.showMessage('Customer berhasil ditambahkan!', 'success');
        }
        catch (error) {
            console.error('Error saving customer:', error);
            this.showMessage('Gagal menyimpan customer!', 'error');
        }
    }
    renderCustomerTable() {
        const tableBody = document.querySelector('#customerTable tbody');
        if (!tableBody)
            return;
        const customers = this.getCustomersData();
        tableBody.innerHTML = '';
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.email}</td>
        <td>Rp ${customer.amount.toLocaleString('id-ID')}</td>
        <td>${customer.product}</td>
        <td>${new Date(customer.date).toLocaleDateString('id-ID')}</td>
        <td><span class="status-badge ${customer.status}">${this.getStatusLabel(customer.status)}</span></td>
        <td class="customer-actions-cell">
          <button class="action-btn-small edit" onclick="editCustomer(${customer.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn-small delete" onclick="deleteCustomer(${customer.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
            tableBody.appendChild(row);
        });
        this.updateCustomerStats();
    }
    getStatusLabel(status) {
        const labels = {
            'new': 'Customer Baru',
            'returning': 'Customer Berulang',
            'vip': 'VIP Customer'
        };
        return labels[status] || status;
    }
    updateCustomerStats() {
        const customers = this.getCustomersData();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const totalCustomers = customers.length;
        const newThisMonth = customers.filter(customer => {
            const createdDate = new Date(customer.createdAt || customer.date);
            return createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear;
        }).length;
        const returningCustomers = customers.filter(customer => customer.status === 'returning').length;
        this.updateStatElement('totalCustomers', totalCustomers);
        this.updateStatElement('newCustomersMonth', newThisMonth);
        this.updateStatElement('returningCustomers', returningCustomers);
    }
    deleteCustomer(id) {
        if (!this.requireAuth())
            return;
        this.showConfirmDialog('Hapus Customer', 'Apakah Anda yakin ingin menghapus customer ini?').then(confirmed => {
            if (confirmed) {
                const customers = this.getCustomersData();
                const updatedCustomers = customers.filter(customer => customer.id !== id);
                this.saveCustomersData(updatedCustomers);
                this.renderCustomerTable();
                this.updateDashboardStats();
                this.showMessage('Customer berhasil dihapus!', 'success');
            }
        });
    }
    exportCustomers() {
        if (!this.requireAuth())
            return;
        const customers = this.getCustomersData();
        if (customers.length === 0) {
            this.showMessage('Tidak ada data customer untuk diekspor!', 'warning');
            return;
        }
        const csvContent = this.convertToCSV(customers);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showMessage('Data customer berhasil diekspor!', 'success');
    }
    loadRecentActivity() {
        const activityList = DOMUtils.getElementById('activityList');
        if (!activityList)
            return;
        const orders = this.getOrders();
        const recentActivities = [];
        orders
            .filter(order => order.status === 'completed')
            .sort((a, b) => new Date(b.completedDate || b.orderDate).getTime() - new Date(a.completedDate || a.orderDate).getTime())
            .slice(0, 5)
            .forEach(order => {
            const completedDate = new Date(order.completedDate || order.orderDate);
            const timeAgo = this.getTimeAgo(completedDate);
            recentActivities.push({
                icon: '✅',
                message: `Pesanan ${order.productName} dikonfirmasi untuk ${order.buyerName}`,
                time: timeAgo
            });
        });
        orders
            .filter(order => order.status === 'pending')
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 3)
            .forEach(order => {
            const orderDate = new Date(order.orderDate);
            const timeAgo = this.getTimeAgo(orderDate);
            recentActivities.push({
                icon: '⏳',
                message: `Pesanan baru ${order.productName} dari ${order.buyerName}`,
                time: timeAgo
            });
        });
        recentActivities.sort((a, b) => {
            return 0;
        });
        if (recentActivities.length === 0) {
            activityList.innerHTML = `
        <div class="activity-item">
          <span class="activity-icon">📋</span>
          <div class="activity-content">
            <div class="activity-message">Belum ada aktivitas terbaru</div>
            <div class="activity-time">Mulai simulasi untuk melihat aktivitas</div>
          </div>
        </div>
      `;
        }
        else {
            activityList.innerHTML = recentActivities.slice(0, 8).map(activity => `
        <div class="activity-item">
          <span class="activity-icon">${activity.icon}</span>
          <div class="activity-content">
            <div class="activity-message">${activity.message}</div>
            <div class="activity-time">${activity.time}</div>
          </div>
        </div>
      `).join('');
        }
    }
    getTimeAgo(date) {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        if (diffInMinutes < 1) {
            return 'Baru saja';
        }
        else if (diffInMinutes < 60) {
            return `${diffInMinutes} menit yang lalu`;
        }
        else if (diffInHours < 24) {
            return `${diffInHours} jam yang lalu`;
        }
        else if (diffInDays < 7) {
            return `${diffInDays} hari yang lalu`;
        }
        else {
            return date.toLocaleDateString('id-ID');
        }
    }
    convertToCSV(customers) {
        const headers = ['Nama', 'Email', 'Telepon', 'Produk', 'Total Pembelian', 'Tanggal', 'Status'];
        const csvRows = [headers.join(',')];
        customers.forEach(customer => {
            const row = [
                `"${customer.name}"`,
                `"${customer.email}"`,
                `"${customer.phone || ''}"`,
                `"${customer.product}"`,
                customer.amount,
                `"${customer.date}"`,
                `"${this.getStatusLabel(customer.status)}""`
            ];
            csvRows.push(row.join(','));
        });
        return csvRows.join('\n');
    }
    setupCustomerModalHandlers() {
        const modal = document.getElementById('customerModal');
        const closeBtn = document.getElementById('closeCustomerModal');
        const cancelBtn = document.getElementById('cancelCustomerModal');
        const form = document.getElementById('customerForm');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCustomerModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeCustomerModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCustomerModal();
                }
            });
        }
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                await this.handleCustomerSubmit(formData);
            });
        }
    }
    async renderOrderItems() {
        try {
            const orders = this.getOrders();
            const container = DOMUtils.getElementById('ordersContainer');
            if (!container) {
                console.warn('Orders container not found');
                return;
            }
            if (orders.length === 0) {
                container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-shopping-cart"></i>
            <h3>Belum Ada Pesanan</h3>
            <p>Pesanan dari pelanggan akan muncul di sini.</p>
          </div>
        `;
                return;
            }
            this.updateOrderStatistics(orders);
            const tableBody = container.querySelector('tbody');
            if (tableBody) {
                tableBody.innerHTML = orders.map(order => this.createOrderRow(order)).join('');
                this.setupOrderEventListeners();
            }
        }
        catch (error) {
            console.error('Error rendering orders:', error);
            ErrorUtils.handleError(new Error('Failed to load orders'), 'renderOrderItems');
        }
    }
    getOrders() {
        try {
            return JSON.parse(localStorage.getItem('orders') || '[]');
        }
        catch (error) {
            console.error('Error loading orders:', error);
            return [];
        }
    }
    updateOrderStatistics(orders) {
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;
        const totalElement = DOMUtils.getElementById('totalOrders');
        const pendingElement = DOMUtils.getElementById('pendingOrders');
        const completedElement = DOMUtils.getElementById('completedOrders');
        this.updateOrderNotificationBadge(pendingOrders);
        if (totalElement)
            totalElement.textContent = totalOrders.toString();
        if (pendingElement)
            pendingElement.textContent = pendingOrders.toString();
        if (completedElement)
            completedElement.textContent = completedOrders.toString();
    }
    updateOrderNotificationBadge(pendingCount) {
        const badge = DOMUtils.getElementById('orderNotificationBadge');
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount.toString();
                badge.style.display = 'flex';
            }
            else {
                badge.style.display = 'none';
            }
        }
    }
    createOrderRow(order) {
        const statusClass = order.status === 'pending' ? 'status-pending' : 'status-completed';
        const statusText = order.status === 'pending' ? 'Menunggu Konfirmasi' : 'Selesai';
        const orderDate = new Date(order.orderDate).toLocaleDateString('id-ID');
        return `
      <tr data-order-id="${order.id}">
        <td>#${order.id.slice(-6)}</td>
        <td>${order.buyerName}</td>
        <td>${order.buyerEmail}</td>
        <td>${order.productName}</td>
        <td>${order.paymentMethod}</td>
        <td>${FormatUtils.formatPrice(order.totalAmount)}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>${orderDate}</td>
        <td>
          ${order.status === 'pending' ? `
            <button class="btn btn-sm btn-success" onclick="confirmOrder('${order.id}')">
              <i class="fas fa-check"></i> Konfirmasi
            </button>
            <button class="btn btn-sm btn-danger" onclick="rejectOrder('${order.id}')">
              <i class="fas fa-times"></i> Tolak
            </button>
          ` : `
            <button class="btn btn-sm btn-info" onclick="viewOrderDetails('${order.id}')">
              <i class="fas fa-eye"></i> Detail
            </button>
          `}
        </td>
      </tr>
    `;
    }
    setupOrderEventListeners() {
        const exportBtn = DOMUtils.getElementById('exportOrdersBtn');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportOrders();
        }
        const searchInput = DOMUtils.getElementById('orderSearch');
        if (searchInput) {
            searchInput.oninput = debounce(() => this.filterOrders(), 300);
        }
        const statusFilter = DOMUtils.getElementById('orderStatusFilter');
        if (statusFilter) {
            statusFilter.onchange = () => this.filterOrders();
        }
    }
    confirmOrder(orderId) {
        try {
            const orders = this.getOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                console.error('Order not found');
                return;
            }
            orders[orderIndex].status = 'completed';
            orders[orderIndex].completedDate = new Date().toISOString();
            localStorage.setItem('orders', JSON.stringify(orders));
            this.updateProductSoldCount(orders[orderIndex].productId);
            this.updateDashboardStats();
            alert('Pesanan berhasil dikonfirmasi! File akan dikirim ke email pelanggan.');
            this.renderOrderItems();
        }
        catch (error) {
            console.error('Error confirming order:', error);
            console.error('Failed to confirm order');
        }
    }
    rejectOrder(orderId) {
        if (!confirm('Apakah Anda yakin ingin menolak pesanan ini?')) {
            return;
        }
        try {
            const orders = this.getOrders();
            const updatedOrders = orders.filter(order => order.id !== orderId);
            localStorage.setItem('orders', JSON.stringify(updatedOrders));
            alert('Pesanan berhasil ditolak dan dihapus.');
            this.renderOrderItems();
        }
        catch (error) {
            console.error('Error rejecting order:', error);
            console.error('Failed to reject order');
        }
    }
    viewOrderDetails(orderId) {
        const orders = this.getOrders();
        const order = orders.find(order => order.id === orderId);
        if (!order) {
            console.error('Order not found');
            return;
        }
        const orderDate = new Date(order.orderDate).toLocaleString('id-ID');
        const completedDate = order.completedDate ? new Date(order.completedDate).toLocaleString('id-ID') : '-';
        alert(`Detail Pesanan #${order.id.slice(-6)}\n\n` +
            `Nama: ${order.buyerName}\n` +
            `Email: ${order.buyerEmail}\n` +
            `Produk: ${order.productName}\n` +
            `Metode Pembayaran: ${order.paymentMethod}\n` +
            `Total: ${FormatUtils.formatPrice(order.totalAmount)}\n` +
            `Status: ${order.status === 'pending' ? 'Menunggu Konfirmasi' : 'Selesai'}\n` +
            `Tanggal Pesanan: ${orderDate}\n` +
            `Tanggal Selesai: ${completedDate}\n` +
            `Catatan: ${order.notes || 'Tidak ada catatan'}`);
    }
    updateProductSoldCount(productId) {
        try {
            const products = this.productsData;
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                if (products[productIndex]) {
                    products[productIndex].soldCount = (products[productIndex]?.soldCount || 0) + 1;
                }
                SafeStorage.set(StorageKeys.PRODUCTS_DATA, products);
                this.productsData = products;
            }
        }
        catch (error) {
            console.error('Error updating product sold count:', error);
        }
    }
    filterOrders() {
        const searchInput = DOMUtils.getElementById('orderSearch');
        const statusFilter = DOMUtils.getElementById('orderStatusFilter');
        const tableRows = DOMUtils.querySelectorAll('#ordersContainer tbody tr');
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const statusFilter_value = statusFilter?.value || 'all';
        tableRows.forEach(row => {
            const orderData = row.textContent?.toLowerCase() || '';
            const statusElement = row.querySelector('.status');
            const orderStatus = statusElement?.classList.contains('status-pending') ? 'pending' : 'completed';
            const matchesSearch = orderData.includes(searchTerm);
            const matchesStatus = statusFilter_value === 'all' || orderStatus === statusFilter_value;
            row.style.display = matchesSearch && matchesStatus ? '' : 'none';
        });
    }
    exportOrders() {
        try {
            const orders = this.getOrders();
            if (orders.length === 0) {
                alert('Tidak ada data pesanan untuk diekspor.');
                return;
            }
            const headers = ['ID Pesanan', 'Nama Pembeli', 'Email', 'Produk', 'Metode Pembayaran', 'Total', 'Status', 'Tanggal Pesanan', 'Catatan'];
            const csvContent = [headers.join(',')];
            orders.forEach(order => {
                const row = [
                    `#${order.id.slice(-6)}`,
                    order.buyerName,
                    order.buyerEmail,
                    order.productName,
                    order.paymentMethod,
                    order.totalAmount,
                    order.status === 'pending' ? 'Menunggu Konfirmasi' : 'Selesai',
                    new Date(order.orderDate).toLocaleDateString('id-ID'),
                    order.notes || ''
                ];
                csvContent.push(row.join(','));
            });
            const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        catch (error) {
            console.error('Error exporting orders:', error);
            console.error('Failed to export orders');
        }
    }
}
const adminApp = new AdminApp();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => adminApp.init());
}
else {
    adminApp.init();
}
window.previewPortfolioImageUrl = () => adminApp.previewPortfolioImageUrl();
window.previewProductImageUrl = () => adminApp.previewProductImageUrl();
window.clearPortfolioImage = () => adminApp.clearPortfolioImage();
window.clearProductImage = () => adminApp.clearProductImage();
window.showCustomerModal = () => adminApp.showCustomerModal();
window.closeCustomerModal = () => adminApp.closeCustomerModal();
window.deleteCustomer = (id) => adminApp.deleteCustomer(id);
window.exportCustomers = () => adminApp.exportCustomers();
window.switchToTab = (tabName) => adminApp.switchToTab(tabName);
window.showPortfolioModal = () => adminApp.showPortfolioModal();
window.showProductModal = () => adminApp.showProductModal();
window.confirmOrder = (orderId) => adminApp.confirmOrder(orderId);
window.rejectOrder = (orderId) => adminApp.rejectOrder(orderId);
window.viewOrderDetails = (orderId) => adminApp.viewOrderDetails(orderId);
export default adminApp;
export { AdminApp };
//# sourceMappingURL=admin-script.js.map
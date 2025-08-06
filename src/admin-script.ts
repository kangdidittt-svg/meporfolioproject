// Admin Panel Script - TypeScript Version
import { 
  PortfolioItem, 
  ProductItem, 
  SiteSettings, 
  User,
  ThumbnailSize,
  CropperConfig,
  MessageType,
  ImageTarget,
  TabName,
  CategoryName,
  ProductCategoryName,
  SizeName,
  ProductType,
  StorageKeys,
  Nullable,
  Optional
} from './types.js';

import {
  debounce,
  throttle,
  SafeStorage,
  DOMUtils,
  AnimationUtils,
  ImageUtils,
  ValidationUtils,
  PerformanceUtils,
  FormatUtils,
  ErrorUtils
} from './utils.js';

// Import Cropper.js
declare const Cropper: any;

/**
 * Admin Panel Application Class
 */
class AdminApp {
  private portfolioData: PortfolioItem[] = [];
  private productsData: ProductItem[] = [];
  private siteSettings: SiteSettings;
  private currentUser: Nullable<User> = null;
  private cropper: any = null;
  private currentImageTarget: ImageTarget = 'portfolio';
  private currentEditingId: Nullable<number> = null;
  private isInitialized = false;
  private thumbnailSizes: ThumbnailSize[] = [];
  private tempImageData: { [key: string]: string } = {};

  // DOM Elements Cache
  private elements: {
    portfolioGrid?: HTMLElement | null;
    productsGrid?: HTMLElement | null;
    cropperModal?: HTMLElement | null;
    cropperImage?: HTMLImageElement | null;
    profileImage?: HTMLImageElement | null;
    tabButtons?: NodeListOf<HTMLElement>;
    tabContents?: NodeListOf<HTMLElement>;
    forms?: NodeListOf<HTMLFormElement>;
  } = {};

  constructor() {
    this.siteSettings = this.getDefaultSettings();
    this.thumbnailSizes = this.getDefaultThumbnailSizes();
    this.bindMethods();
  }

  /**
   * Bind methods to preserve 'this' context
   */
  private bindMethods(): void {
    this.handleTabSwitch = this.handleTabSwitch.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleCropperSave = this.handleCropperSave.bind(this);
    this.handleDeleteItem = this.handleDeleteItem.bind(this);
    this.handleEditItem = this.handleEditItem.bind(this);
    this.handlePreviewItem = this.handlePreviewItem.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.showProductModal = this.showProductModal.bind(this);
    this.closeProductModal = this.closeProductModal.bind(this);
    this.showPortfolioModal = this.showPortfolioModal.bind(this);
    this.closePortfolioModal = this.closePortfolioModal.bind(this);
  }

  /**
   * Initialize the admin application
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

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
    } catch (error) {
      console.error('❌ Failed to initialize admin panel:', error);
      this.showMessage('Failed to load admin panel', 'error');
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  private cacheElements(): void {
    this.elements = {
      portfolioGrid: DOMUtils.getElementById<HTMLElement>('portfolioList'),
      productsGrid: DOMUtils.getElementById<HTMLElement>('productsList'),
      cropperModal: DOMUtils.getElementById<HTMLElement>('cropperModal'),
      cropperImage: DOMUtils.getElementById<HTMLImageElement>('cropperImage'),
      profileImage: DOMUtils.getElementById<HTMLImageElement>('profileImage'),
      tabButtons: DOMUtils.querySelectorAll<HTMLElement>('.nav-tab'),
      tabContents: DOMUtils.querySelectorAll<HTMLElement>('.tab-content'),
      forms: DOMUtils.querySelectorAll<HTMLFormElement>('form')
    };
  }

  /**
   * Load data from localStorage
   */
  private async loadData(): Promise<void> {
    PerformanceUtils.mark('admin-data-load-start');

    // Load portfolio data
    this.portfolioData = SafeStorage.get(StorageKeys.PORTFOLIO_DATA, this.getDefaultPortfolio());
    
    // Load products data
    this.productsData = SafeStorage.get(StorageKeys.PRODUCTS_DATA, this.getDefaultProducts());
    
    // Load site settings
    this.siteSettings = SafeStorage.get(StorageKeys.SITE_SETTINGS, this.getDefaultSettings());

    // Load user data
    this.currentUser = SafeStorage.get(StorageKeys.USER_DATA, null);

    // Save default data if not exists
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

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Login form
    const loginForm = DOMUtils.getElementById<HTMLFormElement>('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin);
    }

    // Logout button
    const logoutBtn = DOMUtils.getElementById<HTMLButtonElement>('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout);
    }

    // Tab switching
    if (this.elements.tabButtons) {
      DOMUtils.addEventListeners(
        this.elements.tabButtons,
        'click',
        this.handleTabSwitch
      );
    }

    // Form submissions
    if (this.elements.forms) {
      this.elements.forms.forEach(form => {
        form.addEventListener('submit', this.handleFormSubmit);
      });
    }

    // Image upload handlers
    const imageInputs = DOMUtils.querySelectorAll<HTMLInputElement>('input[type="file"]');
    DOMUtils.addEventListeners(imageInputs, 'change', this.handleImageUpload);

    // Cropper modal handlers
    this.setupCropperHandlers();

    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

    // Auto-save functionality
    this.setupAutoSave();

    // Product modal handlers
    this.setupProductModalHandlers();

    // Portfolio modal handlers
    this.setupPortfolioModalHandlers();

    // Event delegation for dynamic buttons
    this.setupEventDelegation();
  }

  /**
   * Setup event delegation for dynamically created buttons
   */
  private setupEventDelegation(): void {
    // Event delegation for edit, delete, and preview buttons
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Handle preview buttons
      if (target.classList.contains('preview-btn') || target.closest('.preview-btn')) {
        const button = target.classList.contains('preview-btn') ? target : target.closest('.preview-btn') as HTMLElement;
        if (button) {
          this.handlePreviewItem(event, button);
        }
      }
      
      // Handle edit buttons
      if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
        const button = target.classList.contains('edit-btn') ? target : target.closest('.edit-btn') as HTMLElement;
        if (button) {
          this.handleEditItem(event, button);
        }
      }
      
      // Handle delete buttons
      if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
        const button = target.classList.contains('delete-btn') ? target : target.closest('.delete-btn') as HTMLElement;
        if (button) {
          this.handleDeleteItem(event, button);
        }
      }
    });
  }

  /**
   * Setup cropper modal handlers
   */
  private setupCropperHandlers(): void {
    const cropperModal = this.elements.cropperModal;
    if (!cropperModal) return;

    // Save button
    const saveBtn = cropperModal.querySelector('.cropper-save');
    saveBtn?.addEventListener('click', this.handleCropperSave);

    // Cancel button
    const cancelBtn = cropperModal.querySelector('.cropper-cancel');
    cancelBtn?.addEventListener('click', () => this.closeCropperModal());

    // Close on overlay click
    const overlay = cropperModal.querySelector('.modal-overlay');
    overlay?.addEventListener('click', () => this.closeCropperModal());
  }

  /**
   * Setup product modal handlers
   */
  private setupProductModalHandlers(): void {
    const modal = DOMUtils.getElementById<HTMLElement>('productModal');
    const closeBtn = DOMUtils.getElementById<HTMLButtonElement>('closeProductModal');
    const cancelBtn = DOMUtils.getElementById<HTMLButtonElement>('cancelProductModal');
    const addBtn = DOMUtils.getElementById<HTMLButtonElement>('addProductBtn');

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
        if (e.target === modal) this.closeProductModal();
      });
    }
  }

  /**
   * Setup portfolio modal handlers
   */
  private setupPortfolioModalHandlers(): void {
    const modal = DOMUtils.getElementById<HTMLElement>('portfolioModal');
    const closeBtn = DOMUtils.getElementById<HTMLButtonElement>('closePortfolioModal');
    const cancelBtn = DOMUtils.getElementById<HTMLButtonElement>('cancelPortfolioModal');
    const addBtn = DOMUtils.getElementById<HTMLButtonElement>('addPortfolioBtn');

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
        if (e.target === modal) this.closePortfolioModal();
      });
    }
  }

  /**
   * Setup form validation
   */
  private setupFormValidation(): void {
    const forms = this.elements.forms;
    if (!forms) return;

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input as HTMLInputElement));
        input.addEventListener('input', debounce(() => this.validateField(input as HTMLInputElement), 300));
      });
    });
  }

  /**
   * Setup image handlers
   */
  private setupImageHandlers(): void {
    // Profile image edit
    const profileImage = this.elements.profileImage;
    if (profileImage) {
      const editBtn = document.querySelector('.edit-profile-image');
      editBtn?.addEventListener('click', () => this.editProfileImage());
    }

    // Image preview handlers
    const imageInputs = DOMUtils.querySelectorAll<HTMLInputElement>('input[type="file"][accept*="image"]');
    imageInputs.forEach(input => {
      input.addEventListener('change', (e) => this.previewImage(e.target as HTMLInputElement));
    });

    // Setup additional image handlers
    this.setupAdditionalImageHandlers();
  }

  /**
   * Setup additional image handlers
   */
  private setupAdditionalImageHandlers(): void {
    for (let i = 1; i <= 3; i++) {
      const fileInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImage${i}`);
      const urlInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImageUrl${i}`);
      
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          this.handleAdditionalImageUpload(e, i);
        });
      }
      
      if (urlInput) {
        urlInput.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          if (target.value) {
            this.showAdditionalImagePreview(target.value, i);
          }
        });
      }
    }

    // Setup remove buttons
    const removeButtons = DOMUtils.querySelectorAll<HTMLButtonElement>('.remove-additional-image');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const index = parseInt(target.dataset.index || '0');
        if (index > 0) {
          this.removeAdditionalImage(index);
        }
      });
    });
  }

  /**
   * Handle additional image upload
   */
  private async handleAdditionalImageUpload(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await ImageUtils.fileToDataURL(file);
      const urlInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImageUrl${index}`);
      if (urlInput) {
        urlInput.value = imageUrl;
        this.showAdditionalImagePreview(imageUrl, index);
      }
    } catch (error) {
      this.showMessage('Error uploading additional image', 'error');
    }
  }

  /**
   * Show additional image preview
   */
  private showAdditionalImagePreview(imageUrl: string, index: number): void {
    const preview = DOMUtils.getElementById<HTMLElement>(`additionalPreview${index}`);
    if (preview) {
      const img = preview.querySelector('img');
      if (img) {
        img.src = imageUrl;
        preview.style.display = 'block';
      }
    }
  }

  /**
   * Remove additional image
   */
  public removeAdditionalImage(index: number): void {
    const preview = DOMUtils.getElementById<HTMLElement>(`additionalPreview${index}`);
    const urlInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImageUrl${index}`);
    const fileInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImage${index}`);
    
    if (preview) preview.style.display = 'none';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    const autoSaveInterval = 30000; // 30 seconds
    
    setInterval(() => {
      this.autoSave();
    }, autoSaveInterval);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveAllData();
    });
  }

  /**
   * Render all content
   */
  private async renderContent(): Promise<void> {
    PerformanceUtils.mark('admin-render-start');

    await Promise.all([
      this.renderPortfolioItems(),
      this.renderProductItems(),
      this.loadSettings(),
      this.updateStatistics()
    ]);

    PerformanceUtils.measure('Admin Content Rendering', 'admin-render-start');
  }

  /**
   * Render portfolio items in admin grid
   */
  private async renderPortfolioItems(): Promise<void> {
    const container = this.elements.portfolioGrid;
    if (!container) return;

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

  /**
   * Create portfolio admin card
   */
  private createPortfolioAdminCard(item: PortfolioItem): HTMLElement {
    const card = DOMUtils.createElement<HTMLDivElement>('div', 'portfolio-item');
    
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

  /**
   * Render product items in admin grid
   */
  private async renderProductItems(): Promise<void> {
    const container = this.elements.productsGrid;
    if (!container) return;

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

  /**
   * Create product admin card
   */
  private createProductAdminCard(product: ProductItem): HTMLElement {
    const card = DOMUtils.createElement<HTMLDivElement>('div', 'product-item');
    
    // Create price display with discount
    let priceDisplay = FormatUtils.formatPrice(product.price);
    if (product.originalPrice && product.discount && product.discount > 0) {
      priceDisplay = `
        <div class="price-container">
          <span class="original-price">${FormatUtils.formatPrice(product.originalPrice)}</span>
          <span class="current-price">${FormatUtils.formatPrice(product.price)}</span>
          <span class="discount-badge">-${product.discount}%</span>
        </div>
      `;
    }
    
    // Create category and type display
    const categoryDisplay = product.category ? `<span class="item-category">${this.getCategoryDisplayName(product.category)}</span>` : '';
    const typeDisplay = product.type ? `<span class="item-type ${product.type}">${product.type.toUpperCase()}</span>` : '';
    
    card.innerHTML = `
      <div class="item-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.discount && product.discount > 0 ? `<div class="discount-overlay">-${product.discount}%</div>` : ''}
      </div>
      <div class="item-content">
        <h4 class="item-title">${product.name}</h4>
        <p class="item-description">${product.description}</p>
        <div class="item-price">${priceDisplay}</div>
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

  /**
   * Load and apply settings to form
   */
  private async loadSettings(): Promise<void> {
    const {
      siteName,
      heroTitle,
      heroSubtitle,
      aboutText,
      whatsappNumber,
      profileImage
    } = this.siteSettings;

    // Update form fields
    this.setFormValue('siteName', siteName);
    this.setFormValue('heroTitle', heroTitle);
    this.setFormValue('heroSubtitle', heroSubtitle);
    this.setFormValue('aboutText', aboutText);
    this.setFormValue('whatsappNumber', whatsappNumber);

    // Update profile image
    if (profileImage && this.elements.profileImage) {
      this.elements.profileImage.src = profileImage;
    }
  }

  /**
   * Update statistics dashboard
   */
  private async updateStatistics(): Promise<void> {
    const stats = {
      totalPortfolio: this.portfolioData.length,
      totalProducts: this.productsData.length,
      activeProducts: this.productsData.filter(p => p.status === 'active').length,
      totalCategories: new Set(this.portfolioData.map(p => p.category)).size
    };

    // Update stat elements
    this.updateStatElement('totalPortfolio', stats.totalPortfolio);
    this.updateStatElement('totalProducts', stats.totalProducts);
    this.updateStatElement('activeProducts', stats.activeProducts);
    this.updateStatElement('totalCategories', stats.totalCategories);
  }

  // Authentication Methods

  /**
   * Handle login form submission
   */
  private handleLogin(event: Event): void {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    // Simple authentication (in real app, use proper authentication)
     if (username === 'admin' && password === 'admin123') {
       this.currentUser = { username: 'admin', password: 'admin123' };
       SafeStorage.set(StorageKeys.USER_DATA, this.currentUser);
       this.showDashboard();
       this.showMessage('Login berhasil!', 'success');
     } else {
       this.showMessage('Username atau password salah!', 'error');
     }
  }

  /**
   * Handle logout
   */
  private handleLogout(): void {
     this.currentUser = null;
     SafeStorage.remove(StorageKeys.USER_DATA);
     this.showLogin();
     this.showMessage('Logout berhasil!', 'success');
   }

  /**
   * Check authentication status
   */
  private checkAuthStatus(): void {
      try {
        const item = localStorage.getItem(StorageKeys.USER_DATA);
        if (item) {
          const savedUser = JSON.parse(item) as User;
          this.currentUser = savedUser;
          this.showDashboard();
        } else {
          this.showLogin();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        this.showLogin();
      }
    }

  /**
   * Show login modal
   */
  private showLogin(): void {
    const loginModal = DOMUtils.getElementById('loginModal');
    const adminDashboard = DOMUtils.getElementById('adminDashboard');
    
    if (loginModal) DOMUtils.addClass(loginModal, 'active');
    if (adminDashboard) DOMUtils.removeClass(adminDashboard, 'active');
  }

  /**
   * Show admin dashboard
   */
  private showDashboard(): void {
    const loginModal = DOMUtils.getElementById('loginModal');
    const adminDashboard = DOMUtils.getElementById('adminDashboard');
    
    if (loginModal) DOMUtils.removeClass(loginModal, 'active');
    if (adminDashboard) DOMUtils.addClass(adminDashboard, 'active');
    
    // Load dashboard data
    this.renderPortfolioItems();
    this.renderProductItems();
    this.loadSettings();
  }

  // Event Handlers

  /**
   * Handle tab switching
   */
  private handleTabSwitch(event: Event, element: HTMLElement): void {
    event.preventDefault();
    
    const targetTab = element.dataset.tab as TabName;
    if (!targetTab) return;

    // Update active tab button
    this.elements.tabButtons?.forEach(btn => DOMUtils.removeClass(btn, 'active'));
    DOMUtils.addClass(element, 'active');

    // Update active tab content
    this.elements.tabContents?.forEach(content => DOMUtils.removeClass(content, 'active'));
    
    const targetContent = DOMUtils.getElementById<HTMLElement>(`${targetTab}Tab`);
    if (targetContent) {
      DOMUtils.addClass(targetContent, 'active');
    }

    // Save current tab state
    this.savePageState(targetTab);

    // Load tab-specific data
    this.loadTabData(targetTab);
  }

  /**
   * Handle form submissions
   */
  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
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
    } catch (error) {
      console.error('Form submission error:', error);
      this.showMessage('Failed to save data', 'error');
    }
  }

  /**
   * Handle portfolio form submission
   */
  private async handlePortfolioSubmit(formData: FormData): Promise<void> {
    const portfolioItem: Partial<PortfolioItem> = {
      title: formData.get('title') as string,
      category: formData.get('category') as CategoryName,
      description: formData.get('description') as string,
      status: ((formData.get('status') as string) || 'active') as 'active' | 'inactive'
    };

    // Get image from form or temp storage
    const imageInput = DOMUtils.getElementById<HTMLInputElement>('portfolioImage');
    const imageUrl = this.tempImageData.portfolio || imageInput?.value || '';

    // Collect additional images
    const additionalImageUrls: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const urlInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImageUrl${i}`);
      if (urlInput?.value) {
        additionalImageUrls.push(urlInput.value);
      }
    }

    // Validate required fields
    if (!portfolioItem.title || !portfolioItem.category) {
      throw new Error('Title and category are required');
    }

    if (this.currentEditingId) {
      // Update existing item
      const index = this.portfolioData.findIndex(item => item.id === this.currentEditingId);
      if (index !== -1) {
      const existingItem = this.portfolioData[index];
      if (existingItem) {
        this.portfolioData[index] = { 
          ...existingItem, 
          ...portfolioItem,
          image: imageUrl || existingItem.image,
          additionalImages: additionalImageUrls,
          id: existingItem.id // Keep original ID
        } as PortfolioItem;
      }
      }
      this.currentEditingId = null;
    } else {
      // Create new item
      const newItem: PortfolioItem = {
        ...portfolioItem as PortfolioItem,
        id: this.generateId(),
        image: imageUrl || ImageUtils.createPlaceholder(400, 300, portfolioItem.title || 'Portfolio Item'),
        additionalImages: additionalImageUrls
      };
      this.portfolioData.push(newItem);
    }

    // Clear temp image data
    delete this.tempImageData.portfolio;

    await this.savePortfolioData();
    await this.renderPortfolioItems();
  }

  /**
   * Handle product form submission
   */
  private async handleProductSubmit(formData: FormData): Promise<void> {
    const price = parseInt(formData.get('price') as string);
    const originalPrice = formData.get('originalPrice') ? parseInt(formData.get('originalPrice') as string) : undefined;
    const discount = formData.get('discount') ? parseInt(formData.get('discount') as string) : undefined;
    
    // Calculate discount if original price is provided
    let calculatedDiscount = discount;
    if (originalPrice && originalPrice > price) {
      calculatedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    
    const productItem: Partial<ProductItem> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: price,
      status: ((formData.get('status') as string) || 'active') as 'active' | 'inactive'
    };

    // Add optional fields only if they have values
    if (originalPrice !== undefined) {
      productItem.originalPrice = originalPrice;
    }
    if (calculatedDiscount !== undefined) {
      productItem.discount = calculatedDiscount;
    }
    if (formData.get('category')) {
      productItem.category = formData.get('category') as ProductCategoryName;
    }
    if (formData.get('type')) {
      productItem.type = formData.get('type') as 'digital' | 'physical';
    }
    if (formData.get('downloadLink')) {
      productItem.downloadLink = formData.get('downloadLink') as string;
    }

    // Get image from form or temp storage
    const imageInput = DOMUtils.getElementById<HTMLInputElement>('productImage');
    const imageUrl = this.tempImageData.product || imageInput?.value || '';

    // Validate required fields
    if (!productItem.name || !productItem.price) {
      throw new Error('Name and price are required');
    }

    if (this.currentEditingId) {
      // Update existing item
      const index = this.productsData.findIndex(item => item.id === this.currentEditingId);
      if (index !== -1) {
      const existingItem = this.productsData[index];
      if (existingItem) {
        this.productsData[index] = { 
          ...existingItem, 
          ...productItem,
          image: imageUrl || existingItem.image,
          id: existingItem.id // Keep original ID
        } as ProductItem;
      }
      }
      this.currentEditingId = null;
    } else {
      // Create new item
      const newItem: ProductItem = {
        ...productItem as ProductItem,
        id: this.generateId(),
        image: imageUrl || ImageUtils.createPlaceholder(300, 200, productItem.name || 'Product')
      };
      this.productsData.push(newItem);
    }

    // Clear temp image data
    delete this.tempImageData.product;

    await this.saveProductsData();
    await this.renderProductItems();
  }

  /**
   * Handle settings form submission
   */
  private async handleSettingsSubmit(formData: FormData): Promise<void> {
    const settings: Partial<SiteSettings> = {
      siteName: formData.get('siteName') as string,
      heroTitle: formData.get('heroTitle') as string,
      heroSubtitle: formData.get('heroSubtitle') as string,
      aboutText: formData.get('aboutText') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
      gridLayout: formData.get('gridLayout') as 'masonry' | 'grid' | 'list',
      itemsPerPage: parseInt(formData.get('itemsPerPage') as string) || 9,
      showCategories: formData.get('showCategories') === 'on',
      enableAnimations: formData.get('enableAnimations') === 'on'
    };

    // Validate WhatsApp number
    if (settings.whatsappNumber && !ValidationUtils.isValidPhoneNumber(settings.whatsappNumber)) {
      throw new Error('Invalid WhatsApp number format');
    }

    this.siteSettings = { ...this.siteSettings, ...settings };
    await this.saveSiteSettings();
    
    // Show success message
    this.showMessage('Pengaturan berhasil disimpan!', 'success');
  }

  /**
   * Handle image upload
   */
  private async handleImageUpload(event: Event, element: HTMLInputElement): Promise<void> {
    const file = element.files?.[0];
    if (!file) return;

    // Validate file
    if (!ValidationUtils.isValidImageFile(file)) {
      this.showMessage('Please select a valid image file', 'error');
      return;
    }

    if (!ValidationUtils.isValidFileSize(file, 5 * 1024 * 1024)) { // 5MB limit
      this.showMessage('File size must be less than 5MB', 'error');
      return;
    }

    try {
      const imageUrl = await ImageUtils.fileToDataURL(file);
      const targetType = element.dataset.target as ImageTarget;
      
      this.currentImageTarget = targetType || 'portfolio';
      
      // Show confirmation dialog for direct upload or cropping
      const useDirectly = await this.showConfirmDialog(
        'Upload Gambar',
        'Apakah Anda ingin menggunakan gambar ini langsung atau ingin mengeditnya terlebih dahulu?'
      );
      
      if (useDirectly) {
        // Apply image directly without cropping
        if (this.currentImageTarget === 'profile') {
          await this.applyCroppedImage(imageUrl);
        } else {
          // For portfolio and product, store in temp data
          this.tempImageData[this.currentImageTarget] = imageUrl;
          if (this.currentImageTarget === 'portfolio') {
            this.updatePortfolioImagePreview(imageUrl);
          } else if (this.currentImageTarget === 'product') {
            this.updateProductImagePreview(imageUrl);
          }
        }
        this.showMessage('Image uploaded successfully!', 'success');
      } else {
        // Show cropper modal for editing
        this.showCropperModal(imageUrl);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      this.showMessage('Failed to process image', 'error');
    }
  }

  /**
   * Handle cropper save
   */
  private async handleCropperSave(): Promise<void> {
    if (!this.cropper) return;

    try {
      const canvas = this.cropper.getCroppedCanvas({
        width: 800,
        height: 600,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Apply cropped image based on target
      await this.applyCroppedImage(croppedImageUrl);
      
      this.closeCropperModal();
      this.showMessage('Image updated successfully!', 'success');
    } catch (error) {
      console.error('Cropper save error:', error);
      this.showMessage('Failed to save image', 'error');
    }
  }

  /**
   * Handle delete item
   */
  private async handleDeleteItem(event: Event, element: HTMLElement): Promise<void> {
    const id = parseInt(element.dataset.id || '0');
    const type = element.dataset.type as 'portfolio' | 'product';
    
    if (!id || !type) return;

    const confirmed = await this.showConfirmDialog(
      'Delete Item',
      `Are you sure you want to delete this ${type} item? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      if (type === 'portfolio') {
        await this.deletePortfolioItem(id);
      } else {
        await this.deleteProductItem(id);
      }
      
      this.showMessage('Item deleted successfully!', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      this.showMessage('Failed to delete item', 'error');
    }
  }

  /**
   * Handle edit item
   */
  private async handleEditItem(event: Event, element: HTMLElement): Promise<void> {
    const id = parseInt(element.dataset.id || '0');
    const type = element.dataset.type as 'portfolio' | 'product';
    
    if (!id || !type) return;

    try {
      if (type === 'portfolio') {
        await this.editPortfolioItem(id);
      } else {
        await this.editProductItem(id);
      }
    } catch (error) {
      console.error('Edit error:', error);
      this.showMessage('Failed to load item for editing', 'error');
    }
  }

  /**
   * Handle preview item
   */
  private handlePreviewItem(event: Event, element: HTMLElement): void {
    const id = parseInt(element.dataset.id || '0');
    const type = element.dataset.type as 'portfolio' | 'product';
    
    if (!id || !type) return;

    if (type === 'portfolio') {
      const item = this.portfolioData.find(p => p.id === id);
      if (item) {
        this.showImagePreview(item.image, item.title, item.additionalImages);
      }
    } else {
      const item = this.productsData.find(p => p.id === id);
      if (item) {
        this.showImagePreview(item.image, item.name);
      }
    }
  }

  /**
   * Show image preview modal
   */
  private showImagePreview(imageUrl: string, title: string, additionalImages?: string[]): void {
    // Create modal if it doesn't exist
    let modal = DOMUtils.getElementById<HTMLElement>('imagePreviewModal');
    if (!modal) {
      modal = this.createImagePreviewModal();
      document.body.appendChild(modal);
    }

    // Update modal content
    const modalImage = modal.querySelector('.preview-image') as HTMLImageElement;
    const modalTitle = modal.querySelector('.preview-title') as HTMLElement;
    const additionalContainer = modal.querySelector('.additional-images') as HTMLElement;

    if (modalImage) modalImage.src = imageUrl;
    if (modalTitle) modalTitle.textContent = title;

    // Show additional images if available
    if (additionalContainer) {
      additionalContainer.innerHTML = '';
      if (additionalImages && additionalImages.length > 0) {
        additionalImages.forEach((imgUrl, index) => {
          const img = DOMUtils.createElement<HTMLImageElement>('img', 'additional-preview');
          img.src = imgUrl;
          img.alt = `${title} - Image ${index + 2}`;
          img.addEventListener('click', () => {
            if (modalImage) modalImage.src = imgUrl;
          });
          additionalContainer.appendChild(img);
        });
      }
    }

    // Show modal
    modal.style.display = 'flex';
  }

  /**
   * Create image preview modal
   */
  private createImagePreviewModal(): HTMLElement {
    const modal = DOMUtils.createElement<HTMLDivElement>('div', 'modal');
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

    // Add event listeners
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

  /**
   * Save current page state
   */
  private savePageState(currentTab: TabName): void {
    const pageState = {
      currentTab,
      timestamp: Date.now()
    };
    localStorage.setItem('adminPageState', JSON.stringify(pageState));
  }

  /**
   * Restore page state after refresh
   */
  private restorePageState(): void {
    try {
      const savedState = localStorage.getItem('adminPageState');
      if (!savedState) return;

      const pageState = JSON.parse(savedState);
      const { currentTab, timestamp } = pageState;

      // Only restore if the state is recent (within 1 hour)
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - timestamp > oneHour) {
        localStorage.removeItem('adminPageState');
        return;
      }

      // Find and activate the saved tab
      const tabButton = DOMUtils.querySelector<HTMLElement>(`[data-tab="${currentTab}"]`);
      if (tabButton) {
        // Update active tab button
        this.elements.tabButtons?.forEach(btn => DOMUtils.removeClass(btn, 'active'));
        DOMUtils.addClass(tabButton, 'active');

        // Update active tab content
        this.elements.tabContents?.forEach(content => DOMUtils.removeClass(content, 'active'));
        
        const targetContent = DOMUtils.getElementById<HTMLElement>(`${currentTab}Tab`);
        if (targetContent) {
          DOMUtils.addClass(targetContent, 'active');
        }

        // Load tab-specific data
        this.loadTabData(currentTab);
      }
    } catch (error) {
      console.error('Failed to restore page state:', error);
      localStorage.removeItem('adminPageState');
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveAllData();
      this.showMessage('Data saved!', 'success');
    }

    // Escape to close modals
    if (event.key === 'Escape') {
      this.closeCropperModal();
      // Close image preview modal
      const previewModal = DOMUtils.getElementById<HTMLElement>('imagePreviewModal');
      if (previewModal) {
        previewModal.style.display = 'none';
      }
    }
  }

  // Utility Methods

  /**
   * Show cropper modal
   */
  private showCropperModal(imageUrl: string): void {
    const modal = this.elements.cropperModal;
    const image = this.elements.cropperImage;
    
    if (!modal || !image) {
      console.error('Cropper modal elements not found');
      return;
    }

    // Set image source
    image.src = imageUrl;
    
    // Show modal
    DOMUtils.addClass(modal, 'active');
    
    // Initialize cropper
    this.initializeCropper();
  }

  /**
   * Close cropper modal
   */
  private closeCropperModal(): void {
    const modal = this.elements.cropperModal;
    if (!modal) return;

    DOMUtils.removeClass(modal, 'active');
    
    // Destroy cropper
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }

  /**
   * Initialize cropper
   */
  private initializeCropper(): void {
    const image = this.elements.cropperImage;
    if (!image || typeof Cropper === 'undefined') {
      console.error('Cropper not available or image element not found');
      return;
    }

    const config: CropperConfig = this.getCropperConfig();
    
    // Wait for image to load
    image.onload = () => {
      this.cropper = new Cropper(image, config);
    };
  }

  /**
   * Get cropper configuration based on target
   */
  private getCropperConfig(): CropperConfig {
    const baseConfig: CropperConfig = {
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
        return { ...baseConfig, aspectRatio: 1 }; // Square for profile
      case 'product':
        return { ...baseConfig, aspectRatio: 3 / 2 }; // 3:2 for products
      case 'portfolio':
      default:
        return { ...baseConfig, aspectRatio: 4 / 3 }; // 4:3 for portfolio
    }
  }

  /**
   * Apply cropped image
   */
  private async applyCroppedImage(imageUrl: string): Promise<void> {
    switch (this.currentImageTarget) {
      case 'profile':
        await this.updateProfileImage(imageUrl);
        break;
      case 'portfolio':
        if (this.currentEditingId) {
          await this.updatePortfolioImage(imageUrl);
        } else {
          // Store image temporarily for new items
          this.tempImageData.portfolio = imageUrl;
          this.updatePortfolioImagePreview(imageUrl);
        }
        break;
      case 'product':
        if (this.currentEditingId) {
          await this.updateProductImage(imageUrl);
        } else {
          // Store image temporarily for new items
          this.tempImageData.product = imageUrl;
          this.updateProductImagePreview(imageUrl);
        }
        break;
    }
  }

  /**
   * Update profile image
   */
  private async updateProfileImage(imageUrl: string): Promise<void> {
    this.siteSettings.profileImage = imageUrl;
    
    if (this.elements.profileImage) {
      this.elements.profileImage.src = imageUrl;
    }
    
    await this.saveSiteSettings();
  }

  /**
   * Update portfolio image
   */
  private async updatePortfolioImage(imageUrl: string): Promise<void> {
    if (!this.currentEditingId) return;
    
    const item = this.portfolioData.find(p => p.id === this.currentEditingId);
    if (item) {
      item.image = imageUrl;
      item.thumbnail = await ImageUtils.createThumbnail(imageUrl, 300, 200);
      await this.savePortfolioData();
      await this.renderPortfolioItems();
    }
  }

  /**
   * Update product image
   */
  private async updateProductImage(imageUrl: string): Promise<void> {
    if (!this.currentEditingId) return;
    
    const item = this.productsData.find(p => p.id === this.currentEditingId);
    if (item) {
      item.image = imageUrl;
      await this.saveProductsData();
      await this.renderProductItems();
    }
  }

  /**
   * Update portfolio image preview
   */
  private updatePortfolioImagePreview(imageUrl: string): void {
    const previewImg = DOMUtils.getElementById<HTMLImageElement>('portfolioPreviewImg');
    const previewContainer = DOMUtils.getElementById<HTMLElement>('portfolioImagePreview');
    const imageInput = DOMUtils.getElementById<HTMLInputElement>('portfolioImage');
    
    if (previewImg) previewImg.src = imageUrl;
    if (previewContainer) previewContainer.style.display = 'block';
    if (imageInput) imageInput.value = imageUrl;
  }

  /**
   * Update product image preview
   */
  private updateProductImagePreview(imageUrl: string): void {
    const previewImg = DOMUtils.getElementById<HTMLImageElement>('productPreviewImg');
    const previewContainer = DOMUtils.getElementById<HTMLElement>('productImagePreview');
    const imageInput = DOMUtils.getElementById<HTMLInputElement>('productImage');
    
    if (previewImg) previewImg.src = imageUrl;
    if (previewContainer) previewContainer.style.display = 'block';
    if (imageInput) imageInput.value = imageUrl;
  }

  /**
   * Edit profile image
   */
  private editProfileImage(): void {
    const profileImage = this.elements.profileImage;
    const cropperImage = this.elements.cropperImage;
    const cropperModal = this.elements.cropperModal;
    
    if (!profileImage || !cropperImage || !cropperModal) {
      this.showMessage('Profile image editing is not available', 'error');
      return;
    }

    // Check if profile image is a default SVG placeholder
    if (profileImage.src.startsWith('data:image/svg+xml')) {
      this.showMessage('Please upload a profile image first', 'warning');
      return;
    }

    this.currentImageTarget = 'profile';
    this.showCropperModal(profileImage.src);
  }

  /**
   * Edit portfolio item
   */
  private async editPortfolioItem(id: number): Promise<void> {
    const item = this.portfolioData.find(p => p.id === id);
    if (!item) return;

    this.currentEditingId = id;
    
    // Fill form with item data
    this.setFormValue('title', item.title);
    this.setFormValue('category', item.category);
    this.setFormValue('description', item.description || '');
    this.setFormValue('status', item.status || 'active');

    // Load main image
    if (item.image) {
      const imageInput = DOMUtils.getElementById<HTMLInputElement>('portfolioImage');
      if (imageInput) imageInput.value = item.image;
      this.updatePortfolioImagePreview(item.image);
    }

    // Load additional images
    for (let i = 1; i <= 3; i++) {
      const urlInput = DOMUtils.getElementById<HTMLInputElement>(`additionalImageUrl${i}`);
      const preview = DOMUtils.getElementById<HTMLElement>(`additionalPreview${i}`);
      
      if (item.additionalImages && item.additionalImages[i - 1]) {
        const imageUrl = item.additionalImages[i - 1];
        if (urlInput && imageUrl) urlInput.value = imageUrl;
        if (imageUrl) this.showAdditionalImagePreview(imageUrl, i);
      } else {
        if (urlInput) urlInput.value = '';
        if (preview) preview.style.display = 'none';
      }
    }

    // Show portfolio modal
    const modal = DOMUtils.getElementById<HTMLElement>('portfolioModal');
    if (modal) {
      modal.style.display = 'flex';
      // Update modal title
      const title = modal.querySelector('#portfolioModalTitle');
      if (title) title.textContent = 'Edit Karya Portfolio';
    }

    // Switch to portfolio tab
    this.switchToTab('portfolio');
  }

  /**
   * Edit product item
   */
  private async editProductItem(id: number): Promise<void> {
    const item = this.productsData.find(p => p.id === id);
    if (!item) return;

    this.currentEditingId = id;
    
    // Fill form with item data
    this.setFormValue('name', item.name);
    this.setFormValue('description', item.description);
    this.setFormValue('price', item.price.toString());
    this.setFormValue('originalPrice', item.originalPrice?.toString() || '');
    this.setFormValue('discount', item.discount?.toString() || '');
    this.setFormValue('category', item.category || '');
    this.setFormValue('type', item.type || 'digital');
    this.setFormValue('downloadLink', item.downloadLink || '');
    this.setFormValue('status', item.status);

    // Switch to products tab
    this.switchToTab('products');
    
    // Show product modal
    const modal = DOMUtils.querySelector<HTMLElement>('#productModal');
    if (modal) {
      modal.style.display = 'flex';
      // Update modal title
      const title = modal.querySelector('#productModalTitle');
      if (title) title.textContent = 'Edit Produk Digital';
    }
  }

  /**
   * Delete portfolio item
   */
  private async deletePortfolioItem(id: number): Promise<void> {
    const index = this.portfolioData.findIndex(item => item.id === id);
    if (index === -1) return;

    this.portfolioData.splice(index, 1);
    await this.savePortfolioData();
    await this.renderPortfolioItems();
    await this.updateStatistics();
  }

  /**
   * Delete product item
   */
  private async deleteProductItem(id: number): Promise<void> {
    const index = this.productsData.findIndex(item => item.id === id);
    if (index === -1) return;

    this.productsData.splice(index, 1);
    await this.saveProductsData();
    await this.renderProductItems();
    await this.updateStatistics();
  }

  /**
   * Switch to specific tab
   */
  private switchToTab(tabName: TabName): void {
    const tabButton = DOMUtils.querySelector<HTMLElement>(`[data-tab="${tabName}"]`);
    if (tabButton) {
      tabButton.click();
    }
  }

  /**
   * Load tab-specific data
   */
  private async loadTabData(tabName: TabName): Promise<void> {
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
      case 'settings':
        await this.loadSettings();
        break;
    }
  }

  /**
   * Validate form field
   */
  private validateField(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    const type = input.type;
    const required = input.hasAttribute('required');
    
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (required && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Type-specific validation
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

    // Update field appearance
    DOMUtils.toggleClass(input, 'invalid', !isValid);
    DOMUtils.toggleClass(input, 'valid', isValid && !!value);

    // Show/hide error message
    this.showFieldError(input, isValid ? '' : errorMessage);

    return isValid;
  }

  /**
   * Show field error message
   */
  private showFieldError(input: HTMLInputElement, message: string): void {
    let errorElement = input.parentElement?.querySelector('.field-error') as HTMLElement;
    
    if (!errorElement) {
      errorElement = DOMUtils.createElement<HTMLDivElement>('div', 'field-error');
      input.parentElement?.appendChild(errorElement);
    }

    errorElement.textContent = message;
    DOMUtils.toggleClass(errorElement, 'visible', !!message);
  }

  /**
   * Preview image before upload
   */
  private previewImage(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewContainer = input.parentElement?.querySelector('.image-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `<img src="${e.target?.result}" alt="Preview">`;
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Auto-save functionality
   */
  private async autoSave(): Promise<void> {
    try {
      await this.saveAllData();
      console.log('📁 Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Save all data
   */
  private async saveAllData(): Promise<void> {
    await Promise.all([
      this.savePortfolioData(),
      this.saveProductsData(),
      this.saveSiteSettings()
    ]);
  }

  /**
   * Save portfolio data
   */
  private async savePortfolioData(): Promise<void> {
    SafeStorage.set(StorageKeys.PORTFOLIO_DATA, this.portfolioData);
  }

  /**
   * Save products data
   */
  private async saveProductsData(): Promise<void> {
    SafeStorage.set(StorageKeys.PRODUCTS_DATA, this.productsData);
  }

  /**
   * Save site settings
   */
  private async saveSiteSettings(): Promise<void> {
    SafeStorage.set(StorageKeys.SITE_SETTINGS, this.siteSettings);
  }

  /**
   * Set form field value
   */
  private setFormValue(name: string, value: string): void {
    const input = DOMUtils.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`);
    if (input) {
      input.value = value;
    }
  }

  /**
   * Update statistic element
   */
  private updateStatElement(id: string, value: number): void {
    const element = DOMUtils.getElementById<HTMLElement>(id);
    if (element) {
      AnimationUtils.animateNumber(element, value, 1000);
    }
  }

  /**
   * Show message to user
   */
  private showMessage(message: string, type: MessageType = 'info'): void {
    const messageContainer = DOMUtils.getElementById<HTMLElement>('messageContainer') || this.createMessageContainer();
    
    const messageElement = DOMUtils.createElement<HTMLDivElement>('div', `message message-${type}`);
    messageElement.innerHTML = `
      <span class="message-text">${message}</span>
      <button class="message-close">&times;</button>
    `;

    // Add close handler
    const closeBtn = messageElement.querySelector('.message-close');
    closeBtn?.addEventListener('click', () => {
      AnimationUtils.fadeOut(messageElement, 300).then(() => {
        messageElement.remove();
      });
    });

    messageContainer.appendChild(messageElement);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentElement) {
        AnimationUtils.fadeOut(messageElement, 300).then(() => {
          messageElement.remove();
        });
      }
    }, 5000);

    // Animate in
    AnimationUtils.fadeIn(messageElement, 300);
  }

  /**
   * Create message container
   */
  private createMessageContainer(): HTMLElement {
    const container = DOMUtils.createElement<HTMLDivElement>('div', 'message-container');
    container.id = 'messageContainer';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Show confirm dialog
   */
  private async showConfirmDialog(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = this.createConfirmDialog(title, message, resolve);
      document.body.appendChild(dialog);
      
      // Animate in
      requestAnimationFrame(() => {
        DOMUtils.addClass(dialog, 'active');
      });
    });
  }

  /**
   * Create confirm dialog
   */
  private createConfirmDialog(title: string, message: string, callback: (result: boolean) => void): HTMLElement {
    const dialog = DOMUtils.createElement<HTMLDivElement>('div', 'confirm-dialog');
    
    // Check if this is an image upload dialog
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

    const closeDialog = (result: boolean) => {
      DOMUtils.removeClass(dialog, 'active');
      setTimeout(() => {
        dialog.remove();
        callback(result);
      }, 300);
    };

    // Add event listeners
    const cancelBtn = dialog.querySelector('.dialog-cancel');
    const confirmBtn = dialog.querySelector('.dialog-confirm');
    const overlay = dialog.querySelector('.dialog-overlay');

    cancelBtn?.addEventListener('click', () => closeDialog(false));
    confirmBtn?.addEventListener('click', () => closeDialog(true));
    overlay?.addEventListener('click', () => closeDialog(false));

    return dialog;
  }

  /**
   * Generate unique ID
   */
  private generateId(): number {
    const allIds = [
      ...this.portfolioData.map(item => item.id),
      ...this.productsData.map(item => item.id)
    ];
    
    return Math.max(0, ...allIds) + 1;
  }

  /**
   * Get category display name
   */
  private getCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      'ilustrasi': 'Ilustrasi',
      'character': 'Character Design',
      'branding': 'Branding',
      'editorial': 'Editorial'
    };
    
    return categoryNames[category] || category;
  }

  /**
   * Get display name for product category
   */
  private getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'brush': 'Custom Brush',
      'font': 'Font',
      'action': 'Action Photoshop',
      'texture': 'Texture Pack',
      'template': 'Template',
      'other': 'Lainnya'
    };
    
    return categoryMap[category] || category;
  }

  /**
   * Show product modal
   */
  private showProductModal(): void {
    const modal = DOMUtils.getElementById<HTMLElement>('productModal');
    if (modal) {
      modal.style.display = 'flex';
      // Reset form
      const form = modal.querySelector('form');
      if (form) form.reset();
      // Update modal title
      const title = modal.querySelector('#productModalTitle');
      if (title) title.textContent = 'Tambah Produk Digital';
      this.currentEditingId = null;
    }
  }

  /**
   * Close product modal
   */
  private closeProductModal(): void {
    const modal = DOMUtils.getElementById<HTMLElement>('productModal');
    if (modal) {
      modal.style.display = 'none';
      this.currentEditingId = null;
    }
  }

  /**
   * Show portfolio modal
   */
  private showPortfolioModal(): void {
    const modal = DOMUtils.getElementById<HTMLElement>('portfolioModal');
    if (modal) {
      modal.style.display = 'flex';
      // Reset form
      const form = modal.querySelector('form');
      if (form) form.reset();
      // Update modal title
      const title = modal.querySelector('#portfolioModalTitle');
      if (title) title.textContent = 'Tambah Karya Portfolio';
      this.currentEditingId = null;
    }
  }

  /**
   * Close portfolio modal
   */
  private closePortfolioModal(): void {
    const modal = DOMUtils.getElementById<HTMLElement>('portfolioModal');
    if (modal) {
      modal.style.display = 'none';
      this.currentEditingId = null;
    }
  }

  // Default Data Methods

  /**
   * Get default portfolio data
   */
  private getDefaultPortfolio(): PortfolioItem[] {
    return [
      {
        id: 1,
        title: "Digital Art Sample",
        category: "ilustrasi" as CategoryName,
        image: ImageUtils.createPlaceholder(400, 300, "Digital Art"),
        description: "Sample digital artwork",
        status: "active"
      }
    ];
  }

  /**
   * Get default products data
   */
  private getDefaultProducts(): ProductItem[] {
    return [
      {
        id: 1,
        name: "Sample Product",
        price: 100000,
        description: "Sample digital product",
        image: ImageUtils.createPlaceholder(300, 200, "Product"),
        status: "active"
      }
    ];
  }

  /**
   * Get default site settings
   */
  private getDefaultSettings(): SiteSettings {
    return {
      siteName: 'Portfolio Admin',
      heroTitle: 'Ilustrator & Desainer',
      heroSubtitle: 'Menciptakan karya visual yang menginspirasi',
      whatsappNumber: '6281234567890',
      aboutText: 'Professional illustrator and graphic designer with 5+ years of experience.'
    };
  }

  /**
   * Get default thumbnail sizes
   */
  private getDefaultThumbnailSizes(): ThumbnailSize[] {
    return [
      { name: 'small', width: 150, height: 100 },
      { name: 'medium', width: 300, height: 200 },
      { name: 'large', width: 600, height: 400 }
    ];
  }
}

// Initialize the admin application when DOM is ready
const adminApp = new AdminApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => adminApp.init());
} else {
  adminApp.init();
}

// Export for potential external use
export default adminApp;
export { AdminApp };
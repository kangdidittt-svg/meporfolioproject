// Main Portfolio Website Script - TypeScript Version
import { 
  PortfolioItem, 
  ProductItem, 
  SiteSettings, 
  DOMElements,
  StorageKeys,
  ScrollConfig,
  ObserverConfig,
  Nullable
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
  FormatUtils
} from './utils.js';

/**
 * Main Portfolio Application Class
 */
class PortfolioApp {
  private domElements: DOMElements;
  private portfolioData: PortfolioItem[] = [];
  private productsData: ProductItem[] = [];
  private siteSettings: SiteSettings;
  private observer: IntersectionObserver | null = null;
  private isInitialized = false;

  constructor() {
    this.domElements = this.initializeDOMElements();
    this.siteSettings = this.getDefaultSettings();
    this.bindMethods();
  }

  /**
   * Initialize DOM elements with type safety
   */
  private initializeDOMElements(): DOMElements {
    return {
      hamburger: DOMUtils.querySelector<HTMLElement>('.hamburger'),
      navMenu: DOMUtils.querySelector<HTMLElement>('.nav-menu'),
      navLinks: DOMUtils.querySelectorAll<HTMLElement>('.nav-link'),
      sections: DOMUtils.querySelectorAll<HTMLElement>('.section'),
      productButtons: DOMUtils.querySelectorAll<HTMLElement>('.btn-primary'),
      portfolioItems: DOMUtils.querySelectorAll<HTMLElement>('.portfolio-item')
    };
  }

  /**
   * Bind methods to preserve 'this' context
   */
  private bindMethods(): void {
    this.handleNavigation = this.handleNavigation.bind(this);
    this.handleMobileMenuToggle = this.handleMobileMenuToggle.bind(this);
    this.handleProductButtonClick = this.handleProductButtonClick.bind(this);
    this.handlePortfolioItemClick = this.handlePortfolioItemClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the application
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    PerformanceUtils.mark('app-init-start');

    try {
      await this.loadData();
      this.setupEventListeners();
      this.setupIntersectionObserver();
      await this.renderContent();
      this.setupPerformanceOptimizations();
      
      this.isInitialized = true;
      PerformanceUtils.measure('App Initialization', 'app-init-start');
      
      console.log('✅ Portfolio website loaded successfully!');
      console.log('🚀 Features: TypeScript, Responsive navigation, Smooth animations, WhatsApp integration');
    } catch (error) {
      console.error('❌ Failed to initialize portfolio app:', error);
    }
  }

  /**
   * Load data from localStorage with fallbacks
   */
  private async loadData(): Promise<void> {
    PerformanceUtils.mark('data-load-start');

    // Load portfolio data
    this.portfolioData = SafeStorage.get(StorageKeys.PORTFOLIO_DATA, this.getDefaultPortfolio());
    
    // Load products data
    this.productsData = SafeStorage.get(StorageKeys.PRODUCTS_DATA, this.getDefaultProducts());
    
    // Load site settings
    this.siteSettings = SafeStorage.get(StorageKeys.SITE_SETTINGS, this.getDefaultSettings());

    // Initialize default data if not exists
    if (!SafeStorage.get(StorageKeys.PORTFOLIO_DATA, null)) {
      SafeStorage.set(StorageKeys.PORTFOLIO_DATA, this.portfolioData);
    }
    
    if (!SafeStorage.get(StorageKeys.PRODUCTS_DATA, null)) {
      SafeStorage.set(StorageKeys.PRODUCTS_DATA, this.productsData);
    }

    PerformanceUtils.measure('Data Loading', 'data-load-start');
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Mobile navigation
    if (this.domElements.hamburger) {
      this.domElements.hamburger.addEventListener('click', this.handleMobileMenuToggle);
    }

    // Navigation links
    if (this.domElements.navLinks) {
      DOMUtils.addEventListeners(
        this.domElements.navLinks,
        'click',
        this.handleNavigation
      );
    }

    // Portfolio items
    if (this.domElements.portfolioItems) {
      DOMUtils.addEventListeners(
        this.domElements.portfolioItems,
        'click',
        this.handlePortfolioItemClick
      );
    }

    // Product buttons
    if (this.domElements.productButtons) {
      DOMUtils.addEventListeners(
        this.domElements.productButtons,
        'click',
        this.handleProductButtonClick
      );
    }

    // Window events with throttling/debouncing
    window.addEventListener('scroll', throttle(this.handleScroll, 16)); // ~60fps
    window.addEventListener('resize', debounce(this.handleResize, 250));
    window.addEventListener('load', this.handleWindowLoad.bind(this));

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Setup intersection observer for animations
   */
  private setupIntersectionObserver(): void {
    const options: ObserverConfig = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          DOMUtils.addClass(entry.target as HTMLElement, 'animate-in');
        }
      });
    }, options);

    // Observe all sections
    this.domElements.sections?.forEach(section => {
      if (this.observer) {
        this.observer.observe(section);
      }
    });
  }

  /**
   * Render all dynamic content
   */
  private async renderContent(): Promise<void> {
    PerformanceUtils.mark('render-start');

    await Promise.all([
      this.renderPortfolioItems(),
      this.renderProductItems(),
      this.applySiteSettings()
    ]);

    PerformanceUtils.measure('Content Rendering', 'render-start');
  }

  /**
   * Render portfolio items with lazy loading
   */
  private async renderPortfolioItems(): Promise<void> {
    const container = DOMUtils.getElementById<HTMLElement>('portfolioGrid');
    if (!container || this.portfolioData.length === 0) return;

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (const item of this.portfolioData) {
      const portfolioCard = this.createPortfolioCard(item);
      fragment.appendChild(portfolioCard);
    }

    container.appendChild(fragment);
    this.setupLazyLoading();
  }

  /**
   * Create portfolio card element
   */
  private createPortfolioCard(item: PortfolioItem): HTMLElement {
    const card = DOMUtils.createElement<HTMLDivElement>('div', 'portfolio-item');
    
    // Set aspect ratio based on image
    card.style.setProperty('--portfolio-aspect-ratio', '3/4');
    
    card.innerHTML = `
      <div class="portfolio-image">
        <img src="${item.thumbnail || item.image}" 
             alt="${item.title}" 
             loading="lazy"
             data-full-src="${item.image}">
        <div class="portfolio-overlay">
          <button class="preview-btn" title="Pratinjau Gambar">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      <div class="portfolio-content">
        <h3>${item.title}</h3>
        <p class="portfolio-category">${this.getCategoryName(item.category)}</p>
      </div>
    `;

    // Add click handler for card
    card.addEventListener('click', (e) => {
      // Check if clicked element is the preview button
      if ((e.target as HTMLElement).closest('.preview-btn')) {
        e.stopPropagation();
        this.showImagePreview(item.image, item.title);
      } else {
        this.showPortfolioModal(item);
      }
    });

    return card;
  }

  /**
   * Render product items
   */
  private async renderProductItems(): Promise<void> {
    const container = DOMUtils.getElementById<HTMLElement>('productsGrid');
    if (!container || this.productsData.length === 0) return;

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();
    const activeProducts = this.productsData.filter(product => product.status === 'active');

    for (const product of activeProducts) {
      const productCard = this.createProductCard(product);
      fragment.appendChild(productCard);
    }

    container.appendChild(fragment);
  }

  /**
   * Create product card element
   */
  private createProductCard(product: ProductItem): HTMLElement {
    const card = DOMUtils.createElement<HTMLDivElement>('div', 'product-card');
    
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" 
             alt="${product.name}" 
             loading="lazy">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-price">${FormatUtils.formatPrice(product.price)}</div>
        <button class="btn btn-primary" data-product-id="${product.id}">
          <i class="fab fa-whatsapp"></i> Pesan Sekarang
        </button>
      </div>
    `;

    // Set dynamic aspect ratio
    const img = card.querySelector('img') as HTMLImageElement;
    if (img) {
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        card.style.setProperty('--product-aspect-ratio', aspectRatio.toString());
      };
    }

    return card;
  }

  /**
   * Apply site settings to DOM
   */
  private async applySiteSettings(): Promise<void> {
    const { siteName, heroTitle, heroSubtitle, aboutText, profileImage } = this.siteSettings;

    // Update site title
    document.title = siteName;
    
    // Update hero section
    const heroTitleEl = DOMUtils.getElementById<HTMLElement>('heroTitle');
    const heroSubtitleEl = DOMUtils.getElementById<HTMLElement>('heroSubtitle');
    
    if (heroTitleEl) heroTitleEl.textContent = heroTitle;
    if (heroSubtitleEl) heroSubtitleEl.textContent = heroSubtitle;

    // Update about section
    const aboutTextEl = DOMUtils.getElementById<HTMLElement>('aboutText');
    if (aboutTextEl) aboutTextEl.textContent = aboutText;

    // Update profile image
    if (profileImage) {
      const profileImageEl = DOMUtils.getElementById<HTMLImageElement>('profileImage');
      if (profileImageEl) profileImageEl.src = profileImage;
    }

    // Update WhatsApp links
    this.updateWhatsAppLinks();
  }

  /**
   * Update WhatsApp links with phone number
   */
  private updateWhatsAppLinks(): void {
    const phoneNumber = this.siteSettings.whatsappNumber;
    const whatsappLinks = DOMUtils.querySelectorAll<HTMLAnchorElement>('a[href*="whatsapp"]');
    
    whatsappLinks.forEach(link => {
      const productId = link.dataset.productId;
      let message = 'Halo, saya tertarik dengan portfolio Anda.';
      
      if (productId) {
        const product = this.productsData.find(p => p.id.toString() === productId);
        if (product) {
          message = `Halo, saya tertarik dengan produk "${product.name}" seharga ${FormatUtils.formatPrice(product.price)}.`;
        }
      }
      
      link.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    });
  }

  /**
   * Setup lazy loading for images
   */
  private setupLazyLoading(): void {
    const images = DOMUtils.querySelectorAll<HTMLImageElement>('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const fullSrc = img.dataset.fullSrc;
          
          if (fullSrc && fullSrc !== img.src) {
            img.src = fullSrc;
            img.removeAttribute('data-full-src');
          }
          
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Setup performance optimizations
   */
  private setupPerformanceOptimizations(): void {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Setup service worker if available
    this.setupServiceWorker();
    
    // Optimize images
    this.optimizeImages();
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    const criticalImages = this.portfolioData.slice(0, 6).map(item => item.image);
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * Setup service worker for caching
   */
  private async setupServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service Worker registered successfully');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Optimize images for better performance
   */
  private optimizeImages(): void {
    const images = DOMUtils.querySelectorAll<HTMLImageElement>('img');
    
    images.forEach(img => {
      // Add loading attribute if not present
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }
      
      // Add decode attribute for better performance
      img.decoding = 'async';
      
      // Handle image load errors
      img.onerror = () => {
        img.src = ImageUtils.createPlaceholder(300, 200, 'Image not found');
      };
    });
  }

  // Event Handlers

  /**
   * Handle mobile menu toggle
   */
  private handleMobileMenuToggle(): void {
    if (!this.domElements.hamburger || !this.domElements.navMenu) return;
    
    DOMUtils.toggleClass(this.domElements.hamburger, 'active');
    DOMUtils.toggleClass(this.domElements.navMenu, 'active');
  }

  /**
   * Handle navigation between sections
   */
  private handleNavigation(event: Event, element: HTMLElement): void {
    event.preventDefault();
    
    const targetId = element.getAttribute('href')?.substring(1);
    if (!targetId) return;

    // Update active nav link
    this.domElements.navLinks?.forEach(link => DOMUtils.removeClass(link, 'active'));
    DOMUtils.addClass(element, 'active');

    // Show target section
    this.domElements.sections?.forEach(section => DOMUtils.removeClass(section, 'active'));
    
    const targetSection = DOMUtils.getElementById<HTMLElement>(targetId);
    if (targetSection) {
      DOMUtils.addClass(targetSection, 'active');
    }

    // Close mobile menu
    if (this.domElements.hamburger && this.domElements.navMenu) {
      DOMUtils.removeClass(this.domElements.hamburger, 'active');
      DOMUtils.removeClass(this.domElements.navMenu, 'active');
    }

    // Smooth scroll to top
    AnimationUtils.smoothScrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handle portfolio item click
   */
  private handlePortfolioItemClick(event: Event, element: HTMLElement): void {
    const img = element.querySelector('img');
    if (!img) return;

    const itemTitle = element.querySelector('h3')?.textContent || '';
    const item = this.portfolioData.find(p => p.title === itemTitle);
    
    if (item) {
      this.showPortfolioModal(item);
    }
  }

  /**
   * Handle product button click
   */
  private handleProductButtonClick(event: Event, element: HTMLElement): void {
    const productId = element.dataset.productId;
    if (!productId) return;

    const product = this.productsData.find(p => p.id.toString() === productId);
    if (!product) return;

    const message = `Halo, saya tertarik dengan produk "${product.name}" seharga ${FormatUtils.formatPrice(product.price)}.`;
    const whatsappUrl = `https://wa.me/${this.siteSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    const scrollY = window.scrollY;
    const header = DOMUtils.querySelector<HTMLElement>('header');
    
    if (header) {
      DOMUtils.toggleClass(header, 'scrolled', scrollY > 100);
    }
  }

  /**
   * Handle resize events
   */
  private handleResize(): void {
    this.adjustPortfolioGrid();
  }

  /**
   * Handle window load event
   */
  private handleWindowLoad(): void {
    this.adjustPortfolioGrid();
    this.setupImageLoadHandlers();
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAllModals();
    }
  }

  // Utility Methods

  /**
   * Show portfolio modal
   */
  private showPortfolioModal(item: PortfolioItem): void {
    const modal = this.createPortfolioModal(item);
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      DOMUtils.addClass(modal, 'active');
    });

    // Setup close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const closeModal = () => {
      DOMUtils.removeClass(modal, 'active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
  }

  /**
   * Create portfolio modal
   */
  private createPortfolioModal(item: PortfolioItem): HTMLElement {
    const modal = DOMUtils.createElement<HTMLDivElement>('div', 'portfolio-modal');
    
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-image">
          <img src="${item.image}" alt="${item.title}" id="modalMainImage">
        </div>
        <div class="modal-info">
          <h2>${item.title}</h2>
          <p class="modal-category">${this.getCategoryName(item.category)}</p>
          ${item.description ? `<p class="modal-description">${item.description}</p>` : ''}
          ${item.additionalImages && item.additionalImages.length > 0 ? this.renderAdditionalImages(item.additionalImages) : ''}
          <div class="contact-cta">
            <a href="#about" class="contact-btn">
              <i class="fas fa-envelope"></i>
              Jika tertarik hubungi saya
            </a>
          </div>
        </div>
      </div>
    `;

    // Setup additional image click handlers
    const additionalImages = modal.querySelectorAll('.additional-images img');
    const mainImage = modal.querySelector('#modalMainImage') as HTMLImageElement;
    
    additionalImages.forEach((img) => {
      img.addEventListener('click', () => {
        if (mainImage && img instanceof HTMLImageElement) {
          mainImage.src = img.src;
        }
      });
    });

    // Setup contact button click handler
    const contactBtn = modal.querySelector('.contact-btn');
    contactBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      // Close modal first
      DOMUtils.removeClass(modal, 'active');
      setTimeout(() => modal.remove(), 300);
      
      // Navigate to about section
      const aboutSection = DOMUtils.getElementById('about');
      if (aboutSection) {
        // Update navigation
        this.domElements.navLinks?.forEach(link => DOMUtils.removeClass(link, 'active'));
        const aboutLink = DOMUtils.querySelector('a[href="#about"]');
        if (aboutLink) DOMUtils.addClass(aboutLink, 'active');
        
        // Update sections
        this.domElements.sections?.forEach(section => DOMUtils.removeClass(section, 'active'));
        DOMUtils.addClass(aboutSection, 'active');
        
        // Close mobile menu if open
        if (this.domElements.hamburger && this.domElements.navMenu) {
          DOMUtils.removeClass(this.domElements.hamburger, 'active');
          DOMUtils.removeClass(this.domElements.navMenu, 'active');
        }
        
        // Smooth scroll to top
        AnimationUtils.smoothScrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    return modal;
  }

  /**
   * Render additional images
   */
  private renderAdditionalImages(images: string[]): string {
    if (images.length === 0) return '';
    
    const imageElements = images.map(src => 
      `<img src="${src}" alt="Additional image" loading="lazy">`
    ).join('');
    
    return `<div class="additional-images">${imageElements}</div>`;
  }

  /**
   * Show image preview modal
   */
  private showImagePreview(imageSrc: string, title: string): void {
    const modal = DOMUtils.createElement<HTMLDivElement>('div', 'image-preview-modal');
    
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="image-preview-content">
        <button class="modal-close">&times;</button>
        <img src="${imageSrc}" alt="${title}" loading="lazy">
        <div class="image-preview-title">${title}</div>
      </div>
    `;

    // Add close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const closeModal = () => {
      modal.remove();
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
    
    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.appendChild(modal);
    
    // Trigger animation
    requestAnimationFrame(() => {
      DOMUtils.addClass(modal, 'active');
    });
  }

  /**
   * Close all modals
   */
  private closeAllModals(): void {
    const modals = DOMUtils.querySelectorAll<HTMLElement>('.portfolio-modal');
    modals.forEach(modal => {
      DOMUtils.removeClass(modal, 'active');
      setTimeout(() => modal.remove(), 300);
    });
  }

  /**
   * Adjust portfolio grid layout
   */
  private adjustPortfolioGrid(): void {
    const container = DOMUtils.getElementById<HTMLElement>('portfolioGrid');
    if (!container) return;

    const items = container.querySelectorAll('.portfolio-item');
    const containerWidth = container.offsetWidth;
    const itemMinWidth = 300;
    const gap = 20;
    
    const columns = Math.floor((containerWidth + gap) / (itemMinWidth + gap));
    const actualColumns = Math.max(1, Math.min(columns, 4));
    
    container.style.gridTemplateColumns = `repeat(${actualColumns}, 1fr)`;
  }

  /**
   * Setup image load handlers
   */
  private setupImageLoadHandlers(): void {
    const images = DOMUtils.querySelectorAll<HTMLImageElement>('img');
    
    images.forEach(img => {
      if (img.complete) {
        DOMUtils.addClass(img, 'loaded');
      } else {
        img.addEventListener('load', () => {
          DOMUtils.addClass(img, 'loaded');
        });
      }
    });
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

  // Default Data

  /**
   * Get default portfolio data
   */
  private getDefaultPortfolio(): PortfolioItem[] {
    return [
      {
        id: 1,
        title: "Digital Art",
        category: "ilustrasi",
        description: "Karya ilustrasi digital dengan teknik painting dan detail yang kompleks. Menggabungkan elemen fantasi dengan realisme.",
        image: ImageUtils.createPlaceholder(400, 300, "Digital Art"),
        additionalImages: [
          ImageUtils.createPlaceholder(400, 300, "Mockup"),
          ImageUtils.createPlaceholder(400, 300, "Process"),
          ImageUtils.createPlaceholder(400, 300, "Sketch")
        ]
      },
      {
        id: 2,
        title: "Character Design",
        category: "character",
        description: "Desain karakter untuk game dan animasi dengan eksplorasi berbagai pose dan ekspresi.",
        image: ImageUtils.createPlaceholder(400, 300, "Character"),
        additionalImages: [
          ImageUtils.createPlaceholder(400, 300, "Concept"),
          ImageUtils.createPlaceholder(400, 300, "Turnaround"),
          ImageUtils.createPlaceholder(400, 300, "Expression")
        ]
      },
      {
        id: 3,
        title: "Branding Project",
        category: "branding",
        description: "Identitas visual lengkap untuk startup teknologi, termasuk logo, color palette, dan aplikasi brand.",
        image: ImageUtils.createPlaceholder(400, 300, "Branding"),
        additionalImages: [
          ImageUtils.createPlaceholder(400, 300, "Logo Variations"),
          ImageUtils.createPlaceholder(400, 300, "Brand Guidelines"),
          ImageUtils.createPlaceholder(400, 300, "Applications")
        ]
      },
      {
        id: 4,
        title: "Editorial Illustration",
        category: "editorial",
        description: "Ilustrasi untuk artikel majalah tentang teknologi dan masa depan dengan gaya minimalis modern.",
        image: ImageUtils.createPlaceholder(400, 300, "Editorial"),
        additionalImages: [
          ImageUtils.createPlaceholder(400, 300, "Layout"),
          ImageUtils.createPlaceholder(400, 300, "Sketches")
        ]
      },
      {
        id: 5,
        title: "Logo Design",
        category: "branding",
        description: "Koleksi desain logo untuk berbagai klien dengan pendekatan yang unik dan memorable.",
        image: ImageUtils.createPlaceholder(400, 300, "Logo"),
        additionalImages: [
          ImageUtils.createPlaceholder(400, 300, "Process"),
          ImageUtils.createPlaceholder(400, 300, "Variations")
        ]
      },
      {
        id: 6,
        title: "Book Cover",
        category: "editorial",
        description: "Desain cover buku novel dengan ilustrasi yang menangkap esensi cerita dan menarik perhatian pembaca.",
        image: ImageUtils.createPlaceholder(400, 300, "Book Cover"),
        additionalImages: [
          ImageUtils.createPlaceholder(400, 300, "Mockup"),
          ImageUtils.createPlaceholder(400, 300, "Concept")
        ]
      },
      {
        id: 7,
        title: "Poster Design",
        category: "ilustrasi",
        description: "Poster promosi untuk event musik dengan komposisi dinamis dan tipografi yang kuat.",
        image: ImageUtils.createPlaceholder(400, 300, "Poster")
      },
      {
        id: 8,
        title: "Icon Set",
        category: "branding",
        description: "Set icon untuk aplikasi mobile dengan konsistensi visual dan kemudahan penggunaan.",
        image: ImageUtils.createPlaceholder(400, 300, "Icons")
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
        name: "Brush Pack Premium",
        price: 150000,
        description: "Koleksi 50+ brush digital untuk ilustrasi",
        image: ImageUtils.createPlaceholder(300, 200, "Brush Pack"),
        status: "active"
      },
      {
        id: 2,
        name: "Font Collection",
        price: 200000,
        description: "10 font unik untuk branding dan desain",
        image: ImageUtils.createPlaceholder(300, 200, "Font Pack"),
        status: "active"
      },
      {
        id: 3,
        name: "Photoshop Actions",
        price: 100000,
        description: "25 action untuk efek foto profesional",
        image: ImageUtils.createPlaceholder(300, 200, "PS Actions"),
        status: "active"
      },
      {
        id: 4,
        name: "Texture Pack",
        price: 120000,
        description: "Koleksi tekstur high-res untuk desain",
        image: ImageUtils.createPlaceholder(300, 200, "Textures"),
        status: "active"
      }
    ];
  }

  /**
   * Get default site settings
   */
  private getDefaultSettings(): SiteSettings {
    return {
      siteName: 'Portfolio Ilustrator',
      heroTitle: 'Ilustrator & Desainer',
      heroSubtitle: 'Menciptakan karya visual yang menginspirasi dan bermakna',
      whatsappNumber: '6281234567890',
      aboutText: 'Saya adalah seorang ilustrator dan desainer grafis dengan pengalaman lebih dari 5 tahun dalam industri kreatif.'
    };
  }
}

// Initialize the application when DOM is ready
const app = new PortfolioApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for potential external use
export default app;
export { PortfolioApp };
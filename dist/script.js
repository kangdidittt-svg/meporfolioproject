import { StorageKeys } from './types.js';
import { debounce, throttle, SafeStorage, DOMUtils, AnimationUtils, ImageUtils, PerformanceUtils, FormatUtils } from './utils.js';
class PortfolioApp {
    constructor() {
        this.portfolioData = [];
        this.productsData = [];
        this.observer = null;
        this.isInitialized = false;
        this.domElements = this.initializeDOMElements();
        this.siteSettings = this.getDefaultSettings();
        this.bindMethods();
    }
    initializeDOMElements() {
        return {
            hamburger: DOMUtils.querySelector('.hamburger'),
            navMenu: DOMUtils.querySelector('.nav-menu'),
            navLinks: DOMUtils.querySelectorAll('.nav-link'),
            sections: DOMUtils.querySelectorAll('.section'),
            productButtons: DOMUtils.querySelectorAll('.btn-primary'),
            portfolioItems: DOMUtils.querySelectorAll('.portfolio-item')
        };
    }
    bindMethods() {
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleMobileMenuToggle = this.handleMobileMenuToggle.bind(this);
        this.handleProductButtonClick = this.handleProductButtonClick.bind(this);
        this.handlePortfolioItemClick = this.handlePortfolioItemClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    async init() {
        if (this.isInitialized)
            return;
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
        }
        catch (error) {
            console.error('❌ Failed to initialize portfolio app:', error);
        }
    }
    async loadData() {
        PerformanceUtils.mark('data-load-start');
        this.portfolioData = SafeStorage.get(StorageKeys.PORTFOLIO_DATA, this.getDefaultPortfolio());
        this.productsData = SafeStorage.get(StorageKeys.PRODUCTS_DATA, this.getDefaultProducts());
        this.siteSettings = SafeStorage.get(StorageKeys.SITE_SETTINGS, this.getDefaultSettings());
        if (!SafeStorage.get(StorageKeys.PORTFOLIO_DATA, null)) {
            SafeStorage.set(StorageKeys.PORTFOLIO_DATA, this.portfolioData);
        }
        if (!SafeStorage.get(StorageKeys.PRODUCTS_DATA, null)) {
            SafeStorage.set(StorageKeys.PRODUCTS_DATA, this.productsData);
        }
        PerformanceUtils.measure('Data Loading', 'data-load-start');
    }
    setupEventListeners() {
        if (this.domElements.hamburger) {
            this.domElements.hamburger.addEventListener('click', this.handleMobileMenuToggle);
        }
        if (this.domElements.navLinks) {
            DOMUtils.addEventListeners(this.domElements.navLinks, 'click', this.handleNavigation);
        }
        if (this.domElements.portfolioItems) {
            DOMUtils.addEventListeners(this.domElements.portfolioItems, 'click', this.handlePortfolioItemClick);
        }
        if (this.domElements.productButtons) {
            DOMUtils.addEventListeners(this.domElements.productButtons, 'click', this.handleProductButtonClick);
        }
        window.addEventListener('scroll', throttle(this.handleScroll, 16));
        window.addEventListener('resize', debounce(this.handleResize, 250));
        window.addEventListener('load', this.handleWindowLoad.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    DOMUtils.addClass(entry.target, 'animate-in');
                }
            });
        }, options);
        this.domElements.sections?.forEach(section => {
            if (this.observer) {
                this.observer.observe(section);
            }
        });
    }
    async renderContent() {
        PerformanceUtils.mark('render-start');
        await Promise.all([
            this.renderPortfolioItems(),
            this.renderProductItems(),
            this.applySiteSettings()
        ]);
        PerformanceUtils.measure('Content Rendering', 'render-start');
    }
    async renderPortfolioItems() {
        const container = DOMUtils.getElementById('portfolioGrid');
        if (!container || this.portfolioData.length === 0)
            return;
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (const item of this.portfolioData) {
            const portfolioCard = this.createPortfolioCard(item);
            fragment.appendChild(portfolioCard);
        }
        container.appendChild(fragment);
        this.setupLazyLoading();
    }
    createPortfolioCard(item) {
        const card = DOMUtils.createElement('div', 'portfolio-item');
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
        card.addEventListener('click', (e) => {
            if (e.target.closest('.preview-btn')) {
                e.stopPropagation();
                this.showImagePreview(item.image, item.title);
            }
            else {
                this.showPortfolioModal(item);
            }
        });
        return card;
    }
    async renderProductItems() {
        const container = DOMUtils.getElementById('productsGrid');
        if (!container || this.productsData.length === 0)
            return;
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const activeProducts = this.productsData.filter(product => product.status === 'active');
        for (const product of activeProducts) {
            const productCard = this.createProductCard(product);
            fragment.appendChild(productCard);
        }
        container.appendChild(fragment);
    }
    createProductCard(product) {
        const card = DOMUtils.createElement('div', 'product-card');
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
        const img = card.querySelector('img');
        if (img) {
            img.onload = () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                card.style.setProperty('--product-aspect-ratio', aspectRatio.toString());
            };
        }
        return card;
    }
    async applySiteSettings() {
        const { siteName, heroTitle, heroSubtitle, aboutText, profileImage } = this.siteSettings;
        document.title = siteName;
        const heroTitleEl = DOMUtils.getElementById('heroTitle');
        const heroSubtitleEl = DOMUtils.getElementById('heroSubtitle');
        if (heroTitleEl)
            heroTitleEl.textContent = heroTitle;
        if (heroSubtitleEl)
            heroSubtitleEl.textContent = heroSubtitle;
        const aboutTextEl = DOMUtils.getElementById('aboutText');
        if (aboutTextEl)
            aboutTextEl.textContent = aboutText;
        if (profileImage) {
            const profileImageEl = DOMUtils.getElementById('profileImage');
            if (profileImageEl)
                profileImageEl.src = profileImage;
        }
        this.updateWhatsAppLinks();
    }
    updateWhatsAppLinks() {
        const phoneNumber = this.siteSettings.whatsappNumber;
        const whatsappLinks = DOMUtils.querySelectorAll('a[href*="whatsapp"]');
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
    setupLazyLoading() {
        const images = DOMUtils.querySelectorAll('img[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
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
    setupPerformanceOptimizations() {
        this.preloadCriticalResources();
        this.setupServiceWorker();
        this.optimizeImages();
    }
    preloadCriticalResources() {
        const criticalImages = this.portfolioData.slice(0, 6).map(item => item.image);
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('🔧 Service Worker registered successfully');
            }
            catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
    optimizeImages() {
        const images = DOMUtils.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
            img.decoding = 'async';
            img.onerror = () => {
                img.src = ImageUtils.createPlaceholder(300, 200, 'Image not found');
            };
        });
    }
    handleMobileMenuToggle() {
        if (!this.domElements.hamburger || !this.domElements.navMenu)
            return;
        DOMUtils.toggleClass(this.domElements.hamburger, 'active');
        DOMUtils.toggleClass(this.domElements.navMenu, 'active');
    }
    handleNavigation(event, element) {
        event.preventDefault();
        const targetId = element.getAttribute('href')?.substring(1);
        if (!targetId)
            return;
        this.domElements.navLinks?.forEach(link => DOMUtils.removeClass(link, 'active'));
        DOMUtils.addClass(element, 'active');
        this.domElements.sections?.forEach(section => DOMUtils.removeClass(section, 'active'));
        const targetSection = DOMUtils.getElementById(targetId);
        if (targetSection) {
            DOMUtils.addClass(targetSection, 'active');
        }
        if (this.domElements.hamburger && this.domElements.navMenu) {
            DOMUtils.removeClass(this.domElements.hamburger, 'active');
            DOMUtils.removeClass(this.domElements.navMenu, 'active');
        }
        AnimationUtils.smoothScrollTo({ top: 0, behavior: 'smooth' });
    }
    handlePortfolioItemClick(event, element) {
        const img = element.querySelector('img');
        if (!img)
            return;
        const itemTitle = element.querySelector('h3')?.textContent || '';
        const item = this.portfolioData.find(p => p.title === itemTitle);
        if (item) {
            this.showPortfolioModal(item);
        }
    }
    handleProductButtonClick(event, element) {
        const productId = element.dataset.productId;
        if (!productId)
            return;
        const product = this.productsData.find(p => p.id.toString() === productId);
        if (!product)
            return;
        const message = `Halo, saya tertarik dengan produk "${product.name}" seharga ${FormatUtils.formatPrice(product.price)}.`;
        const whatsappUrl = `https://wa.me/${this.siteSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
    handleScroll() {
        const scrollY = window.scrollY;
        const header = DOMUtils.querySelector('header');
        if (header) {
            DOMUtils.toggleClass(header, 'scrolled', scrollY > 100);
        }
    }
    handleResize() {
        this.adjustPortfolioGrid();
    }
    handleWindowLoad() {
        this.adjustPortfolioGrid();
        this.setupImageLoadHandlers();
    }
    handleKeydown(event) {
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }
    showPortfolioModal(item) {
        const modal = this.createPortfolioModal(item);
        document.body.appendChild(modal);
        requestAnimationFrame(() => {
            DOMUtils.addClass(modal, 'active');
        });
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        const closeModal = () => {
            DOMUtils.removeClass(modal, 'active');
            setTimeout(() => modal.remove(), 300);
        };
        closeBtn?.addEventListener('click', closeModal);
        overlay?.addEventListener('click', closeModal);
    }
    createPortfolioModal(item) {
        const modal = DOMUtils.createElement('div', 'portfolio-modal');
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
        const additionalImages = modal.querySelectorAll('.additional-images img');
        const mainImage = modal.querySelector('#modalMainImage');
        additionalImages.forEach((img) => {
            img.addEventListener('click', () => {
                if (mainImage && img instanceof HTMLImageElement) {
                    mainImage.src = img.src;
                }
            });
        });
        const contactBtn = modal.querySelector('.contact-btn');
        contactBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            DOMUtils.removeClass(modal, 'active');
            setTimeout(() => modal.remove(), 300);
            const aboutSection = DOMUtils.getElementById('about');
            if (aboutSection) {
                this.domElements.navLinks?.forEach(link => DOMUtils.removeClass(link, 'active'));
                const aboutLink = DOMUtils.querySelector('a[href="#about"]');
                if (aboutLink)
                    DOMUtils.addClass(aboutLink, 'active');
                this.domElements.sections?.forEach(section => DOMUtils.removeClass(section, 'active'));
                DOMUtils.addClass(aboutSection, 'active');
                if (this.domElements.hamburger && this.domElements.navMenu) {
                    DOMUtils.removeClass(this.domElements.hamburger, 'active');
                    DOMUtils.removeClass(this.domElements.navMenu, 'active');
                }
                AnimationUtils.smoothScrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        return modal;
    }
    renderAdditionalImages(images) {
        if (images.length === 0)
            return '';
        const imageElements = images.map(src => `<img src="${src}" alt="Additional image" loading="lazy">`).join('');
        return `<div class="additional-images">${imageElements}</div>`;
    }
    showImagePreview(imageSrc, title) {
        const modal = DOMUtils.createElement('div', 'image-preview-modal');
        modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="image-preview-content">
        <button class="modal-close">&times;</button>
        <img src="${imageSrc}" alt="${title}" loading="lazy">
        <div class="image-preview-title">${title}</div>
      </div>
    `;
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        const closeModal = () => {
            modal.remove();
        };
        closeBtn?.addEventListener('click', closeModal);
        overlay?.addEventListener('click', closeModal);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.appendChild(modal);
        requestAnimationFrame(() => {
            DOMUtils.addClass(modal, 'active');
        });
    }
    closeAllModals() {
        const modals = DOMUtils.querySelectorAll('.portfolio-modal');
        modals.forEach(modal => {
            DOMUtils.removeClass(modal, 'active');
            setTimeout(() => modal.remove(), 300);
        });
    }
    adjustPortfolioGrid() {
        const container = DOMUtils.getElementById('portfolioGrid');
        if (!container)
            return;
        const items = container.querySelectorAll('.portfolio-item');
        const containerWidth = container.offsetWidth;
        const itemMinWidth = 300;
        const gap = 20;
        const columns = Math.floor((containerWidth + gap) / (itemMinWidth + gap));
        const actualColumns = Math.max(1, Math.min(columns, 4));
        container.style.gridTemplateColumns = `repeat(${actualColumns}, 1fr)`;
    }
    setupImageLoadHandlers() {
        const images = DOMUtils.querySelectorAll('img');
        images.forEach(img => {
            if (img.complete) {
                DOMUtils.addClass(img, 'loaded');
            }
            else {
                img.addEventListener('load', () => {
                    DOMUtils.addClass(img, 'loaded');
                });
            }
        });
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
    getDefaultPortfolio() {
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
    getDefaultProducts() {
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
    getDefaultSettings() {
        return {
            siteName: 'Portfolio Ilustrator',
            heroTitle: 'Ilustrator & Desainer',
            heroSubtitle: 'Menciptakan karya visual yang menginspirasi dan bermakna',
            whatsappNumber: '6281234567890',
            aboutText: 'Saya adalah seorang ilustrator dan desainer grafis dengan pengalaman lebih dari 5 tahun dalam industri kreatif.'
        };
    }
}
const app = new PortfolioApp();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
}
else {
    app.init();
}
export default app;
export { PortfolioApp };
//# sourceMappingURL=script.js.map
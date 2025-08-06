// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const productButtons = document.querySelectorAll('.btn-primary');

// Mobile Navigation Toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Navigation between sections
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav links
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Get target section
        const targetId = link.getAttribute('href').substring(1);
        
        // Hide all sections
        sections.forEach(section => section.classList.remove('active'));
        
        // Show target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Portfolio item click handler
const portfolioItems = document.querySelectorAll('.portfolio-item');
portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
        // Add click animation
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
            item.style.transform = '';
        }, 150);
        
        // Here you can add modal or lightbox functionality
        console.log('Portfolio item clicked:', item.querySelector('span').textContent);
    });
});

// Product purchase handlers
productButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const productCard = button.closest('.product-card');
        const productName = productCard.querySelector('h3').textContent;
        const productPrice = productCard.querySelector('.product-price').textContent;
        
        // WhatsApp message template
        const message = `Halo! Saya tertarik untuk membeli ${productName} dengan harga ${productPrice}. Bisa tolong berikan informasi lebih lanjut?`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/6281234567890?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Button animation
        button.style.transform = 'scale(0.95)';
        button.textContent = 'Mengarahkan...';
        
        setTimeout(() => {
            button.style.transform = '';
            button.textContent = 'Beli Sekarang';
        }, 1000);
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe portfolio items and product cards
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.portfolio-item, .product-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close mobile menu
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Smooth reveal animation for hero section
window.addEventListener('load', () => {
    const hero = document.querySelector('.hero');
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(30px)';
    hero.style.transition = 'opacity 1s ease, transform 1s ease';
    
    setTimeout(() => {
        hero.style.opacity = '1';
        hero.style.transform = 'translateY(0)';
    }, 300);
});

// Portfolio grid masonry effect (optional enhancement)
function adjustPortfolioGrid() {
    const grid = document.querySelector('.portfolio-grid');
    const items = grid.querySelectorAll('.portfolio-item');
    
    // Reset any previous modifications
    items.forEach(item => {
        item.style.gridRowEnd = 'auto';
    });
    
    // Only apply masonry on larger screens
    if (window.innerWidth > 768) {
        items.forEach(item => {
            const itemHeight = item.getBoundingClientRect().height;
            const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
            const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap'));
            const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap));
            
            if (!item.classList.contains('tall') && !item.classList.contains('wide')) {
                item.style.gridRowEnd = `span ${rowSpan}`;
            }
        });
    }
}

// Adjust grid on load and resize
window.addEventListener('load', adjustPortfolioGrid);
window.addEventListener('resize', adjustPortfolioGrid);

// Add loading state for images (when real images are added)
function handleImageLoading() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.style.opacity = '1';
        });
        
        img.addEventListener('error', () => {
            // Handle image loading errors
            img.style.display = 'none';
        });
    });
}

// Initialize image loading handler
document.addEventListener('DOMContentLoaded', handleImageLoading);

// Load dynamic content from admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicContent();
});

// Load dynamic content from localStorage
function loadDynamicContent() {
    loadPortfolioItems();
    loadProductItems();
    loadSiteSettings();
}

// Load portfolio items from admin data
function loadPortfolioItems() {
    const portfolioData = JSON.parse(localStorage.getItem('portfolioData'));
    if (!portfolioData || portfolioData.length === 0) return;
    
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    // Clear existing placeholder items
    portfolioGrid.innerHTML = '';
    
    portfolioData.forEach(item => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = `portfolio-item ${item.size}`;
        portfolioItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="placeholder-image" style="display:none;">
                <span>${item.title}</span>
            </div>
        `;
        
        // Add click handler
        portfolioItem.addEventListener('click', () => {
            showPortfolioModal(item);
        });
        
        portfolioGrid.appendChild(portfolioItem);
    });
}

// Load product items from admin data
function loadProductItems() {
    const productsData = JSON.parse(localStorage.getItem('productsData'));
    if (!productsData || productsData.length === 0) return;
    
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;
    
    // Clear existing placeholder items
    productsGrid.innerHTML = '';
    
    productsData.filter(product => product.status === 'active').forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; color:white; font-weight:500; font-size:1.1rem;">
                    <span>${product.name}</span>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">Rp ${product.price.toLocaleString('id-ID')}</div>
                <button class="btn-primary">Beli Sekarang</button>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
    
    // Re-attach event listeners for new product buttons
    attachProductButtonListeners();
}

// Load site settings from admin data
function loadSiteSettings() {
    const settings = JSON.parse(localStorage.getItem('siteSettings'));
    if (!settings) return;
    
    // Update hero section
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero p');
    
    if (heroTitle && settings.heroTitle) {
        heroTitle.textContent = settings.heroTitle;
    }
    
    if (heroSubtitle && settings.heroSubtitle) {
        heroSubtitle.textContent = settings.heroSubtitle;
    }
    
    // Update about section
    const aboutText = document.querySelector('.about-content p');
    if (aboutText && settings.aboutText) {
        aboutText.textContent = settings.aboutText;
    }
    
    // Update WhatsApp number in footer and product buttons
    if (settings.whatsappNumber) {
        updateWhatsAppLinks(settings.whatsappNumber);
    }
    
    // Update site title
    if (settings.siteName) {
        document.title = settings.siteName;
        const navLogo = document.querySelector('.nav-logo h2');
        if (navLogo) {
            navLogo.textContent = settings.siteName;
        }
    }
}

// Update WhatsApp links
function updateWhatsAppLinks(phoneNumber) {
    // Update footer link
    const footerLink = document.querySelector('.social-link');
    if (footerLink) {
        footerLink.href = `https://wa.me/${phoneNumber}`;
    }
    
    // Update product button handlers
    attachProductButtonListeners(phoneNumber);
}

// Attach event listeners to product buttons
function attachProductButtonListeners(phoneNumber = null) {
    const settings = JSON.parse(localStorage.getItem('siteSettings'));
    const whatsappNumber = phoneNumber || (settings && settings.whatsappNumber) || '6281234567890';
    
    document.querySelectorAll('.product-card .btn-primary').forEach(button => {
        // Remove existing listeners
        button.replaceWith(button.cloneNode(true));
    });
    
    // Re-attach listeners
    document.querySelectorAll('.product-card .btn-primary').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const productCard = button.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent;
            
            // WhatsApp message template
            const message = `Halo! Saya tertarik untuk membeli ${productName} dengan harga ${productPrice}. Bisa tolong berikan informasi lebih lanjut?`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
            
            // Button animation
            button.style.transform = 'scale(0.95)';
            button.textContent = 'Mengarahkan...';
            
            setTimeout(() => {
                button.style.transform = '';
                button.textContent = 'Beli Sekarang';
            }, 1000);
        });
    });
}

// Show portfolio modal (for portfolio item details)
function showPortfolioModal(item) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('portfolioDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'portfolioDetailModal';
        modal.className = 'portfolio-modal';
        modal.innerHTML = `
            <div class="portfolio-modal-content">
                <button class="portfolio-close-btn">&times;</button>
                <img class="portfolio-modal-image" src="" alt="">
                <div class="portfolio-modal-info">
                    <h3 class="portfolio-modal-title"></h3>
                    <p class="portfolio-modal-description"></p>
                    <span class="portfolio-modal-category"></span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .portfolio-modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }
            .portfolio-modal.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .portfolio-modal-content {
                background: white;
                border-radius: 12px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            .portfolio-close-btn {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(0, 0, 0, 0.5);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 1001;
            }
            .portfolio-modal-image {
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
            }
            .portfolio-modal-info {
                padding: 1.5rem;
            }
            .portfolio-modal-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 0.5rem;
            }
            .portfolio-modal-description {
                color: #666;
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            .portfolio-modal-category {
                background: #ecf0f1;
                color: #2c3e50;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.9rem;
            }
            @media (max-width: 768px) {
                .portfolio-modal-content {
                    margin: 1rem;
                    max-width: calc(100vw - 2rem);
                }
                .portfolio-modal-image {
                    max-height: 50vh;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        modal.querySelector('.portfolio-close-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // Update modal content
    modal.querySelector('.portfolio-modal-image').src = item.image;
    modal.querySelector('.portfolio-modal-image').alt = item.title;
    modal.querySelector('.portfolio-modal-title').textContent = item.title;
    modal.querySelector('.portfolio-modal-description').textContent = item.description;
    modal.querySelector('.portfolio-modal-category').textContent = getCategoryName(item.category);
    
    // Show modal
    modal.classList.add('active');
}

// Helper function to get category name
function getCategoryName(category) {
    const categories = {
        illustration: 'Ilustrasi Digital',
        character: 'Character Design',
        editorial: 'Editorial',
        branding: 'Branding',
        concept: 'Concept Art'
    };
    return categories[category] || category;
}

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handler
const debouncedScrollHandler = debounce(() => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Default portfolio items
const defaultPortfolio = [
    {
        id: 1,
        title: "Digital Art",
        category: "ilustrasi",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EDigital Art%3C/text%3E%3C/svg%3E",
        size: "normal"
    },
    {
        id: 2,
        title: "Character Design",
        category: "character",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23764ba2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3ECharacter%3C/text%3E%3C/svg%3E",
        size: "wide"
    },
    {
        id: 3,
        title: "Branding Project",
        category: "branding",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect width='600' height='300' fill='%23f093fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EBranding%3C/text%3E%3C/svg%3E",
        size: "tall"
    },
    {
        id: 4,
        title: "Editorial Illustration",
        category: "editorial",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%234facfe'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EEditorial%3C/text%3E%3C/svg%3E",
        size: "normal"
    },
    {
        id: 5,
        title: "Logo Design",
        category: "branding",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%2343e97b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3ELogo%3C/text%3E%3C/svg%3E",
        size: "normal"
    },
    {
        id: 6,
        title: "Book Cover",
        category: "editorial",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%2338f9d7'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EBook Cover%3C/text%3E%3C/svg%3E",
        size: "tall"
    },
    {
        id: 7,
        title: "Poster Design",
        category: "ilustrasi",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EPoster%3C/text%3E%3C/svg%3E",
        size: "wide"
    },
    {
        id: 8,
        title: "Icon Set",
        category: "branding",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f093fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EIcons%3C/text%3E%3C/svg%3E",
        size: "normal"
    }
];

// Default digital products
const defaultProducts = [
    {
        id: 1,
        name: "Brush Pack Premium",
        price: 150000,
        description: "Koleksi 50+ brush digital untuk ilustrasi",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f093fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='18'%3EBrush Pack%3C/text%3E%3C/svg%3E",
        status: "active"
    },
    {
        id: 2,
        name: "Font Collection",
        price: 200000,
        description: "10 font unik untuk branding dan desain",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='18'%3EFont Pack%3C/text%3E%3C/svg%3E",
        status: "active"
    },
    {
        id: 3,
        name: "Photoshop Actions",
        price: 100000,
        description: "25 action untuk efek foto profesional",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23764ba2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='18'%3EPS Actions%3C/text%3E%3C/svg%3E",
        status: "active"
    },
    {
        id: 4,
        name: "Texture Pack",
        price: 120000,
        description: "Koleksi tekstur high-res untuk desain",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%2343e97b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='18'%3ETextures%3C/text%3E%3C/svg%3E",
        status: "active"
    }
];

// Initialize default data if not exists
if (!localStorage.getItem('portfolioData')) {
    localStorage.setItem('portfolioData', JSON.stringify(defaultPortfolio));
}

if (!localStorage.getItem('productsData')) {
    localStorage.setItem('productsData', JSON.stringify(defaultProducts));
}

// Load dynamic content when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDynamicContent();
});

console.log('Portfolio website loaded successfully!');
console.log('Features: Responsive navigation, smooth animations, WhatsApp integration');
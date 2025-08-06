export function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
export function throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
export class SafeStorage {
    static get(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        }
        catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return defaultValue;
        }
    }
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        }
        catch (error) {
            console.error(`Error writing to localStorage (${key}):`, error);
            return false;
        }
    }
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        }
        catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    }
    static clear() {
        try {
            localStorage.clear();
            return true;
        }
        catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}
export class DOMUtils {
    static getElementById(id) {
        return document.getElementById(id);
    }
    static querySelector(selector) {
        return document.querySelector(selector);
    }
    static querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }
    static createElement(tagName, className) {
        const element = document.createElement(tagName);
        if (className)
            element.className = className;
        return element;
    }
    static addEventListeners(elements, event, handler) {
        const elementsArray = Array.from(elements);
        elementsArray.forEach(element => {
            element.addEventListener(event, (e) => handler(e, element));
        });
    }
    static removeEventListeners(elements, event, handler) {
        const elementsArray = Array.from(elements);
        elementsArray.forEach(element => {
            element.removeEventListener(event, handler);
        });
    }
    static toggleClass(element, className, force) {
        element.classList.toggle(className, force);
    }
    static addClass(element, ...classNames) {
        element.classList.add(...classNames);
    }
    static removeClass(element, ...classNames) {
        element.classList.remove(...classNames);
    }
    static hasClass(element, className) {
        return element.classList.contains(className);
    }
}
export class AnimationUtils {
    static smoothScrollTo(config) {
        window.scrollTo(config);
    }
    static fadeIn(element, duration = 300) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                element.style.opacity = progress.toString();
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
                else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }
    static fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            const start = performance.now();
            const startOpacity = parseFloat(getComputedStyle(element).opacity);
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                element.style.opacity = (startOpacity * (1 - progress)).toString();
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
                else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }
    static animateNumber(element, targetValue, duration = 1000) {
        const startValue = parseInt(element.textContent || '0');
        const difference = targetValue - startValue;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (difference * easeOut));
            element.textContent = currentValue.toString();
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
    static slideUp(element, duration = 300) {
        return new Promise(resolve => {
            const height = element.offsetHeight;
            element.style.overflow = 'hidden';
            element.style.transition = `height ${duration}ms ease`;
            element.style.height = '0px';
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }
    static slideDown(element, duration = 300) {
        return new Promise(resolve => {
            element.style.display = 'block';
            const height = element.scrollHeight;
            element.style.height = '0px';
            element.style.overflow = 'hidden';
            element.style.transition = `height ${duration}ms ease`;
            requestAnimationFrame(() => {
                element.style.height = `${height}px`;
            });
            setTimeout(() => {
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }
}
export class ImageUtils {
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    static getImageDimensions(src) {
        return this.loadImage(src).then(img => ({
            width: img.naturalWidth,
            height: img.naturalHeight
        }));
    }
    static resizeImage(file, maxWidth, maxHeight, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            const img = new Image();
            img.onload = () => {
                const { width, height } = img;
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                canvas.width = width * ratio;
                canvas.height = height * ratio;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
    static createPlaceholder(width, height, text) {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='16'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
    }
    static async createThumbnail(imageUrl, width, height) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            canvas.width = width;
            canvas.height = height;
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const targetRatio = width / height;
                let drawWidth = img.width;
                let drawHeight = img.height;
                let offsetX = 0;
                let offsetY = 0;
                if (aspectRatio > targetRatio) {
                    drawWidth = img.height * targetRatio;
                    offsetX = (img.width - drawWidth) / 2;
                }
                else {
                    drawHeight = img.width / targetRatio;
                    offsetY = (img.height - drawHeight) / 2;
                }
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }
    static async fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    resolve(e.target.result);
                }
                else {
                    reject(new Error('Failed to read file'));
                }
            };
            reader.onerror = () => reject(new Error('File reading error'));
            reader.readAsDataURL(file);
        });
    }
}
export class ValidationUtils {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    static isValidPhoneNumber(phone) {
        return this.isValidPhone(phone);
    }
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    static isValidUrl(url) {
        return this.isValidURL(url);
    }
    static isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }
    static isValidFileSize(file, maxSizeInMB) {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    }
}
export class PerformanceUtils {
    static mark(name) {
        this.marks.set(name, performance.now());
    }
    static measure(name, startMark) {
        const startTime = this.marks.get(startMark);
        if (!startTime) {
            console.warn(`Start mark '${startMark}' not found`);
            return 0;
        }
        const duration = performance.now() - startTime;
        console.log(`${name}: ${duration.toFixed(2)}ms`);
        return duration;
    }
    static async measureAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        console.log(`${name}: ${duration.toFixed(2)}ms`);
        return result;
    }
    static lazy(fn) {
        let cached;
        let hasValue = false;
        return () => {
            if (!hasValue) {
                cached = fn();
                hasValue = true;
            }
            return cached;
        };
    }
}
PerformanceUtils.marks = new Map();
export class FormatUtils {
    static formatPrice(price, currency = 'IDR') {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(price);
    }
    static formatDate(date, locale = 'id-ID') {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(dateObj);
    }
    static formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    static truncateText(text, maxLength, suffix = '...') {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
export class ErrorUtils {
    static handleError(error, context) {
        const message = context ? `${context}: ${error.message}` : error.message;
        console.error(message, error);
    }
    static createError(message, code) {
        const error = new Error(message);
        if (code) {
            error.code = code;
        }
        return error;
    }
    static isNetworkError(error) {
        return error.message.includes('network') ||
            error.message.includes('fetch') ||
            error.message.includes('connection');
    }
}
export default {
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
};
//# sourceMappingURL=utils.js.map
// Utility functions for Portfolio Application
import { 
  PortfolioItem, 
  ProductItem, 
  SiteSettings, 
  MessageType, 
  StorageKeys,
  AnimationConfig,
  ScrollConfig,
  Nullable,
  VoidFunction
} from './types.js';

/**
 * Debounce function to limit function calls
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe localStorage operations with error handling
 */
export class SafeStorage {
  static get<T>(key: StorageKeys, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  }

  static set<T>(key: StorageKeys, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }

  static remove(key: StorageKeys): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
}

/**
 * DOM utility functions
 */
export class DOMUtils {
  static getElementById<T extends HTMLElement>(id: string): Nullable<T> {
    return document.getElementById(id) as T | null;
  }

  static querySelector<T extends HTMLElement>(selector: string): Nullable<T> {
    return document.querySelector(selector) as T | null;
  }

  static querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return document.querySelectorAll(selector) as NodeListOf<T>;
  }

  static createElement<T extends HTMLElement>(tagName: string, className?: string): T {
    const element = document.createElement(tagName) as T;
    if (className) element.className = className;
    return element;
  }

  static addEventListeners<T extends HTMLElement>(
    elements: NodeListOf<T> | T[],
    event: string,
    handler: (event: Event, element: T) => void
  ): void {
    const elementsArray = Array.from(elements);
    elementsArray.forEach(element => {
      element.addEventListener(event, (e) => handler(e, element));
    });
  }

  static removeEventListeners<T extends HTMLElement>(
    elements: NodeListOf<T> | T[],
    event: string,
    handler: EventListener
  ): void {
    const elementsArray = Array.from(elements);
    elementsArray.forEach(element => {
      element.removeEventListener(event, handler);
    });
  }

  static toggleClass(element: HTMLElement, className: string, force?: boolean): void {
    element.classList.toggle(className, force);
  }

  static addClass(element: HTMLElement, ...classNames: string[]): void {
    element.classList.add(...classNames);
  }

  static removeClass(element: HTMLElement, ...classNames: string[]): void {
    element.classList.remove(...classNames);
  }

  static hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
  }
}

/**
 * Animation utilities
 */
export class AnimationUtils {
  static smoothScrollTo(config: ScrollConfig): void {
    window.scrollTo(config);
  }

  static fadeIn(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const start = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress.toString();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  static fadeOut(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now();
      const startOpacity = parseFloat(getComputedStyle(element).opacity);
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = (startOpacity * (1 - progress)).toString();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.display = 'none';
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  /**
   * Animate number counter
   */
  static animateNumber(element: HTMLElement, targetValue: number, duration: number = 1000): void {
    const startValue = parseInt(element.textContent || '0');
    const difference = targetValue - startValue;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (difference * easeOut));
      
      element.textContent = currentValue.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  static slideUp(element: HTMLElement, duration = 300): Promise<void> {
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

  static slideDown(element: HTMLElement, duration = 300): Promise<void> {
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

/**
 * Image utilities
 */
export class ImageUtils {
  static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  static getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return this.loadImage(src).then(img => ({
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
  }

  static resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality = 0.8
  ): Promise<string> {
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

  static createPlaceholder(width: number, height: number, text: string): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='16'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Create thumbnail from image URL
   */
  static async createThumbnail(imageUrl: string, width: number, height: number): Promise<string> {
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
        // Calculate aspect ratio and crop to fit
        const aspectRatio = img.width / img.height;
        const targetRatio = width / height;
        
        let drawWidth = img.width;
        let drawHeight = img.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > targetRatio) {
          // Image is wider, crop width
          drawWidth = img.height * targetRatio;
          offsetX = (img.width - drawWidth) / 2;
        } else {
          // Image is taller, crop height
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

  /**
   * Convert file to data URL
   */
  static async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate phone number (alias)
   */
  static isValidPhoneNumber(phone: string): boolean {
    return this.isValidPhone(phone);
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate URL format (alias)
   */
  static isValidUrl(url: string): boolean {
    return this.isValidURL(url);
  }

  static isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  }

  static isValidFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}

/**
 * Performance utilities
 */
export class PerformanceUtils {
  private static marks: Map<string, number> = new Map();

  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark '${startMark}' not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return result;
  }

  static lazy<T>(fn: () => T): () => T {
    let cached: T;
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

/**
 * Format utilities
 */
export class FormatUtils {
  static formatPrice(price: number, currency = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  }

  static formatDate(date: Date | string, locale = 'id-ID'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static truncateText(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  static handleError(error: Error, context?: string): void {
    const message = context ? `${context}: ${error.message}` : error.message;
    console.error(message, error);
    
    // You can extend this to send errors to a logging service
    // this.sendToLoggingService(error, context);
  }

  static createError(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }

  static isNetworkError(error: Error): boolean {
    return error.message.includes('network') || 
           error.message.includes('fetch') ||
           error.message.includes('connection');
  }
}

/**
 * Export all utilities as default
 */
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
import { StorageKeys, ScrollConfig, Nullable } from './types.js';
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
export declare class SafeStorage {
    static get<T>(key: StorageKeys, defaultValue: T): T;
    static set<T>(key: StorageKeys, value: T): boolean;
    static remove(key: StorageKeys): boolean;
    static clear(): boolean;
}
export declare class DOMUtils {
    static getElementById<T extends HTMLElement>(id: string): Nullable<T>;
    static querySelector<T extends HTMLElement>(selector: string): Nullable<T>;
    static querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T>;
    static createElement<T extends HTMLElement>(tagName: string, className?: string): T;
    static addEventListeners<T extends HTMLElement>(elements: NodeListOf<T> | T[], event: string, handler: (event: Event, element: T) => void): void;
    static removeEventListeners<T extends HTMLElement>(elements: NodeListOf<T> | T[], event: string, handler: EventListener): void;
    static toggleClass(element: HTMLElement, className: string, force?: boolean): void;
    static addClass(element: HTMLElement, ...classNames: string[]): void;
    static removeClass(element: HTMLElement, ...classNames: string[]): void;
    static hasClass(element: HTMLElement, className: string): boolean;
}
export declare class AnimationUtils {
    static smoothScrollTo(config: ScrollConfig): void;
    static fadeIn(element: HTMLElement, duration?: number): Promise<void>;
    static fadeOut(element: HTMLElement, duration?: number): Promise<void>;
    static animateNumber(element: HTMLElement, targetValue: number, duration?: number): void;
    static slideUp(element: HTMLElement, duration?: number): Promise<void>;
    static slideDown(element: HTMLElement, duration?: number): Promise<void>;
}
export declare class ImageUtils {
    static loadImage(src: string): Promise<HTMLImageElement>;
    static getImageDimensions(src: string): Promise<{
        width: number;
        height: number;
    }>;
    static resizeImage(file: File, maxWidth: number, maxHeight: number, quality?: number): Promise<string>;
    static createPlaceholder(width: number, height: number, text: string): string;
    static createThumbnail(imageUrl: string, width: number, height: number): Promise<string>;
    static fileToDataURL(file: File): Promise<string>;
}
export declare class ValidationUtils {
    static isValidEmail(email: string): boolean;
    static isValidPhone(phone: string): boolean;
    static isValidPhoneNumber(phone: string): boolean;
    static isValidURL(url: string): boolean;
    static isValidUrl(url: string): boolean;
    static isValidImageFile(file: File): boolean;
    static isValidFileSize(file: File, maxSizeInMB: number): boolean;
}
export declare class PerformanceUtils {
    private static marks;
    static mark(name: string): void;
    static measure(name: string, startMark: string): number;
    static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
    static lazy<T>(fn: () => T): () => T;
}
export declare class FormatUtils {
    static formatPrice(price: number, currency?: string): string;
    static formatDate(date: Date | string, locale?: string): string;
    static formatFileSize(bytes: number): string;
    static truncateText(text: string, maxLength: number, suffix?: string): string;
    static slugify(text: string): string;
}
export declare class ErrorUtils {
    static handleError(error: Error, context?: string): void;
    static createError(message: string, code?: string): Error;
    static isNetworkError(error: Error): boolean;
}
declare const _default: {
    debounce: typeof debounce;
    throttle: typeof throttle;
    SafeStorage: typeof SafeStorage;
    DOMUtils: typeof DOMUtils;
    AnimationUtils: typeof AnimationUtils;
    ImageUtils: typeof ImageUtils;
    ValidationUtils: typeof ValidationUtils;
    PerformanceUtils: typeof PerformanceUtils;
    FormatUtils: typeof FormatUtils;
    ErrorUtils: typeof ErrorUtils;
};
export default _default;
//# sourceMappingURL=utils.d.ts.map
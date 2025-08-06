export interface PortfolioItem {
    id: number;
    title: string;
    category: CategoryName;
    image: string;
    thumbnail?: string;
    description?: string;
    additionalImages?: string[];
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface ProductItem {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    description: string;
    image: string;
    status: 'active' | 'inactive';
    type?: 'digital' | 'physical';
    category?: ProductCategoryName;
    additionalImages?: string[];
    downloadLink?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface SiteSettings {
    siteName: string;
    heroTitle: string;
    heroSubtitle: string;
    whatsappNumber: string;
    aboutText: string;
    profileImage?: string;
    gridLayout?: 'masonry' | 'grid' | 'list';
    itemsPerPage?: number;
    showCategories?: boolean;
    enableAnimations?: boolean;
}
export interface User {
    username: string;
    password: string;
    lastLogin?: string;
}
export interface ThumbnailSize {
    name: string;
    width: number;
    height: number;
    ratio?: number;
}
export interface ThumbnailSizes {
    normal: ThumbnailSize;
    wide2x: ThumbnailSize;
    tall2x: ThumbnailSize;
}
export interface CropperConfig {
    aspectRatio: number;
    viewMode: number;
    autoCropArea: number;
    responsive: boolean;
    restore: boolean;
    guides: boolean;
    center: boolean;
    highlight: boolean;
    cropBoxMovable: boolean;
    cropBoxResizable: boolean;
    toggleDragModeOnDblclick: boolean;
    dragMode?: string;
}
export type MessageType = 'success' | 'error' | 'warning' | 'info';
export type ImageTarget = 'profile' | 'portfolio' | 'product' | 'portfolio-thumbnail';
export type TabName = 'dashboard' | 'portfolio' | 'products' | 'settings';
export type CategoryName = 'ilustrasi' | 'character' | 'branding' | 'editorial' | 'concept';
export type ProductCategoryName = 'brush' | 'font' | 'action' | 'texture' | 'template' | 'other';
export type SizeName = 'normal' | 'wide2x' | 'tall2x';
export type ProductType = 'digital' | 'physical';
export interface DOMElements {
    hamburger?: HTMLElement | null;
    navMenu?: HTMLElement | null;
    navLinks?: NodeListOf<HTMLElement>;
    sections?: NodeListOf<HTMLElement>;
    productButtons?: NodeListOf<HTMLElement>;
    portfolioItems?: NodeListOf<HTMLElement>;
    portfolioGrid?: HTMLElement | null;
    productsGrid?: HTMLElement | null;
    cropperModal?: HTMLElement | null;
    cropperImage?: HTMLImageElement | null;
    profileImage?: HTMLImageElement | null;
    tabButtons?: NodeListOf<HTMLElement>;
    tabContents?: NodeListOf<HTMLElement>;
    forms?: NodeListOf<HTMLFormElement>;
}
export type EventHandler<T = Event> = (event: T) => void;
export type ClickHandler = EventHandler<MouseEvent>;
export type SubmitHandler = EventHandler<SubmitEvent>;
export type ChangeHandler = EventHandler<Event>;
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export declare enum StorageKeys {
    PORTFOLIO_DATA = "portfolioData",
    PRODUCTS_DATA = "productsData",
    SITE_SETTINGS = "siteSettings",
    USER_DATA = "userData"
}
export interface AnimationConfig {
    duration: number;
    easing: string;
    delay?: number;
}
export interface ScrollConfig {
    top: number;
    behavior: 'smooth' | 'auto';
}
export interface ObserverConfig {
    threshold: number;
    rootMargin: string;
}
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
export type Predicate<T> = (item: T) => boolean;
export type Mapper<T, U> = (item: T) => U;
export type Reducer<T, U> = (acc: U, current: T) => U;
export interface AppError {
    code: string;
    message: string;
    details?: any;
}
export interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
}
export declare namespace PortfolioTypes {
    type Portfolio = PortfolioItem;
    type Product = ProductItem;
    type Settings = SiteSettings;
    type UserData = User;
    type Message = MessageType;
    type Target = ImageTarget;
    type Tab = TabName;
    type Category = CategoryName;
    type Size = SizeName;
    type Type = ProductType;
}
//# sourceMappingURL=types.d.ts.map
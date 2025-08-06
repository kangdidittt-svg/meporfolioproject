// Type definitions for Portfolio Application

// Portfolio Item Interface
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

// Product Item Interface
export interface ProductItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number; // For discount calculation
  discount?: number; // Discount percentage (0-100)
  description: string;
  image: string;
  status: 'active' | 'inactive';
  type?: 'digital' | 'physical';
  category?: ProductCategoryName;
  additionalImages?: string[];
  downloadLink?: string; // For digital products
  createdAt?: string;
  updatedAt?: string;
}

// Site Settings Interface
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

// User Interface
export interface User {
  username: string;
  password: string;
  lastLogin?: string;
}

// Thumbnail Size Configuration
export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
  ratio?: number;
}

// Thumbnail Sizes Configuration
export interface ThumbnailSizes {
  normal: ThumbnailSize;
  wide2x: ThumbnailSize;
  tall2x: ThumbnailSize;
}

// Cropper Configuration
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

// Message Types
export type MessageType = 'success' | 'error' | 'warning' | 'info';

// Image Target Types
export type ImageTarget = 'profile' | 'portfolio' | 'product' | 'portfolio-thumbnail';

// Tab Names
export type TabName = 'dashboard' | 'portfolio' | 'products' | 'settings';

// Category Names
export type CategoryName = 'ilustrasi' | 'character' | 'branding' | 'editorial' | 'concept';

// Product Category Names
export type ProductCategoryName = 'brush' | 'font' | 'action' | 'texture' | 'template' | 'other';

// Size Names
export type SizeName = 'normal' | 'wide2x' | 'tall2x';

// Product Types
export type ProductType = 'digital' | 'physical';

// DOM Element Selectors
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

// Event Handler Types
export type EventHandler<T = Event> = (event: T) => void;
export type ClickHandler = EventHandler<MouseEvent>;
export type SubmitHandler = EventHandler<SubmitEvent>;
export type ChangeHandler = EventHandler<Event>;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Local Storage Keys
export enum StorageKeys {
  PORTFOLIO_DATA = 'portfolioData',
  PRODUCTS_DATA = 'productsData',
  SITE_SETTINGS = 'siteSettings',
  USER_DATA = 'userData'
}

// Animation Configuration
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Scroll Configuration
export interface ScrollConfig {
  top: number;
  behavior: 'smooth' | 'auto';
}

// Observer Configuration
export interface ObserverConfig {
  threshold: number;
  rootMargin: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Function Types
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
export type Predicate<T> = (item: T) => boolean;
export type Mapper<T, U> = (item: T) => U;
export type Reducer<T, U> = (acc: U, current: T) => U;

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Performance Metrics
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
}

// Export all types as a namespace
export namespace PortfolioTypes {
  export type Portfolio = PortfolioItem;
  export type Product = ProductItem;
  export type Settings = SiteSettings;
  export type UserData = User;
  export type Message = MessageType;
  export type Target = ImageTarget;
  export type Tab = TabName;
  export type Category = CategoryName;
  export type Size = SizeName;
  export type Type = ProductType;
}
/**
 * Media type constants and configuration for the Lemmy Media Slideshow
 */

export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
  GIF: 'gif',
  UNKNOWN: 'unknown',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
  '.tiff',
] as const;

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.ogg',
  '.mov',
  '.avi',
] as const;

export const SUPPORTED_GIF_EXTENSIONS = ['.gif'] as const;

export const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
] as const;

export const SUPPORTED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
] as const;

export const SUPPORTED_GIF_MIMES = ['image/gif'] as const;

export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_VIDEO_EXTENSIONS,
  ...SUPPORTED_GIF_EXTENSIONS,
] as const;

export const ALL_SUPPORTED_MIMES = [
  ...SUPPORTED_IMAGE_MIMES,
  ...SUPPORTED_VIDEO_MIMES,
  ...SUPPORTED_GIF_MIMES,
] as const;

/**
 * Pictrs image service transformations
 */
export const PICTRS_FORMATS = {
  THUMBNAIL: 'thumbnail',
  WEBP: 'webp',
  JPG: 'jpg',
} as const;

export const PICTRS_SIZES = {
  SMALL: 256,
  MEDIUM: 512,
  LARGE: 1024,
  XLARGE: 1920,
} as const;

/**
 * Media optimization settings
 */
export const OPTIMIZATION_SETTINGS = {
  // Quality settings for different screen sizes
  MOBILE_QUALITY: 75,
  DESKTOP_QUALITY: 85,

  // Preload settings
  PRELOAD_COUNT: 3,
  PRELOAD_TIMEOUT: 10000, // 10 seconds

  // Cache settings
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_CACHE_ITEMS: 200,

  // Connection speed thresholds (Mbps)
  SLOW_CONNECTION: 1,
  FAST_CONNECTION: 10,

  // Pixel 6 specific optimizations
  PIXEL6_WIDTH: 412,
  PIXEL6_HEIGHT: 915,
  PIXEL6_DPR: 2.625,
} as const;

/**
 * Error handling constants
 */
export const MEDIA_ERRORS = {
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  LOAD_FAILED: 'LOAD_FAILED',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_URL: 'INVALID_URL',
} as const;

export type MediaError = (typeof MEDIA_ERRORS)[keyof typeof MEDIA_ERRORS];

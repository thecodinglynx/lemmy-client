/**
 * Media utilities - Simple helpers for media type detection
 */

import { MediaTypeDetector } from './media-type-detector';
import { MediaType } from '../constants/media-types';

/**
 * Get the media type from a URL
 */
export function getMediaType(url: string): MediaType {
  const result = MediaTypeDetector.detect(url);
  return result.type;
}

/**
 * Check if a URL is a supported media type
 */
export function isSupportedMediaType(url: string): boolean {
  const result = MediaTypeDetector.detect(url);
  return result.isValid;
}

/**
 * Check if a URL is a video
 */
export function isVideo(url: string): boolean {
  return getMediaType(url) === MediaType.VIDEO;
}

/**
 * Check if a URL is an image
 */
export function isImage(url: string): boolean {
  return getMediaType(url) === MediaType.IMAGE;
}

/**
 * Check if a URL is a GIF
 */
export function isGif(url: string): boolean {
  return getMediaType(url) === MediaType.GIF;
}

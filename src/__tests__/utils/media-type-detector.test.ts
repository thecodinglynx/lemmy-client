/**
 * Tests for MediaTypeDetector
 */

import { describe, it, expect } from 'vitest';
import { MediaTypeDetector } from '../../utils/media-type-detector';
import { MediaType, MEDIA_ERRORS } from '../../constants/media-types';

describe('MediaTypeDetector', () => {
  describe('detect', () => {
    it('should detect image types from URL extensions', () => {
      const imageUrls = [
        'https://example.com/image.jpg',
        'https://example.com/image.jpeg',
        'https://example.com/image.png',
        'https://example.com/image.webp',
      ];

      imageUrls.forEach((url) => {
        const result = MediaTypeDetector.detect(url);
        expect(result.type).toBe(MediaType.IMAGE);
        expect(result.isValid).toBe(true);
        expect(result.originalUrl).toBe(url);
      });
    });

    it('should detect video types from URL extensions', () => {
      const videoUrls = [
        'https://example.com/video.mp4',
        'https://example.com/video.webm',
        'https://example.com/video.ogg',
      ];

      videoUrls.forEach((url) => {
        const result = MediaTypeDetector.detect(url);
        expect(result.type).toBe(MediaType.VIDEO);
        expect(result.isValid).toBe(true);
      });
    });

    it('should detect GIF types from URL extensions', () => {
      const result = MediaTypeDetector.detect(
        'https://example.com/animation.gif'
      );
      expect(result.type).toBe(MediaType.GIF);
      expect(result.isValid).toBe(true);
      expect(result.metadata?.isProbablyAnimated).toBe(true);
    });

    it('should prefer MIME type over extension', () => {
      const result = MediaTypeDetector.detect(
        'https://example.com/file.txt',
        'image/jpeg'
      );
      expect(result.type).toBe(MediaType.IMAGE);
      expect(result.metadata?.mimeType).toBe('image/jpeg');
    });

    it('should identify Pictrs URLs', () => {
      const pictrsUrl = 'https://lemmy.world/pictrs/image/abc123.jpg';
      const result = MediaTypeDetector.detect(pictrsUrl);
      expect(result.isPictrs).toBe(true);
      expect(result.type).toBe(MediaType.IMAGE);
    });

    it('should handle invalid URLs', () => {
      const result = MediaTypeDetector.detect('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(MEDIA_ERRORS.INVALID_URL);
    });

    it('should handle unsupported formats', () => {
      const result = MediaTypeDetector.detect('https://example.com/file.xyz');
      expect(result.type).toBe(MediaType.UNKNOWN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(MEDIA_ERRORS.UNSUPPORTED_FORMAT);
    });

    it('should handle URLs with query parameters', () => {
      const result = MediaTypeDetector.detect(
        'https://example.com/image.jpg?v=123&size=large'
      );
      expect(result.type).toBe(MediaType.IMAGE);
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPictrsUrl', () => {
    it('should identify Pictrs URLs correctly', () => {
      const pictrsUrls = [
        'https://lemmy.world/pictrs/image/abc123.jpg',
        'https://example.com/pictrs/image/xyz789.png',
        'http://localhost/pictrs/image/test.webp',
      ];

      pictrsUrls.forEach((url) => {
        expect(MediaTypeDetector.isPictrsUrl(url)).toBe(true);
      });
    });

    it('should reject non-Pictrs URLs', () => {
      const nonPictrsUrls = [
        'https://example.com/image.jpg',
        'https://lemmy.world/uploads/image.png',
        'https://example.com/pictrs/something/else.jpg',
      ];

      nonPictrsUrls.forEach((url) => {
        expect(MediaTypeDetector.isPictrsUrl(url)).toBe(false);
      });
    });
  });

  describe('isLikelyAnimated', () => {
    it('should identify GIFs as likely animated', () => {
      const result = MediaTypeDetector.isLikelyAnimated(
        'https://example.com/animation.gif'
      );
      expect(result).toBe(true);
    });

    it('should identify videos as animated', () => {
      const result = MediaTypeDetector.isLikelyAnimated(
        'https://example.com/video.mp4'
      );
      expect(result).toBe(true);
    });

    it('should identify images with animation keywords', () => {
      const animatedUrls = [
        'https://example.com/animated-cat.jpg',
        'https://example.com/video-preview.png',
        'https://example.com/motion-blur.webp',
      ];

      animatedUrls.forEach((url) => {
        expect(MediaTypeDetector.isLikelyAnimated(url)).toBe(true);
      });
    });

    it('should not identify static images as animated', () => {
      const result = MediaTypeDetector.isLikelyAnimated(
        'https://example.com/photo.jpg'
      );
      expect(result).toBe(false);
    });
  });

  describe('getOptimalFormat', () => {
    it('should return appropriate formats for different media types', () => {
      expect(MediaTypeDetector.getOptimalFormat(MediaType.IMAGE)).toMatch(
        /^(avif|webp|jpg)$/
      );
      expect(MediaTypeDetector.getOptimalFormat(MediaType.VIDEO)).toBe('mp4');
      expect(MediaTypeDetector.getOptimalFormat(MediaType.GIF)).toBe('gif');
      expect(MediaTypeDetector.getOptimalFormat(MediaType.UNKNOWN)).toBe('jpg');
    });
  });
});

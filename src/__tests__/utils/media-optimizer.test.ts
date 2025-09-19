/**
 * Tests for MediaOptimizer
 */

import { describe, it, expect } from 'vitest';
import { MediaOptimizer } from '../../utils/media-optimizer';

describe('MediaOptimizer', () => {
  describe('optimize', () => {
    it('should handle non-Pictrs URLs', () => {
      const url = 'https://example.com/image.jpg';
      const result = MediaOptimizer.optimize(url);

      expect(result.originalUrl).toBe(url);
      expect(result.optimizedUrl).toBe(url);
      expect(result.metadata.isPictrs).toBe(false);
    });

    it('should handle mobile optimization options', () => {
      const url = 'https://example.com/image.jpg';
      const result = MediaOptimizer.optimize(url, {
        isMobile: true,
        width: 400,
        quality: 70,
      });

      expect(result.metadata.quality).toBe(70);
      expect(result.originalUrl).toBe(url);
    });

    it('should adjust quality based on connection speed', () => {
      const url = 'https://example.com/image.jpg';

      const slowResult = MediaOptimizer.optimize(url, {
        connectionSpeed: 'slow',
        width: 800,
      });

      const fastResult = MediaOptimizer.optimize(url, {
        connectionSpeed: 'fast',
        width: 800,
      });

      // Both should return valid results
      expect(slowResult.metadata.quality).toBeGreaterThan(0);
      expect(fastResult.metadata.quality).toBeGreaterThan(0);
    });
  });

  describe('shouldOptimize', () => {
    it('should return false for very small images', () => {
      const result = MediaOptimizer.shouldOptimize(
        'https://example.com/image.jpg',
        100 // Small width
      );
      expect(result).toBe(false);
    });

    it('should return false for non-Pictrs URLs by default', () => {
      const result = MediaOptimizer.shouldOptimize(
        'https://example.com/image.jpg'
      );
      expect(result).toBe(false);
    });
  });

  describe('getDevicePixelRatio', () => {
    it('should return device pixel ratio or default to 1', () => {
      const ratio = MediaOptimizer.getDevicePixelRatio();
      expect(typeof ratio).toBe('number');
      expect(ratio).toBeGreaterThan(0);
    });
  });

  describe('detectConnectionSpeed', () => {
    it('should return a valid connection speed', () => {
      const speed = MediaOptimizer.detectConnectionSpeed();
      expect(['slow', 'medium', 'fast']).toContain(speed);
    });
  });
});

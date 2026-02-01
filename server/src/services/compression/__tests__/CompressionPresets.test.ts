/**
 * Compression Presets Unit Tests
 * Tests compression presets and preset utilities
 */

import { describe, it, expect } from 'vitest';
import { COMPRESSION_PRESETS, getPreset, getDefaultPreset } from '../presets/CompressionPresets.js';

describe('CompressionPresets', () => {
  describe('COMPRESSION_PRESETS', () => {
    it('should have all required presets', () => {
      const presetNames = COMPRESSION_PRESETS.map(p => p.name);
      
      expect(presetNames).toContain('fast');
      expect(presetNames).toContain('balanced');
      expect(presetNames).toContain('small');
      expect(presetNames).toContain('quality');
      expect(presetNames).toContain('maximum');
      expect(presetNames).toContain('streaming');
      expect(presetNames).toContain('archive');
    });

    it('should have valid preset configurations', () => {
      COMPRESSION_PRESETS.forEach(preset => {
        expect(preset.name).toBeTruthy();
        expect(['low', 'medium', 'high', 'maximum']).toContain(preset.level);
        expect(['size', 'quality', 'balanced', 'fast']).toContain(preset.strategy);
        expect(preset.targetBitrate).toBeGreaterThan(0);
        expect(preset.targetBitrate).toBeLessThanOrEqual(200);
        expect(preset.description).toBeTruthy();
        expect(preset.useCase).toBeTruthy();
      });
    });

    it('should have presets with different compression levels', () => {
      const levels = COMPRESSION_PRESETS.map(p => p.level);
      
      expect(levels).toContain('low');
      expect(levels).toContain('medium');
      expect(levels).toContain('high');
      expect(levels).toContain('maximum');
    });
  });

  describe('getPreset', () => {
    it('should return preset by name', () => {
      const preset = getPreset('balanced');
      
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('balanced');
    });

    it('should return undefined for unknown preset', () => {
      const preset = getPreset('unknown');
      
      expect(preset).toBeUndefined();
    });

    it('should return all known presets', () => {
      const knownPresets = ['fast', 'balanced', 'small', 'quality', 'maximum', 'streaming', 'archive'];
      
      knownPresets.forEach(name => {
        const preset = getPreset(name);
        expect(preset).toBeDefined();
        expect(preset?.name).toBe(name);
      });
    });
  });

  describe('getDefaultPreset', () => {
    it('should return balanced preset as default', () => {
      const defaultPreset = getDefaultPreset();
      
      expect(defaultPreset).toBeDefined();
      expect(defaultPreset.name).toBe('balanced');
    });
  });

  describe('preset characteristics', () => {
    it('should have fast preset with low compression', () => {
      const fast = getPreset('fast');
      
      expect(fast?.level).toBe('low');
      expect(fast?.strategy).toBe('fast');
      expect(fast?.targetBitrate).toBeGreaterThan(100);
    });

    it('should have small preset with high compression', () => {
      const small = getPreset('small');
      
      expect(small?.level).toBe('high');
      expect(small?.strategy).toBe('size');
      expect(small?.targetBitrate).toBeLessThan(100);
    });

    it('should have quality preset prioritizing quality', () => {
      const quality = getPreset('quality');
      
      expect(quality?.level).toBe('low');
      expect(quality?.strategy).toBe('quality');
      expect(quality?.targetBitrate).toBeGreaterThan(150);
    });

    it('should have maximum preset with extreme compression', () => {
      const maximum = getPreset('maximum');
      
      expect(maximum?.level).toBe('maximum');
      expect(maximum?.strategy).toBe('size');
      expect(maximum?.targetBitrate).toBeLessThan(60);
    });
  });
});

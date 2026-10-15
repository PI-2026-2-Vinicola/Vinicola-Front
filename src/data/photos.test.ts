import { describe, expect, it } from 'vitest';
import { TILES } from '../components/map/tiles';
import { HERO_PHOTO, PHOTO_CREDITS, VARIETY_PHOTOS } from './photos';
import { VARIETIES } from './varieties';

const FREE_LICENSES = ['CC BY 2.0', 'CC BY 3.0', 'CC BY-SA 4.0'];

describe('fotografias', () => {
  it('toda variedade tem foto própria, sem repetir arquivo', () => {
    const srcs = VARIETIES.map((v) => VARIETY_PHOTOS[v.id]?.src);
    expect(srcs.every(Boolean)).toBe(true);
    expect(new Set([...srcs, HERO_PHOTO.src]).size).toBe(VARIETIES.length + 1);
  });

  it('cada foto tem texto alternativo, autor, licença livre e origem verificável no Wikimedia Commons', () => {
    for (const p of PHOTO_CREDITS) {
      expect(p.alt.length).toBeGreaterThan(20);
      expect(p.author.trim()).not.toBe('');
      expect(FREE_LICENSES).toContain(p.license);
      expect(p.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/licenses\//);
      expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
    expect(PHOTO_CREDITS).toHaveLength(VARIETIES.length + 1);
  });
});

describe('camadas do mapa', () => {
  it('não usam provedores que exigem chave e trazem atribuição', () => {
    for (const t of Object.values(TILES)) {
      expect(t.url).not.toMatch(/cartocdn|api_key|apikey|access_token/i);
      expect(t.url).toMatch(/^https:\/\/.+\{z\}.+\{(x|y)\}.+\{(x|y)\}/);
      expect(t.attribution).not.toBe('');
      expect(t.maxNativeZoom).toBeLessThanOrEqual(t.maxZoom);
    }
    expect(TILES.mapa.attribution).toContain('OpenStreetMap');
  });
});

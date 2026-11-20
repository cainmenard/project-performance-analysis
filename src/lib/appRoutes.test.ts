import { describe, it, expect } from 'vitest';
import appSource from '../App.tsx?raw';
import { APP_ROUTE_PATTERNS, isAppRoute } from './appRoutes';

describe('isAppRoute', () => {
  it('matches every analysis route, with or without a trailing slash', () => {
    for (const path of ['/dashboard', '/portfolio/', '/gain-fade', '/costs', '/segments', '/market', '/project/24-107']) {
      expect(isAppRoute(path), path).toBe(true);
    }
  });

  it('does not match the landing page or unknown paths', () => {
    for (const path of ['/', '', '/project', '/marketing', '/dashboard/extra', '/nope']) {
      expect(isAppRoute(path), path).toBe(false);
    }
  });

  // The list lives apart from App.tsx so the provider can read it before the router mounts.
  // This keeps the two from drifting: every route App.tsx declares, other than the landing
  // page and the catch-all, has to be in APP_ROUTE_PATTERNS.
  it('lists every route App.tsx declares', () => {
    const declared = [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '/' && p !== '*');
    expect(declared.length).toBeGreaterThan(0);
    expect([...declared].sort()).toEqual([...APP_ROUTE_PATTERNS].sort());
  });
});

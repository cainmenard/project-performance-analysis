import { matchPath } from 'react-router-dom';

/**
 * The analysis routes, the ones rendered inside AppShell. Kept here so the data provider can
 * tell, before the router mounts, whether the first URL of a visit is a deep link into the
 * analysis. appRoutes.test.ts fails if a route is added to App.tsx and not to this list.
 */
export const APP_ROUTE_PATTERNS = [
  '/dashboard',
  '/portfolio',
  '/gain-fade',
  '/costs',
  '/segments',
  '/market',
  '/project/:id',
] as const;

/** True when the path is one of the analysis routes. Matching follows the router's rules. */
export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PATTERNS.some((pattern) => matchPath(pattern, pathname) !== null);
}

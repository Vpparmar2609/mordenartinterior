/**
 * Route prefetching map — maps route paths to their lazy import functions.
 * When a user hovers a nav link, we eagerly load the chunk so navigation is instant.
 */
const routeImportMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/projects': () => import('@/pages/Projects'),
  '/team': () => import('@/pages/Team'),
  '/design-tasks': () => import('@/pages/DesignTasks'),
  '/execution-tasks': () => import('@/pages/ExecutionTasks'),
  '/issues': () => import('@/pages/Issues'),
  '/approvals': () => import('@/pages/Approvals'),
  '/accounts': () => import('@/pages/Accounts'),
  '/messages': () => import('@/pages/Messages'),
  '/documents': () => import('@/pages/Documents'),
  '/notifications': () => import('@/pages/Notifications'),
  '/settings': () => import('@/pages/Settings'),
  '/profile': () => import('@/pages/Profile'),
};

const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's JS chunk on hover/focus so navigation feels instant.
 * Each route is only prefetched once.
 */
export function prefetchRoute(path: string) {
  if (prefetchedRoutes.has(path)) return;
  const importer = routeImportMap[path];
  if (importer) {
    prefetchedRoutes.add(path);
    importer();
  }
}

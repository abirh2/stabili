import type { Route } from './types';

export interface AppLocation {
  route: Route;
  buildingId?: string;
  managementId?: string;
}

const EXPLORE_LOCATION: AppLocation = { route: 'explore' };

function decodeSegment(value: string): string | null {
  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return null;
  }
}

export function parseHash(hash: string): AppLocation {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (!path || path === 'explore') return EXPLORE_LOCATION;
  if (path === 'saved') return { route: 'saved' };
  if (path === 'about') return { route: 'about' };

  if (path.startsWith('building/')) {
    const buildingId = decodeSegment(path.slice('building/'.length));
    return buildingId ? { route: 'building-details', buildingId } : EXPLORE_LOCATION;
  }

  if (path.startsWith('management/')) {
    const managementId = decodeSegment(path.slice('management/'.length));
    return managementId ? { route: 'management-profile', managementId } : EXPLORE_LOCATION;
  }

  return EXPLORE_LOCATION;
}

export function locationHash(location: AppLocation): string {
  switch (location.route) {
    case 'building-details':
      return location.buildingId ? `#/building/${encodeURIComponent(location.buildingId)}` : '#/explore';
    case 'management-profile':
      return location.managementId ? `#/management/${encodeURIComponent(location.managementId)}` : '#/explore';
    case 'saved':
      return '#/saved';
    case 'about':
      return '#/about';
    default:
      return '#/explore';
  }
}

export function replaceHash(location: AppLocation): void {
  const url = `${window.location.pathname}${window.location.search}${locationHash(location)}`;
  window.history.replaceState(null, '', url);
}

export function navigateTo(location: AppLocation): void {
  const hash = locationHash(location);
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

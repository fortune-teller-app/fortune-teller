// Central theme logic. Dark is the default when no preference is stored.
// The preference lives in a cookie so the server can render the right
// <html data-theme> on first paint; "system" is resolved in the browser.

export const THEME_COOKIE = 'noctua-theme';
export const THEME_PREFERENCES = ['dark', 'light', 'system'];
export const DEFAULT_PREFERENCE = 'dark';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : DEFAULT_PREFERENCE;
}

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveTheme(preference) {
  return preference === 'system' ? getSystemTheme() : preference;
}

// Writes data-theme (resolved) and data-theme-pref (chosen) on <html>.
export function applyTheme(preference) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(preference);
  root.dataset.themePref = preference;
}

export function persistPreference(preference) {
  document.cookie = `${THEME_COOKIE}=${preference}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

// Runs in <head> before first paint. Only "system" needs it, because the
// server cannot know the OS setting; explicit choices are server-rendered.
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);var p=m?m[1]:'${DEFAULT_PREFERENCE}';if(p!=='light'&&p!=='dark'&&p!=='system')p='${DEFAULT_PREFERENCE}';var d=document.documentElement;d.dataset.themePref=p;d.dataset.theme=p==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;}catch(e){}})();`;

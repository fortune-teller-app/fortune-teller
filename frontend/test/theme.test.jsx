import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import ThemeRow from '../components/ui/ThemeRow/ThemeRow';
import { THEME_COOKIE, normalizePreference } from '../lib/theme';

function mockMatchMedia(matchesLight) {
  window.matchMedia = () => ({
    matches: matchesLight,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

function clearCookie() {
  document.cookie = `${THEME_COOKIE}=; path=/; max-age=0`;
}

describe('theme preference', () => {
  beforeEach(() => {
    clearCookie();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themePref;
    mockMatchMedia(false);
  });

  it('falls back to dark for missing or invalid values', () => {
    expect(normalizePreference(undefined)).toBe('dark');
    expect(normalizePreference('purple')).toBe('dark');
    expect(normalizePreference('light')).toBe('light');
    expect(normalizePreference('system')).toBe('system');
  });

  it('applies the initial preference to <html>', () => {
    render(<ThemeProvider initialPreference="dark"><ThemeRow /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('radio', { name: /Dark/ })).toBeChecked();
  });

  it('switches immediately and persists the choice in a cookie', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider initialPreference="dark"><ThemeRow /></ThemeProvider>);

    await user.click(screen.getByRole('radio', { name: /Light/ }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.cookie).toContain(`${THEME_COOKIE}=light`);
  });

  it('resolves "system" from the OS color scheme', async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    render(<ThemeProvider initialPreference="dark"><ThemeRow /></ThemeProvider>);

    await user.click(screen.getByRole('radio', { name: /System/ }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themePref).toBe('system');
    expect(document.cookie).toContain(`${THEME_COOKIE}=system`);
  });
});

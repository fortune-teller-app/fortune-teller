import { Cormorant_Garamond, Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { THEME_COOKIE, THEME_INIT_SCRIPT, normalizePreference } from '../lib/theme';
import '../styles/globals.css';

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Noctua',
  description: 'A private oracle for the curious.',
  icons: { icon: '/favicon.svg' },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const preference = normalizePreference(cookieStore.get(THEME_COOKIE)?.value);

  return (
    // data-theme is server-rendered for explicit choices so the first paint is
    // correct. "system" can only be resolved in the browser, so the inline script
    // below sets it before paint; suppressHydrationWarning covers that attribute.
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable}`}
      data-theme={preference === 'system' ? undefined : preference}
      data-theme-pref={preference}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider initialPreference={preference}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

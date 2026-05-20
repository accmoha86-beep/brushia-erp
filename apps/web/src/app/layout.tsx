import type { Metadata, Viewport } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { Providers } from '@/providers/providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: {
    default: 'Brushia ERP',
    template: '%s | Brushia ERP',
  },
  description: 'Enterprise Beauty & Cosmetics Management Platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <body className="font-sans antialiased bg-surface text-slate-900 dark:bg-dark dark:text-slate-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

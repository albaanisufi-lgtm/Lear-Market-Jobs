import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LEAR MARKET — Karriera',
  description: 'Aplikoni për punë në LEAR MARKET.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LEAR MARKET',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f2d5c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

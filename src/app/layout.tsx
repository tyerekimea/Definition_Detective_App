
import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers';
import Header from '@/components/header';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Definition Detective',
  description: 'An endless word puzzle game with a twist.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400;1,7..72,700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0f172a" />
        {/* Google AdSense */}
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2955575113938000"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Monetag Tag */}
        <Script 
          src="https://quge5.com/88/tag.min.js" 
          data-zone="205412" 
          async 
          data-cfasync="false"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>
          <div className="relative flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
        <Script
          id="monetag-sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('Monetag SW registered'))
                  .catch(err => console.log('Monetag SW registration failed:', err));
              }
            `
          }}
        />
      </body>
    </html>
  );
}

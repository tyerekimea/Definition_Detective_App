import type { Metadata } from 'next';
import { Inter, Literata } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import Header from '@/components/header';
import PremiumAwareAds from '@/components/ads/PremiumAwareAds';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const literata = Literata({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-literata',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://traylapps.com'),
  title: 'Definition Detective',
  description: 'An endless word puzzle game with a twist.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://traylapps.com/',
    title: 'Definition Detective',
    description: 'An endless word puzzle game with a twist.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Definition Detective',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Definition Detective',
    description: 'An endless word puzzle game with a twist.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Definition Detective",
    description: "An endless word puzzle game with a twist. Unscramble the definition and guess the word.",
    url: "https://traylapps.com/",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    inLanguage: "en",
    genre: "Word game",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} ${literata.variable} font-body antialiased bg-background text-foreground`}>
        <Providers>
          <div className="relative flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 min-h-0">{children}</main>
            <PremiumAwareAds />
          </div>
        </Providers>
      </body>
    </html>
  );
}

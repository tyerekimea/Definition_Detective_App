import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/profile', '/login', '/signup'],
    },
    sitemap: 'https://traylapps.com/sitemap.xml',
  };
}

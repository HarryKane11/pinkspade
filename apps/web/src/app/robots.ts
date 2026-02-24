import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/workspace',
          '/onboarding',
          '/login',
          '/campaign/',
          '/studio/',
          '/brand-dna/extracted',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://pinkspade.co/sitemap.xml',
  };
}

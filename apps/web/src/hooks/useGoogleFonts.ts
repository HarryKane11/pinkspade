import { useState, useEffect } from 'react';

interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}

// Popular fonts to show first (curated list)
const POPULAR_FONTS = [
  'Pretendard',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Source Sans 3',
  'Noto Sans',
  'Noto Sans KR',
  'Ubuntu',
  'Merriweather',
  'PT Sans',
  'Rubik',
  'Work Sans',
  'Fira Sans',
  'Quicksand',
  'Barlow',
  'Mulish',
  'DM Sans',
  'Josefin Sans',
  'Cabin',
  'Karla',
  'Libre Baskerville',
  'Crimson Text',
  'IBM Plex Sans',
  'Space Grotesk',
  'Manrope',
  'Plus Jakarta Sans',
  'Outfit',
  'Sora',
  'Albert Sans',
];

let cachedFonts: GoogleFont[] | null = null;

export function useGoogleFonts() {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cachedFonts) {
      setFonts(cachedFonts);
      setIsLoading(false);
      return;
    }

    const fetchFonts = async () => {
      try {
        const res = await fetch(
          'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ-20&sort=popularity'
        );
        if (!res.ok) throw new Error('Failed to fetch fonts');

        const data = await res.json();
        const googleFonts: GoogleFont[] = data.items.map((item: { family: string; variants: string[]; category: string }) => ({
          family: item.family,
          variants: item.variants,
          category: item.category,
        }));

        // Add Pretendard at the top (it's not in Google Fonts)
        const allFonts: GoogleFont[] = [
          { family: 'Pretendard', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], category: 'sans-serif' },
          ...googleFonts,
        ];

        cachedFonts = allFonts;
        setFonts(allFonts);
      } catch {
        // Fallback to popular fonts only
        const fallback = POPULAR_FONTS.map((f) => ({
          family: f,
          variants: ['regular', '700'],
          category: 'sans-serif',
        }));
        setFonts(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFonts();
  }, []);

  return { fonts, isLoading, popularFonts: POPULAR_FONTS };
}

/** Load a Google Font dynamically via <link> tag */
export function loadGoogleFont(family: string) {
  if (family === 'Pretendard') return; // Already loaded locally

  const id = `gfont-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Pink Spade — AI 브랜드 디자인 자동화 스튜디오';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #3F3F46 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Decorative dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Accent gradient circle */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
            opacity: 0.15,
            filter: 'blur(80px)',
          }}
        />

        {/* Spade icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #EC4899, #DB2777)',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(236, 72, 153, 0.3)',
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="white"
          >
            <path d="M12 2C12 2 4 10 4 14C4 17.5 7 19 9.5 17.5C10.5 16.8 11 15.5 11 14C11 14 11.5 17 9 20C8.5 20.7 9 22 10 22H14C15 22 15.5 20.7 15 20C12.5 17 13 14 13 14C13 15.5 13.5 16.8 14.5 17.5C17 19 20 17.5 20 14C20 10 12 2 12 2Z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.04em',
            marginBottom: 16,
          }}
        >
          Pink Spade
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: '#A1A1AA',
            letterSpacing: '-0.02em',
          }}
        >
          AI 브랜드 디자인 자동화 스튜디오
        </div>

        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
          }}
        >
          {['브랜드 DNA 추출', '멀티채널 에셋 생성', '컴플라이언스 가드'].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  padding: '8px 20px',
                  borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#D4D4D8',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}

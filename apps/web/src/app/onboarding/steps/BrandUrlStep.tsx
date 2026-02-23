'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Loader2, CheckCircle2 } from 'lucide-react'
import { saveBrand } from '@/lib/brand-storage'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`)
    return !!url.hostname.includes('.')
  } catch {
    return false
  }
}

function getDomain(str: string): string {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`)
    return url.hostname
  } catch {
    return ''
  }
}

type ExtractionPhase = 'idle' | 'scanning' | 'colors' | 'typography' | 'voice' | 'done' | 'error'

const phaseLabels: Record<ExtractionPhase, string> = {
  idle: '',
  scanning: 'DOM 구조 분석 중...',
  colors: '컬러 팔레트 추출 중...',
  typography: '타이포그래피 식별 중...',
  voice: '브랜드 톤 정의 중...',
  done: '추출 완료!',
  error: '추출에 실패했습니다. 건너뛰어도 됩니다.',
}

export default function BrandUrlStep({ data, update, onNext }: Props) {
  const [showFavicon, setShowFavicon] = useState(false)
  const [phase, setPhase] = useState<ExtractionPhase>('idle')
  const [extractedColors, setExtractedColors] = useState<string[]>([])
  const domain = getDomain(data.brandUrl)
  const validUrl = isValidUrl(data.brandUrl)
  const extracting = phase !== 'idle' && phase !== 'done' && phase !== 'error'

  useEffect(() => {
    setShowFavicon(isValidUrl(data.brandUrl))
  }, [data.brandUrl])

  const handleExtract = useCallback(async () => {
    if (!validUrl) {
      onNext()
      return
    }

    setPhase('scanning')

    // Animate through phases while API works
    const timers = [
      setTimeout(() => setPhase('colors'), 2000),
      setTimeout(() => setPhase('typography'), 4500),
      setTimeout(() => setPhase('voice'), 7000),
    ]

    try {
      const res = await fetch('/api/brand-dna/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.brandUrl }),
      })

      timers.forEach(clearTimeout)

      if (res.ok) {
        const result = await res.json()
        const brandDna = result.brandDna

        // Show extracted colors briefly
        const colors = [
          brandDna?.colors?.primary,
          brandDna?.colors?.secondary,
          brandDna?.colors?.accent,
        ].filter(Boolean)
        setExtractedColors(colors)

        // Store to sessionStorage (for immediate use)
        sessionStorage.setItem('brandDna', JSON.stringify(brandDna))
        sessionStorage.setItem('brandDnaMeta', JSON.stringify(result.metadata))
        sessionStorage.setItem('brandDnaUrl', domain)

        // Persist to Supabase (with localStorage fallback)
        const saved = await saveBrand({
          brandName: brandDna.brandName || domain,
          websiteUrl: domain,
          extractedAt: new Date().toISOString(),
          colors: brandDna.colors ?? {},
          typography: brandDna.typography ?? {},
          tone: brandDna.tone ?? {},
        })
        if (saved) {
          sessionStorage.setItem('activeBrandId', saved.id)
        }

        setPhase('done')
        setTimeout(onNext, 1200)
      } else {
        setPhase('error')
      }
    } catch {
      timers.forEach(clearTimeout)
      setPhase('error')
    }
  }, [validUrl, data.brandUrl, domain, onNext])

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-xl font-semibold text-zinc-900 mb-1 text-center"
      >
        브랜드 웹사이트가 있으신가요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm text-zinc-400 mb-8 text-center"
      >
        웹사이트에서 브랜드 DNA를 자동으로 추출합니다
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative"
      >
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
          {showFavicon && domain ? (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              width={16}
              height={16}
              className="rounded-sm"
              onError={() => setShowFavicon(false)}
            />
          ) : (
            <Globe size={16} className="text-zinc-400" />
          )}
        </div>
        <input
          type="url"
          value={data.brandUrl}
          onChange={(e) => update('brandUrl', e.target.value)}
          placeholder="https://example.com"
          disabled={extracting}
          className="input disabled:opacity-60"
          style={{ paddingLeft: '2.5rem' }}
        />
      </motion.div>

      {/* Favicon + domain indicator */}
      {showFavicon && domain && phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 flex items-center gap-2 text-xs text-zinc-400"
        >
          <div className="w-1 h-1 rounded-full bg-green-400" />
          {domain}
        </motion.div>
      )}

      {/* Extraction progress */}
      <AnimatePresence mode="wait">
        {phase !== 'idle' && (
          <motion.div
            key="extraction"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              {phase === 'done' ? (
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              ) : phase === 'error' ? (
                <div className="w-[18px] h-[18px] rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
              ) : (
                <Loader2 size={18} className="text-pink-500 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${phase === 'error' ? 'text-red-500' : phase === 'done' ? 'text-green-600' : 'text-zinc-700'}`}>
                  {phaseLabels[phase]}
                </p>
                {/* Show extracted colors */}
                {phase === 'done' && extractedColors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 mt-2"
                  >
                    {extractedColors.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <span className="text-xs text-zinc-400 ml-1">추출됨</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Progress dots */}
            {extracting && (
              <div className="flex justify-center gap-1.5 mt-3">
                {(['scanning', 'colors', 'typography', 'voice'] as const).map((p, i) => {
                  const phases: ExtractionPhase[] = ['scanning', 'colors', 'typography', 'voice']
                  const currentIdx = phases.indexOf(phase)
                  const active = i <= currentIdx
                  return (
                    <div
                      key={p}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        active ? 'bg-pink-500' : 'bg-zinc-200'
                      }`}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="mt-8 flex items-center justify-between"
      >
        <button
          onClick={onNext}
          disabled={extracting}
          className="text-sm text-zinc-400 hover:text-zinc-500 transition-colors disabled:opacity-30"
        >
          아직 없어요
        </button>
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="btn btn-primary btn-md px-6 disabled:opacity-50"
        >
          {extracting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            validUrl ? 'DNA 추출하기' : '다음'
          )}
        </button>
      </motion.div>
    </div>
  )
}

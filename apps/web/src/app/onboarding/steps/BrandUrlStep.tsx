'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
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

export default function BrandUrlStep({ data, update, onNext }: Props) {
  const [showFavicon, setShowFavicon] = useState(false)
  const domain = getDomain(data.brandUrl)

  useEffect(() => {
    setShowFavicon(isValidUrl(data.brandUrl))
  }, [data.brandUrl])

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
        브랜드 DNA 추출에 활용됩니다
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative"
      >
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
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
          className="input pl-10"
        />
      </motion.div>

      {showFavicon && domain && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 flex items-center gap-2 text-xs text-zinc-400"
        >
          <div className="w-1 h-1 rounded-full bg-green-400" />
          {domain}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="mt-8 flex items-center justify-between"
      >
        <button onClick={onNext} className="text-sm text-zinc-400 hover:text-zinc-500 transition-colors">
          아직 없어요
        </button>
        <button
          onClick={onNext}
          className="btn btn-primary btn-md px-6"
        >
          다음
        </button>
      </motion.div>
    </div>
  )
}

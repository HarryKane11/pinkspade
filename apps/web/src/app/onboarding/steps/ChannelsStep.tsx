'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
}

const channels = [
  { id: 'instagram', label: '인스타그램', color: '#E4405F' },
  { id: 'kakao', label: '카카오', color: '#FEE500' },
  { id: 'naver', label: '네이버', color: '#03C75A' },
  { id: 'coupang', label: '쿠팡', color: '#E31937' },
  { id: 'youtube', label: '유튜브', color: '#FF0000' },
  { id: 'facebook', label: '페이스북', color: '#1877F2' },
  { id: 'google', label: '구글 Ads', color: '#4285F4' },
  { id: 'linkedin', label: '링크드인', color: '#0A66C2' },
]

export default function ChannelsStep({ data, update, onNext }: Props) {
  const toggle = useCallback((id: string) => {
    const current = data.channels
    if (current.includes(id)) {
      update('channels', current.filter(c => c !== id))
    } else {
      update('channels', [...current, id])
    }
  }, [data.channels, update])

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-xl font-semibold text-zinc-900 mb-1 text-center"
      >
        주로 어떤 채널에 디자인을 사용하시나요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm text-zinc-400 mb-8 text-center"
      >
        채널에 맞는 사이즈를 자동 추천해 드려요
      </motion.p>

      <div className="grid grid-cols-2 gap-2.5">
        {channels.map((ch, i) => {
          const selected = data.channels.includes(ch.id)
          return (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={() => toggle(ch.id)}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: ch.color }}
              />
              <span className={`text-sm font-medium ${selected ? 'text-pink-600' : 'text-zinc-700'}`}>
                {ch.label}
              </span>
              {selected && (
                <Check size={14} className="absolute right-3 text-pink-500" />
              )}
            </motion.button>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mt-6 flex items-center justify-between"
      >
        <button onClick={onNext} className="text-sm text-zinc-400 hover:text-zinc-500 transition-colors">
          건너뛰기
        </button>
        <button
          onClick={onNext}
          disabled={data.channels.length === 0}
          className="btn btn-primary btn-md px-6 disabled:opacity-30"
        >
          다음
        </button>
      </motion.div>
    </div>
  )
}

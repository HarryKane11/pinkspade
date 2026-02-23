'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Coffee, Monitor, ShoppingBag, GraduationCap, Heart, Building2, Banknote, Plane, MoreHorizontal } from 'lucide-react'
import { Check } from 'lucide-react'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
}

const industries = [
  { id: 'beauty', label: '뷰티·패션', icon: Sparkles },
  { id: 'fnb', label: 'F&B', icon: Coffee },
  { id: 'tech', label: '테크·IT', icon: Monitor },
  { id: 'ecommerce', label: '이커머스', icon: ShoppingBag },
  { id: 'education', label: '교육', icon: GraduationCap },
  { id: 'healthcare', label: '헬스케어', icon: Heart },
  { id: 'realestate', label: '부동산', icon: Building2 },
  { id: 'finance', label: '금융', icon: Banknote },
  { id: 'travel', label: '여행', icon: Plane },
  { id: 'other', label: '기타', icon: MoreHorizontal },
]

export default function IndustryStep({ data, update, onNext }: Props) {
  const toggle = useCallback((id: string) => {
    const current = data.industries
    if (current.includes(id)) {
      update('industries', current.filter(i => i !== id))
    } else {
      update('industries', [...current, id])
    }
  }, [data.industries, update])

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-xl font-semibold text-zinc-900 mb-1 text-center"
      >
        어떤 업종에서 활동하시나요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm text-zinc-400 mb-8 text-center"
      >
        여러 개 선택 가능합니다
      </motion.p>

      <div className="grid grid-cols-2 gap-2.5">
        {industries.map((item, i) => {
          const Icon = item.icon
          const selected = data.industries.includes(item.id)
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.03, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={() => toggle(item.id)}
              className={`relative flex items-center gap-2.5 p-3.5 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <Icon size={18} className={selected ? 'text-pink-500' : 'text-zinc-400'} />
              <span className={`text-sm font-medium ${selected ? 'text-pink-600' : 'text-zinc-700'}`}>
                {item.label}
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
          disabled={data.industries.length === 0}
          className="btn btn-primary btn-md px-6 disabled:opacity-30"
        >
          다음
        </button>
      </motion.div>
    </div>
  )
}

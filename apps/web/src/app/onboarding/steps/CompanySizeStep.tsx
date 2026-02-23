'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
}

const sizes = [
  { id: '1', label: '1인' },
  { id: '2-10', label: '2-10명' },
  { id: '11-50', label: '11-50명' },
  { id: '51-200', label: '51-200명' },
  { id: '200+', label: '200명+' },
]

export default function CompanySizeStep({ data, update, onNext }: Props) {
  const select = useCallback((id: string) => {
    update('companySize', id)
    setTimeout(onNext, 400)
  }, [update, onNext])

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-xl font-semibold text-zinc-900 mb-1 text-center"
      >
        회사 규모가 어떻게 되나요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm text-zinc-400 mb-8 text-center"
      >
        팀 규모에 맞는 경험을 제공할게요
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-wrap justify-center gap-2.5"
      >
        {sizes.map((size) => {
          const selected = data.companySize === size.id
          return (
            <button
              key={size.id}
              onClick={() => select(size.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selected
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {size.label}
            </button>
          )
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="mt-8 text-center"
      >
        <button onClick={onNext} className="text-sm text-zinc-400 hover:text-zinc-500 transition-colors">
          건너뛰기
        </button>
      </motion.div>
    </div>
  )
}

'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
}

const goals = [
  { id: 'brand_consistency', label: '브랜드 일관성 유지' },
  { id: 'ad_creative', label: '광고 소재 제작' },
  { id: 'sns_content', label: 'SNS 콘텐츠 제작' },
  { id: 'detail_page', label: '상세페이지 제작' },
  { id: 'other', label: '기타' },
]

export default function GoalsStep({ data, update, onNext }: Props) {
  const toggle = useCallback((id: string) => {
    const current = data.goals
    if (current.includes(id)) {
      update('goals', current.filter(g => g !== id))
    } else {
      update('goals', [...current, id])
    }
  }, [data.goals, update])

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-xl font-semibold text-zinc-900 mb-1 text-center"
      >
        Pink Spade로 무엇을 하고 싶으신가요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm text-zinc-400 mb-8 text-center"
      >
        목표에 맞게 워크플로우를 구성해 드릴게요
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-wrap justify-center gap-2.5"
      >
        {goals.map((goal) => {
          const selected = data.goals.includes(goal.id)
          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal.id)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                selected
                  ? 'border-pink-500 bg-pink-50 text-pink-600'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              {goal.label}
            </button>
          )
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-8 flex items-center justify-between"
      >
        <button onClick={onNext} className="text-sm text-zinc-400 hover:text-zinc-500 transition-colors">
          건너뛰기
        </button>
        <button
          onClick={onNext}
          disabled={data.goals.length === 0}
          className="btn btn-primary btn-md px-6 disabled:opacity-30"
        >
          다음
        </button>
      </motion.div>
    </div>
  )
}

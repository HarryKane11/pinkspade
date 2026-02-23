'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Palette, Briefcase, Video, MoreHorizontal } from 'lucide-react'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
}

const roles = [
  { id: 'marketer', label: '마케터', icon: Megaphone },
  { id: 'designer', label: '디자이너', icon: Palette },
  { id: 'founder', label: '대표·창업자', icon: Briefcase },
  { id: 'creator', label: '콘텐츠 크리에이터', icon: Video },
  { id: 'other', label: '기타', icon: MoreHorizontal },
]

export default function RoleStep({ data, update, onNext }: Props) {
  const select = useCallback((id: string) => {
    update('role', id)
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
        어떤 일을 하고 계신가요?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-sm text-zinc-400 mb-8 text-center"
      >
        맞춤 추천을 위해 알려주세요
      </motion.p>

      <div className="grid grid-cols-2 gap-3">
        {roles.map((role, i) => {
          const Icon = role.icon
          const selected = data.role === role.id
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={() => select(role.id)}
              className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-200 ${
                selected
                  ? 'border-pink-500 bg-pink-50 scale-[1.02]'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Icon size={22} className={selected ? 'text-pink-500' : 'text-zinc-400'} />
              <span className={`text-sm font-medium ${selected ? 'text-pink-600' : 'text-zinc-700'}`}>
                {role.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-6 text-center"
      >
        <button onClick={onNext} className="text-sm text-zinc-400 hover:text-zinc-500 transition-colors">
          건너뛰기
        </button>
      </motion.div>
    </div>
  )
}

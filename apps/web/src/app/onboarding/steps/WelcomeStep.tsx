'use client'

import { motion } from 'framer-motion'
import type { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  onNext: () => void
  userName: string
}

export default function WelcomeStep({ data, update, onNext, userName }: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="mb-8"
      >
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z" fill="white" />
            <path d="M12 6c-2 0-4 2-4 4 0 3 4 6 4 6s4-3 4-6c0-2-2-4-4-4z" fill="#18181b" />
          </svg>
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-2xl font-semibold text-zinc-900 mb-2"
      >
        반갑습니다{userName ? `, ${userName}님` : ''}!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-zinc-400 text-sm mb-8"
      >
        Pink Spade와 함께 브랜드를 완성하세요
      </motion.p>

      {/* Name input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-xs mb-8"
      >
        <label className="block text-xs text-zinc-400 mb-2 text-left">표시 이름</label>
        <input
          type="text"
          value={data.displayName}
          onChange={(e) => update('displayName', e.target.value)}
          placeholder="이름을 입력하세요"
          className="input text-center"
        />
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={onNext}
        className="btn btn-primary btn-lg px-10"
      >
        시작하기
      </motion.button>
    </div>
  )
}

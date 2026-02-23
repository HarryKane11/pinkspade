'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import WelcomeStep from './steps/WelcomeStep'
import RoleStep from './steps/RoleStep'
import CompanySizeStep from './steps/CompanySizeStep'
import IndustryStep from './steps/IndustryStep'
import BrandUrlStep from './steps/BrandUrlStep'
import ChannelsStep from './steps/ChannelsStep'
import GoalsStep from './steps/GoalsStep'
import CompleteStep from './steps/CompleteStep'

export interface OnboardingData {
  displayName: string
  role: string
  companySize: string
  industries: string[]
  brandUrl: string
  channels: string[]
  goals: string[]
}

const TOTAL_STEPS = 8

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [saving, setSaving] = useState(false)
  const [userName, setUserName] = useState('')
  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    role: '',
    companySize: '',
    industries: [],
    brandUrl: '',
    channels: [],
    goals: [],
  })

  // Load user info on mount
  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
        setUserName(name)
        setData(d => ({ ...d, displayName: name }))
      }
    }
    loadUser()
  }, [])

  const next = useCallback(() => {
    setDirection(1)
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const back = useCallback(() => {
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }, [])

  const update = useCallback(<K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData(d => ({ ...d, [field]: value }))
  }, [])

  const complete = useCallback(async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('profiles').update({
        display_name: data.displayName,
        onboarding_completed: true,
        onboarding_data: {
          role: data.role,
          company_size: data.companySize,
          industries: data.industries,
          brand_url: data.brandUrl,
          channels: data.channels,
          goals: data.goals,
        },
      }).eq('id', user.id)

      router.push('/workspace')
    } catch {
      setSaving(false)
    }
  }, [data, router])

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  const stepComponents = [
    <WelcomeStep key="welcome" data={data} update={update} onNext={next} userName={userName} />,
    <RoleStep key="role" data={data} update={update} onNext={next} />,
    <CompanySizeStep key="company" data={data} update={update} onNext={next} />,
    <IndustryStep key="industry" data={data} update={update} onNext={next} />,
    <BrandUrlStep key="brand" data={data} update={update} onNext={next} />,
    <ChannelsStep key="channels" data={data} update={update} onNext={next} />,
    <GoalsStep key="goals" data={data} update={update} onNext={next} />,
    <CompleteStep key="complete" onComplete={complete} saving={saving} />,
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="noise-bg" />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-400 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>

      {/* Back button */}
      <AnimatePresence>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onClick={back}
            className="fixed top-6 left-6 z-50 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>뒤로</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Step counter */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="fixed top-6 right-6 z-50 text-xs text-zinc-300 font-medium">
          {step} / {TOTAL_STEPS - 2}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {stepComponents[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

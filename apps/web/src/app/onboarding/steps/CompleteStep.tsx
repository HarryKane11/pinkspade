'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface Props {
  onComplete: () => void
  saving: boolean
}

function createConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#ec4899', '#f472b6', '#18181b', '#a1a1aa', '#fbbf24', '#f9a8d4']
  const particles: Array<{
    x: number; y: number; w: number; h: number
    vx: number; vy: number; rot: number; vr: number
    color: string; alpha: number
  }> = []

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 - 100,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    })
  }

  let animId: number
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const p of particles) {
      p.vy += 0.25
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.alpha -= 0.005
      if (p.alpha <= 0) continue
      alive = true
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (alive) animId = requestAnimationFrame(animate)
  }
  animate()

  return () => cancelAnimationFrame(animId)
}

export default function CompleteStep({ onComplete, saving }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const cleanup = createConfetti(canvasRef.current)
    return cleanup
  }, [])

  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      {/* Check circle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-pink-200"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
        >
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-2xl font-semibold text-zinc-900 mb-2"
      >
        준비 완료!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-sm text-zinc-400 mb-10"
      >
        워크스페이스가 준비되었습니다
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={onComplete}
        disabled={saving}
        className="btn btn-primary btn-lg px-10 relative"
      >
        {saving ? (
          <>
            <span className="opacity-0">워크스페이스로 이동</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="spinner w-5 h-5" />
            </div>
          </>
        ) : (
          '워크스페이스로 이동'
        )}
      </motion.button>
    </div>
  )
}

'use client';

import { useEffect, useRef, useState } from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  delay?: number;
  color?: 'dark' | 'light';
}

export function MetricBar({ label, value, delay = 0, color = 'dark' }: MetricBarProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const barColor = color === 'dark' ? 'bg-zinc-900' : 'bg-zinc-300';
  const textColor = value >= 50 ? 'text-zinc-900 font-semibold' : 'text-zinc-400 font-semibold';

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest">
        <span className="text-zinc-500 font-medium">{label}</span>
        <span className={textColor}>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-200/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full metric-bar-fill ${animated ? 'animate-bar' : ''}`}
          style={{
            width: `${value}%`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

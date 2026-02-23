import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  borderGradient?: boolean;
}

export function GlassCard({ children, className, borderGradient = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-white/90 to-white/40 rounded-3xl backdrop-blur-xl shadow-sm',
        className
      )}
      style={
        borderGradient
          ? {
              position: 'relative',
              '--border-gradient':
                'linear-gradient(135deg, rgba(24,24,27,0.06), rgba(24,24,27,0))',
              '--border-radius-before': '1.5rem',
            } as React.CSSProperties
          : undefined
      }
    >
      {children}
    </div>
  );
}

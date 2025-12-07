import { useCountdown } from '@/hooks/useCountdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: string;
  compact?: boolean;
  className?: string;
}

const TimeUnit = ({ value, label, compact }: { value: number; label: string; compact?: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "relative overflow-hidden rounded-lg bg-muted/50 border border-border",
      compact ? "px-2 py-1 min-w-[40px]" : "px-4 py-3 min-w-[70px]"
    )}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "block font-display font-bold text-foreground tabular-nums",
            compact ? "text-lg" : "text-3xl md:text-4xl"
          )}
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className={cn(
      "text-muted-foreground uppercase tracking-wider mt-1",
      compact ? "text-[10px]" : "text-xs"
    )}>
      {label}
    </span>
  </div>
);

const Separator = ({ compact }: { compact?: boolean }) => (
  <span className={cn(
    "text-primary font-bold self-start mt-3",
    compact ? "text-lg" : "text-3xl"
  )}>
    :
  </span>
);

export const CountdownTimer = ({ targetDate, compact = false, className }: CountdownTimerProps) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        <span className="status-badge status-passed">Show Passed</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 md:gap-2", className)}>
      {days > 0 && (
        <>
          <TimeUnit value={days} label="Days" compact={compact} />
          <Separator compact={compact} />
        </>
      )}
      <TimeUnit value={hours} label="Hrs" compact={compact} />
      <Separator compact={compact} />
      <TimeUnit value={minutes} label="Min" compact={compact} />
      <Separator compact={compact} />
      <TimeUnit value={seconds} label="Sec" compact={compact} />
    </div>
  );
};

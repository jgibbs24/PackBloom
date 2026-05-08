import { useEffect, useState } from 'react';

type AnimatedCurrencyProps = {
  value: number;
  className?: string;
  prefix?: string;
};

export function AnimatedCurrency({ value, className = '', prefix = '$' }: AnimatedCurrencyProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const startValue = displayValue;
    const difference = value - startValue;
    const durationMs = 650;
    let animationFrame = 0;
    let startTime = 0;

    function animate(timestamp: number) {
      if (startTime === 0) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + difference * easedProgress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <span className={className}>
      {prefix}{Math.abs(displayValue).toFixed(2)}
    </span>
  );
}

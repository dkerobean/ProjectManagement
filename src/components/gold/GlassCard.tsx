import React from 'react';
import { Card } from '@/components/ui/Card';
import classNames from 'classnames';

interface GlassCardProps extends React.ComponentProps<typeof Card> {
  variant?: 'default' | 'gold' | 'dark';
}

const GlassCard = ({ children, className, variant = 'default', ...props }: GlassCardProps) => {
  const variants = {
    default: 'bg-gray-900/40 border-gray-800/50',
    gold: 'bg-amber-900/10 border-amber-600/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    dark: 'bg-black/60 border-white/5',
  };

  return (
    <Card
      className={classNames(
        'backdrop-blur-xl border transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};

export default GlassCard;

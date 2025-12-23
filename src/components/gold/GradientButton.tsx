import React from 'react';
import { Button } from '@/components/ui/Button';
import classNames from 'classnames';

type VariantType = 'gold' | 'danger' | 'success' | 'dark';

interface GradientButtonProps extends React.ComponentProps<typeof Button> {
  variantType?: VariantType;
  glow?: boolean;
}

const GradientButton = ({ 
  children, 
  className, 
  variantType = 'gold', 
  glow = false,
  ...props 
}: GradientButtonProps) => {
  
  const variants = {
    gold: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black border-none',
    danger: 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-none',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white border-none',
    dark: 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 border',
  };

  const glowEffects = {
    gold: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    danger: 'shadow-[0_0_15px_rgba(220,38,38,0.4)]',
    success: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    dark: '',
  };

  return (
    <Button
      className={classNames(
        'transition-all duration-300 font-bold tracking-wide active:scale-95',
        variants[variantType],
        glow && glowEffects[variantType],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default GradientButton;

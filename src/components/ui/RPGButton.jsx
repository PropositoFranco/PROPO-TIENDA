import { motion } from 'framer-motion';

/**
 * Gold RPG-style button.
 * Variants: default, purple
 */
export default function RPGButton({
  children,
  variant = 'default',
  onClick,
  disabled = false,
  className = '',
  fullWidth = false,
}) {
  const base =
    'relative overflow-hidden font-cinzel font-bold uppercase tracking-[4px] cursor-pointer transition-all duration-300 rounded-[10px] select-none';

  const variants = {
    default: `px-6 py-4 bg-gradient-to-br from-gold-darkest via-gold-bright to-gold text-dark-900 
      shadow-[0_4px_0_rgba(0,0,0,0.4),0_6px_20px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]
      hover:shadow-[0_8px_30px_rgba(212,175,55,0.6)] hover:-translate-y-[2px]
      active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.4)]
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`,

    purple: `px-6 py-4 bg-gradient-to-br from-purple-dark via-purple to-purple-deep text-purple-light
      shadow-[0_4px_0_rgba(0,0,0,0.4),0_8px_25px_rgba(147,51,234,0.45)]
      hover:shadow-[0_8px_30px_rgba(147,51,234,0.6)] hover:-translate-y-[2px]
      active:translate-y-[2px]`,

    ghost: `px-3 py-2 bg-transparent text-purple-muted text-[9px] tracking-[2px]
      hover:text-gold-light transition-colors`,
  };

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {/* Shine animation */}
      <span
        className="absolute top-0 left-[-100%] w-[60%] h-full 
          bg-gradient-to-r from-transparent via-white/30 to-transparent 
          -skew-x-[20deg] pointer-events-none
          animate-[bswipe_3s_ease-in-out_infinite]"
      />
      {children}
    </motion.button>
  );
}

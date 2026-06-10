import { motion } from 'framer-motion';

/**
 * RPG Panel — ornamental box with corner decorations, shimmer lines, and glow.
 * Used as the base container for login, register steps, and other content.
 */
export default function RPGPanel({
  children,
  className = '',
  title,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative w-full bg-gradient-to-br from-dark-400/95 to-dark-800/98 
        border border-gold/28 rounded-2xl p-6 overflow-hidden
        shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(160,100,255,0.07)]
        ${className}`}
    >
      {/* Shimmer lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple/30 to-transparent animate-[shimmer_3s_ease-in-out_infinite] [animation-delay:1.5s]" />

      {/* Corner ornaments */}
      <div className="absolute top-[7px] left-[7px] w-[18px] h-[18px] border-t-2 border-l-2 border-gold/50 rounded-tl-[3px]" />
      <div className="absolute top-[7px] right-[7px] w-[18px] h-[18px] border-t-2 border-r-2 border-gold/50 rounded-tr-[3px]" />
      <div className="absolute bottom-[7px] left-[7px] w-[18px] h-[18px] border-b-2 border-l-2 border-gold/50 rounded-bl-[3px]" />
      <div className="absolute bottom-[7px] right-[7px] w-[18px] h-[18px] border-b-2 border-r-2 border-gold/50 rounded-br-[3px]" />

      {/* Panel glow */}
      <div className="absolute -top-[50%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-radial-gradient from-purple/10 to-transparent pointer-events-none" />

      {/* Title */}
      {title && (
        <div className="font-cinzel text-[13px] tracking-[3px] text-gold-dark uppercase text-center mb-5">
          {title}
        </div>
      )}

      {children}
    </motion.div>
  );
}

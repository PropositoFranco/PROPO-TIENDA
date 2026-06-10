import { motion } from 'framer-motion';
import { useMaestroAsset } from '../../hooks/useAssetLayer';

/**
 * Maestro character — floating animated guide.
 * Renders an SVG placeholder until the real asset is provided.
 */
export default function Maestro({ size = 'default', className = '' }) {
  const svgPlaceholder = useMaestroAsset();
  const isEntrance = size === 'entrance';

  const sizes = {
    default: 'w-[120px] h-[160px]',
    large: 'w-[200px] h-[260px]',
    entrance: 'w-[200px] h-[260px]',
    hub: 'w-[100px] h-[130px]',
  };

  return (
    <motion.div
      className={`${sizes[size]} relative ${className}`}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Glow aura behind Maestro */}
      <div
        className="absolute inset-0 scale-110 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(160,100,255,0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* SVG placeholder — replace with real asset when available */}
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: svgPlaceholder }}
        style={{
          filter: 'drop-shadow(0 0 20px rgba(160,100,255,0.5)) drop-shadow(0 30px 50px rgba(0,0,0,0.9))',
          animation: isEntrance
            ? 'maestroEntrance 0.9s cubic-bezier(0.34,1.56,0.64,1) both, maestroFloat 3.5s 1s ease-in-out infinite, maestroBreathe 4s 1s ease-in-out infinite'
            : 'maestroFloat 3.5s ease-in-out infinite, maestroBreathe 4s ease-in-out infinite',
          transformOrigin: 'bottom center',
        }}
      />
    </motion.div>
  );
}

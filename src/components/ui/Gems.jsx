const GEM_COLORS = [
  'from-rose-400 to-rose-900 shadow-rose-500/60',
  'from-green-400 to-green-800 shadow-green-500/60',
  'from-purple-400 to-purple-900 shadow-purple-500/80',
  'from-blue-400 to-blue-900 shadow-blue-400/60',
  'from-amber-400 to-amber-900 shadow-amber-400/60',
];

/**
 * Animated gem row. Shows the 5 colored gems of T-STORE.
 */
export default function Gems({ size = 'sm', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 gap-[7px]',
    md: 'w-7 h-7 gap-3',
    lg: 'w-8 h-8 gap-3',
  };

  return (
    <div className={`flex ${sizes[size]} ${className}`}>
      {GEM_COLORS.map((color, i) => (
        <div
          key={i}
          className={`${sizes[size].split(' ')[0]} ${sizes[size].split(' ')[1]} 
            rounded-full relative bg-gradient-to-br ${color} flex-shrink-0`}
          style={{
            animation: 'gemPulse 2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        >
          {/* Inner shine */}
          <div
            className="absolute inset-[3px] rounded-full bg-white/25"
            style={{
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4), transparent)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

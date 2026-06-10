export default function RPGInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  error,
  className = '',
  center = false,
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block font-cinzel text-[11px] tracking-[2px] text-purple-muted uppercase mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gold/50 text-sm pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3.5 bg-dark-900/90 border border-gold/20 rounded-lg 
            text-gold-light text-[13px] outline-none transition-all duration-300
            placeholder:text-gold/20 placeholder:font-crimson placeholder:italic placeholder:text-sm
            focus:border-gold/60 focus:bg-dark-800/97 
            focus:shadow-[0_0_0_3px_rgba(212,175,55,0.07),0_0_18px_rgba(212,175,55,0.12)]
            ${error ? 'border-red-500/50 animate-[shake_0.4s_ease]' : ''}
            ${center && type !== 'password' ? 'text-center tracking-[4px] text-lg uppercase font-cinzel' : ''}
            ${center && type === 'password' ? 'text-center tracking-[4px] text-lg font-mono' : ''}
            ${!center ? 'font-cinzel' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-red-400 text-[10px] font-cinzel tracking-[1px] mt-1 -mb-2">
          {error}
        </p>
      )}
    </div>
  );
}
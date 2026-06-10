import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';

/**
 * Global toast notification layer.
 */
export default function ToastLayer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`
              px-5 py-3.5 rounded-xl font-cinzel text-xs tracking-[1px]
              shadow-[0_8px_30px_rgba(34,197,94,0.3)]
              ${toast.type === 'success'
                ? 'bg-gradient-to-br from-green-900 to-green-700 border border-green-500 text-green-400'
                : 'bg-gradient-to-br from-red-900 to-red-700 border border-red-500 text-red-400'
              }
            `}
          >
            {toast.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

export default function WatermarkOverlay() {
  const isAdmin      = useAuthStore(s => s.isAdmin);
  const loading      = useAuthStore(s => s.loading);
  const user         = useAuthStore(s => s.user);
  const templarioName = usePlayerStore(s => s.templarioName);

  if (loading || !user || isAdmin) return null;

  const label = (templarioName || user.email || 'TEMPLARIO').toUpperCase();

  const positions = [
    { left: '22%', top: '28%' },
    { left: '62%', top: '22%' },
    { left: '18%', top: '65%' },
    { left: '60%', top: '62%' },
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        8999,
        pointerEvents: 'none',
        userSelect:    'none',
        overflow:      'hidden',
      }}
    >
      {positions.map((pos, i) => (
        <div
          key={i}
          style={{
            position:      'absolute',
            left:          pos.left,
            top:           pos.top,
            transform:     'rotate(-28deg)',
            whiteSpace:    'nowrap',
            fontFamily:    "'Cinzel', serif",
            fontSize:      '11px',
            fontWeight:    700,
            letterSpacing: '2px',
            color:         'rgba(212,175,55,0.08)',
            textTransform: 'uppercase',
          }}
        >
          ⚔ {label} ⚔
        </div>
      ))}
    </div>
  );
}
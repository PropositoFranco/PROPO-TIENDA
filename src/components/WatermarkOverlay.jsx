import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';

export default function WatermarkOverlay() {
  const user    = useAuthStore(s => s.user);
  const isAdmin = useAuthStore(s => s.isAdmin);
  const loading = useAuthStore(s => s.loading);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('templario_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const name = data?.templario_name || user.email || 'TEMPLARIO';
        setLabel(name.toUpperCase());
      });
  }, [user]);

  if (loading || !user || isAdmin || !label) return null;

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
            color:         'rgba(212,175,55,0.09)',
            textTransform: 'uppercase',
          }}
        >
          ⚔ {label} ⚔
        </div>
      ))}
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export function useAppConfig() {
  const [maintenance, setMaintenance]   = useState({ active: false, message: '' });
  const [features, setFeatures]         = useState({});
  const [announcement, setAnnouncement] = useState({ active: false, text: '', color: 'gold' });
  const [scheduled, setScheduled]       = useState({ enabled: false, activate_at: '', deactivate_at: '' });
  const [loading, setLoading]           = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from('app_config')
      .select('key, value');
    if (!data) return;

    let currentMaint = null;
    let scheduledVal = null;

    data.forEach(row => {
      if (row.key === 'maintenance')           { setMaintenance(row.value); currentMaint = row.value; }
      if (row.key === 'maintenance_scheduled') { setScheduled(row.value);   scheduledVal = row.value; }
      if (row.key === 'features')              setFeatures(row.value);
      if (row.key === 'announcement')          setAnnouncement(row.value);
    });

    // ── Checker de mantenimiento programado ──────────────────────────────
    if (scheduledVal?.enabled && currentMaint) {
      const now          = new Date();
      const activateAt   = scheduledVal.activate_at   ? new Date(scheduledVal.activate_at)   : null;
      const deactivateAt = scheduledVal.deactivate_at ? new Date(scheduledVal.deactivate_at) : null;

      // ¿Hay que ACTIVAR?
      if (activateAt && now >= activateAt && !currentMaint.active) {
        const newVal = { ...currentMaint, active: true };
        await supabase.from('app_config').update({ value: newVal }).eq('key', 'maintenance');
        setMaintenance(newVal);
      }

      // ¿Hay que DESACTIVAR?
      if (deactivateAt && now >= deactivateAt && currentMaint.active) {
        const newVal = { ...currentMaint, active: false };
        await supabase.from('app_config').update({ value: newVal }).eq('key', 'maintenance');
        setMaintenance(newVal);
        // Apagar el programado para que no siga intentando
        await supabase.from('app_config')
          .update({ value: { ...scheduledVal, enabled: false } })
          .eq('key', 'maintenance_scheduled');
      }
    }
    // ────────────────────────────────────────────────────────────────────
  }, []);

  useEffect(() => {
    // Carga inicial
    fetchConfig().finally(() => setLoading(false));

    // Realtime (funciona en producción)
    const channel = supabase
      .channel('app_config_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_config' },
        ({ new: row }) => {
          if (row.key === 'maintenance')           setMaintenance(row.value);
          if (row.key === 'maintenance_scheduled') setScheduled(row.value);
          if (row.key === 'features')              setFeatures(row.value);
          if (row.key === 'announcement')          setAnnouncement(row.value);
        }
      )
      .subscribe();

    // Polling cada 30 segundos (respaldo para local y cuando realtime falla)
    const interval = setInterval(fetchConfig, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchConfig]);

  return { maintenance, features, announcement, scheduled, loading };
}
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase';

function mapRow(p, userId) {
  return { id: p.id, name: p.char_name || p.name, pts: p.weekly_points ?? p.points ?? 0, isMe: p.id === userId };
}

export function useLobbyData(userId) {
  const [player,  setPlayer]  = useState(null);
  const [ranking, setRanking] = useState([]);

  const fetchRanking = useCallback(async () => {
    const { data } = await supabase
      .from('templo_players')
      .select('id, char_name, points, weekly_points, streak')
      .order('weekly_points', { ascending: false });
    if (data) setRanking(data.map(p => mapRow(p, userId)));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('templo_players')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => { if (data) setPlayer(data); });
  }, [userId]);

  useEffect(() => {
    fetchRanking();

    const channel = supabase
      .channel('ranking_live')
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        if (!payload) return;
        setRanking(prev => {
          const existe = prev.find(p => p.id === payload.id);
          const next = existe
            ? prev.map(p => p.id === payload.id
                ? { ...p, pts: payload.pts, name: payload.name }
                : p)
            : [...prev, { id: payload.id, name: payload.name, pts: payload.pts, isMe: payload.id === userId }];
          return [...next].sort((a, b) => b.pts - a.pts);
        });
        if (payload.id === userId) {
          setPlayer(prev => prev ? { ...prev, weekly_points: payload.pts } : prev);
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templo_players' },
        ({ eventType, new: row, old: oldRow }) => {
          if (eventType === 'UPDATE' || eventType === 'INSERT') {
            if (row.id === userId) setPlayer(row);
            setRanking(prev => {
              const existe = prev.find(p => p.id === row.id);
              const next = existe
                ? prev.map(p => p.id === row.id ? mapRow(row, userId) : p)
                : [...prev, mapRow(row, userId)];
              return [...next].sort((a, b) => b.pts - a.pts);
            });
          }
          if (eventType === 'DELETE') {
            setRanking(prev => prev.filter(p => p.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchRanking, userId]);

  return { player, ranking };
}
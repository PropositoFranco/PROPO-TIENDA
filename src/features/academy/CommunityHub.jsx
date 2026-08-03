/**
   * CommunityHub.jsx  —  src/features/academy/CommunityHub.jsx
   *
   * Feed · Miembros · DMs · Leaderboard
   * ─────────────────────────────────────────────────────────────
   * • 100 % conectado a Supabase (cero mock data)
   * • Realtime en Feed y DMs via supabase channels
   * • Puntos de comunidad → PropoCoins + XP + nivel configurable
   * • Leaderboard 7d / 30d / all-time independiente del juego
   * • Posiciones RELATIVAS, responsive clamp(), sin absolutas
   * • Niveles y acciones configurables desde admin (community_level_config)
   * ─────────────────────────────────────────────────────────────
   */

  import React, {
    useState, useEffect, useRef,
    useCallback, useMemo, memo,
  } from 'react';
  import { createPortal } from 'react-dom';
  import { useAuthStore }   from '../../store/useAuthStore';
  import { usePlayerStore } from '../../store/usePlayerStore';
  import { supabase }       from '../../services/supabase';
  import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
  import useMembershipStore, { ACADEMY_MODULES, MODULE_TYPE_CONFIG } from '../../store/useMembershipStore';
import { missionsService } from '../../services/missions.service';

  // ─── Paleta (idéntica a AcademyHub) ──────────────────────────────────────────
  const C = {
    gold:    '#F5C518',
    purple:  '#C084FC',
    green:   '#10B981',
    blue:    '#60A5FA',
    coral:   '#F97316',
    red:     '#EF4444',
    muted:   'rgba(255,255,255,0.90)',
    border:  'rgba(192,132,252,0.35)',
    border2: 'rgba(192,132,252,0.55)',
    surface: 'rgba(192,132,252,0.08)',
    surf2:   'rgba(255,255,255,0.10)',
    surf3:   'rgba(192,132,252,0.18)',
    dark:    'rgba(0,0,0,0.35)',
    glow:    '0 0 30px rgba(192,132,252,0.35)',
    glowG:   '0 0 30px rgba(245,197,24,0.25)',
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const timeAgo = (ts) => {
    const d = Date.now() - new Date(ts).getTime();
    if (d < 60000)    return 'ahora';
    if (d < 3600000)  return `${Math.floor(d / 60000)}m`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h`;
    return `${Math.floor(d / 86400000)}d`;
  };

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

  const colorFromStr = (str = '') => {
    const palette = [C.purple, C.blue, C.coral, C.green, C.gold];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  };

  // ─── Hook: detección responsive real (resize + orientación) ─────────────────
  const useIsMobile = (breakpoint = 900) => {
    const [isMobile, setIsMobile] = useState(
      typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    );
    useEffect(() => {
      const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
      const handler = (e) => setIsMobile(e.matches);
      mq.addEventListener('change', handler);
      setIsMobile(mq.matches);
      return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);
    return isMobile;
  };

  // ─── Componentes base ─────────────────────────────────────────────────────────
  const Avatar = memo(({ name = '', size = 36, color }) => {
    const bg = color || colorFromStr(name);
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `${bg}22`, border: `1.5px solid ${bg}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Cinzel", serif', fontWeight: 700,
        fontSize: Math.round(size * 0.32), color: bg,
        userSelect: 'none', letterSpacing: 0,
      }}>{initials(name)}</div>
    );
  });

  const Badge = memo(({ level, title, color, icon }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.28em',
      padding: '0.2em 0.75em',
      background: `${color}30`, border: `1.5px solid ${color}77`,
      borderRadius: '999px',
      fontFamily: '"Cinzel", serif', fontSize: '0.65rem', color: '#fff',
      fontWeight: 700,
      whiteSpace: 'nowrap', letterSpacing: '0.04em',
      boxShadow: `0 0 10px ${color}44`,
      textShadow: `0 0 8px ${color}`,
    }}>
      {icon} {title} · Nv.{level}
    </span>
  ));

  const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
      <div style={{
        width: 28, height: 28,
        border: `2px solid ${C.border2}`,
        borderTop: `2px solid ${C.purple}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const Empty = ({ text }) => (
    <p style={{
      fontFamily: '"Crimson Text", serif',
      fontSize: 'clamp(1.1rem,2.5vw,1.3rem)',
      color: '#fff', textAlign: 'center',
      padding: '3rem 1rem', margin: 0,
      letterSpacing: '0.02em',
      textShadow: '0 0 20px rgba(192,132,252,0.4)',
    }}>{text}</p>
  );

  // ─── Botón copiar link ────────────────────────────────────────────────────────
  const CopyLinkBtn = ({ postId, small = false }) => {
    const [copied, setCopied] = useState(false);
    return (
      <button
        onClick={e => {
          e.stopPropagation();
          const url = `${window.location.origin}/academia/comunidad/post/${postId}`;
          navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        title="Copiar enlace"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3em',
          padding: copied ? '0.25em 0.7em' : '0.25em 0.6em',
          background: copied
            ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))'
            : 'linear-gradient(135deg, rgba(245,197,24,0.12), rgba(245,197,24,0.04))',
          border: copied
            ? '1px solid rgba(16,185,129,0.55)'
            : '1px solid rgba(245,197,24,0.35)',
          borderRadius: '999px',
          color: copied ? '#10B981' : 'rgba(245,197,24,0.85)',
          fontFamily: '"Cinzel", serif',
          fontSize: small ? '0.58rem' : '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: copied
            ? '0 0 10px rgba(16,185,129,0.3)'
            : '0 0 8px rgba(245,197,24,0.15)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!copied) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,197,24,0.22), rgba(245,197,24,0.1))';
            e.currentTarget.style.borderColor = 'rgba(245,197,24,0.65)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(245,197,24,0.35)';
            e.currentTarget.style.color = '#F5C518';
          }
        }}
        onMouseLeave={e => {
          if (!copied) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,197,24,0.12), rgba(245,197,24,0.04))';
            e.currentTarget.style.borderColor = 'rgba(245,197,24,0.35)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(245,197,24,0.15)';
            e.currentTarget.style.color = 'rgba(245,197,24,0.85)';
          }
        }}
      >
        <span style={{ fontSize: small ? '0.75rem' : '0.85rem' }}>{copied ? '✓' : '🔗'}</span>
        <span>{copied ? 'copiado' : 'link'}</span>
      </button>
    );
  };

  // ─── Toast de recompensa ──────────────────────────────────────────────────────
  const RewardToast = memo(({ reward, onDone }) => {
    useEffect(() => {
      const t = setTimeout(onDone, 2600);
      return () => clearTimeout(t);
    }, [onDone]);

    return (
      <div style={{
        position: 'fixed', bottom: '5rem', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.7rem 1.5rem',
        background: 'rgba(10,6,24,0.97)',
        border: `1px solid ${reward._msg ? C.purple : C.gold}44`,
        borderRadius: '999px',
        boxShadow: `0 0 32px ${reward._msg ? C.purple : C.gold}18`,
        zIndex: 9999, pointerEvents: 'none',
        animation: 'toastPop 0.3s cubic-bezier(0.16,1,0.3,1)',
        whiteSpace: 'nowrap',
      }}>
        <span>{reward._msg ? '🌙' : '⚡'}</span>
        {reward._msg ? (
          <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.78rem', color: C.purple, fontWeight: 700 }}>
            {reward._msg}
          </span>
        ) : (
          <>
            {reward.xp > 0 && (
              <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.78rem', color: C.gold, fontWeight: 700 }}>
                +{reward.xp} XP
              </span>
            )}
            {reward.xp > 0 && reward.coins > 0 && <span style={{ color: C.muted }}>·</span>}
            {reward.coins > 0 && (
              <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.78rem', color: C.purple }}>
                +{reward.coins} PropoCoins
              </span>
            )}
            {reward.points > 0 && (
              <>
                <span style={{ color: C.muted }}>·</span>
                <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.78rem', color: C.green }}>
                  +{reward.points} pts
                </span>
              </>
            )}
          </>
        )}
        <style>{`
          @keyframes toastPop {
            from { opacity:0; transform: translateX(-50%) translateY(12px); }
            to   { opacity:1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </div>
    );
  });

  // ─── Hook: cargar configuración global ───────────────────────────────────────
  function useCommunityConfig() {
    const [levelCfg,   setLevelCfg]   = useState([]);
    const [pointsCfg,  setPointsCfg]  = useState({});
    const [categories, setCategories] = useState([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      Promise.all([
        supabase.from('community_level_config').select('*').order('level'),
        supabase.from('community_points_config').select('*'),
        supabase.from('community_categories').select('*').eq('active', true).order('sort_order'),
      ]).then(([lvl, pts, cats]) => {
        setLevelCfg(lvl.data || []);
        const map = {};
        (pts.data || []).forEach(r => { map[r.action] = r; });
        setPointsCfg(map);
        setCategories(cats.data || []);
        setReady(true);
      });
    }, []);

    const getLvl = useCallback((level = 1) =>
      levelCfg.find(l => l.level === level) ||
      levelCfg[0] ||
      { level: 1, title: 'Iniciado', color: C.purple, icon: '⚡', min_points: 0 },
    [levelCfg]);

    return { levelCfg, pointsCfg, categories, ready, getLvl };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  TAB: FEED
  // ════════════════════════════════════════════════════════════════════════════
  const FeedTab = ({ myUser, pointsCfg, categories, getLvl, onReward, storeProfile }) => {
    const { postId: urlPostId } = useParams();
    const navigate = useNavigate();
    const [posts,        setPosts]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [activeCat,    setActiveCat]    = useState('all');
    const [likedPosts,   setLikedPosts]   = useState(new Set());
    const [likedComments,setLikedComments]= useState(new Set());
    const [expanded,     setExpanded]     = useState(null);
    const [commentsMap,  setCommentsMap]  = useState({});
    const [commentText,  setCommentText]  = useState({});
    const [replyingTo,   setReplyingTo]   = useState({}); // { postId: { commentId, name } }
    const [newPost,      setNewPost]      = useState('');
    const [postCat,      setPostCat]      = useState('');
    const [submitting,   setSubmitting]   = useState(false);
    const [sortMode,       setSortMode]       = useState('newest'); // newest | top
    const [hasNewGuide,    setHasNewGuide]    = useState(false);
    const [showingGuide,   setShowingGuide]   = useState(false);
    const [showRules,      setShowRules]      = useState(() => {
      return !localStorage.getItem('_feed_rules_accepted');
    });

    // Oculta la barra superior de AppLayout SOLO mientras este modal está abierto
    // (reutiliza el mismo mecanismo que tu app ya usa para contenido a pantalla completa)
    useEffect(() => {
      if (showRules) window.dispatchEvent(new Event('vip-content-open'));
      return () => window.dispatchEvent(new Event('vip-content-close'));
    }, [showRules]);

    // ─── Cargar posts ──────────────────────────────────────────────────────────
    const loadPosts = useCallback(async () => {
      setLoading(true);
      let q = supabase
        .from('community_posts')
        .select(`
          id, body, pinned, hidden, likes_count, comments_count, created_at, user_id,
          category:community_categories(id, name, color),
          author:profiles!community_posts_user_id_fkey(id, templario_name, community_level)
        `)
        .order('pinned', { ascending: false });

      if (sortMode === 'newest') {
        q = q.order('created_at', { ascending: false });
      } else {
        q = q.order('likes_count', { ascending: false });
      }
      if (activeCat !== 'all') q = q.eq('category_id', activeCat);
      q = q.limit(50);

      const { data } = await q;
      setPosts(data || []);
      setLoading(false);
    }, [activeCat, sortMode]);

    useEffect(() => { loadPosts(); }, [activeCat, sortMode]);

    // ─── Detectar mensajes nuevos del Guía ────────────────────────────────────
    useEffect(() => {
      if (!myUser?.id || !posts.length) return;
      const checkNewGuide = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('guide_last_seen_at')
          .eq('id', myUser.id)
          .single();

        const lastSeen = data?.guide_last_seen_at;
        const guidePosts = posts.filter(p =>
          p.category?.name?.toLowerCase().includes('guía') ||
          p.category?.name?.toLowerCase().includes('guia')
        );

        if (!lastSeen) {
          setHasNewGuide(guidePosts.length > 0);
          return;
        }

        const hasNew = guidePosts.some(p => new Date(p.created_at) > new Date(lastSeen));
        setHasNewGuide(hasNew);
      };
      checkNewGuide();
    }, [myUser?.id, posts]);

    useEffect(() => {
      if (urlPostId && !loading && posts.length > 0) {
        setExpanded(urlPostId);
        loadComments(urlPostId);
        setTimeout(() => {
          document.getElementById(`post-${urlPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }, [urlPostId, loading, posts.length]);

    // ─── Cargar mis likes ──────────────────────────────────────────────────────
    useEffect(() => {
      if (!myUser?.id) return;
      Promise.all([
        supabase.from('community_post_likes').select('post_id').eq('user_id', myUser.id),
        supabase.from('community_comment_likes').select('comment_id').eq('user_id', myUser.id),
      ]).then(([pl, cl]) => {
        setLikedPosts(new Set((pl.data || []).map(r => r.post_id)));
        setLikedComments(new Set((cl.data || []).map(r => r.comment_id)));
      });
    }, [myUser?.id]);

    // ─── Realtime: nuevos posts ────────────────────────────────────────────────
    useEffect(() => {
      const ch = supabase
        .channel('rt_feed_posts')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'community_posts',
        }, async (payload) => {
          // Ignorar posts propios — ya los carga loadPosts()
          if (payload.new.user_id === myUser?.id) return;
          // enriquecer con author y category
          const { data } = await supabase
            .from('community_posts')
            .select(`
              id, body, pinned, likes_count, comments_count, created_at, user_id,
              category:community_categories!community_posts_category_id_fkey(id, name, color),
              author:profiles!community_posts_user_id_fkey(id, templario_name, community_level)
            `)
            .eq('id', payload.new.id)
            .single();
          if (data) setPosts(prev => [data, ...prev]);
        })
        .subscribe();
      return () => supabase.removeChannel(ch);
    }, []);

    // ─── Toggle like post ──────────────────────────────────────────────────────
    const toggleLike = useCallback(async (postId) => {
      if (!myUser?.id) return;
      const post = posts.find(p => p.id === postId);
      if (post?.user_id === myUser.id) return;
      const alreadyLiked = likedPosts.has(postId);
      // Optimistic update
      setLikedPosts(prev => {
        const s = new Set(prev);
        alreadyLiked ? s.delete(postId) : s.add(postId);
        return s;
      });
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (alreadyLiked ? -1 : 1) }
          : p
      ));
      const { data, error } = await supabase.rpc('toggle_post_like', {
  p_post_id: postId, p_user_id: myUser.id,
});
if (error?.message?.includes('Límite de 25 likes')) {
  setLikedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
  setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p));
  onReward({ xp: 0, coins: 0, points: 0, _msg: '🌙 Ya diste 25 likes hoy. Vuelve mañana.' });
  return;
}
      if (data?.liked) {
        onReward({ points: 1, coins: 0, xp: 2 });
        missionsService.trackEvent(myUser.id, 'post_like');
      }
    }, [likedPosts, myUser?.id, onReward, pointsCfg]);

    // ─── Cargar comentarios ────────────────────────────────────────────────────
    const loadComments = useCallback(async (postId) => {
      let q = supabase
        .from('community_comments')
        .select(`
          id, body, likes_count, created_at, user_id, parent_id, hidden,
          author:profiles!community_comments_user_id_fkey(id, templario_name, community_level)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!myUser?.is_admin) {
        q = q.eq('hidden', false);
      }

      const { data } = await q;
      setCommentsMap(prev => ({ ...prev, [postId]: data || [] }));
    }, [myUser?.is_admin]);

    const toggleExpand = useCallback((postId) => {
      setExpanded(prev => {
        const next = prev === postId ? null : postId;
        if (next) loadComments(next);
        return next;
      });
    }, [loadComments]);

    // ─── Toggle like comentario ────────────────────────────────────────────────
    const toggleCommentLike = useCallback(async (commentId, postId) => {
      if (!myUser?.id) return;
      const already = likedComments.has(commentId);
      setLikedComments(prev => {
        const s = new Set(prev);
        already ? s.delete(commentId) : s.add(commentId);
        return s;
      });
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c =>
          c.id === commentId
            ? { ...c, likes_count: c.likes_count + (already ? -1 : 1) }
            : c
        ),
      }));
      const { data } = await supabase.rpc('toggle_comment_like', {
        p_comment_id: commentId, p_user_id: myUser.id,
      });
      if (data?.liked) {
        onReward({ points: 2, coins: 10, xp: 10 });
      }
    }, [likedComments, myUser?.id, onReward]);

    // ─── Enviar comentario ─────────────────────────────────────────────────────
    const submitComment = useCallback(async (postId, parentId = null) => {
      const body = (commentText[postId] || '').trim();
      if (!body || !myUser?.id) return;
      const { data, error } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: myUser.id, body, parent_id: parentId || null })
        .select(`
          id, body, likes_count, created_at, user_id, parent_id,
          author:profiles!community_comments_user_id_fkey(id, templario_name, community_level)
        `)
        .single();
      if (!error && data) {
        setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
        if (!parentId) {
          setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
          ));
        }
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
        await supabase.rpc('award_community_points', {
          p_user_id: myUser.id, p_action: 'comment', p_ref_id: postId,
        });
        onReward({ points: 5, coins: 5, xp: 10 });
      }
    }, [commentText, myUser?.id, onReward]);

    // ─── Admin: borrar/editar comentario ───────────────────────────────────────
    const handleAdminDeleteComment = useCallback((commentId, postId) => {
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
      }));
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
      ));
    }, []);

    const handleAdminEditComment = useCallback((commentId, postId, newBody, newHidden) => {
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c =>
          c.id === commentId
            ? { ...c, body: newBody ?? c.body, hidden: newHidden ?? c.hidden }
            : c
        ),
      }));
    }, []);

    // ─── Crear post ────────────────────────────────────────────────────────────
    const submitPost = useCallback(async () => {
      if (!newPost.trim() || submitting || !myUser?.id) return;
      setSubmitting(true);
      const { data: newPostData, error } = await supabase
  .from('community_posts')
  .insert({ user_id: myUser.id, body: newPost.trim(), category_id: postCat || null })
  .select('id')
  .single();

if (!error && newPostData?.id) {
  if (!myUser?.is_admin) supabase.functions.invoke('moderate-post', {
    body: { post_id: newPostData.id, user_id: myUser.id, body: newPost.trim() },
  }).then(({ data: modData }) => {
    if (modData?.violation) {
      setPosts(prev => prev.filter(p => p.id !== newPostData.id));
      onReward({ xp:0, coins:0, points:0, _msg:`🚫 Post eliminado: ${modData.reason}` });
    }
  });
}
if (error) {
  if (error.message.includes('Límite de 3 posts')) {
    setToast({ xp: 0, coins: 0, points: 0, _msg: '🌙 Ya publicaste 3 veces hoy. Vuelve mañana.' });
  }
  setSubmitting(false);
  return;
}
if (!error) {
        setNewPost('');
        setPostCat('');
        await supabase.rpc('award_community_points', {
          p_user_id: myUser.id, p_action: 'post',
        });
        onReward(pointsCfg.post || { points: 10, coins: 10, xp: 10 });
      missionsService.trackEvent(myUser.id, 'post_feed');
      loadPosts();
      }
      setSubmitting(false);
    }, [newPost, submitting, myUser?.id, postCat, onReward, pointsCfg, loadPosts]);

    // ─── AdminPostMenu ─────────────────────────────────────────────────────────
    const AdminPostMenu = memo(({ post, onPin, onHide, onDelete, onEdit }) => {
      const [open,          setOpen]          = useState(false);
      const [editing,       setEditing]       = useState(false);
      const [draft,         setDraft]         = useState(post.body);
      const [confirmDelete, setConfirmDelete] = useState(false);
      const [menuPos,       setMenuPos]       = useState({ x: 0, y: 0 });

      return (
        <div style={{ display: 'inline-flex', position: 'relative' }}
          onClick={e => e.stopPropagation()}>

          {/* Cerrar al hacer clic fuera */}
          {open && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9989,
            }} onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          )}

          {/* Botón abrir menú */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom;
              const menuHeight = 180; // altura aprox del menú
              setMenuPos({
                x: rect.right - 180,
                y: spaceBelow < menuHeight
                  ? rect.top - menuHeight - 6
                  : rect.bottom + 6,
              });
              setOpen(o => !o);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3em',
              background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(192,132,252,0.05))',
              border: '1.5px solid rgba(192,132,252,0.4)',
              borderRadius: '999px', padding: '0.25em 0.8em',
              color: C.purple, fontFamily: '"Cinzel", serif',
              fontSize: '0.62rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >⚙️ Admin</button>

          {/* Menú desplegable */}
          {open && (
            <div style={{
              position: 'fixed',
              top: menuPos.y,
              left: Math.min(menuPos.x, window.innerWidth - 196),
              background: 'linear-gradient(135deg, rgba(15,8,32,0.98), rgba(10,6,24,0.98))',
              border: '1px solid rgba(192,132,252,0.35)',
              borderRadius: '0.875rem', padding: '0.5rem',
              zIndex: 9990, minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(192,132,252,0.15)',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
            }}>

              {/* Fijar */}
              <button onClick={async (e) => { e.stopPropagation(); await onPin(); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.5em',
                background: post.pinned ? 'rgba(245,197,24,0.12)' : 'transparent',
                border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
                color: post.pinned ? C.gold : 'rgba(255,255,255,0.8)',
                fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,197,24,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = post.pinned ? 'rgba(245,197,24,0.12)' : 'transparent'}
              >{post.pinned ? '📌 Desfijar' : '📌 Fijar'}</button>

              {/* Ocultar */}
              <button onClick={async (e) => { e.stopPropagation(); await onHide(); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.5em',
                background: post.hidden ? 'rgba(96,165,250,0.12)' : 'transparent',
                border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
                color: post.hidden ? C.blue : 'rgba(255,255,255,0.8)',
                fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = post.hidden ? 'rgba(96,165,250,0.12)' : 'transparent'}
              >{post.hidden ? '👁️ Mostrar' : '🙈 Ocultar'}</button>

              {/* Editar */}
              <button onClick={(e) => { e.stopPropagation(); setEditing(true); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.5em',
                background: 'transparent', border: 'none', borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem', color: 'rgba(255,255,255,0.8)',
                fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,132,252,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >✏️ Editar</button>

              {/* Separador */}
              <div style={{ height: 1, background: 'rgba(239,68,68,0.2)', margin: '0.25rem 0' }} />

              {/* Borrar */}
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); setConfirmDelete(true); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.5em',
                background: 'transparent', border: 'none', borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem', color: C.red,
                fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >🗑️ Borrar</button>
            </div>
          )}

          {/* Modal confirmar borrar */}
          {confirmDelete && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }} onClick={() => setConfirmDelete(false)}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(15,8,32,0.99), rgba(10,6,24,0.99))',
                border: '1.5px solid rgba(239,68,68,0.5)',
                borderRadius: '1.25rem', padding: '1.75rem',
                width: '100%', maxWidth: 420,
                boxShadow: '0 0 60px rgba(239,68,68,0.2)',
                textAlign: 'center',
              }} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🗑️</p>
                <p style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 900,
                  fontSize: '0.95rem', color: C.red,
                  margin: '0 0 0.5rem', letterSpacing: '0.08em',
                }}>¿Borrar este mensaje?</p>
                <p style={{
                  fontFamily: '"Crimson Text", serif', fontSize: '0.95rem',
                  color: 'rgba(255,255,255,0.6)', margin: '0 0 1.5rem',
                }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={() => setConfirmDelete(false)} style={{
                    padding: '0.6em 1.5em',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '0.5rem', color: 'rgba(255,255,255,0.7)',
                    fontFamily: '"Cinzel", serif', fontSize: '0.72rem', cursor: 'pointer',
                  }}>Cancelar</button>
                  <button onClick={async () => { setConfirmDelete(false); await onDelete(); }} style={{
                    padding: '0.6em 1.5em',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                    border: '1.5px solid rgba(239,68,68,0.6)',
                    borderRadius: '0.5rem', color: C.red,
                    fontFamily: '"Cinzel", serif', fontSize: '0.72rem',
                    fontWeight: 700, cursor: 'pointer',
                  }}>🗑️ Sí, borrar</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal editar */}
          {editing && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }} onClick={() => setEditing(false)}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(15,8,32,0.99), rgba(10,6,24,0.99))',
                border: '1.5px solid rgba(245,197,24,0.4)',
                borderRadius: '1.25rem', padding: '1.75rem',
                width: '100%', maxWidth: 560,
                boxShadow: '0 0 60px rgba(245,197,24,0.15)',
              }} onClick={e => e.stopPropagation()}>
                <p style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 900,
                  fontSize: '0.88rem', color: C.gold,
                  margin: '0 0 1rem', letterSpacing: '0.1em',
                }}>✏️ Editar Mensaje</p>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(245,197,24,0.4)',
                    borderRadius: '0.75rem', padding: '0.875rem 1rem',
                    color: '#fff', fontFamily: '"Crimson Text", serif',
                    fontSize: '1rem', lineHeight: 1.7,
                    resize: 'vertical', outline: 'none',
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditing(false)} style={{
                    padding: '0.5em 1.25em',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '0.5rem', color: 'rgba(255,255,255,0.7)',
                    fontFamily: '"Cinzel", serif', fontSize: '0.72rem', cursor: 'pointer',
                  }}>Cancelar</button>
                  <button onClick={async () => {
                    const { error } = await supabase.from('community_posts')
                      .update({ body: draft }).eq('id', post.id);
                    if (!error) { onEdit(draft); setEditing(false); }
                  }} style={{
                    padding: '0.5em 1.25em',
                    background: 'linear-gradient(135deg, rgba(245,197,24,0.3), rgba(245,197,24,0.15))',
                    border: '1.5px solid rgba(245,197,24,0.6)',
                    borderRadius: '0.5rem', color: C.gold,
                    fontFamily: '"Cinzel", serif', fontSize: '0.72rem',
                    fontWeight: 700, cursor: 'pointer',
                  }}>💾 Guardar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });

    // ─── AdminCommentMenu ──────────────────────────────────────────────────────
    const AdminCommentMenu = memo(({ comment, postId, onDelete, onEdit }) => {
      const [open,          setOpen]          = useState(false);
      const [confirmDelete, setConfirmDelete] = useState(false);
      const [menuPos,       setMenuPos]       = useState({ x: 0, y: 0 });

      return (
        <div style={{ position: 'relative', display: 'inline-flex' }} onClick={e => e.stopPropagation()}>
          {open && <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={() => setOpen(false)} />}

          <button onClick={(e) => {
            if (!open) {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPos({
                x: Math.min(rect.right - 150, window.innerWidth - 160),
                y: rect.bottom + 4,
              });
            }
            setOpen(o => !o);
          }} style={{
            background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)',
            borderRadius: '999px', padding: '0.15em 0.5em',
            color: C.purple, fontFamily: '"Cinzel", serif', fontSize: '0.55rem',
            fontWeight: 700, cursor: 'pointer',
          }}>⚙️</button>

          {open && (
            <div style={{
              position: 'fixed', top: menuPos.y, left: menuPos.x,
              background: 'linear-gradient(135deg, rgba(15,8,32,0.99), rgba(10,6,24,0.99))',
              border: '1px solid rgba(192,132,252,0.35)',
              borderRadius: '0.875rem', padding: '0.4rem',
              zIndex: 9998, minWidth: 150,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', gap: '0.2rem',
            }}>
              {/* Ocultar / Mostrar */}
              <button onClick={async () => {
                setOpen(false);
                const newHidden = !comment.hidden;
                const { error } = await supabase.from('community_comments').update({ hidden: newHidden }).eq('id', comment.id);
                if (!error) onEdit(comment.id, postId, comment.body, newHidden);
              }} style={{
                display: 'flex', alignItems: 'center', gap: '0.4em',
                background: 'transparent', border: 'none', borderRadius: '0.4rem',
                padding: '0.45rem 0.65rem', color: comment.hidden ? C.blue : 'rgba(255,255,255,0.85)',
                fontFamily: '"Cinzel", serif', fontSize: '0.62rem', fontWeight: 700,
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{comment.hidden ? '👁️ Mostrar' : '🙈 Ocultar'}</button>

              <div style={{ height: 1, background: 'rgba(239,68,68,0.2)', margin: '0.15rem 0' }} />

              {/* Borrar */}
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); setConfirmDelete(true); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.4em',
                background: 'transparent', border: 'none', borderRadius: '0.4rem',
                padding: '0.45rem 0.65rem', color: C.red,
                fontFamily: '"Cinzel", serif', fontSize: '0.62rem', fontWeight: 700,
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >🗑️ Borrar</button>
            </div>
          )}

          {/* Modal confirmar borrar */}
          {confirmDelete && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }} onClick={() => setConfirmDelete(false)}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(15,8,32,0.99), rgba(10,6,24,0.99))',
                border: '1.5px solid rgba(239,68,68,0.5)',
                borderRadius: '1.25rem', padding: '1.75rem',
                width: '100%', maxWidth: 380,
                boxShadow: '0 0 60px rgba(239,68,68,0.2)', textAlign: 'center',
              }} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🗑️</p>
                <p style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 900,
                  fontSize: '0.88rem', color: C.red, margin: '0 0 0.5rem',
                }}>¿Borrar este comentario?</p>
                <p style={{
                  fontFamily: '"Crimson Text", serif', fontSize: '0.92rem',
                  color: 'rgba(255,255,255,0.55)', margin: '0 0 1.25rem',
                }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={() => setConfirmDelete(false)} style={{
                    padding: '0.55em 1.25em',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '0.5rem', color: 'rgba(255,255,255,0.7)',
                    fontFamily: '"Cinzel", serif', fontSize: '0.7rem', cursor: 'pointer',
                  }}>Cancelar</button>
                  <button onClick={async () => {
                    setConfirmDelete(false);
                    const { error } = await supabase.from('community_comments').delete().eq('id', comment.id);
                    if (!error) onDelete(comment.id, postId);
                  }} style={{
                    padding: '0.55em 1.25em',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                    border: '1.5px solid rgba(239,68,68,0.6)',
                    borderRadius: '0.5rem', color: C.red,
                    fontFamily: '"Cinzel", serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  }}>🗑️ Sí, borrar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });

    // ─── CommentLinkBtn ────────────────────────────────────────────────────────
    const CommentLinkBtn2 = ({ postId, commentId }) => {
      const [copied, setCopied] = useState(false);
      return (
        <button
          onClick={e => {
            e.stopPropagation();
            const url = `${window.location.origin}/academia/comunidad/post/${postId}#comment-${commentId}`;
            navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.2em',
            background: copied
              ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))'
              : 'linear-gradient(135deg, rgba(192,132,252,0.12), rgba(192,132,252,0.04))',
            border: copied ? '1px solid rgba(16,185,129,0.55)' : '1px solid rgba(192,132,252,0.35)',
            borderRadius: '999px', padding: '0.15em 0.5em',
            color: copied ? '#10B981' : 'rgba(192,132,252,0.85)',
            fontFamily: '"Cinzel", serif', fontSize: '0.58rem', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >{copied ? '✓' : '🔗 link'}</button>
      );
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    if (showRules) return createPortal(
      <div style={{
        position:'fixed', inset:0, zIndex:99999,
        background:'rgba(2,1,10,.92)', backdropFilter:'blur(14px)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        overflowY:'auto', WebkitOverflowScrolling:'touch',
        padding:'clamp(0.75rem,3vh,2rem) 1rem',
      }}>
        <div style={{
          maxWidth:'440px', width:'100%',
          maxHeight:'90dvh', overflowY:'auto', WebkitOverflowScrolling:'touch',
          background:'radial-gradient(ellipse at top,rgba(192,132,252,.14) 0%,rgba(4,2,14,.98) 70%)',
          border:'1.5px solid rgba(192,132,252,.4)', borderRadius:'1.5rem',
          padding:'clamp(1.25rem,5vw,2.5rem)', textAlign:'center',
          boxShadow:'0 0 100px rgba(192,132,252,.18)', position:'relative',
        }}>
          <div style={{ position:'absolute',top:0,left:'20%',right:'20%',height:'1px',
            background:'linear-gradient(90deg,transparent,rgba(192,132,252,.8),transparent)' }}/>
          <div style={{ fontSize:'2.5rem', marginBottom:'.75rem',
            filter:'drop-shadow(0 0 14px rgba(192,132,252,.6))' }}>🏛️</div>
          <div style={{ display:'inline-block', padding:'.25em 1em',
            background:'rgba(192,132,252,.12)', border:'1px solid rgba(192,132,252,.3)',
            borderRadius:'999px', marginBottom:'1rem' }}>
            <span style={{ fontFamily:'"Cinzel",serif', fontSize:'.6rem',
              letterSpacing:'.2em', textTransform:'uppercase', color:'#C084FC' }}>
              ⚜️ Código del Templo
            </span>
          </div>
          <h3 style={{ fontFamily:'"Cinzel",serif', fontWeight:700,
            fontSize:'clamp(1rem,3vw,1.25rem)', color:'#fff', marginBottom:'1.25rem' }}>
            Antes de entrar al Feed
          </h3>
          <div style={{ textAlign:'left', marginBottom:'1.5rem',
            background:'rgba(255,255,255,.03)', border:'1px solid rgba(192,132,252,.15)',
            borderRadius:'1rem', padding:'1.25rem',
            display:'flex', flexDirection:'column', gap:'.75rem' }}>
            {[
              { icon:'✅', text:'Comparte avances, reflexiones y aprendizajes reales.' },
              { icon:'✅', text:'Apoya y responde a otros Templarios con respeto.' },
              { icon:'✅', text:'Haz preguntas y celebra tus victorias.' },
              { icon:'🚫', text:'Prohibido publicitar servicios, negocios o productos propios.' },
              { icon:'🚫', text:'Prohibido spam, links externos o contenido no relacionado.' },
              { icon:'🚫', text:'Prohibido lenguaje ofensivo o irrespetuoso.' },
            ].map((r,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'.75rem' }}>
                <span style={{ fontSize:'1rem', flexShrink:0, marginTop:'.1rem' }}>{r.icon}</span>
                <span style={{ fontFamily:'"Crimson Text",serif', fontSize:'clamp(.9rem,2vw,1rem)',
                  color:'rgba(255,255,255,.75)', lineHeight:1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily:'"Crimson Text",serif', fontSize:'.88rem',
            color:'rgba(255,255,255,.35)', marginBottom:'1.5rem', lineHeight:1.5 }}>
            Las publicaciones que violen estas reglas serán eliminadas automáticamente. Infracciones repetidas resultan en restricción temporal para publicar.
          </p>
          <button onClick={() => {
            localStorage.setItem('_feed_rules_accepted','1');
            setShowRules(false);
          }} style={{
            width:'100%', padding:'.95rem',
            background:'linear-gradient(135deg,#9333ea,#C084FC)',
            border:'none', borderRadius:'.75rem',
            color:'#000', fontFamily:'"Cinzel",serif',
            fontWeight:700, fontSize:'.78rem',
            letterSpacing:'.12em', textTransform:'uppercase',
            cursor:'pointer',
          }}>
            ⚡ Entendido — Entrar al Feed
          </button>
        </div>

        {/* Indicadores de scroll — avisan que hay que deslizar hacia abajo */}
        <div style={{
          position:'absolute', top:'50%', left:'clamp(0.4rem,3vw,1.5rem)',
          fontSize:'clamp(1.5rem,4vw,2.2rem)', color:'rgba(192,132,252,.6)',
          animation:'scrollHintBounce 1.6s ease-in-out infinite',
          pointerEvents:'none', textShadow:'0 0 14px rgba(192,132,252,.7)',
        }}>⌄</div>
        <div style={{
          position:'absolute', top:'50%', right:'clamp(0.4rem,3vw,1.5rem)',
          fontSize:'clamp(1.5rem,4vw,2.2rem)', color:'rgba(192,132,252,.6)',
          animation:'scrollHintBounce 1.6s ease-in-out infinite 0.3s',
          pointerEvents:'none', textShadow:'0 0 14px rgba(192,132,252,.7)',
        }}>⌄</div>
        <style>{`
          @keyframes scrollHintBounce {
            0%,100%  { transform: translateY(calc(-50% + 0px));  opacity:.55; }
            50%       { transform: translateY(calc(-50% + 12px)); opacity:1; }
          }
        `}</style>
      </div>,
      document.body
    );

    return (
      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
        <style>{`
          @keyframes feedRaySwing {
            0%,100% { transform: translateX(-50%) rotate(-14deg); }
            50%      { transform: translateX(-50%) rotate(14deg); }
          }
          @keyframes feedRaySwing2 {
            0%,100% { transform: translateX(-50%) rotate(8deg); }
            50%      { transform: translateX(-50%) rotate(-8deg); }
          }
          @keyframes feedEmberFloat {
            0%   { transform: translateY(0px) translateX(0px); opacity: 0.7; }
            50%  { transform: translateY(-18px) translateX(6px); opacity: 1; }
            100% { transform: translateY(-36px) translateX(-4px); opacity: 0; }
          }
        `}</style>

        {/* ══ RAYO DE FUEGO — Feed ══ */}
        <div style={{
          position: 'absolute',
          top: -60, left: '30%',
          width: 2,
          height: '90%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(249,115,22,0.6) 25%, rgba(249,115,22,0.2) 70%, transparent 100%)',
          transform: 'translateX(-50%) rotate(-14deg)',
          transformOrigin: 'top center',
          animation: 'feedRaySwing 7s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(0.8px)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: -60, left: '70%',
          width: 80,
          height: '60%',
          background: 'radial-gradient(ellipse at top, rgba(249,115,22,0.1) 0%, transparent 70%)',
          transform: 'translateX(-50%) rotate(8deg)',
          transformOrigin: 'top center',
          animation: 'feedRaySwing2 9s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(10px)',
          zIndex: 0,
        }} />
        {/* Partículas de brasa */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: `${20 + i * 28}%`,
            left: `${15 + i * 30}%`,
            width: 3, height: 3, borderRadius: '50%',
            background: '#F97316',
            opacity: 0.6,
            animation: `feedEmberFloat ${2.2 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.9}s`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        ))}

        {/* Composer */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(15,8,32,0.90) 55%, rgba(192,132,252,0.08) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(249,115,22,0.40)',
          borderRadius: '1rem', padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 0 40px rgba(249,115,22,0.15), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(249,115,22,0.18)',
          position: 'relative', zIndex: 1,
        }}>
          {myUser?.is_admin && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.75rem',
              padding: '0.35rem 0.875rem',
              background: 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.06))',
              border: '1px solid rgba(245,197,24,0.45)',
              borderRadius: '999px',
              width: 'fit-content',
            }}>
              <span style={{ fontSize: '0.75rem' }}>⚜️</span>
              <span style={{
                fontFamily: '"Cinzel", serif', fontSize: '0.62rem',
                color: '#F5C518', fontWeight: 700, letterSpacing: '0.1em',
              }}>MODO GUÍA ACTIVO</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <Avatar name={myUser?.full_name || myUser?.templario_name} size={38} color={C.purple} />
            <div style={{ flex: 1 }}>
              {(() => {
                const restrictedUntil = storeProfile?.posting_restricted_until;
                const isRestricted = restrictedUntil && new Date(restrictedUntil) > new Date();
                const minutesLeft = isRestricted
                  ? Math.ceil((new Date(restrictedUntil) - new Date()) / 60000)
                  : 0;
                const hoursLeft = minutesLeft > 60 ? Math.ceil(minutesLeft / 60) : null;
                if (isRestricted) return (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(15,8,32,0.95))',
                    border: '1.5px solid rgba(239,68,68,0.4)',
                    borderRadius: '0.875rem',
                    padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: '0 0 30px rgba(239,68,68,0.1)',
                  }}>
                    <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' }}>🚫</span>
                    <div>
                      <p style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.82rem',
                        color: '#ef4444', margin: '0 0 0.25rem', letterSpacing: '0.08em' }}>
                        Publicación restringida temporalmente
                      </p>
                      <p style={{ fontFamily: '"Crimson Text", serif', fontSize: '0.95rem',
                        color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>
                        Podrás publicar de nuevo en{' '}
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>
                          {hoursLeft ? `${hoursLeft}h` : `${minutesLeft} min`}
                        </span>
                        . Recuerda el Código del Templo.
                      </p>
                    </div>
                  </div>
                );
                return (
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && submitPost()}
                placeholder="Comparte tu avance, reflexión o pregunta esta semana…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.08)',
                  border: `1.5px solid rgba(192,132,252,0.5)`, borderRadius: '0.75rem',
                  padding: '0.875rem 1.1rem', color: '#fff',
                  fontFamily: '"Crimson Text", serif',
                  fontSize: 'clamp(1rem,2.5vw,1.15rem)', lineHeight: 1.7,
                  resize: 'none', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 0 16px rgba(192,132,252,0.1)',
                }}
                onFocus={e => (e.target.style.borderColor = `${C.purple}66`)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
              />
              );
              })()}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: '0.625rem',
                flexWrap: 'wrap', gap: '0.5rem',
              }}>
                <select
                  value={postCat}
                  onChange={e => setPostCat(e.target.value)}
                  style={{
                    background: '#0f0820', border: `1px solid rgba(192,132,252,0.35)`,
                    borderRadius: '0.5rem', padding: '0.4rem 0.75rem',
                    color: postCat ? '#fff' : 'rgba(255,255,255,0.65)',
                    fontFamily: '"Cinzel", serif', fontSize: '0.68rem',
                    outline: 'none', cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(192,132,252,0.1)',
                  }}
                >
                  <option value="">Sin categoría</option>
                  {categories
                  .filter(c => myUser?.is_admin ? true : c.name !== 'Mensajes del Guía')
                  .map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#0f0820', color: '#fff' }}>
                      {c.name === 'Mensajes del Guía' ? '⚜️ Mensajes del Guía' : c.name}
                    </option>
                  ))
                }
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontFamily: '"Cinzel", serif', fontSize: '0.63rem', color: C.muted,
                  }}>
                    +{pointsCfg.post?.xp || 10} XP · +{pointsCfg.post?.coins || 10} 🪙
                  </span>
                  <button
                    onClick={submitPost}
                    disabled={!newPost.trim() || submitting}
                    style={{
                      padding: '0.5em 1.25em',
                      background: newPost.trim() && !submitting ? C.purple : C.surf2,
                      border: 'none', borderRadius: '0.5rem',
                      color: newPost.trim() && !submitting ? '#0a0614' : C.muted,
                      fontFamily: '"Cinzel", serif', fontWeight: 700,
                      fontSize: '0.72rem', letterSpacing: '0.08em',
                      cursor: newPost.trim() && !submitting ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}
                  >{submitting ? '…' : 'Publicar'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {/* Sort arriba — grande y claro */}
          <div style={{
            display: 'flex', gap: '0.5rem',
          }}>
            {[['newest', '🕐', 'Nuevo'], ['top', '🔥', 'Top'], ...(hasNewGuide || showingGuide ? [['guide', '⚜️', 'Guía']] : [])].map(([k, icon, label]) => (
              <button key={k} onClick={async () => {
                setSortMode(k);
                if (k === 'guide') {
                  setShowingGuide(true);
                  setHasNewGuide(false);
                  await supabase
                    .from('profiles')
                    .update({ guide_last_seen_at: new Date().toISOString() })
                    .eq('id', myUser.id);
                } else {
                  setShowingGuide(false);
                }
              }} style={{
                padding: '0.55em 1.4em',
                background: sortMode === k
                  ? 'linear-gradient(135deg, rgba(192,132,252,0.45), rgba(249,115,22,0.30))'
                  : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${sortMode === k ? 'rgba(192,132,252,0.9)' : 'rgba(255,255,255,0.30)'}`,
                borderRadius: '0.6rem',
                color: '#fff',
                fontFamily: '"Cinzel", serif', fontSize: 'clamp(0.72rem,1.8vw,0.85rem)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: sortMode === k ? '0 0 20px rgba(192,132,252,0.5)' : '0 0 8px rgba(255,255,255,0.05)',
                textShadow: sortMode === k ? '0 0 10px rgba(192,132,252,0.9)' : 'none',
              }}>{icon} {label}</button>
            ))}
          </div>

          {/* Categorías — chips grandes y coloridos */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[{ id: 'all', name: '✦ Todos', color: C.purple }, ...categories].map(cat => {
              const clr = cat.color || C.purple;
              const active = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  style={{
                    padding: '0.5em 1.1em',
                    background: active
                      ? `linear-gradient(135deg, ${clr}55, ${clr}33)`
                      : 'rgba(255,255,255,0.08)',
                    border: `1.5px solid ${active ? clr : 'rgba(255,255,255,0.30)'}`,
                    borderRadius: '999px', cursor: 'pointer',
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(0.70rem,1.8vw,0.82rem)',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                    boxShadow: active ? `0 0 18px ${clr}77, inset 0 1px 0 rgba(255,255,255,0.15)` : '0 0 6px rgba(255,255,255,0.05)',
                    textShadow: active ? `0 0 12px ${clr}` : 'none',
                  }}
                >{cat.name}</button>
              );
            })}
          </div>
        </div>

        {/* ══ MENSAJES DEL GUÍA — Tablón oficial ══ */}
        {!loading && posts.some(p =>
    p.category?.name?.toLowerCase().includes('guía') ||
    p.category?.name?.toLowerCase().includes('guia')
  ) && (
          <div style={{
            marginBottom: '1.75rem',
            background: 'linear-gradient(135deg, rgba(245,197,24,0.13) 0%, rgba(12,6,28,0.92) 55%, rgba(245,197,24,0.06) 100%)',
            border: '1.5px solid rgba(245,197,24,0.45)',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(245,197,24,0.12), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,197,24,0.2)',
            position: 'relative', zIndex: 1,
          }}>
            {/* Header premium */}
            <div style={{
              padding: '0.6rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(245,197,24,0.22) 0%, rgba(20,10,40,0.95) 60%, rgba(245,197,24,0.08) 100%)',
              borderBottom: '1px solid rgba(245,197,24,0.3)',
              display: 'flex', alignItems: 'center', gap: '1rem',
              boxShadow: 'inset 0 -1px 0 rgba(245,197,24,0.15), 0 4px 24px rgba(0,0,0,0.3)',
            }}>
              {/* Icono ⚜️ con glow */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(245,197,24,0.35), rgba(245,197,24,0.1))',
                border: '1.5px solid rgba(245,197,24,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
                boxShadow: '0 0 16px rgba(245,197,24,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>⚜️</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 900,
                  fontSize: 'clamp(0.85rem,2vw,1rem)', color: C.gold,
                  margin: '0 0 0.15rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                  textShadow: '0 0 20px rgba(245,197,24,0.7), 0 0 40px rgba(245,197,24,0.3)',
                }}>Mensajes del Guía</p>
                <p style={{
                  fontFamily: '"Crimson Text", serif', fontSize: '0.85rem',
                  color: 'rgba(245,197,24,0.55)', margin: 0, letterSpacing: '0.04em',
                }}>Comunicados oficiales del Templo</p>
              </div>

              <div style={{
                padding: '0.3em 1em',
                background: 'linear-gradient(135deg, rgba(245,197,24,0.2), rgba(245,197,24,0.06))',
                border: '1px solid rgba(245,197,24,0.45)',
                borderRadius: '999px',
                fontFamily: '"Cinzel", serif', fontSize: '0.65rem',
                color: C.gold, letterSpacing: '0.1em', fontWeight: 700,
                boxShadow: '0 0 12px rgba(245,197,24,0.2)',
                whiteSpace: 'nowrap',
              }}>
                {posts.filter(p => p.category?.name === 'Mensajes del Guía').length} mensajes
              </div>
            </div>

            {/* Posts del guía */}
            {posts.filter(p => p.category?.name === 'Mensajes del Guía' && (!p.hidden || myUser?.is_admin)).map((post, idx, arr) => (
              <div key={post.id} id={`post-${post.id}`} onClick={() => toggleExpand(post.id)} style={{
                padding: '1.1rem 1.5rem',
                borderBottom: idx < arr.length - 1 ? '1px solid rgba(245,197,24,0.1)' : 'none',
                display: 'flex', flexDirection: 'column', gap: '1rem',
                transition: 'background 0.2s', cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,197,24,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Layout horizontal: icono + contenido */}
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  {/* Mascota del Guía */}
                  <div style={{
                    flexShrink: 0,
                    width: 96, height: 96,
                    position: 'relative',
                    animation: 'mascotFloat 3s ease-in-out infinite',
                  }}>
                    <style>{`
                      @keyframes mascotFloat {
                        0%,100% { transform: translateY(0px); }
                        50%      { transform: translateY(-6px); }
                      }
                      @keyframes mascotGlow {
                        0%,100% { opacity: 0.5; transform: scale(1); }
                        50%      { opacity: 1;   transform: scale(1.08); }
                      }
                    `}</style>
                    {/* Glow de fondo */}
                    <div style={{
                      position: 'absolute', inset: -8,
                      borderRadius: '50%',
                      background: post.hidden
                        ? 'radial-gradient(circle, rgba(96,165,250,0.35) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(245,197,24,0.4) 0%, transparent 70%)',
                      animation: 'mascotGlow 3s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                    <img
                      src="/src/assets/proposito_mascot.png"
                      alt="El Guía"
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'contain',
                        position: 'relative', zIndex: 1,
                        filter: post.hidden
                          ? 'drop-shadow(0 0 8px rgba(96,165,250,0.7)) grayscale(0.3)'
                          : 'drop-shadow(0 0 10px rgba(245,197,24,0.8))',
                      }}
                    />
                    {/* Badge oculto encima de la mascota */}
                    {post.hidden && myUser?.is_admin && (
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        background: 'rgba(96,165,250,0.9)',
                        borderRadius: '999px', padding: '0.1em 0.4em',
                        fontFamily: '"Cinzel", serif', fontSize: '0.5rem',
                        color: '#fff', fontWeight: 700,
                        border: '1px solid rgba(96,165,250,0.5)',
                        boxShadow: '0 0 8px rgba(96,165,250,0.6)',
                      }}>🙈</div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badge oculto arriba del texto */}
                    {post.hidden && myUser?.is_admin && (
                      <span style={{
                        display: 'inline-block', marginBottom: '0.3rem',
                        fontFamily: '"Cinzel", serif', fontSize: '0.58rem',
                        color: C.blue, background: 'rgba(96,165,250,0.12)',
                        border: '1px solid rgba(96,165,250,0.3)',
                        borderRadius: '999px', padding: '0.15em 0.6em',
                        fontWeight: 700, letterSpacing: '0.06em',
                      }}>🙈 OCULTO</span>
                    )}

                    {/* Cuerpo */}
                    <p style={{
                      fontFamily: '"Crimson Text", serif',
                      fontSize: 'clamp(1.25rem,3vw,1.6rem)',
                      color: '#fff', lineHeight: 1.55,
                      margin: '0 0 0.875rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      textShadow: '0 0 24px rgba(245,197,24,0.2)',
                    }}>{post.body}</p>

                    {/* Footer */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap',
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(245,197,24,0.12)',
                    }}>
                      <span style={{
                      fontFamily: '"Cinzel", serif', fontSize: '0.65rem',
                      color: 'rgba(245,197,24,0.6)', letterSpacing: '0.06em',
                    }}>⚜️ De: {post.author?.templario_name || 'El Guía'}</span>
                    <span style={{
                      fontFamily: '"Cinzel", serif', fontSize: '0.62rem',
                      color: 'rgba(255,255,255,0.35)',
                    }}>{timeAgo(post.created_at)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(() => {
                        const isLiked = likedPosts.has(post.id);
                        return (
                          <button
                            onClick={e => { e.stopPropagation(); toggleLike(post.id); }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.4em',
                              background: isLiked
                                ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                              border: `1.5px solid ${isLiked ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.2)'}`,
                              borderRadius: '999px', padding: '0.35em 0.9em',
                              color: isLiked ? '#FF8C42' : 'rgba(255,255,255,0.8)',
                              fontFamily: '"Cinzel", serif', fontSize: '0.72rem', fontWeight: 800,
                              cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: isLiked ? '0 0 16px rgba(249,115,22,0.4)' : 'none',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.7)'; e.currentTarget.style.color = '#FF8C42'; e.currentTarget.style.boxShadow = '0 0 14px rgba(249,115,22,0.35)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = isLiked ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = isLiked ? '#FF8C42' : 'rgba(255,255,255,0.8)'; e.currentTarget.style.boxShadow = isLiked ? '0 0 16px rgba(249,115,22,0.4)' : 'none'; e.currentTarget.style.background = isLiked ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))' : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'; }}
                          >
                            <span style={{
                              fontSize: '1rem',
                              filter: isLiked ? 'drop-shadow(0 0 4px rgba(249,115,22,0.8))' : 'none',
                              animation: isLiked ? 'likePop 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none',
                            }}>{isLiked ? '🔥' : '🤍'}</span>
                            <span>{post.likes_count} {isLiked ? 'liked' : 'like'}</span>
                          </button>
                        );
                      })()}
                      <button
                        onClick={e => { e.stopPropagation(); toggleExpand(post.id); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4em',
                          background: expanded === post.id
                            ? 'linear-gradient(135deg, rgba(192,132,252,0.22), rgba(192,132,252,0.08))'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                          border: `1.5px solid ${expanded === post.id ? 'rgba(192,132,252,0.65)' : 'rgba(255,255,255,0.2)'}`,
                          borderRadius: '999px', padding: '0.35em 0.9em',
                          color: expanded === post.id ? C.purple : 'rgba(255,255,255,0.8)',
                          fontFamily: '"Cinzel", serif', fontSize: '0.72rem', fontWeight: 800,
                          cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: expanded === post.id ? '0 0 16px rgba(192,132,252,0.4)' : 'none',
                        }}
                      >💬 {post.comments_count}</button>
                      <CopyLinkBtn postId={post.id} />
                      {myUser?.is_admin && (
                        <AdminPostMenu
                          post={post}
                          onPin={async () => {
                            const newPinned = !post.pinned;
                            const { error } = await supabase.from('community_posts').update({ pinned: newPinned }).eq('id', post.id);
                            if (!error) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: newPinned } : p));
                          }}
                          onHide={async () => {
                            const newHidden = !post.hidden;
                            const { error } = await supabase.from('community_posts').update({ hidden: newHidden }).eq('id', post.id);
                            if (!error) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, hidden: newHidden } : p));
                          }}
                          onDelete={async () => {
                            const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
                            if (!error) setPosts(prev => prev.filter(p => p.id !== post.id));
                          }}
                          onEdit={(newBody) => {
                            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, body: newBody } : p));
                          }}
                        />
                      )}
                    </div>{/* fin div botones */}
                    </div>{/* fin Footer */}
                  </div>{/* fin flex:1 */}
                </div>{/* fin layout horizontal */}

                {expanded === post.id && (
                  <div style={{ borderTop: '1px solid rgba(245,197,24,0.15)', paddingTop: '0.75rem' }} onClick={e => e.stopPropagation()}>
                    {(() => {
                      const allComments = commentsMap[post.id] || [];
                      const topLevel = allComments.filter(c => !c.parent_id);
                      const visible = topLevel.slice(0, 5);
                      const hasMore = topLevel.length > 5;
                      return (
                        <>
                          <div style={{
                            maxHeight: '300px', overflowY: 'auto',
                            display: 'flex', flexDirection: 'column', gap: '0.5rem',
                            paddingRight: '0.25rem',
                          }}>
                            {visible.filter(c => !c.hidden || myUser?.is_admin).map(c => {
                              const replies = allComments.filter(r => r.parent_id === c.id);
                              const isLikd = likedComments.has(c.id);
                              return (
                                <div key={c.id}>
                                  {/* Comentario principal */}
                                  <div style={{
                                    display: 'flex', gap: '0.625rem',
                                    background: c.hidden ? 'rgba(96,165,250,0.06)' : 'rgba(192,132,252,0.06)',
                                    border: c.hidden ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(192,132,252,0.18)',
                                    borderRadius: '0.75rem',
                                    padding: '0.6rem 0.875rem',
                                    marginLeft: '0.5rem',
                                    opacity: c.hidden ? 0.6 : 1,
                                  }}>
                                    <Avatar name={c.author?.templario_name || 'M'} size={28} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.72rem', color: C.gold, fontWeight: 700 }}>
                                            {c.author?.templario_name || 'Miembro'}
                                          </span>
                                          {c.hidden && (
                                            <span style={{
                                              fontFamily: '"Cinzel", serif', fontSize: '0.55rem',
                                              color: C.blue, background: 'rgba(96,165,250,0.12)',
                                              border: '1px solid rgba(96,165,250,0.3)',
                                              borderRadius: '999px', padding: '0.1em 0.5em',
                                              fontWeight: 700, letterSpacing: '0.06em',
                                            }}>🙈 OCULTO</span>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                          {/* Like comentario */}
                                          <button onClick={e => { e.stopPropagation(); toggleCommentLike(c.id, post.id); }} style={{
                                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.2em',
                                            color: isLikd ? C.coral : 'rgba(255,255,255,0.4)',
                                            fontFamily: '"Cinzel", serif', fontSize: '0.62rem',
                                            transition: 'color 0.2s',
                                          }}>{isLikd ? '🔥' : '🤍'} {c.likes_count}</button>
                                          {/* Reply */}
                                          <button onClick={e => { e.stopPropagation(); setReplyingTo(prev => ({ ...prev, [post.id]: prev[post.id]?.commentId === c.id ? null : { commentId: c.id, name: c.author?.templario_name || 'Miembro' } })); }} style={{
                                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                            color: 'rgba(192,132,252,0.6)', fontFamily: '"Cinzel", serif', fontSize: '0.6rem',
                                            transition: 'color 0.2s',
                                          }}>↩ responder</button>
                                          {/* Link */}
                                          <CommentLinkBtn2 postId={post.id} commentId={c.id} />
                                          {/* Admin */}
                                          {myUser?.is_admin && (
                                            <AdminCommentMenu
                                              comment={c}
                                              postId={post.id}
                                              onDelete={handleAdminDeleteComment}
                                              onEdit={handleAdminEditComment}
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <p style={{ fontFamily: '"Crimson Text", serif', fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>{c.body}</p>
                                    </div>
                                  </div>

                                  {/* Replies */}
                                  {replies.map(r => (
                                    <div key={r.id} style={{
                                      display: 'flex', gap: '0.5rem',
                                      background: 'rgba(245,197,24,0.04)',
                                      border: '1px solid rgba(245,197,24,0.15)',
                                      borderRadius: '0.625rem',
                                      padding: '0.5rem 0.75rem',
                                      marginLeft: '2rem',
                                      marginTop: '0.3rem',
                                    }}>
                                      <Avatar name={r.author?.templario_name || 'M'} size={22} />
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.65rem', color: C.purple, fontWeight: 700 }}>
                                          {r.author?.templario_name || 'Miembro'}
                                        </span>
                                        <p style={{ fontFamily: '"Crimson Text", serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', margin: '0.1rem 0 0' }}>{r.body}</p>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Input reply */}
                                  {replyingTo[post.id]?.commentId === c.id && (
                                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '2rem', marginTop: '0.3rem' }}>
                                      <Avatar name={myUser?.templario_name || '?'} size={22} color={C.purple} />
                                      <input
                                        autoFocus
                                        value={commentText[post.id] || ''}
                                        onChange={e => setCommentText(p => ({ ...p, [post.id]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); submitComment(post.id, c.id); } if (e.key === 'Escape') setReplyingTo(prev => ({ ...prev, [post.id]: null })); }}
                                        placeholder={`Respondiendo a ${replyingTo[post.id]?.name}…`}
                                        style={{
                                          flex: 1, background: 'rgba(245,197,24,0.06)',
                                          border: '1px solid rgba(245,197,24,0.3)', borderRadius: '0.5rem',
                                          padding: '0.4rem 0.65rem', color: '#fff',
                                          fontFamily: '"Crimson Text", serif', fontSize: '0.88rem', outline: 'none',
                                        }}
                                      />
                                      <button onClick={e => { e.stopPropagation(); submitComment(post.id, c.id); }} style={{
                                        padding: '0.4rem 0.75rem',
                                        background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.4)',
                                        borderRadius: '0.5rem', color: C.gold,
                                        fontFamily: '"Cinzel", serif', fontSize: '0.72rem', cursor: 'pointer',
                                      }}>→</button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {hasMore && (
                            <button onClick={e => { e.stopPropagation(); loadComments(post.id); }} style={{
                              display: 'flex', alignItems: 'center', gap: '0.4em',
                              background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.25)',
                              borderRadius: '999px', padding: '0.35em 1em',
                              color: C.gold, cursor: 'pointer',
                              fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
                              marginLeft: '0.5rem', marginTop: '0.4rem', transition: 'all 0.2s',
                            }}>⚡ Ver {topLevel.length - 5} comentarios más</button>
                          )}
                        </>
                      );
                    })()}
                    {!replyingTo[post.id] && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <Avatar name={myUser?.templario_name || myUser?.full_name || '?'} size={28} color={C.gold} />
                        <input
                          value={commentText[post.id] || ''}
                          onChange={e => setCommentText(p => ({ ...p, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && submitComment(post.id, null)}
                          placeholder="Responde al Guía…"
                          style={{
                            flex: 1, background: 'rgba(245,197,24,0.08)',
                            border: '1px solid rgba(245,197,24,0.35)', borderRadius: '0.5rem',
                            padding: '0.5rem 0.75rem', color: '#fff',
                            fontFamily: '"Crimson Text", serif', fontSize: '0.9rem', outline: 'none',
                          }}
                        />
                        <button onClick={() => submitComment(post.id, null)} style={{
                          padding: '0.5rem 0.875rem',
                          background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.4)',
                          borderRadius: '0.5rem', color: C.gold,
                          fontFamily: '"Cinzel", serif', fontSize: '0.75rem', cursor: 'pointer',
                        }}>→</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {loading ? <Spinner /> : (() => {
          const feedPosts = posts.filter(p =>
            !p.category?.name?.toLowerCase().includes('guía') &&
            !p.category?.name?.toLowerCase().includes('guia') &&
            (!p.hidden || myUser?.is_admin)
          );
          if (sortMode === 'guide') return null;
          if (feedPosts.length === 0) return null;
          return feedPosts.map(post => {
          const lvl     = getLvl(post.author?.community_level || 1);
          const isLiked = likedPosts.has(post.id);
          const isExp   = expanded === post.id;
          const postComments = commentsMap[post.id] || [];

          return (
            <div key={post.id} id={`post-${post.id}`} style={{
              background: post.pinned
              ? 'linear-gradient(135deg, rgba(245,197,24,0.14) 0%, rgba(20,12,40,0.92) 60%, rgba(245,197,24,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(192,132,252,0.10) 0%, rgba(15,8,32,0.88) 55%, rgba(249,115,22,0.06) 100%)',
            border: `1px solid ${post.pinned ? 'rgba(245,197,24,0.45)' : 'rgba(192,132,252,0.28)'}`,
            borderRadius: '1rem', padding: '1.25rem',
            marginBottom: '0.875rem',
              boxShadow: post.pinned
                ? '0 0 40px rgba(245,197,24,0.15), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,197,24,0.2)'
                : '0 0 24px rgba(192,132,252,0.1), 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {/* Pin */}
              {post.pinned && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3em',
                  fontSize: '0.63rem', color: C.gold,
                  fontFamily: '"Cinzel", serif', marginBottom: '0.625rem',
                  background: `${C.gold}14`, padding: '0.15em 0.6em',
                  borderRadius: '999px', border: `1px solid ${C.gold}25`,
                }}>📌 Fijado</div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <Avatar name={post.author?.templario_name || 'M'} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 700,
                        fontSize: 'clamp(0.78rem,2vw,0.88rem)', color: '#fff',
                      }}>
                        {post.author?.templario_name || 'Miembro'}
                      </span>
                      <Badge
                        level={post.author?.community_level || 1}
                        title={lvl.title} color={lvl.color} icon={lvl.icon}
                      />
                    </div>
                    <span style={{
                      fontFamily: '"Cinzel", serif', fontSize: '0.65rem', color: C.muted,
                      whiteSpace: 'nowrap',
                    }}>{timeAgo(post.created_at)}</span>
                  </div>
                  {post.category && (
                    <span style={{
                      display: 'inline-block', marginTop: '0.25rem',
                      fontFamily: '"Cinzel", serif', fontSize: '0.62rem',
                      color: post.category.color || C.purple,
                      background: `${post.category.color || C.purple}14`,
                      padding: '0.1em 0.55em', borderRadius: '999px',
                      border: `1px solid ${post.category.color || C.purple}22`,
                    }}>#{post.category.name}</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <p style={{
                fontFamily: '"Crimson Text", serif',
                fontSize: 'clamp(0.95rem,2.2vw,1.05rem)',
                color: 'rgba(255,255,255,0.85)', lineHeight: 1.65,
                marginBottom: '1rem', margin: '0 0 1rem',
              }}>{post.body}</p>

              {/* Acciones */}
              <div style={{
                display: 'flex', gap: '1rem', alignItems: 'center',
                paddingTop: '0.75rem', borderTop: `1px solid rgba(192,132,252,0.1)`,
              }}>
                {/* Like */}
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5em',
                    background: isLiked
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: `1.5px solid ${isLiked ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '999px', padding: '0.45em 1.1em',
                    color: isLiked ? '#FF8C42' : 'rgba(255,255,255,0.8)',
                    fontFamily: '"Cinzel", serif', fontSize: '0.78rem', fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isLiked
                      ? '0 0 20px rgba(249,115,22,0.45), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 0 8px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
                    letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.7)';
                    e.currentTarget.style.color = '#FF8C42';
                    e.currentTarget.style.boxShadow = '0 0 18px rgba(249,115,22,0.4)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLiked ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = isLiked ? '#FF8C42' : 'rgba(255,255,255,0.8)';
                    e.currentTarget.style.boxShadow = isLiked ? '0 0 20px rgba(249,115,22,0.45)' : '0 0 8px rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = isLiked ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))' : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
                  }}
                >
                  <span style={{
                    fontSize: '1.1rem', display: 'inline-block',
                    animation: isLiked ? 'likePop 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none',
                    filter: isLiked ? 'drop-shadow(0 0 4px rgba(249,115,22,0.8))' : 'none',
                  }}>{isLiked ? '🔥' : '🤍'}</span>
                  <span>{post.likes_count} {isLiked ? 'liked' : 'like'}</span>
                </button>

                {/* Comentarios */}
                <button
                  onClick={() => toggleExpand(post.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5em',
                    background: isExp
                      ? 'linear-gradient(135deg, rgba(192,132,252,0.22), rgba(192,132,252,0.08))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: `1.5px solid ${isExp ? 'rgba(192,132,252,0.65)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '999px', padding: '0.45em 1.1em',
                    color: isExp ? C.purple : 'rgba(255,255,255,0.8)',
                    fontFamily: '"Cinzel", serif', fontSize: '0.78rem', fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isExp
                      ? '0 0 20px rgba(192,132,252,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 0 8px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
                    letterSpacing: '0.04em',
                    animation: post.comments_count > 0 && !isExp ? 'commentPulse 2s ease-in-out infinite' : 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(192,132,252,0.7)';
                    e.currentTarget.style.color = C.purple;
                    e.currentTarget.style.boxShadow = '0 0 18px rgba(192,132,252,0.4)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(192,132,252,0.08))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isExp ? 'rgba(192,132,252,0.65)' : 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = isExp ? C.purple : 'rgba(255,255,255,0.8)';
                    e.currentTarget.style.boxShadow = isExp ? '0 0 20px rgba(192,132,252,0.35)' : '0 0 8px rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = isExp ? 'linear-gradient(135deg, rgba(192,132,252,0.22), rgba(192,132,252,0.08))' : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
                  }}
                >
                  <span style={{
                    fontSize: '1.1rem', display: 'inline-block',
                    animation: post.comments_count > 0 && !isExp ? 'commentBounce 2s ease-in-out infinite' : 'none',
                  }}>💬</span>
                  <span>{post.comments_count} {post.comments_count === 1 ? 'comentario' : 'comentarios'}</span>
                </button>

                <CopyLinkBtn postId={post.id} />

                {myUser?.is_admin && (
                  <AdminPostMenu
                    post={post}
                    onPin={async () => {
                      const newPinned = !post.pinned;
                      const { error } = await supabase.from('community_posts').update({ pinned: newPinned }).eq('id', post.id);
                      if (!error) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: newPinned } : p));
                    }}
                    onHide={async () => {
                      const newHidden = !post.hidden;
                      const { error } = await supabase.from('community_posts').update({ hidden: newHidden }).eq('id', post.id);
                      if (!error) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, hidden: newHidden } : p));
                    }}
                    onDelete={async () => {
                      const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
                      if (!error) setPosts(prev => prev.filter(p => p.id !== post.id));
                    }}
                    onEdit={(newBody) => {
                      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, body: newBody } : p));
                    }}
                  />
                )}
              </div>

              <style>{`
                @keyframes likePop {
                  0%   { transform: scale(1); }
                  50%  { transform: scale(1.4); }
                  100% { transform: scale(1); }
                }
                @keyframes commentBounce {
                  0%,100% { transform: scale(1); }
                  50%     { transform: scale(1.25); }
                }
                @keyframes commentPulse {
                  0%,100% { box-shadow: 0 0 0px rgba(192,132,252,0); }
                  50%     { box-shadow: 0 0 14px rgba(192,132,252,0.4); }
                }
              `}</style>

              {/* Comentarios */}
              {isExp && (
                <div style={{ marginTop: '1rem' }}>
                  {(() => {
                    const allC = commentsMap[post.id] || [];
                    const topLevel = allC.filter(c => !c.parent_id && (!c.hidden || myUser?.is_admin));
                    return topLevel.map(c => {
                      const clvl   = getLvl(c.author?.community_level || 1);
                      const isLikd = likedComments.has(c.id);
                      const replies = allC.filter(r => r.parent_id === c.id);
                      return (
                        <div key={c.id}>
                          <div style={{
                            display: 'flex', gap: '0.625rem',
                            paddingTop: '0.75rem',
                            borderTop: `1px solid ${C.border}`,
                          }}>
                            <Avatar name={c.author?.templario_name || 'M'} size={28} />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: '0.2rem',
                                flexWrap: 'wrap', gap: '0.25rem',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{
                                    fontFamily: '"Cinzel", serif', fontSize: '0.75rem',
                                    fontWeight: 700, color: '#fff',
                                  }}>{c.author?.templario_name || 'Miembro'}</span>
                                  <span style={{
                                    fontFamily: '"Cinzel", serif',
                                    fontSize: '0.58rem', color: clvl.color,
                                  }}>{clvl.icon} Nv.{c.author?.community_level || 1}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => toggleCommentLike(c.id, post.id)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '0.3em',
                                      background: isLikd
                                        ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))'
                                        : 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
                                      border: `1.5px solid ${isLikd ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.18)'}`,
                                      borderRadius: '999px', padding: '0.25em 0.7em',
                                      color: isLikd ? '#FF8C42' : 'rgba(255,255,255,0.7)',
                                      fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
                                      cursor: 'pointer', transition: 'all 0.2s',
                                      boxShadow: isLikd ? '0 0 10px rgba(249,115,22,0.35)' : 'none',
                                    }}
                                  >{isLikd ? '🔥' : '🤍'} {c.likes_count}</button>
                                  <button
                                    onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: prev[post.id]?.commentId === c.id ? null : { commentId: c.id, name: c.author?.templario_name || 'Miembro' } }))}
                                    style={{
                                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                      color: 'rgba(192,132,252,0.6)', fontFamily: '"Cinzel", serif', fontSize: '0.6rem',
                                      transition: 'color 0.2s',
                                    }}
                                  >↩ responder</button>
                                  <span style={{
                                    fontFamily: '"Cinzel", serif',
                                    fontSize: '0.6rem', color: C.muted,
                                  }}>{timeAgo(c.created_at)}</span>
                                </div>
                              </div>
                              <p style={{
                                fontFamily: '"Crimson Text", serif',
                                fontSize: 'clamp(0.88rem,2vw,0.95rem)',
                                color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, margin: 0,
                              }}>{c.body}</p>
                            </div>
                          </div>

                          {/* Replies */}
                          {replies.map(r => (
                            <div key={r.id} style={{
                              display: 'flex', gap: '0.5rem',
                              background: 'rgba(192,132,252,0.04)',
                              border: '1px solid rgba(192,132,252,0.15)',
                              borderRadius: '0.625rem',
                              padding: '0.5rem 0.75rem',
                              marginLeft: '2.25rem',
                              marginTop: '0.3rem',
                            }}>
                              <Avatar name={r.author?.templario_name || 'M'} size={22} />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontFamily: '"Cinzel", serif', fontSize: '0.65rem', color: C.purple, fontWeight: 700 }}>
                                  {r.author?.templario_name || 'Miembro'}
                                </span>
                                <p style={{ fontFamily: '"Crimson Text", serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', margin: '0.1rem 0 0' }}>{r.body}</p>
                              </div>
                            </div>
                          ))}

                          {/* Input reply */}
                          {replyingTo[post.id]?.commentId === c.id && (
                            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '2.25rem', marginTop: '0.3rem' }}>
                              <Avatar name={myUser?.templario_name || '?'} size={22} color={C.purple} />
                              <input
                                autoFocus
                                value={commentText[post.id] || ''}
                                onChange={e => setCommentText(p => ({ ...p, [post.id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { e.stopPropagation(); submitComment(post.id, c.id); }
                                  if (e.key === 'Escape') setReplyingTo(prev => ({ ...prev, [post.id]: null }));
                                }}
                                placeholder={`Respondiendo a ${replyingTo[post.id]?.name}…`}
                                style={{
                                  flex: 1, background: 'rgba(192,132,252,0.06)',
                                  border: '1px solid rgba(192,132,252,0.3)', borderRadius: '0.5rem',
                                  padding: '0.4rem 0.65rem', color: '#fff',
                                  fontFamily: '"Crimson Text", serif', fontSize: '0.88rem', outline: 'none',
                                }}
                              />
                              <button onClick={e => { e.stopPropagation(); submitComment(post.id, c.id); }} style={{
                                padding: '0.4rem 0.75rem',
                                background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.4)',
                                borderRadius: '0.5rem', color: C.purple,
                                fontFamily: '"Cinzel", serif', fontSize: '0.72rem', cursor: 'pointer',
                              }}>→</button>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {/* Input comentario principal */}
                  {!replyingTo[post.id] && (
                    <div style={{
                      display: 'flex', gap: '0.625rem',
                      marginTop: '0.75rem', paddingTop: '0.75rem',
                      borderTop: `1px solid ${C.border}`,
                    }}>
                      <Avatar name={myUser?.full_name || myUser?.templario_name || '?'} size={28} color={C.purple} />
                      <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={commentText[post.id] || ''}
                          onChange={e => setCommentText(p => ({ ...p, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && submitComment(post.id, null)}
                          placeholder="Responde…"
                          style={{
                            flex: 1, background: 'rgba(255,255,255,0.08)',
                            border: `1.5px solid rgba(192,132,252,0.45)`, borderRadius: '0.5rem',
                            padding: '0.5rem 0.75rem', color: '#fff',
                            fontFamily: '"Crimson Text", serif', fontSize: '0.9rem', outline: 'none',
                            transition: 'border-color 0.2s',
                            boxShadow: '0 0 10px rgba(192,132,252,0.1)',
                          }}
                          onFocus={e => (e.target.style.borderColor = `${C.purple}66`)}
                          onBlur={e  => (e.target.style.borderColor = C.border)}
                        />
                        <button
                          onClick={() => submitComment(post.id, null)}
                          style={{
                            padding: '0.5rem 0.875rem',
                            background: `${C.purple}22`,
                            border: `1px solid ${C.purple}44`,
                            borderRadius: '0.5rem', color: C.purple,
                            fontFamily: '"Cinzel", serif', fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >→</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
        })()}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  TAB: MIEMBROS
  // ════════════════════════════════════════════════════════════════════════════
  const MembersTab = ({ myUser, getLvl, levelCfg, onOpenDM }) => {
    const [members,  setMembers]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
      supabase
        .from('community_user_stats')
        .select(`
          user_id, community_points, community_level,
          total_posts, total_comments, total_likes_recv, total_xp_earned,
          profile:profiles!community_user_stats_user_id_fkey(id, templario_name, email)
        `)
        .order('community_points', { ascending: false })
        .limit(100)
        .then(({ data }) => { setMembers(data || []); setLoading(false); });
    }, []);

    const filtered = useMemo(() =>
      members.filter(m =>
        m.user_id !== myUser?.id &&
        (m.profile?.templario_name || m.profile?.email || '')
          .toLowerCase().includes(search.toLowerCase())
      ),
    [members, search, myUser?.id]);

    const getName = (m) =>
      m?.profile?.templario_name || m?.profile?.email?.split('@')[0] || 'Miembro';

    // ─── Vista detalle miembro ─────────────────────────────────────────────────
    if (selected) {
      const m    = selected;
      const lvl  = getLvl(m.community_level);
      const name = getName(m);
      const next = levelCfg.find(l => l.level === m.community_level + 1);
      const curr = levelCfg.find(l => l.level === m.community_level);
      const pct  = next && curr
        ? Math.min(100, Math.round(
            ((m.community_points - curr.min_points) / (next.min_points - curr.min_points)) * 100
          ))
        : 100;

      return (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              background: 'none', border: 'none', color: C.muted,
              fontFamily: '"Cinzel", serif', fontSize: '0.75rem',
              cursor: 'pointer', marginBottom: '1.5rem', padding: 0,
            }}
          >← Volver</button>

          <div style={{
            background: C.surface, border: `1px solid ${lvl.color}33`,
            borderRadius: '1.25rem', padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Avatar name={name} size={72} />
            </div>
            <h3 style={{
              fontFamily: '"Cinzel", serif', fontWeight: 700,
              fontSize: 'clamp(1.1rem,3vw,1.3rem)', color: '#fff',
              margin: '0 0 0.5rem',
            }}>{name}</h3>
            <div style={{ marginBottom: '1.25rem' }}>
              <Badge level={m.community_level} title={lvl.title} color={lvl.color} icon={lvl.icon} />
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: '0.75rem', margin: '0 0 1.25rem',
            }}>
              {[
                { label: 'Puntos',    val: m.community_points },
                { label: 'Posts',     val: m.total_posts },
                { label: 'Likes rec', val: m.total_likes_recv },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.surf2, borderRadius: '0.75rem', padding: '0.875rem 0.5rem',
                }}>
                  <p style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700,
                    fontSize: 'clamp(0.9rem,2vw,1rem)', color: lvl.color, margin: '0 0 0.25rem',
                  }}>{s.val}</p>
                  <p style={{
                    fontFamily: '"Cinzel", serif', fontSize: '0.58rem',
                    color: C.muted, letterSpacing: '0.06em', margin: 0,
                  }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Barra progreso */}
            {next && curr && (
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '0.375rem',
                }}>
                  <span style={{
                    fontFamily: '"Cinzel", serif', fontSize: '0.63rem', color: C.muted,
                  }}>→ {next.title}</span>
                  <span style={{
                    fontFamily: '"Cinzel", serif', fontSize: '0.63rem', color: lvl.color,
                  }}>{pct}%</span>
                </div>
                <div style={{
                  height: 5, borderRadius: '999px',
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '999px', width: `${pct}%`,
                    background: `linear-gradient(90deg,${lvl.color}88,${lvl.color})`,
                    transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
              </div>
            )}

            <button
              onClick={() => { onOpenDM(m); setSelected(null); }}
              style={{
                width: '100%', padding: '0.875rem',
                background: `${lvl.color}22`, border: `1px solid ${lvl.color}44`,
                borderRadius: '0.75rem', color: lvl.color,
                fontFamily: '"Cinzel", serif', fontWeight: 700,
                fontSize: '0.78rem', letterSpacing: '0.08em', cursor: 'pointer',
              }}
            >💬 Enviar mensaje directo</button>
          </div>
        </div>
      );
    }

    // ─── Grid de miembros ──────────────────────────────────────────────────────
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
        <style>{`
          @keyframes membersRayDrift {
            0%,100% { transform: translateX(-50%) rotate(-22deg); opacity: 0.9; }
            50%      { transform: translateX(-50%) rotate(6deg);  opacity: 0.6; }
          }
          @keyframes membersRayDrift2 {
            0%,100% { transform: translateX(-50%) rotate(18deg); }
            50%      { transform: translateX(-50%) rotate(-8deg); }
          }
          @keyframes starTwinkle {
            0%,100% { opacity: 0.2; transform: scale(1); }
            50%      { opacity: 0.9; transform: scale(1.6); }
          }
        `}</style>

        {/* ══ RAYO CONSTELACIÓN — Miembros ══ */}
        <div style={{
          position: 'absolute',
          top: -50, left: '60%',
          width: 2,
          height: '85%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(96,165,250,0.55) 20%, rgba(192,132,252,0.25) 65%, transparent 100%)',
          transform: 'translateX(-50%) rotate(-22deg)',
          transformOrigin: 'top center',
          animation: 'membersRayDrift 10s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(0.8px)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: -50, left: '25%',
          width: 100,
          height: '70%',
          background: 'radial-gradient(ellipse at top, rgba(192,132,252,0.1) 0%, transparent 70%)',
          transform: 'translateX(-50%) rotate(18deg)',
          transformOrigin: 'top center',
          animation: 'membersRayDrift2 13s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(12px)',
          zIndex: 0,
        }} />
        {/* Estrellitas constelación */}
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: `${8 + i * 18}%`,
            left: `${10 + i * 18}%`,
            width: 2, height: 2, borderRadius: '50%',
            background: i % 2 === 0 ? '#60A5FA' : '#C084FC',
            animation: `starTwinkle ${1.8 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        ))}

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar miembro…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(96,165,250,0.6)',
            borderRadius: '0.75rem', padding: '0.75rem 1rem',
            color: '#fff', fontFamily: '"Cinzel", serif', fontSize: '0.85rem',
            outline: 'none', marginBottom: '1.25rem',
            transition: 'border-color 0.2s',
            position: 'relative', zIndex: 1,
            boxShadow: '0 0 20px rgba(96,165,250,0.2)',
          }}
          onFocus={e => (e.target.style.borderColor = `${C.purple}88`)}
          onBlur={e  => (e.target.style.borderColor = 'rgba(96,165,250,0.3)')}
        />
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <Empty text={search ? 'Sin resultados.' : 'No hay otros miembros aún.'} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,185px),1fr))',
            gap: '0.875rem',
          }}>
            {filtered.map(m => {
              const lvl  = getLvl(m.community_level);
              const name = getName(m);
              return (
                <div
                  key={m.user_id}
                  onClick={() => setSelected(m)}
                  style={{
                    background: `linear-gradient(145deg, ${lvl.color}18 0%, rgba(12,6,28,0.90) 55%, ${lvl.color}08 100%)`,
                    backdropFilter: 'blur(24px)',
                    border: `1px solid ${lvl.color}40`,
                    borderRadius: '1rem', padding: '1.25rem',
                    cursor: 'pointer', textAlign: 'center',
                    boxShadow: `0 0 20px ${lvl.color}18, 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09)`,
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${lvl.color}44`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <Avatar name={name} size={48} />
                  </div>
                  <p style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 700,
                    fontSize: '0.8rem', color: '#fff',
                    margin: '0 0 0.35rem', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{name}</p>
                  <Badge level={m.community_level} title={lvl.title} color={lvl.color} icon={lvl.icon} />
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.625rem',
                  }}>
                    <span style={{
                      fontFamily: '"Cinzel", serif', fontSize: '0.62rem', color: '#fff',
                      fontWeight: 700,
                    }}>⚡ {m.community_points}</span>
                    <span style={{
                      fontFamily: '"Cinzel", serif', fontSize: '0.62rem', color: '#fff',
                      fontWeight: 700,
                    }}>📝 {m.total_posts}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  TAB: DMs
  // ════════════════════════════════════════════════════════════════════════════
  const DMsTab = ({ myUser, initialTarget, onReward, pointsCfg, getLvl }) => {
    const [threads,    setThreads]    = useState([]);
    const [selected,   setSelected]   = useState(null);
    const [messages,   setMessages]   = useState([]);
    const [input,      setInput]      = useState('');
    const [loadingMsg, setLoadingMsg] = useState(false);
    const [unreadMap,  setUnreadMap]  = useState({});
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    // ─── Cargar threads ────────────────────────────────────────────────────────
    const loadThreads = useCallback(async () => {
      if (!myUser?.id) return;
      const { data } = await supabase.rpc('get_dm_threads', { p_user_id: myUser.id });
      if (data) {
        setThreads(data);
        const um = {};
        data.forEach(t => { um[t.partner_id] = Number(t.unread_count) || 0; });
        setUnreadMap(um);
      }
    }, [myUser?.id]);

    useEffect(() => { loadThreads(); }, [loadThreads]);

    // ─── Aplicar initialTarget (desde Miembros) ────────────────────────────────
    useEffect(() => {
      if (!initialTarget) return;
      const id    = initialTarget.user_id || initialTarget.id;
      const name  = initialTarget.profile?.full_name || initialTarget.full_name || 'Miembro';
      const level = initialTarget.community_level || 1;
      setSelected({ partner_id: id, partner_name: name, community_level: level });
    }, [initialTarget]);

    // ─── Cargar mensajes de conversación ──────────────────────────────────────
    useEffect(() => {
      if (!selected || !myUser?.id) return;
      setLoadingMsg(true);
      const pid = selected.partner_id;
      supabase
        .from('community_dms')
        .select('id, from_user, to_user, body, read, created_at')
        .or(`and(from_user.eq.${myUser.id},to_user.eq.${pid}),and(from_user.eq.${pid},to_user.eq.${myUser.id})`)
        .order('created_at', { ascending: true })
        .then(({ data }) => { setMessages(data || []); setLoadingMsg(false); });

      // Marcar como leídos
      supabase
        .from('community_dms')
        .update({ read: true })
        .eq('to_user', myUser.id)
        .eq('from_user', pid)
        .then(() => {
          setUnreadMap(prev => ({ ...prev, [pid]: 0 }));
        });
    }, [selected, myUser?.id]);

    // ─── Realtime: mensajes nuevos ─────────────────────────────────────────────
    useEffect(() => {
      if (!myUser?.id) return;
      const ch = supabase
        .channel(`dms_${myUser.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'community_dms',
          filter: `to_user=eq.${myUser.id}`,
        }, payload => {
          const msg = payload.new;
          if (msg.from_user === selected?.partner_id) {
            setMessages(prev => [...prev, msg]);
            // marcar leído automáticamente
            supabase.from('community_dms').update({ read: true }).eq('id', msg.id).then(() => {});
          } else {
            setUnreadMap(prev => ({ ...prev, [msg.from_user]: (prev[msg.from_user] || 0) + 1 }));
            loadThreads();
          }
        })
        .subscribe();
      return () => supabase.removeChannel(ch);
    }, [myUser?.id, selected, loadThreads]);

    // ─── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Enviar mensaje ────────────────────────────────────────────────────────
    const sendMessage = useCallback(async () => {
      if (!input.trim() || !selected || !myUser?.id) return;
      const body = input.trim();
      setInput('');
      const { data, error } = await supabase
        .from('community_dms')
        .insert({ from_user: myUser.id, to_user: selected.partner_id, body })
        .select()
        .single();
      if (!error && data) {
        setMessages(prev => [...prev, data]);
        await supabase.rpc('award_community_points', {
          p_user_id: myUser.id, p_action: 'dm', p_ref_id: data.id,
        });
        onReward(pointsCfg.dm || { points: 2, coins: 1, xp: 3 });
        loadThreads();
      } else if (error) {
        setInput(body); // restaurar si falló
      }
    }, [input, selected, myUser?.id, onReward, pointsCfg, loadThreads]);

    const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: selected ? 'min(230px,34%) 1fr' : '1fr',
        gap: '1rem', maxWidth: 820, margin: '0 auto', minHeight: '60vh',
        position: 'relative',
      }}>
        <style>{`
          @keyframes dmsRayPulse {
            0%,100% { transform: translateX(-50%) rotate(20deg); opacity: 0.8; }
            50%      { transform: translateX(-50%) rotate(-10deg); opacity: 0.5; }
          }
          @keyframes dmsRayPulse2 {
            0%,100% { transform: translateX(-50%) rotate(-16deg); }
            50%      { transform: translateX(-50%) rotate(12deg); }
          }
          @keyframes dmsDot {
            0%,100% { opacity: 0.15; transform: scale(1); }
            50%      { opacity: 0.7; transform: scale(2); }
          }
        `}</style>

        {/* ══ RAYO SEÑAL — Mensajes ══ */}
        <div style={{
          position: 'absolute',
          top: -50, left: '45%',
          width: 2,
          height: '90%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.55) 22%, rgba(96,165,250,0.2) 68%, transparent 100%)',
          transform: 'translateX(-50%) rotate(20deg)',
          transformOrigin: 'top center',
          animation: 'dmsRayPulse 8s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(0.8px)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: -50, left: '20%',
          width: 90,
          height: '65%',
          background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.1) 0%, transparent 70%)',
          transform: 'translateX(-50%) rotate(-16deg)',
          transformOrigin: 'top center',
          animation: 'dmsRayPulse2 11s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(10px)',
          zIndex: 0,
        }} />
        {/* Puntos de señal/ping */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: `${15 + i * 25}%`,
            left: `${75 + i * 7}%`,
            width: 4, height: 4, borderRadius: '50%',
            background: '#10B981',
            animation: `dmsDot ${1.5 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        ))}

        {/* Lista de threads */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '1rem', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: 520,
          boxShadow: '0 0 20px rgba(16,185,129,0.06)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            padding: '1rem 1.25rem', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{
              fontFamily: '"Cinzel", serif', fontSize: '0.7rem',
              letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff',
              fontWeight: 700, margin: 0,
              textShadow: '0 0 10px rgba(16,185,129,0.6)',
            }}>💬 Mensajes</p>
            {totalUnread > 0 && (
              <span style={{
                background: C.purple, borderRadius: '999px',
                padding: '0.1em 0.55em',
                fontFamily: '"Cinzel", serif', fontSize: '0.63rem',
                color: '#0a0614', fontWeight: 700,
              }}>{totalUnread}</span>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {threads.length === 0 && (
              <p style={{
                fontFamily: '"Crimson Text", serif', fontSize: '0.95rem',
                color: C.muted, textAlign: 'center', padding: '1.5rem 1rem', margin: 0,
              }}>Sin conversaciones aún</p>
            )}
            {threads.map(t => {
              const lvl       = getLvl(t.community_level);
              const isActive  = selected?.partner_id === t.partner_id;
              const unread    = unreadMap[t.partner_id] || 0;
              return (
                <div
                  key={t.partner_id}
                  onClick={() => setSelected(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1.25rem', cursor: 'pointer',
                    background: isActive ? C.surf2 : 'transparent',
                    borderBottom: `1px solid ${C.border}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar name={t.partner_name || '?'} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 700,
                        fontSize: '0.78rem', color: '#fff', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{t.partner_name}</p>
                      {unread > 0 && (
                        <span style={{
                          background: C.purple, borderRadius: '999px',
                          padding: '0.05em 0.45em', flexShrink: 0,
                          fontFamily: '"Cinzel", serif', fontSize: '0.6rem',
                          color: '#0a0614', fontWeight: 700,
                        }}>{unread}</span>
                      )}
                    </div>
                    {t.last_body && (
                      <p style={{
                        fontFamily: '"Crimson Text", serif', fontSize: '0.82rem',
                        color: C.muted, margin: '0.1rem 0 0',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{t.last_body}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de chat */}
        {selected ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(12,6,28,0.90) 55%, rgba(96,165,250,0.07) 100%)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: '1rem', overflow: 'hidden', minHeight: 400,
            boxShadow: '0 0 30px rgba(16,185,129,0.10), 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem', borderBottom: `1px solid ${C.border}`,
            }}>
              <Avatar name={selected.partner_name || '?'} size={32} />
              <div>
                <p style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 700,
                  fontSize: '0.82rem', color: '#fff', margin: 0,
                }}>{selected.partner_name}</p>
                <Badge
                  level={selected.community_level || 1}
                  title={getLvl(selected.community_level).title}
                  color={getLvl(selected.community_level).color}
                  icon={getLvl(selected.community_level).icon}
                />
              </div>
            </div>

            {/* Mensajes */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '1rem 1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.625rem',
              maxHeight: 380,
            }}>
              {loadingMsg ? <Spinner /> : messages.length === 0 ? (
                <p style={{
                  fontFamily: '"Crimson Text", serif', fontSize: '1rem',
                  color: C.muted, textAlign: 'center', marginTop: '2rem',
                }}>Inicia la conversación</p>
              ) : messages.map(msg => {
                const isMe = msg.from_user === myUser?.id;
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      background: isMe ? `${C.purple}22` : C.surf2,
                      border: `1px solid ${isMe ? C.purple + '44' : C.border}`,
                      borderRadius: isMe
                        ? '1rem 1rem 0.25rem 1rem'
                        : '1rem 1rem 1rem 0.25rem',
                      padding: '0.625rem 0.875rem',
                    }}>
                      <p style={{
                        fontFamily: '"Crimson Text", serif',
                        fontSize: 'clamp(0.88rem,2vw,0.98rem)',
                        color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0,
                      }}>{msg.body}</p>
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.55rem',
                        color: C.muted, marginTop: '0.25rem', textAlign: 'right', margin: '0.25rem 0 0',
                      }}>{timeAgo(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              display: 'flex', gap: '0.625rem',
              padding: '0.875rem 1.25rem', borderTop: `1px solid ${C.border}`,
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe un mensaje…"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.08)',
                  border: `1.5px solid rgba(16,185,129,0.5)`, borderRadius: '0.625rem',
                  padding: '0.625rem 0.875rem', color: '#fff',
                  fontFamily: '"Crimson Text", serif', fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 0 12px rgba(16,185,129,0.15)',
                }}
                onFocus={e => (e.target.style.borderColor = `${C.purple}66`)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '0.625rem 1.125rem',
                  background: input.trim() ? `${C.purple}33` : C.surf2,
                  border: `1px solid ${input.trim() ? C.purple + '55' : C.border}`,
                  borderRadius: '0.625rem',
                  color: input.trim() ? C.purple : C.muted,
                  fontFamily: '"Cinzel", serif', fontSize: '0.85rem',
                  cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >→</button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(10,6,20,0.9))',
            border: `1.5px solid rgba(16,185,129,0.45)`,
            borderRadius: '1rem', minHeight: 300,
            boxShadow: '0 0 30px rgba(16,185,129,0.15)',
          }}>
            <p style={{
              fontFamily: '"Crimson Text", serif', fontSize: '1.1rem', color: '#fff',
              textShadow: '0 0 16px rgba(16,185,129,0.5)',
            }}>Selecciona una conversación o ve a Miembros para iniciar una</p>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  Cuenta regresiva a cierre de ciclo (Lunes 00:00 UTC / día 1 de mes 00:00 UTC)
  // ════════════════════════════════════════════════════════════════════════════
  function useClosureCountdown() {
    const calc = () => {
      const now = new Date();
      const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const day = nextMonday.getUTCDay();
      const daysToAdd = day === 1 ? 7 : ((8 - day) % 7) || 7;
      nextMonday.setUTCDate(nextMonday.getUTCDate() + daysToAdd);
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const parts = (target) => {
        const diff = Math.max(0, target - now);
        return {
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        };
      };
      return { '7d': parts(nextMonday), '30d': parts(nextMonth) };
    };
    const [countdown, setCountdown] = useState(calc);
    useEffect(() => {
      const id = setInterval(() => setCountdown(calc()), 1000);
      return () => clearInterval(id);
    }, []);
    return countdown;
  }

  // ── Cajita de dígito individual (estilo reloj digital) ──
  const CountdownDigit = ({ value, unit, color, urgent }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        fontFamily: '"Cinzel", serif', fontWeight: 900,
        fontSize: 'clamp(1.1rem,4vw,1.6rem)', lineHeight: 1,
        color: '#fff', minWidth: '1.5em', textAlign: 'center',
        padding: '0.15em 0.1em',
        background: `linear-gradient(160deg, rgba(${color},0.5), rgba(${color},0.15))`,
        border: `1.5px solid rgba(${color},0.9)`,
        borderRadius: '0.4rem',
        textShadow: `0 0 14px rgba(${color},1), 0 0 28px rgba(${color},0.6)`,
        boxShadow: `0 0 18px rgba(${color},0.6), inset 0 1px 0 rgba(255,255,255,0.25)`,
        animation: urgent ? 'countdownDigitBlink 1s ease-in-out infinite' : 'none',
      }}>{String(value).padStart(2, '0')}</div>
      <span style={{
        fontFamily: '"Cinzel", serif', fontWeight: 800, fontSize: '0.5rem',
        color: `rgba(${color},0.9)`, letterSpacing: '0.1em', marginTop: '0.2rem',
      }}>{unit}</span>
    </div>
  );

  // ── Contador urgente premium — grande, brillante, con segundero en vivo ──
  const UrgentCountdown = ({ time, size = 'normal' }) => {
    const isCritical = time.d === 0 && time.h < 6;
    const isWarning  = time.d === 0 && time.h < 24 && !isCritical;
    const color = isCritical ? '239,68,68' : isWarning ? '251,146,60' : '245,197,24';
    const scale = size === 'large' ? 1 : 0.72;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
        transform: `scale(${scale})`, transformOrigin: 'center',
      }}>
        <span style={{
          fontFamily: '"Cinzel", serif', fontWeight: 900,
          fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: `rgba(${color},1)`,
          textShadow: `0 0 12px rgba(${color},0.9)`,
        }}>{isCritical ? '🔥 ÚLTIMA HORA' : '⏳ CIERRA EN'}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.5em 0.85em',
          borderRadius: '0.9rem',
          background: `linear-gradient(135deg, rgba(${color},0.22), rgba(6,4,14,0.92))`,
          border: `2px solid rgba(${color},0.85)`,
          boxShadow: `0 0 30px rgba(${color},0.55), 0 0 60px rgba(${color},0.25), inset 0 1px 0 rgba(255,255,255,0.15)`,
          animation: `countdownBoxPulse ${isCritical ? '0.8s' : '2.2s'} ease-in-out infinite`,
        }}>
          {time.d > 0 && (
            <>
              <CountdownDigit value={time.d} unit="D" color={color} />
              <span style={{ color: `rgba(${color},0.8)`, fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.9rem' }}>:</span>
            </>
          )}
          <CountdownDigit value={time.h} unit="H" color={color} />
          <span style={{ color: `rgba(${color},0.8)`, fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.9rem' }}>:</span>
          <CountdownDigit value={time.m} unit="M" color={color} />
          <span style={{ color: `rgba(${color},0.8)`, fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.9rem' }}>:</span>
          <CountdownDigit value={time.s} unit="S" color={color} urgent={isCritical} />
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  TAB: LEADERBOARD — TEMPLO DORADO
  // ════════════════════════════════════════════════════════════════════════════
  const LeaderboardTab = ({ myUser, getLvl, levelCfg }) => {
    const closureCountdown = useClosureCountdown();
    const isMobile = useIsMobile();
    const [levelGuideOpen, setLevelGuideOpen] = useState(false);
    const [showAllLevels,  setShowAllLevels]  = useState(false);
    const [activeBoard,    setActiveBoard]    = useState('7d');
    const [data7d,    setData7d]    = useState([]);
    const [data30d,   setData30d]   = useState([]);
    const [dataAll,   setDataAll]   = useState([]);
    const [myStats,   setMyStats]   = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [snapshots,  setSnapshots]  = useState({ '7d': {}, '30d': {}, alltime: {} });
    const [prizes,     setPrizes]     = useState([]);
    const [myRanks,    setMyRanks]    = useState({ '7d': null, '30d': null, alltime: null });
    const [rayAngle,  setRayAngle]  = useState(0);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
      if (!myUser?.id) return;
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', myUser.id)
        .single()
        .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
    }, [myUser?.id]);

    const handleAvatarUpload = useCallback(async (e) => {
      const file = e.target.files?.[0];
      if (!file || !myUser?.id) return;
      e.target.value = '';
      // re-entrar fullscreen si estaba activo
      const wasFullscreen = !!document.fullscreenElement;
      setUploading(true);
      try {
        const ext  = file.name.split('.').pop().toLowerCase();
        const path = `avatars/${myUser.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('community-avatars')
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage
          .from('community-avatars')
          .getPublicUrl(path);
        const cacheBusted = `${publicUrl}?t=${Date.now()}`;
        await supabase.from('profiles').update({ avatar_url: cacheBusted }).eq('id', myUser.id);
        setAvatarUrl(cacheBusted);
      missionsService.trackEvent(myUser.id, 'change_avatar');
      // restaurar fullscreen
        if (wasFullscreen && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
      } finally {
        setUploading(false);
      }
    }, [myUser?.id]);

    useEffect(() => {
      Promise.all([
        supabase.from('community_leaderboard_7d').select('*').limit(10),
        supabase.from('community_leaderboard_30d').select('*').limit(10),
        supabase.from('community_leaderboard_alltime').select('*').limit(10),
        supabase.from('community_rank_snapshots').select('user_id, board, prev_rank'),
        supabase.from('community_ranking_prizes').select('*').order('position'),
      ]).then(([r7, r30, rAll, snaps, prz]) => {
        setData7d(r7.data   || []);
        setData30d(r30.data  || []);
        setDataAll(rAll.data || []);
        setPrizes(prz.data  || []);
        // Trackeo ranking comunidad
        if (myUser?.id) {
          const allBoards = [...(r7.data||[]), ...(r30.data||[])];
          const inTop10 = allBoards.some(r => r.user_id === myUser.id);
          const inTop3  = allBoards.slice(0,3).some(r => r.user_id === myUser.id);
          const inTop1  = allBoards[0]?.user_id === myUser.id;
          if (inTop1)  missionsService.trackEvent(myUser.id, 'community_top1');
          else if (inTop3)  missionsService.trackEvent(myUser.id, 'community_top3');
          else if (inTop10) missionsService.trackEvent(myUser.id, 'community_top10');
          if (inTop10) missionsService.trackEvent(myUser.id, 'community_rank_win');
        }
        const snapMap = { '7d': {}, '30d': {}, alltime: {} };
        (snaps.data || []).forEach(s => {
          if (snapMap[s.board]) {
            snapMap[s.board][s.user_id] = s.prev_rank;
          }
        });
        setSnapshots(snapMap);
        setLoading(false);
      });
    }, []);

    // ── Posición real del usuario en cada tabla ──────────────────────────────
    useEffect(() => {
      if (!myUser?.id) return;
      Promise.all([
        supabase.from('community_leaderboard_7d').select('user_id, points_7d').order('points_7d', { ascending: false }),
        supabase.from('community_leaderboard_30d').select('user_id, points_30d').order('points_30d', { ascending: false }),
        supabase.from('community_leaderboard_alltime').select('user_id, community_points').order('community_points', { ascending: false }),
      ]).then(([r7, r30, rAll]) => {
        const findRank = (rows, uid) => {
          const idx = (rows || []).findIndex(r => r.user_id === uid);
          return idx === -1 ? null : { rank: idx + 1, row: rows[idx] };
        };
        setMyRanks({
          '7d':     findRank(r7.data,   myUser.id),
          '30d':    findRank(r30.data,  myUser.id),
          alltime:  findRank(rAll.data, myUser.id),
        });
      });
    }, [myUser?.id]);

    useEffect(() => {
      if (!myUser?.id) return;
      supabase
        .from('community_user_stats')
        .select('community_points, community_level, total_posts, total_comments, total_likes_recv')
        .eq('user_id', myUser.id)
        .single()
        .then(({ data }) => setMyStats(data));
    }, [myUser?.id]);

    // Rayo de luz animado
    useEffect(() => {
      let frame;
      let start = null;
      const animate = (ts) => {
        if (!start) start = ts;
        const elapsed = (ts - start) / 1000;
        setRayAngle(Math.sin(elapsed * 0.4) * 18);
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, []);

    const myLevel   = myStats?.community_level || myUser?.community_level || 1;
    const myPoints  = myStats?.community_points || 0;
    const lvlRaw    = getLvl(myLevel);
    const lvl       = { ...lvlRaw, color: lvlRaw.color === '#9CA3AF' ? C.gold : lvlRaw.color };
    const next      = levelCfg.find(l => l.level === myLevel + 1);
    const ptsLeft   = next ? next.min_points - myPoints : 0;

    const LEVEL_COLORS = [
      '#9CA3AF','#D97706','#F97316','#C084FC',
      '#60A5FA','#EF4444','#FB923C','#F5C518','#10B981',
    ];

    return (
      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative' }}>
        <style>{`
          @keyframes lbGoldPulse {
            0%,100% { box-shadow: 0 0 20px rgba(245,197,24,0.25), inset 0 1px 0 rgba(245,197,24,0.15); }
            50%      { box-shadow: 0 0 45px rgba(245,197,24,0.5),  inset 0 1px 0 rgba(245,197,24,0.25); }
          }
          @keyframes lbAvatarFloat {
            0%,100% { transform: translateY(0px); }
            50%      { transform: translateY(-5px); }
          }
          @keyframes lbStatPulse1 {
            0%,100% { box-shadow: 0 0 6px ${lvl.color}22; border-color: ${lvl.color}33; }
            50%     { box-shadow: 0 0 16px ${lvl.color}55; border-color: ${lvl.color}77; }
          }
          @keyframes lbStatPulse2 {
            0%,100% { box-shadow: 0 0 16px ${lvl.color}55; border-color: ${lvl.color}77; }
            50%     { box-shadow: 0 0 6px ${lvl.color}22; border-color: ${lvl.color}33; }
          }
          @keyframes lbShineBar {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes lbFadeUp {
            from { opacity:0; transform:translateY(14px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>

        {/* ══ RAYO DE LUZ ÉPICO DE FONDO (dinámico, no fijo) ══ */}
        <div style={{
          position: 'absolute',
          top: -80, left: '50%',
          width: 3,
          height: '110%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(245,197,24,0.55) 30%, rgba(245,197,24,0.18) 65%, transparent 100%)',
          transform: `translateX(-50%) rotate(${rayAngle}deg)`,
          transformOrigin: 'top center',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(1px)',
        }} />
        <div style={{
          position: 'absolute',
          top: -80, left: '50%',
          width: 120,
          height: '80%',
          background: 'radial-gradient(ellipse at top, rgba(245,197,24,0.12) 0%, transparent 70%)',
          transform: `translateX(-50%) rotate(${rayAngle * 0.5}deg)`,
          transformOrigin: 'top center',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(8px)',
        }} />

        {/* ══ CÓMO SUBIR DE NIVEL ══ */}
        <div style={{
          position: 'relative', zIndex: 1,
          marginBottom: '1.25rem',
          padding: '1.1rem 1.25rem',
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, rgba(192,132,252,0.08) 0%, rgba(10,6,20,0.55) 55%, rgba(245,197,24,0.05) 100%)',
          border: '1.5px solid rgba(192,132,252,0.35)',
          boxShadow: '0 0 24px rgba(192,132,252,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={() => isMobile && setLevelGuideOpen(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: isMobile ? 'pointer' : 'default',
              marginBottom: (!isMobile || levelGuideOpen) ? '0.85rem' : 0,
            }}>
            <p style={{
              fontFamily: '"Cinzel", serif', fontSize: '0.68rem',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: C.gold, margin: 0,
              display: 'flex', alignItems: 'center', gap: '0.5em',
            }}>⚔️ ¿Cómo subo de nivel?</p>
            {isMobile && (
              <span style={{
                fontSize: '0.85rem', color: C.gold,
                transform: levelGuideOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s',
              }}>▾</span>
            )}
          </button>

          {(!isMobile || levelGuideOpen) && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.6rem',
              }}>
                {[
                  { icon: '📝', label: 'Publicar un post',        pts: 10, color: C.purple },
                  { icon: '💬', label: 'Comentar',                 pts: 5,  color: C.blue   },
                  { icon: '🔥', label: 'Dar like',                 pts: 1,  color: '#F97316' },
                  { icon: '❤️', label: 'Recibir un like',          pts: 3,  color: C.red    },
                  { icon: '✉️', label: 'Enviar un mensaje directo',pts: 2,  color: C.green  },
                ].map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.75rem',
                    background: `linear-gradient(135deg, ${a.color}14, rgba(255,255,255,0.02))`,
                    border: `1px solid ${a.color}40`,
                    borderRadius: '0.7rem',
                  }}>
                    <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{a.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0, fontSize: '0.72rem', fontWeight: 600,
                        color: 'rgba(255,255,255,0.88)', lineHeight: 1.2,
                      }}>{a.label}</p>
                      <p style={{
                        margin: '0.15rem 0 0', fontFamily: '"Cinzel", serif',
                        fontSize: '0.78rem', fontWeight: 800, color: a.color,
                        textShadow: `0 0 8px ${a.color}66`,
                      }}>+{a.pts} pts</p>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{
                margin: '0.85rem 0 0', fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
              }}>
                Acumula puntos participando en la comunidad y sube de rango en el mapa de niveles de abajo. 👇
              </p>

              <p style={{
                margin: '0.5rem 0 0', fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.4)', lineHeight: 1.4,
                fontStyle: 'italic',
              }}>
                ⚜️ Nota: el XP y los Propocoins que ganas al <strong style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'normal' }}>sellar módulos del Templo</strong> suben tu nivel de perfil general (arriba), no tu rango de Comunidad — son dos sistemas independientes.
              </p>
            </>
          )}
        </div>

        {/* ══ BLOQUE SUPERIOR: perfil + mapa de niveles ══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'min(270px,36%) 1fr',
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(245,197,24,0.07) 0%, rgba(10,6,20,0.7) 50%, rgba(192,132,252,0.04) 100%)',
          border: '1.5px solid rgba(245,197,24,0.4)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(245,197,24,0.1), inset 0 1px 0 rgba(245,197,24,0.15)',
          animation: 'lbGoldPulse 4s ease-in-out infinite',
          position: 'relative', zIndex: 1,
        }}>

          {/* Columna izquierda: perfil (arriba en móvil) */}
          <div style={{
            padding: isMobile ? '1.5rem 1.25rem' : '2rem 1.5rem',
            borderRight: isMobile ? 'none' : '1px solid rgba(245,197,24,0.25)',
            borderBottom: isMobile ? '1px solid rgba(245,197,24,0.25)' : 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.8rem',
            background: `linear-gradient(180deg, ${lvl.color}18 0%, rgba(0,0,0,0.35) 50%, rgba(245,197,24,0.06) 100%)`,
            boxShadow: `inset 0 0 40px ${lvl.color}0a`,
          }}>
            {/* Avatar con anillo dorado + upload */}
            <div style={{ position: 'relative', animation: 'lbAvatarFloat 4s ease-in-out infinite' }}>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              {/* Anillo dorado exterior */}
              <div style={{
                width: isMobile ? 92 : 130, height: isMobile ? 92 : 130, borderRadius: '50%',
                border: '2px solid rgba(245,197,24,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(245,197,24,0.3), 0 0 60px rgba(245,197,24,0.1)',
                position: 'relative',
              }}>
                {/* Foto o iniciales */}
                <div style={{
                  width: isMobile ? 82 : 118, height: isMobile ? 82 : 118, borderRadius: '50%',
                  background: avatarUrl ? 'transparent' : `radial-gradient(circle at 35% 35%, ${lvl.color}55, rgba(10,6,20,0.9))`,
                  border: `2px solid ${lvl.color}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: isMobile ? '1.6rem' : '2.3rem',
                  color: lvl.color, overflow: 'hidden',
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials(myUser?.full_name || myUser?.templario_name || 'Tú')
                  }
                </div>
                {/* Overlay: label directo sobre input — gesto nativo */}
                <label htmlFor="avatar-upload" style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                  opacity: uploading ? 1 : 0,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = '0'; }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{uploading ? '⏳' : '📷'}</span>
                  <span style={{
                    fontFamily: '"Cinzel", serif', fontSize: '0.55rem',
                    color: C.gold, letterSpacing: '0.08em', fontWeight: 700,
                  }}>{uploading ? 'Subiendo…' : 'Cambiar foto'}</span>
                </label>
              </div>
              {/* Badge nivel */}
              <div style={{
                position: 'absolute', bottom: 3, right: 3,
                width: isMobile ? 26 : 34, height: isMobile ? 26 : 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5C518, #D97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: isMobile ? '0.7rem' : '0.88rem',
                color: '#0a0614', border: '2.5px solid #0a0614',
                boxShadow: '0 0 14px rgba(245,197,24,0.7)',
                pointerEvents: 'none',
              }}>{myLevel}</div>
            </div>

            {/* Nombre */}
            <p style={{
              fontFamily: '"Cinzel", serif', fontWeight: 900,
              fontSize: 'clamp(0.85rem,2.5vw,1.3rem)', color: '#fff',
              margin: 0, textAlign: 'center',
              letterSpacing: '0.06em',
              lineHeight: 1.25,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              maxWidth: '100%',
              textShadow: `0 0 24px ${lvl.color}88, 0 0 48px ${lvl.color}33`,
            }}>{myUser?.full_name || myUser?.templario_name || 'Tú'}</p>

            {/* Badge nivel épico */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4em',
              padding: '0.35em 1.1em',
              background: `linear-gradient(135deg, ${lvl.color}28, ${lvl.color}10)`,
              border: `1.5px solid ${lvl.color}99`,
              borderRadius: '999px',
              fontFamily: '"Cinzel", serif', fontSize: '0.78rem',
              color: '#fff', fontWeight: 700,
              letterSpacing: '0.06em',
              boxShadow: `0 0 16px ${lvl.color}44, inset 0 1px 0 rgba(255,255,255,0.1)`,
              textShadow: `0 0 10px ${lvl.color}99`,
            }}>{lvl.icon} {lvl.title}</div>

            {/* Puntos para siguiente nivel */}
            {next && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, rgba(245,197,24,0.1), rgba(245,197,24,0.04))',
                border: '1px solid rgba(245,197,24,0.35)',
                borderRadius: '0.75rem',
                boxShadow: '0 0 14px rgba(245,197,24,0.15), inset 0 1px 0 rgba(245,197,24,0.1)',
              }}>
                <span style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 900,
                  fontSize: '1.1rem', color: C.gold,
                  textShadow: '0 0 16px rgba(245,197,24,0.9), 0 0 6px rgba(245,197,24,0.6)',
                  letterSpacing: '0.05em',
                }}>{ptsLeft.toLocaleString()} pts</span>
                <span style={{
                  fontFamily: '"Cinzel", serif', fontSize: '0.58rem',
                  color: 'rgba(245,197,24,0.75)', letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 600,
                }}>⚔️ para subir de nivel</span>
              </div>
            )}

            {/* Barra de progreso dorada */}
            {next && (() => {
              const curr2 = levelCfg.find(l => l.level === myLevel);
              const pct = curr2
                ? Math.min(100, Math.round(((myPoints - curr2.min_points) / (next.min_points - curr2.min_points)) * 100))
                : 0;
              return (
                <div style={{ width: '100%' }}>
                  <div style={{
                    height: 6, borderRadius: '999px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(245,197,24,0.2)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '999px', width: `${pct}%`,
                      background: 'linear-gradient(90deg, #D97706, #F5C518, #FDE68A, #F5C518)',
                      backgroundSize: '200% auto',
                      animation: 'lbShineBar 2s linear infinite',
                      boxShadow: '0 0 8px rgba(245,197,24,0.6)',
                      transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              );
            })()}

            {/* Stats */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', width: '100%', justifyContent: 'center' }}>
              {[
                { val: myPoints.toLocaleString(), label: 'Puntos', icon: '⚡', anim: 'lbStatPulse1' },
                { val: myStats?.total_posts || 0,  label: 'Posts',  icon: '📜', anim: 'lbStatPulse2' },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${lvl.color}18, rgba(0,0,0,0.4))`,
                  border: `1px solid ${lvl.color}44`,
                  borderRadius: '0.875rem',
                  padding: '0.65rem 1.25rem',
                  animation: `${s.anim} 2.4s ease-in-out infinite`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Brillo superior */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%',
                    width: '80%', height: '1px',
                    background: `linear-gradient(90deg, transparent, ${lvl.color}, transparent)`,
                  }} />
                  <p style={{
                    fontFamily: '"Cinzel", serif', fontWeight: 900,
                    fontSize: '1.2rem', color: lvl.color, margin: '0 0 0.15rem',
                    textShadow: `0 0 12px ${lvl.color}99`,
                    letterSpacing: '0.04em',
                  }}>{s.icon} {s.val}</p>
                  <p style={{
                    fontFamily: '"Cinzel", serif', fontSize: '0.56rem',
                    color: '#fff', margin: 0, letterSpacing: '0.12em',
                    textTransform: 'uppercase', fontWeight: 700,
                  }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: mapa de niveles */}
          <div style={{ padding: isMobile ? '1.25rem 1.25rem' : '1.5rem 1.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '1rem', gap: '0.5rem',
            }}>
              <p style={{
                fontFamily: '"Cinzel", serif', fontSize: '0.65rem',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: C.gold, margin: 0,
                display: 'flex', alignItems: 'center', gap: '0.5em',
              }}>⚜️ Mapa de Niveles</p>
              {isMobile && (
                <button
                  onClick={() => setShowAllLevels(v => !v)}
                  style={{
                    flexShrink: 0,
                    padding: '0.3em 0.75em',
                    background: 'rgba(245,197,24,0.12)',
                    border: '1px solid rgba(245,197,24,0.4)',
                    borderRadius: '999px',
                    fontFamily: '"Cinzel", serif', fontSize: '0.58rem', fontWeight: 700,
                    color: C.gold, letterSpacing: '0.06em', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >{showAllLevels ? 'Ver menos ▾' : 'Ver todos ▸'}</button>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '0.45rem',
            }}>
              {levelCfg
                .filter((l) => {
                  if (!isMobile || showAllLevels) return true;
                  // Móvil colapsado: solo nivel actual ± 1 para que se entienda de un vistazo
                  return Math.abs(l.level - myLevel) <= 1;
                })
                .map((l) => {
                const idx = levelCfg.findIndex(x => x.id === l.id);
                const reached = myLevel >= l.level;
                const isCurr  = myLevel === l.level;
                const clr     = LEVEL_COLORS[idx] || C.purple;
                return (
                  <div key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0.65rem 0.875rem',
                    background: isCurr
                      ? `linear-gradient(135deg, ${clr}30, rgba(245,197,24,0.12), ${clr}18)`
                      : reached
                        ? `linear-gradient(135deg, ${clr}16, rgba(255,255,255,0.02))`
                        : `linear-gradient(135deg, ${clr}08, rgba(255,255,255,0.01))`,
                    border: isCurr
                      ? `1.5px solid ${clr}88`
                      : reached
                        ? `1px solid ${clr}44`
                        : `1px solid ${clr}22`,
                    borderRadius: '0.75rem',
                    opacity: 1,
                    boxShadow: isCurr
                      ? `0 0 18px ${clr}35, inset 0 1px 0 rgba(255,255,255,0.08)`
                      : reached
                        ? `0 0 8px ${clr}18`
                        : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {/* Círculo número épico */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: isCurr
                        ? `linear-gradient(135deg, ${clr}, #F5C518)`
                        : reached
                          ? `linear-gradient(135deg, ${clr}cc, ${clr}66)`
                          : `linear-gradient(135deg, ${clr}22, ${clr}0a)`,
                      border: isCurr
                        ? `2px solid rgba(245,197,24,0.9)`
                        : reached
                          ? `1.5px solid ${clr}66`
                          : `1.5px solid ${clr}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: '"Cinzel", serif', fontWeight: 900,
                      fontSize: '0.72rem',
                      color: isCurr ? '#0a0614' : reached ? '#fff' : `${clr}cc`,
                      boxShadow: isCurr
                        ? `0 0 14px ${clr}77, 0 0 4px rgba(245,197,24,0.6)`
                        : reached
                          ? `0 0 8px ${clr}44`
                          : 'none',
                    }}>
                      {reached ? l.level : '🔒'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      {/* Nombre del rango */}
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.85rem', fontWeight: 800,
                        color: isCurr ? '#fff' : reached ? '#fff' : `${clr}dd`,
                        margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textShadow: isCurr ? `0 0 12px ${clr}` : reached ? `0 0 6px ${clr}88` : `0 0 8px ${clr}66`,
                        letterSpacing: '0.04em',
                      }}>
                        {l.icon} {l.title}
                        {isCurr && (
                          <span style={{
                            fontFamily: '"Cinzel", serif', fontSize: '0.6rem',
                            color: C.gold, fontWeight: 400, marginLeft: '0.4em',
                            textShadow: '0 0 8px rgba(245,197,24,0.8)',
                          }}>← tú</span>
                        )}
                      </p>
                      {/* Nivel + pts apilados a la derecha */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '0.05rem' }}>
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.82rem', fontWeight: 900,
                          color: isCurr ? C.gold : reached ? `${clr}cc` : `${clr}bb`,
                          textShadow: isCurr ? '0 0 10px rgba(245,197,24,0.7)' : `0 0 6px ${clr}55`,
                          letterSpacing: '0.05em',
                        }}>Nv.{l.level}</span>
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.6rem', fontWeight: 600,
                          color: isCurr
                            ? 'rgba(245,197,24,0.95)'
                            : reached
                              ? 'rgba(255,255,255,0.8)'
                              : 'rgba(255,255,255,0.75)',
                          letterSpacing: '0.03em',
                        }}>{l.min_points.toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ BANNER DE PREMIOS ══ */}
        {prizes.length > 0 && (() => {
          const periods = ['7d', '30d'];
          const activePeriods = periods.filter(p =>
            prizes.some(pr => pr.period === p && pr.is_active)
          );
          if (activePeriods.length === 0) return null;

          return (
            <div style={{
              marginBottom: '1.25rem',
              borderRadius: '1.5rem',
              border: '1.5px solid rgba(245,197,24,0.55)',
              background: 'linear-gradient(160deg, rgba(245,197,24,0.13) 0%, rgba(10,6,20,0.96) 40%, rgba(192,132,252,0.09) 100%)',
              overflow: 'hidden',
              boxShadow: '0 0 80px rgba(245,197,24,0.2), 0 0 160px rgba(245,197,24,0.07), inset 0 1px 0 rgba(245,197,24,0.25)',
              zIndex: 1,
              position: 'relative',
            }}>
              <style>{`
                @keyframes prizeShine {
                  0%   { background-position: -300% center; }
                  100% { background-position:  300% center; }
                }
                @keyframes prizeCardGlow {
                  0%,100% { box-shadow: 0 0 10px rgba(245,197,24,0.15), inset 0 1px 0 rgba(245,197,24,0.08); }
                  50%      { box-shadow: 0 0 26px rgba(245,197,24,0.4),  inset 0 1px 0 rgba(245,197,24,0.18); }
                }
                @keyframes prizeTrophyFloat {
                  0%,100% { transform: translateY(0px) rotate(-3deg); }
                  50%      { transform: translateY(-8px) rotate(3deg); }
                }
                @keyframes prizeCrownPulse {
                  0%,100% { opacity: 0.08; transform: scale(1); }
                  50%      { opacity: 0.14; transform: scale(1.04); }
                }
                @keyframes prizeDividerGlow {
                  0%,100% { opacity: 0.3; }
                  50%      { opacity: 0.8; }
                }
              `}</style>

              {/* Corona fantasma de fondo — reducida en móvil para no sumar scroll extra */}
              <div style={{
                textAlign: 'center',
                fontSize: isMobile ? 'clamp(4rem, 16vw, 6rem)' : 'clamp(7rem, 20vw, 14rem)',
                lineHeight: 0.8,
                marginTop: isMobile ? '0' : '-0.5rem',
                marginBottom: isMobile ? '-1.5rem' : '-4rem',
                opacity: 0.08,
                pointerEvents: 'none',
                userSelect: 'none',
                animation: 'prizeCrownPulse 5s ease-in-out infinite',
                filter: 'drop-shadow(0 0 60px rgba(245,197,24,0.8))',
              }}>🏆</div>

              {/* Header épico */}
              <div style={{
                padding: 'clamp(1.25rem,4vw,2rem) clamp(1.25rem,4vw,2rem) 0',
                position: 'relative',
                zIndex: 1,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(0.875rem,3vw,1.25rem)',
                  marginBottom: 'clamp(1rem,3vw,1.5rem)',
                  flexWrap: 'wrap',
                }}>
                  {/* Trofeo flotante */}
                  <div style={{
                    flexShrink: 0,
                    width: 'clamp(52px,10vw,72px)',
                    height: 'clamp(52px,10vw,72px)',
                    borderRadius: '1.1rem',
                    background: 'linear-gradient(135deg, rgba(245,197,24,0.4) 0%, rgba(245,197,24,0.12) 100%)',
                    border: '2px solid rgba(245,197,24,0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(1.6rem,5vw,2.2rem)',
                    boxShadow: '0 0 32px rgba(245,197,24,0.55), 0 0 64px rgba(245,197,24,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                    animation: 'prizeTrophyFloat 4s ease-in-out infinite',
                  }}>🏆</div>

                  {/* Texto central */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 900,
                      fontSize: 'clamp(1rem,3.5vw,1.4rem)',
                      color: '#F5C518',
                      margin: '0 0 0.2rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      textShadow: '0 0 28px rgba(245,197,24,0.9), 0 0 60px rgba(245,197,24,0.4)',
                      background: 'linear-gradient(90deg, #D97706, #F5C518, #FDE68A, #F5C518, #D97706)',
                      backgroundSize: '300% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'prizeShine 4s linear infinite',
                    }}>PREMIOS DE TEMPORADA</p>
                    <p style={{
                      fontFamily: '"Crimson Text", serif',
                      fontSize: 'clamp(0.82rem,2vw,0.95rem)',
                      color: 'rgba(245,197,24,0.55)',
                      margin: 0,
                      letterSpacing: '0.06em',
                    }}>⚔️ Recompensas al cierre · 7 días y 30 días</p>
                  </div>

                  {/* Pill autoridad */}
                  <div style={{
                    flexShrink: 0,
                    padding: '0.4em 1.1em',
                    background: 'linear-gradient(135deg, rgba(245,197,24,0.22), rgba(245,197,24,0.07))',
                    border: '1.5px solid rgba(245,197,24,0.5)',
                    borderRadius: '999px',
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(0.6rem,1.5vw,0.7rem)',
                    fontWeight: 700,
                    color: '#F5C518',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 16px rgba(245,197,24,0.3)',
                    whiteSpace: 'nowrap',
                  }}>⚜️ Ranking Oficial</div>
                </div>

                {/* Línea divisora animada */}
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(245,197,24,0.7) 30%, rgba(245,197,24,0.9) 50%, rgba(245,197,24,0.7) 70%, transparent 100%)',
                  marginBottom: 'clamp(1rem,3vw,1.5rem)',
                  animation: 'prizeDividerGlow 3s ease-in-out infinite',
                }} />
              </div>

              {/* Grid de períodos */}
              <div style={{
                padding: '0 clamp(1.25rem,4vw,2rem) clamp(1.25rem,4vw,2rem)',
                display: 'grid',
                gridTemplateColumns: activePeriods.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'clamp(1rem,3vw,1.5rem)',
                position: 'relative',
                zIndex: 1,
              }}>
                {activePeriods.map((period) => {
                  const periodPrizes = prizes.filter(p => p.period === period && p.is_active);
                  const medals = ['🥇', '🥈', '🥉'];
                  const periodLabel = period === '7d' ? '⚡ Semanal — 7 Días' : '🌙 Mensual — 30 Días';
                  const periodAccent = period === '7d' ? '#F5C518' : '#C084FC';
                  const periodAccentRgb = period === '7d' ? '245,197,24' : '192,132,252';

                  return (
                    <div key={period} style={{
                      borderRadius: '1.1rem',
                      border: `1.5px solid rgba(${periodAccentRgb},0.35)`,
                      background: `linear-gradient(160deg, rgba(${periodAccentRgb},0.1) 0%, rgba(10,6,20,0.85) 100%)`,
                      overflow: 'hidden',
                      boxShadow: `0 0 40px rgba(${periodAccentRgb},0.12), inset 0 1px 0 rgba(${periodAccentRgb},0.15)`,
                    }}>
                      {/* Header período */}
                      <div style={{
                        padding: '0.85rem 1.1rem 1rem',
                        borderBottom: `1px solid rgba(${periodAccentRgb},0.25)`,
                        background: `linear-gradient(135deg, rgba(${periodAccentRgb},0.18), rgba(${periodAccentRgb},0.05))`,
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '0.5rem', marginBottom: '0.7rem',
                        }}>
                          <p style={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 800,
                            fontSize: 'clamp(0.7rem,1.8vw,0.82rem)',
                            color: periodAccent,
                            margin: 0,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            textShadow: `0 0 14px rgba(${periodAccentRgb},0.8)`,
                          }}>{periodLabel}</p>
                          <span style={{
                            fontFamily: '"Cinzel", serif',
                            fontSize: '0.6rem',
                            color: `rgba(${periodAccentRgb},0.6)`,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            whiteSpace: 'nowrap',
                          }}>{periodPrizes.length} premios</span>
                        </div>
                        <UrgentCountdown time={closureCountdown[period]} size="large" />
                      </div>

                      {/* Lista premios */}
                      <div style={{
                        padding: 'clamp(0.6rem,2vw,0.875rem)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                      }}>
                        {periodPrizes.map((prize, idx) => {
                          const pos = prize.position;
                          const isTop3   = pos <= 3;
                          const rankClr  = pos === 1 ? '#F5C518'
                                        : pos === 2 ? '#93C5FD'
                                        : pos === 3 ? '#FB923C'
                                        : 'rgba(255,255,255,0.4)';
                          const rankRgb  = pos === 1 ? '245,197,24'
                                        : pos === 2 ? '147,197,253'
                                        : pos === 3 ? '251,146,60'
                                        : '255,255,255';

                          return (
                            <div key={prize.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'clamp(0.5rem,2vw,0.875rem)',
                              padding: 'clamp(0.5rem,2vw,0.7rem) clamp(0.6rem,2vw,0.875rem)',
                              borderRadius: '0.875rem',
                              background: isTop3
                                ? `linear-gradient(135deg, rgba(${rankRgb},0.14) 0%, rgba(10,6,20,0.75) 100%)`
                                : 'rgba(255,255,255,0.03)',
                              border: `1px solid rgba(${rankRgb},${isTop3 ? '0.4' : '0.1'})`,
                              borderLeft: `3.5px solid rgba(${rankRgb},${isTop3 ? '0.9' : '0.3'})`,
                              animation: isTop3 ? 'prizeCardGlow 3.5s ease-in-out infinite' : 'none',
                              animationDelay: `${idx * 0.35}s`,
                            }}>

                              {/* Posición / Medalla */}
                              <div style={{
                                flexShrink: 0,
                                width: 'clamp(28px,6vw,36px)',
                                height: 'clamp(28px,6vw,36px)',
                                borderRadius: '50%',
                                background: isTop3
                                  ? `linear-gradient(135deg, rgba(${rankRgb},0.35), rgba(${rankRgb},0.1))`
                                  : 'rgba(255,255,255,0.05)',
                                border: `1.5px solid rgba(${rankRgb},${isTop3 ? '0.7' : '0.2'})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isTop3 ? 'clamp(1rem,3vw,1.2rem)' : 'clamp(0.65rem,2vw,0.75rem)',
                                fontFamily: '"Cinzel", serif',
                                fontWeight: 900,
                                color: rankClr,
                                boxShadow: isTop3 ? `0 0 14px rgba(${rankRgb},0.5)` : 'none',
                                filter: isTop3 ? `drop-shadow(0 0 6px rgba(${rankRgb},0.7))` : 'none',
                              }}>
                                {isTop3 ? medals[pos - 1] : `${pos}`}
                              </div>

                              {/* Label */}
                              <p style={{
                                fontFamily: '"Cinzel", serif',
                                fontWeight: isTop3 ? 700 : 600,
                                fontSize: 'clamp(0.68rem,2vw,0.8rem)',
                                color: isTop3 ? '#fff' : 'rgba(255,255,255,0.5)',
                                margin: 0,
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: isTop3 ? `0 0 12px rgba(${rankRgb},0.5)` : 'none',
                                letterSpacing: '0.04em',
                              }}>{prize.label || `${pos}° Lugar`}</p>

                              {/* Rewards apilados */}
                              <div style={{
                                flexShrink: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem',
                                alignItems: 'flex-end',
                              }}>
                                {prize.coins_reward > 0 && (
                                  <span style={{
                                    fontFamily: '"Cinzel", serif',
                                    fontSize: 'clamp(0.6rem,1.5vw,0.7rem)',
                                    fontWeight: 800,
                                    color: '#F5C518',
                                    textShadow: '0 0 10px rgba(245,197,24,0.8)',
                                    background: 'rgba(245,197,24,0.12)',
                                    border: '1px solid rgba(245,197,24,0.35)',
                                    borderRadius: '999px',
                                    padding: '0.15em 0.6em',
                                    whiteSpace: 'nowrap',
                                  }}>+{prize.coins_reward} PC</span>
                                )}
                                {prize.xp_reward > 0 && (
                                  <span style={{
                                    fontFamily: '"Cinzel", serif',
                                    fontSize: 'clamp(0.6rem,1.5vw,0.7rem)',
                                    fontWeight: 800,
                                    color: '#60A5FA',
                                    textShadow: '0 0 10px rgba(96,165,250,0.7)',
                                    background: 'rgba(96,165,250,0.1)',
                                    border: '1px solid rgba(96,165,250,0.3)',
                                    borderRadius: '999px',
                                    padding: '0.15em 0.6em',
                                    whiteSpace: 'nowrap',
                                  }}>+{prize.xp_reward} XP</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer sello */}
              <div style={{
                padding: '0.75rem clamp(1.25rem,4vw,2rem) clamp(1rem,3vw,1.25rem)',
                borderTop: '1px solid rgba(245,197,24,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  height: '1px',
                  flex: 1,
                  minWidth: 40,
                  background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.4))',
                }} />
                <p style={{
                  fontFamily: '"Cinzel", serif',
                  fontSize: 'clamp(0.58rem,1.4vw,0.65rem)',
                  color: 'rgba(245,197,24,0.45)',
                  margin: 0,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>⚜️ Templo · Los premios se otorgan automáticamente al cierre del período ⚜️</p>
                <div style={{
                  height: '1px',
                  flex: 1,
                  minWidth: 40,
                  background: 'linear-gradient(90deg, rgba(245,197,24,0.4), transparent)',
                }} />
              </div>
            </div>
          );
        })()}

        {/* ══ CONECTOR ÉPICO: flechas palpitantes banner → tablas ══ */}
        {prizes.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0',
            marginBottom: '0.5rem',
            position: 'relative',
            zIndex: 1,
          }}>
            <style>{`
              @keyframes connectorArrowDrop {
                0%   { opacity: 0;   transform: translateY(-8px); }
                40%  { opacity: 1;   transform: translateY(0px); }
                70%  { opacity: 1;   transform: translateY(4px); }
                100% { opacity: 0;   transform: translateY(12px); }
              }
              @keyframes connectorLinePulse {
                0%,100% { opacity: 0.3; }
                50%      { opacity: 1; }
              }
              @keyframes connectorTextShine {
                0%   { background-position: -200% center; }
                100% { background-position:  200% center; }
              }
            `}</style>

            {/* Línea vertical pulsante */}
            <div style={{
              width: '2px',
              height: isMobile ? '0.85rem' : '2rem',
              background: 'linear-gradient(180deg, rgba(245,197,24,0.8), rgba(245,197,24,0.1))',
              animation: 'connectorLinePulse 2s ease-in-out infinite',
            }} />

            {/* Cápsula central con texto + flechas */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              padding: isMobile ? '0.4rem 1.1rem' : '0.6rem 1.75rem',
              borderRadius: '999px',
              border: '1.5px solid rgba(245,197,24,0.5)',
              background: 'linear-gradient(135deg, rgba(245,197,24,0.18), rgba(10,6,20,0.95), rgba(245,197,24,0.1))',
              boxShadow: '0 0 30px rgba(245,197,24,0.25), inset 0 1px 0 rgba(245,197,24,0.2)',
            }}>
              <p style={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 900,
                fontSize: isMobile ? '0.6rem' : 'clamp(0.65rem,2vw,0.78rem)',
                color: '#F5C518',
                margin: 0,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textAlign: 'center',
                background: 'linear-gradient(90deg, #D97706, #F5C518, #FDE68A, #F5C518, #D97706)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'connectorTextShine 3s linear infinite',
              }}>{isMobile ? '⚔️ Compite por estos premios ⚔️' : '⚔️ Estos son los competidores por esos premios ⚔️'}</p>

              {/* Flechas escalonadas palpitantes (1 en móvil, 3 en desktop) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                {(isMobile ? [0] : [0, 1, 2]).map(i => (
                  <div key={i} style={{
                    fontSize: isMobile ? '0.85rem' : 'clamp(0.9rem,2.5vw,1.1rem)',
                    color: '#F5C518',
                    lineHeight: 0.85,
                    animation: 'connectorArrowDrop 1.6s ease-in-out infinite',
                    animationDelay: `${i * 0.22}s`,
                    filter: `drop-shadow(0 0 ${6 - i * 1.5}px rgba(245,197,24,${0.9 - i * 0.2}))`,
                  }}>▼</div>
                ))}
              </div>
            </div>

            {/* Línea vertical inferior */}
            <div style={{
              width: '2px',
              height: isMobile ? '0.75rem' : '1.5rem',
              background: 'linear-gradient(180deg, rgba(245,197,24,0.5), rgba(245,197,24,0.05))',
              animation: 'connectorLinePulse 2s ease-in-out infinite',
              animationDelay: '0.5s',
            }} />
          </div>
        )}

        {/* ══ TRES LEADERBOARDS — wrapper épico ══ */}
        <div style={{
          borderRadius: '1.5rem',
          border: '1.5px solid rgba(245,197,24,0.4)',
          background: 'linear-gradient(160deg, rgba(245,197,24,0.07) 0%, rgba(10,6,20,0.97) 40%, rgba(192,132,252,0.06) 100%)',
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(245,197,24,0.12), 0 0 160px rgba(245,197,24,0.05), inset 0 1px 0 rgba(245,197,24,0.18)',
          position: 'relative', zIndex: 1,
          animation: 'lbFadeUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* Header épico de la sección */}
          <div style={{
            padding: isMobile ? '0.85rem 1rem' : 'clamp(1.1rem,3vw,1.5rem) clamp(1.25rem,4vw,2rem)',
            borderBottom: '1px solid rgba(245,197,24,0.2)',
            background: 'linear-gradient(135deg, rgba(245,197,24,0.12) 0%, rgba(10,6,20,0.9) 60%, rgba(192,132,252,0.07) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.6rem' : 'clamp(0.875rem,3vw,1.25rem)',
            flexWrap: 'wrap',
          }}>
            <style>{`
              @keyframes lbHeaderIconFloat {
                0%,100% { transform: translateY(0px); }
                50%      { transform: translateY(-5px); }
              }
              @keyframes lbHeaderShine {
                0%   { background-position: -300% center; }
                100% { background-position:  300% center; }
              }
              @keyframes lbHeaderBarPulse {
                0%,100% { opacity: 0.4; transform: scaleX(0.97); }
                50%      { opacity: 1;   transform: scaleX(1); }
              }
              @keyframes countdownBoxPulse {
                0%,100% { transform: scale(1);    filter: brightness(1); }
                50%      { transform: scale(1.035); filter: brightness(1.25); }
              }
              @keyframes countdownDigitBlink {
                0%,100% { opacity: 1; }
                50%      { opacity: 0.35; }
              }
            `}</style>

            {/* Icono ranking */}
            <div style={{
              flexShrink: 0,
              width: isMobile ? 36 : 'clamp(48px,9vw,64px)',
              height: isMobile ? 36 : 'clamp(48px,9vw,64px)',
              borderRadius: '0.7rem',
              background: 'linear-gradient(135deg, rgba(245,197,24,0.35) 0%, rgba(245,197,24,0.1) 100%)',
              border: '2px solid rgba(245,197,24,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? '1.1rem' : 'clamp(1.5rem,4.5vw,2rem)',
              boxShadow: '0 0 28px rgba(245,197,24,0.5), 0 0 56px rgba(245,197,24,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
              animation: 'lbHeaderIconFloat 3.5s ease-in-out infinite',
            }}>🏛️</div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 100 }}>
              <p style={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 900,
                fontSize: isMobile ? '0.85rem' : 'clamp(1rem,3.5vw,1.4rem)',
                color: '#F5C518',
                margin: 0,
                letterSpacing: isMobile ? '0.1em' : '0.16em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #D97706, #F5C518, #FDE68A, #F5C518, #D97706)',
                backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'lbHeaderShine 4s linear infinite',
              }}>RANKING DEL TEMPLO</p>
              {!isMobile && (
                <p style={{
                  fontFamily: '"Crimson Text", serif',
                  fontSize: 'clamp(0.82rem,2vw,0.95rem)',
                  color: 'rgba(245,197,24,0.55)',
                  margin: 0,
                  letterSpacing: '0.06em',
                }}>⚡ 7 días · 🌙 30 días · 🏛️ Todo el tiempo</p>
              )}
            </div>

            {/* Pills de períodos — en móvil funcionan como selector de tablero */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto',
            }}>
              {[
                { icon: '⚡', label: '7D', color: '245,197,24', key: '7d' },
                { icon: '🌙', label: '30D', color: '192,132,252', key: '30d' },
                { icon: '🏛️', label: 'ALL', color: '96,165,250', key: 'alltime' },
              ].map(pill => {
                const active = !isMobile || activeBoard === pill.key;
                return (
                  <button
                    key={pill.label}
                    onClick={() => isMobile && setActiveBoard(pill.key)}
                    style={{
                      flex: isMobile ? 1 : 'none',
                      padding: isMobile ? '0.5em 0.5em' : '0.3em 0.75em',
                      background: active ? `rgba(${pill.color},0.22)` : `rgba(${pill.color},0.06)`,
                      border: `1px solid rgba(${pill.color},${active ? '0.7' : '0.25'})`,
                      borderRadius: '999px',
                      fontFamily: '"Cinzel", serif',
                      fontSize: 'clamp(0.58rem,1.4vw,0.68rem)',
                      fontWeight: 700,
                      color: `rgba(${pill.color},${active ? '1' : '0.55'})`,
                      letterSpacing: '0.1em',
                      whiteSpace: 'nowrap',
                      boxShadow: active ? `0 0 12px rgba(${pill.color},0.3)` : 'none',
                      cursor: isMobile ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}>{pill.icon} {pill.label}</button>
                );
              })}
            </div>
          </div>

          {/* Barra shine inferior del header */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(245,197,24,0.6) 25%, rgba(255,255,255,0.3) 50%, rgba(245,197,24,0.6) 75%, transparent 100%)',
            animation: 'lbHeaderBarPulse 3s ease-in-out infinite',
          }} />

          {/* Las 3 tablas dentro del wrapper — en móvil, solo la activa (tab) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '0',
          }}>
          {[
            { rows: data7d,  ptsKey: 'points_7d',       snapKey: '7d',      title: '⚡ 7 días',         accentRgb: '245,197,24'  },
            { rows: data30d, ptsKey: 'points_30d',       snapKey: '30d',     title: '🌙 30 días',        accentRgb: '192,132,252' },
            { rows: dataAll, ptsKey: 'community_points', snapKey: 'alltime', title: '🏛️ Todo el tiempo', accentRgb: '96,165,250'  },
          ]
          .filter(board => !isMobile || board.snapKey === activeBoard)
          .map(({ rows, ptsKey, snapKey, title, accentRgb }, colIdx) => (
            <div key={snapKey} style={{
              background: `linear-gradient(180deg, rgba(${accentRgb},0.05) 0%, rgba(10,6,20,0.6) 100%)`,
              borderRight: (!isMobile && colIdx < 2) ? '1px solid rgba(245,197,24,0.12)' : 'none',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: isMobile ? '0.55rem 0.85rem 0.65rem' : '0.75rem 1.25rem 0.9rem',
                borderBottom: `1px solid rgba(${accentRgb},0.2)`,
                background: `linear-gradient(135deg, rgba(${accentRgb},0.12), rgba(10,6,20,0.7))`,
              }}>
                <p style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 800,
                  fontSize: isMobile ? '0.72rem' : 'clamp(0.75rem,2vw,0.88rem)', color: C.gold,
                  margin: '0 0 0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  textShadow: `0 0 16px rgba(${accentRgb},0.8)`,
                }}>{title}</p>
                {snapKey !== 'alltime' && (
                  <UrgentCountdown time={closureCountdown[snapKey]} />
                )}
              </div>
              {loading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}><Spinner /></div>
              ) : rows.length === 0 ? (
                <p style={{
                  fontFamily: '"Crimson Text", serif', fontSize: '0.95rem',
                  color: C.muted, padding: '1.5rem 1.25rem', margin: 0,
                }}>Sin actividad aún</p>
              ) : rows.map((u, idx) => {
                const name      = u.templario_name || u.full_name || u.email?.split('@')[0] || 'Miembro';
                const ulvl      = getLvl(u.community_level || 1);
                const isMe      = u.user_id === myUser?.id;
                const medals    = ['🥇','🥈','🥉'];
                const rankClr   = idx === 0 ? '#F5C518' : idx === 1 ? '#93C5FD' : idx === 2 ? '#FB923C' : 'rgba(255,255,255,0.5)';
                const isLastRow = idx === rows.length - 1;
                const snap        = snapshots[snapKey]?.[u.user_id];
                const currentRank = idx + 1;
                const moved       = snap ? snap - currentRank : 0;
                return (
                  <div key={u.user_id} style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.65rem',
                    padding: isMobile ? '0.5rem 0.85rem' : '0.7rem 1.25rem',
                    borderBottom: idx < rows.length - 1 ? '1px solid rgba(245,197,24,0.08)' : 'none',
                    background: isMe ? 'rgba(245,197,24,0.06)' : idx === 0 ? 'rgba(245,197,24,0.04)' : 'transparent',
                    borderLeft: idx < 3 ? `3px solid ${rankClr}` : '3px solid transparent',
                    transition: 'background 0.2s',
                  }}>
                    <span style={{
                      fontFamily: '"Cinzel", serif', fontWeight: 900,
                      fontSize: idx < 3 ? '1rem' : '0.78rem',
                      color: rankClr, minWidth: '1.4rem', textAlign: 'center',
                    }}>{idx < 3 ? medals[idx] : idx + 1}</span>
                    <div style={{
                      width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius: '50%', flexShrink: 0,
                      background: `${ulvl.color}22`,
                      border: `1.5px solid ${idx < 3 ? rankClr + '88' : ulvl.color + '44'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: '"Cinzel", serif', fontWeight: 800, fontSize: '0.68rem',
                      color: idx < 3 ? rankClr : ulvl.color,
                      boxShadow: idx < 3 ? `0 0 8px ${rankClr}44` : 'none',
                      overflow: 'hidden',
                    }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : (name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()||'')).join('')
                      }
                    </div>
                    <p style={{
                      fontFamily: '"Cinzel", serif', fontWeight: 600,
                      fontSize: '0.78rem',
                      color: isMe ? C.gold : idx === 0 ? '#fff' : 'rgba(255,255,255,0.8)',
                      margin: 0, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {name}
                      {isMe && <span style={{ color: C.gold, fontWeight: 400, fontSize: '0.62rem', marginLeft: '0.3em' }}>(tú)</span>}
                    </p>
                    {moved !== 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.15em',
                        padding: '0.15em 0.45em',
                        background: moved > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        border: `1px solid ${moved > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        borderRadius: '999px', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '0.6rem', color: moved > 0 ? '#10B981' : '#EF4444' }}>{moved > 0 ? '▲' : '▼'}</span>
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.58rem', fontWeight: 900,
                          color: moved > 0 ? '#10B981' : '#EF4444',
                          textShadow: moved > 0 ? '0 0 8px rgba(16,185,129,0.8)' : '0 0 8px rgba(239,68,68,0.8)',
                        }}>{Math.abs(moved)}</span>
                      </div>
                    )}
                    <span style={{
                      fontFamily: '"Cinzel", serif', fontWeight: 800,
                      fontSize: '0.85rem', color: rankClr,
                      textShadow: idx < 3 ? `0 0 8px ${rankClr}66` : 'none',
                      flexShrink: 0,
                    }}>{(u[ptsKey] || 0).toLocaleString()}</span>
                  </div>
                );
              })}

              {/* ── MI POSICIÓN si no estoy en el Top 10 ── */}
              {(() => {
                const myRankData = myRanks[snapKey];
                if (!myRankData) return null;
                const alreadyVisible = rows.some(r => r.user_id === myUser?.id);
                if (alreadyVisible) return null;
                const myRankRow = myRankData.row;
                const myRankPos = myRankData.rank;
                const myName = myUser?.full_name || myUser?.templario_name || 'Tú';
                return (
                  <>
                    {/* Separador */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.35rem 1.25rem',
                      background: `linear-gradient(90deg, rgba(${accentRgb},0.06), rgba(${accentRgb},0.02))`,
                      borderTop: `1px dashed rgba(${accentRgb},0.25)`,
                    }}>
                      <div style={{ flex: 1, height: '1px', background: `rgba(${accentRgb},0.18)` }} />
                      <span style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.55rem',
                        color: `rgba(${accentRgb},0.5)`, letterSpacing: '0.14em',
                        fontWeight: 700, whiteSpace: 'nowrap',
                      }}>TU POSICIÓN</span>
                      <div style={{ flex: 1, height: '1px', background: `rgba(${accentRgb},0.18)` }} />
                    </div>

                    {/* Fila del usuario */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.65rem',
                      padding: isMobile ? '0.5rem 0.85rem' : '0.7rem 1.25rem',
                      background: `linear-gradient(135deg, rgba(${accentRgb},0.12), rgba(10,6,20,0.7))`,
                      borderBottom: 'none',
                      borderLeft: `3px solid rgba(${accentRgb},0.7)`,
                      borderTop: `1px solid rgba(${accentRgb},0.15)`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {/* Brillo izquierdo */}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: `linear-gradient(180deg, rgba(${accentRgb},0.9), rgba(${accentRgb},0.3))`,
                        boxShadow: `2px 0 12px rgba(${accentRgb},0.5)`,
                      }} />

                      {/* Posición */}
                      <span style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 900,
                        fontSize: '0.8rem',
                        color: `rgba(${accentRgb},1)`,
                        minWidth: '1.4rem', textAlign: 'center',
                        textShadow: `0 0 10px rgba(${accentRgb},0.8)`,
                      }}>#{myRankPos}</span>

                      {/* Avatar */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: `rgba(${accentRgb},0.2)`,
                        border: `1.5px solid rgba(${accentRgb},0.6)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: '"Cinzel", serif', fontWeight: 800, fontSize: '0.68rem',
                        color: `rgba(${accentRgb},1)`,
                        boxShadow: `0 0 10px rgba(${accentRgb},0.4)`,
                        overflow: 'hidden',
                      }}>
                        {avatarUrl
                          ? <img src={avatarUrl} alt={myName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : (myName.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()||'')).join('')
                        }
                      </div>

                      {/* Nombre */}
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 700,
                        fontSize: '0.78rem',
                        color: `rgba(${accentRgb},1)`,
                        margin: 0, flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textShadow: `0 0 12px rgba(${accentRgb},0.6)`,
                      }}>
                        {myName}
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 400,
                          marginLeft: '0.3em', opacity: 0.7,
                        }}>(tú)</span>
                      </p>

                      {/* Puntos */}
                      <span style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 800,
                        fontSize: '0.85rem',
                        color: `rgba(${accentRgb},1)`,
                        textShadow: `0 0 10px rgba(${accentRgb},0.8)`,
                        flexShrink: 0,
                      }}>{(myRankRow[ptsKey] || 0).toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
          </div>{/* fin grid interno */}
        </div>{/* fin wrapper épico */}

        <p style={{
          fontFamily: '"Cinzel", serif', fontSize: '0.56rem',
          color: 'rgba(245,197,24,0.25)', textAlign: 'center',
          marginTop: '1.25rem', letterSpacing: '0.12em',
          position: 'relative', zIndex: 1,
        }}>
          ⚜️ Ranking por puntos de comunidad · Independiente del ranking de juego
        </p>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  COMPONENTE PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════════
  const TABS = [
    { key: 'feed',        label: 'Feed',     icon: '🔥' },
    { key: 'members',     label: 'Miembros', icon: '👥' },
    { key: 'dms',         label: 'Mensajes', icon: '💬' },
    { key: 'leaderboard', label: 'Ranking',  icon: '🏆' },
  ];

  // ─── Banner héroe: módulo activo ─────────────────────────────────────────────
  const ModuleBanner = () => {
    const userProtocolo    = useMembershipStore(s => s.userProtocolo);
    const currentWeekStore = useMembershipStore(s => s.currentWeek);
    const navigate         = useNavigate();

    const currentModule = useMemo(() => {
      if (userProtocolo) {
        return ACADEMY_MODULES.find(m => m.protocolo === userProtocolo) ?? ACADEMY_MODULES[0];
      }
      return ACADEMY_MODULES.find(m => m.week === currentWeekStore) ?? ACADEMY_MODULES[0];
    }, [userProtocolo, currentWeekStore]);

    if (!currentModule) return null;

    const cfg = MODULE_TYPE_CONFIG[currentModule.type] || { color: '#C084FC', icon: '⚔️', label: 'Academia' };

    return (
      <div
        onClick={() => navigate(`/academia/${currentModule.slug}`)}
        style={{
          position: 'relative', overflow: 'hidden',
          marginBottom: '1rem', cursor: 'pointer',
          borderRadius: '1.25rem',
          border: `1.5px solid ${cfg.color}55`,
          background: `linear-gradient(135deg, ${cfg.color}22 0%, rgba(10,6,20,0.92) 50%, ${cfg.color}10 100%)`,
          padding: 'clamp(1.25rem, 3vw, 1.75rem) clamp(1.25rem, 4vw, 2rem)',
          boxShadow: `0 0 60px ${cfg.color}22, 0 0 120px ${cfg.color}10, inset 0 1px 0 rgba(255,255,255,0.08)`,
          transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${cfg.color}99`;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 0 80px ${cfg.color}35, 0 0 160px ${cfg.color}15, inset 0 1px 0 rgba(255,255,255,0.12)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${cfg.color}55`;
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = `0 0 60px ${cfg.color}22, 0 0 120px ${cfg.color}10, inset 0 1px 0 rgba(255,255,255,0.08)`;
        }}
      >
        {/* Fondo animado */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 80% 50%, ${cfg.color}18 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        {/* Icono fantasma de fondo */}
        <div style={{
          position: 'absolute', right: 'clamp(1rem, 5vw, 3rem)', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 'clamp(4rem, 12vw, 7rem)',
          opacity: 0.07, pointerEvents: 'none', userSelect: 'none',
          filter: `drop-shadow(0 0 40px ${cfg.color})`,
        }}>{cfg.icon}</div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 3vw, 1.75rem)' }}>
          {/* Icono épico */}
          <div style={{
            width: 'clamp(52px, 8vw, 68px)', height: 'clamp(52px, 8vw, 68px)',
            borderRadius: '1rem', flexShrink: 0,
            background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}11)`,
            border: `2px solid ${cfg.color}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            boxShadow: `0 0 24px ${cfg.color}44, inset 0 1px 0 rgba(255,255,255,0.1)`,
            animation: 'moduleBannerFloat 3s ease-in-out infinite',
          }}>{cfg.icon}</div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4em',
              padding: '0.2em 0.75em',
              background: `${cfg.color}22`,
              border: `1px solid ${cfg.color}44`,
              borderRadius: '999px',
              marginBottom: '0.5rem',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: cfg.color,
                boxShadow: `0 0 8px ${cfg.color}`,
                animation: 'moduleBannerPulse 2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: '"Cinzel", serif',
                fontSize: 'clamp(0.58rem, 1.3vw, 0.68rem)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: cfg.color, fontWeight: 700,
              }}>Tu módulo activo · Semana {currentModule.week}</span>
            </div>

            <h2 style={{
              fontFamily: '"Cinzel", serif', fontWeight: 900,
              fontSize: 'clamp(1.1rem, 3.5vw, 1.75rem)',
              color: '#fff', margin: '0 0 0.375rem', lineHeight: 1.15,
              textShadow: `0 0 30px ${cfg.color}44`,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{currentModule.title}</h2>

            <p style={{
              fontFamily: '"Crimson Text", serif',
              fontSize: 'clamp(0.85rem, 2vw, 1rem)',
              color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{currentModule.subtitle}</p>
          </div>

          {/* CTA */}
          <div style={{
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
          }}>
            <div style={{
              padding: 'clamp(0.6rem, 1.5vw, 0.875rem) clamp(1rem, 3vw, 1.75rem)',
              background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
              borderRadius: '0.75rem',
              fontFamily: '"Cinzel", serif', fontWeight: 900,
              fontSize: 'clamp(0.65rem, 1.5vw, 0.8rem)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#000',
              boxShadow: `0 0 28px ${cfg.color}66, 0 0 56px ${cfg.color}22`,
              animation: 'moduleBannerGlow 3s ease-in-out infinite',
              whiteSpace: 'nowrap',
            }}>▶ Ir al módulo</div>
            <span style={{
              fontFamily: '"Cinzel", serif', fontSize: '0.58rem',
              color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em',
            }}>+{currentModule.xpReward} XP · {currentModule.duration}</span>
          </div>
        </div>

        <style>{`
          @keyframes moduleBannerFloat {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            50%      { transform: translateY(-4px) rotate(2deg); }
          }
          @keyframes moduleBannerPulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.4; transform:scale(1.4); }
          }
          @keyframes moduleBannerGlow {
            0%,100% { box-shadow: 0 0 28px ${cfg.color}66, 0 0 56px ${cfg.color}22; }
            50%      { box-shadow: 0 0 45px ${cfg.color}99, 0 0 90px ${cfg.color}33; }
          }
        `}</style>
      </div>
    );
  };

  const CommunityHub = () => {
    const user        = useAuthStore(s => s.user);
    const playerLevel = usePlayerStore(s => s.level);
    const location     = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab,    setActiveTab]    = useState(() => {
      const tab = searchParams.get('tab');
      if (tab === 'ranking') return 'leaderboard';
      if (tab === 'feed' || tab === 'members' || tab === 'dms' || tab === 'leaderboard') return tab;
      return 'feed';
    });
    const [dmTarget,     setDmTarget]     = useState(null);
    const [toast,        setToast]        = useState(null);
    const [sessionXP,    setSessionXP]    = useState(0);
    const [sessionCoins, setSessionCoins] = useState(0);
    const [myStats,      setMyStats]      = useState(null);
    const [unreadDMs,    setUnreadDMs]    = useState(0);
    const [newFeedPosts, setNewFeedPosts] = useState(0);
    const [showVictoryCelebration, setShowVictoryCelebration] = useState(!!location?.state?.celebrateAllianceUnlock);

    // Limpia el state de navegación para que un refresh no vuelva a disparar el modal
    useEffect(() => {
      if (location?.state?.celebrateAllianceUnlock) {
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cierra el modal de "Primera Victoria Forjada" y manda al usuario a ver
    // su Código de Alianza en el perfil, con el badge del sidebar encendido.
    const handleVictoryContinue = useCallback(() => {
      setShowVictoryCelebration(false);
      if (user?.id) localStorage.setItem(`tdp_alliance_spotlight_${user.id}`, '1');
      navigate('/profile?highlight=alianza');
    }, [user?.id, navigate]);

    const { levelCfg, pointsCfg, categories, ready, getLvl } = useCommunityConfig();

    // ─── Cargar stats propios ──────────────────────────────────────────────────
    useEffect(() => {
      if (!user?.id) return;
      supabase
        .from('community_user_stats')
        .select('community_points, community_level')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setMyStats(data);
          if (data?.community_level >= 4)
            missionsService.trackEvent(user.id, 'community_level_4');
          if (data?.community_level >= 8)
            missionsService.trackEvent(user.id, 'community_level_8');
          if (data?.community_level >= 9)
            missionsService.trackEvent(user.id, 'community_level_9');
        });
    }, [user?.id]);

    // ─── Contar DMs no leídos ──────────────────────────────────────────────────
    useEffect(() => {
      if (!user?.id) return;
      supabase
        .from('community_dms')
        .select('id', { count: 'exact', head: true })
        .eq('to_user', user.id)
        .eq('read', false)
        .then(({ count }) => setUnreadDMs(count || 0));
    }, [user?.id]);

    // ─── Realtime: badge Feed para posts nuevos ────────────────────────────────
    useEffect(() => {
      if (!user?.id) return;
      const STORAGE_KEY = `community_last_visit_${user.id}`;
      const lastVisit   = localStorage.getItem(STORAGE_KEY);

      // Contar posts publicados después del último visit
      let q = supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('hidden', false);
      if (lastVisit) q = q.gt('created_at', lastVisit);

      q.then(({ count }) => {
        const n = count || 0;
        setNewFeedPosts(n);
        if (user?.id) {
          localStorage.setItem('community_new_posts_count_' + user.id, String(n));
        }
      });

      // Realtime: cada INSERT suma 1 al badge
      const ch = supabase.channel('feed_badge_rt');
      ch.on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'community_posts',
      }, (payload) => {
        if (!payload.new.hidden && payload.new.user_id !== user.id) {
          setNewFeedPosts(prev => {
            const next = prev + 1;
            if (user?.id) localStorage.setItem('community_new_posts_count_' + user.id, String(next));
            return next;
          });
        }
      });
      ch.subscribe();

      return () => supabase.removeChannel(ch);
    }, [user?.id]);

    // ─── Limpiar badge Feed al entrar a esa tab ────────────────────────────────
    useEffect(() => {
      if (activeTab === 'feed' && user?.id) {
        setNewFeedPosts(0);
        localStorage.setItem(`community_last_visit_${user.id}`, new Date().toISOString());
        localStorage.setItem('community_new_posts_count_' + user.id, '0');
      }
      if (activeTab === 'dms') {
        setUnreadDMs(0);
      }
    }, [activeTab, user?.id]);

    // ─── myUser unificado ──────────────────────────────────────────────────────
    const isAdmin      = useAuthStore(s => s.isAdmin);
    const storeProfile = useAuthStore(s => s.profile);

    const myUser = useMemo(() => ({
      id:               user?.id,
      full_name:        storeProfile?.templario_name
                        || user?.user_metadata?.templario_name
                        || user?.user_metadata?.full_name
                        || user?.email?.split('@')[0]
                        || 'Tú',
      templario_name:   storeProfile?.templario_name
                        || user?.user_metadata?.templario_name,
      email:            user?.email,
      level:            playerLevel || 1,
      community_level:  myStats?.community_level || 1,
      community_points: myStats?.community_points || 0,
      is_admin:         isAdmin || storeProfile?.is_admin || false,
    }), [user, playerLevel, myStats, isAdmin, storeProfile]);

    const handleReward = useCallback((reward) => {
      setSessionXP(p    => p + (reward.xp    || 0));
      setSessionCoins(p => p + (reward.coins || 0));
      setToast(reward);
    }, []);

    const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`, { replace: true });
  }, [navigate]);

  const openDM = useCallback((target) => {
    setDmTarget(target);
    changeTab('dms');
  }, [changeTab]);

    const currLvl = useMemo(() =>
      getLvl(myStats?.community_level || 1),
    [getLvl, myStats]);

    if (!ready) return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    );

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0614 0%, #0d0820 40%, #080518 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orbes de fondo épicos */}
        <div style={{
          position: 'fixed', top: '-20%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.13) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'communityOrb1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', bottom: '-15%', right: '-8%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,197,24,0.09) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'communityOrb2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', top: '40%', right: '15%',
          width: '30vw', height: '30vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'communityOrb3 26s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', inset: 0,
          backgroundImage: 'linear-gradient(rgba(192,132,252,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <style>{`
          @keyframes communityOrb1 {
            0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.05)} 66%{transform:translate(-2%,3%) scale(0.97)}
          }
          @keyframes communityOrb2 {
            0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-4%,-3%) scale(1.08)} 66%{transform:translate(2%,-5%) scale(0.95)}
          }
          @keyframes communityOrb3 {
            0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,4%) scale(1.1)}
          }
        `}</style>
        <div style={{
          maxWidth: '68rem', margin: '0 auto',
          padding: 'clamp(1rem,5vw,2rem) clamp(1rem,4vw,1.5rem)',
          minHeight: '100vh',
          position: 'relative', zIndex: 1,
        }}>

        {/* Header */}
        <header style={{ marginBottom: 'clamp(1.5rem,4vw,2rem)' }}>
          <style>{`
            @keyframes heroRaySway {
              0%,100% { transform: translateX(-50%) rotate(-18deg) scaleY(1); opacity: 0.7; }
              50%      { transform: translateX(-50%) rotate(18deg) scaleY(1.08); opacity: 1; }
            }
            @keyframes heroRaySway2 {
              0%,100% { transform: translateX(-50%) rotate(12deg); opacity: 0.5; }
              50%      { transform: translateX(-50%) rotate(-12deg); opacity: 0.8; }
            }
            @keyframes heroStarTwinkle {
              0%,100% { opacity: 0.15; transform: scale(1); }
              50%      { opacity: 1; transform: scale(1.8); }
            }
            @keyframes heroTitleShine {
              0%   { background-position: -200% center; }
              100% { background-position:  200% center; }
            }
            @keyframes heroSubFade {
              from { opacity:0; transform: translateY(8px); }
              to   { opacity:1; transform: translateY(0); }
            }
          `}</style>

          {/* Bloque título épico */}
          <div style={{ position: 'relative', textAlign: 'center', padding: '2.5rem 0 1.5rem', marginBottom: '1.5rem' }}>

            {/* Rayo solar central */}
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              width: 3, height: '100%',
              background: 'linear-gradient(180deg, rgba(192,132,252,0.9) 0%, rgba(245,197,24,0.6) 40%, transparent 100%)',
              transform: 'translateX(-50%) rotate(-18deg)',
              transformOrigin: 'top center',
              animation: 'heroRaySway 8s ease-in-out infinite',
              filter: 'blur(1px)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              width: 180, height: '85%',
              background: 'radial-gradient(ellipse at top, rgba(192,132,252,0.18) 0%, rgba(245,197,24,0.08) 40%, transparent 70%)',
              transform: 'translateX(-50%) rotate(12deg)',
              transformOrigin: 'top center',
              animation: 'heroRaySway2 11s ease-in-out infinite',
              filter: 'blur(8px)', pointerEvents: 'none',
            }} />
            {/* Estrellas */}
            {[
              { top:'12%', left:'8%',  delay:'0s',   size:3 },
              { top:'28%', left:'18%', delay:'0.6s',  size:2 },
              { top:'8%',  left:'78%', delay:'0.3s',  size:3 },
              { top:'35%', left:'88%', delay:'1s',    size:2 },
              { top:'55%', left:'5%',  delay:'1.4s',  size:2 },
              { top:'50%', left:'93%', delay:'0.8s',  size:3 },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', top: s.top, left: s.left,
                width: s.size, height: s.size, borderRadius: '50%',
                background: i % 2 === 0 ? '#C084FC' : '#F5C518',
                animation: `heroStarTwinkle ${1.8 + i * 0.4}s ease-in-out infinite`,
                animationDelay: s.delay, pointerEvents: 'none',
              }} />
            ))}

            {/* Título principal */}
            <h1 style={{
              fontFamily: '"Cinzel", serif', fontWeight: 900,
              fontSize: 'clamp(2.2rem,6vw,4rem)',
              margin: '0 0 0.25rem', lineHeight: 1,
              background: 'linear-gradient(90deg, #C084FC 0%, #F5C518 35%, #fff 50%, #F5C518 65%, #C084FC 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'heroTitleShine 4s linear infinite',
              textShadow: 'none',
              letterSpacing: '0.06em',
              position: 'relative', zIndex: 1,
            }}>COMUNIDAD</h1>

            <h2 style={{
              fontFamily: '"Cinzel", serif', fontWeight: 700,
              fontSize: 'clamp(1.1rem,3vw,1.8rem)',
              margin: '0 0 0.875rem', lineHeight: 1,
              background: `linear-gradient(90deg, ${C.gold}, #fff, ${C.gold})`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'heroTitleShine 5s linear infinite reverse',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              position: 'relative', zIndex: 1,
            }}>del Templo</h2>

            <p style={{
              fontFamily: '"Crimson Text", serif',
              fontSize: 'clamp(0.95rem,2vw,1.15rem)',
              color: 'rgba(255,255,255,0.55)', margin: '0 0 1.5rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              animation: 'heroSubFade 1s ease both',
              position: 'relative', zIndex: 1,
            }}>✦ Comparte · Aprende · Avanza juntos ✦</p>

            
          </div>

          {/* ══ BANNER HÉROE — Módulo activo ══ */}
          <ModuleBanner />

          {/* Badges de nivel y sesión — debajo del banner, versión épica */}
          {myStats && (() => {
            const nextLvl = levelCfg.find(l => l.level === myStats.community_level + 1);
            const currLvlCfg = levelCfg.find(l => l.level === myStats.community_level);
            const pct = nextLvl && currLvlCfg
              ? Math.min(100, Math.round(((myStats.community_points - currLvlCfg.min_points) / (nextLvl.min_points - currLvlCfg.min_points)) * 100))
              : 100;
            const ptsLeft = nextLvl ? nextLvl.min_points - myStats.community_points : 0;
            return (
              <div style={{
                position: 'relative', overflow: 'hidden',
                marginBottom: '1rem',
                borderRadius: '1.25rem',
                border: `1.5px solid ${currLvl.color}66`,
                background: `linear-gradient(135deg, ${currLvl.color}22 0%, rgba(10,6,20,0.92) 50%, ${currLvl.color}10 100%)`,
                padding: '1.25rem 2rem',
                boxShadow: `0 0 60px ${currLvl.color}22, 0 0 120px ${currLvl.color}10, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}>
                {/* Fondo radial */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 20% 50%, ${currLvl.color}18 0%, transparent 60%)`,
                  pointerEvents: 'none',
                }} />
                {/* Icono fantasma de fondo */}
                <div style={{
                  position: 'absolute', left: '1rem', top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '5rem', opacity: 0.06,
                  pointerEvents: 'none', userSelect: 'none',
                  filter: `drop-shadow(0 0 40px ${currLvl.color})`,
                }}>{currLvl.icon}</div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>

                  {/* Izquierda: icono + nombre nivel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '1rem', flexShrink: 0,
                      background: `linear-gradient(135deg, ${currLvl.color}33, ${currLvl.color}11)`,
                      border: `2px solid ${currLvl.color}66`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.75rem',
                      boxShadow: `0 0 24px ${currLvl.color}44, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}>{currLvl.icon}</div>
                    <div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4em',
                        padding: '0.2em 0.75em',
                        background: `${currLvl.color}22`,
                        border: `1px solid ${currLvl.color}44`,
                        borderRadius: '999px',
                        marginBottom: '0.4rem',
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: currLvl.color,
                          boxShadow: `0 0 8px ${currLvl.color}`,
                        }} />
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.62rem',
                          letterSpacing: '0.16em', textTransform: 'uppercase',
                          color: '#fff', fontWeight: 700,
                          textShadow: `0 0 10px ${currLvl.color}`,
                        }}>⚔️ Comunidad · Nv.{myStats.community_level}</span>
                      </div>
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 900,
                        fontSize: '1.5rem', color: '#fff',
                        margin: 0, lineHeight: 1.1,
                        textShadow: `0 0 30px ${currLvl.color}66`,
                        letterSpacing: '0.06em',
                      }}>{currLvl.title}</p>
                    </div>
                  </div>

                  {/* Centro: barra de progreso */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.68rem',
                        color: 'rgba(255,255,255,0.5)', fontWeight: 700,
                      }}>{myStats.community_points.toLocaleString()} pts</span>
                      {nextLvl && (
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.68rem',
                          color: currLvl.color, fontWeight: 700,
                          textShadow: `0 0 8px ${currLvl.color}`,
                        }}>+{ptsLeft} → {nextLvl.title} ✦</span>
                      )}
                      {!nextLvl && (
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.68rem',
                          color: C.gold, fontWeight: 700,
                        }}>👑 Nivel máximo</span>
                      )}
                    </div>
                    <div style={{
                      height: 10, borderRadius: '999px',
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${currLvl.color}33`,
                      overflow: 'hidden',
                      boxShadow: `inset 0 0 8px rgba(0,0,0,0.5)`,
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '999px',
                        width: `${Math.max(pct, 4)}%`,
                        background: `linear-gradient(90deg, ${currLvl.color}88, ${currLvl.color}, #fff, ${currLvl.color})`,
                        backgroundSize: '200% auto',
                        boxShadow: `0 0 16px ${currLvl.color}, 0 0 6px #fff`,
                        animation: 'heroTitleShine 2s linear infinite',
                        transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: '0.4rem',
                    }}>
                      <span style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.3)',
                      }}>{pct}% completado</span>
                      {nextLvl && (
                        <span style={{
                          fontFamily: '"Cinzel", serif', fontSize: '0.6rem',
                          color: 'rgba(255,255,255,0.3)',
                        }}>Meta: {nextLvl.min_points.toLocaleString()} pts</span>
                      )}
                    </div>
                  </div>

                  {/* Derecha: sesión XP si hay */}
                  {(sessionXP > 0 || sessionCoins > 0) && (
                    <div style={{
                      flexShrink: 0,
                      padding: '0.75rem 1.25rem',
                      background: `linear-gradient(135deg, ${C.gold}18, rgba(10,6,20,0.85))`,
                      border: `1.5px solid ${C.gold}55`,
                      borderRadius: '1rem', textAlign: 'center',
                      boxShadow: `0 0 24px ${C.gold}33`,
                    }}>
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.52rem',
                        letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.4)', margin: '0 0 0.3rem',
                      }}>⚡ Esta sesión</p>
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontWeight: 900,
                        fontSize: '1rem', color: C.gold, margin: '0 0 0.15rem',
                        textShadow: `0 0 16px ${C.gold}88`,
                      }}>+{sessionXP} XP</p>
                      <p style={{
                        fontFamily: '"Cinzel", serif', fontSize: '0.62rem',
                        color: C.purple, margin: 0,
                      }}>+{sessionCoins} 🪙</p>
                    </div>
                  )}

                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '0.375rem',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(192,132,252,0.2)',
            borderRadius: '0.875rem', padding: '0.375rem', overflowX: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              const badge =
                tab.key === 'dms'  && unreadDMs    > 0 ? unreadDMs    :
                tab.key === 'feed' && newFeedPosts  > 0 ? newFeedPosts :
                null;
              return (
                <button
                  key={tab.key}
                  onClick={() => changeTab(tab.key)}
                  style={{
                    flex: 1, minWidth: 'max-content',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.4em',
                    padding: 'clamp(0.5rem,1.5vw,0.625rem) clamp(0.5rem,2vw,0.875rem)',
                    background: isActive ? 'rgba(192,132,252,0.18)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(192,132,252,0.4)' : 'transparent'}`,
                    borderRadius: '0.625rem',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.80)',
                    boxShadow: isActive ? '0 0 20px rgba(192,132,252,0.2)' : 'none',
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(0.62rem,1.6vw,0.73rem)',
                    letterSpacing: '0.05em', cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {badge && (
                    <span style={{
                      background: C.purple, borderRadius: '999px',
                      padding: '0.05em 0.45em',
                      fontFamily: '"Cinzel", serif', fontSize: '0.58rem',
                      color: '#0a0614', fontWeight: 700,
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Contenido */}
        <div>
          {activeTab === 'feed' && (
  <FeedTab
    myUser={myUser}
    pointsCfg={pointsCfg}
    categories={categories}
    getLvl={getLvl}
    onReward={handleReward}
    storeProfile={storeProfile}
  />
)}
          {activeTab === 'members' && (
            <MembersTab
              myUser={myUser}
              getLvl={getLvl}
              levelCfg={levelCfg}
              onOpenDM={openDM}
            />
          )}
          {activeTab === 'dms' && (
            <DMsTab
              myUser={myUser}
              initialTarget={dmTarget}
              onReward={handleReward}
              pointsCfg={pointsCfg}
              getLvl={getLvl}
            />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab
              myUser={myUser}
              getLvl={getLvl}
              levelCfg={levelCfg}
            />
          )}
        </div>

        {/* Modal: Primera Victoria Forjada — desbloqueo de Alianza */}
        {showVictoryCelebration && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(15,8,32,0.99), rgba(10,6,24,0.99))',
              border: `1.5px solid ${C.gold}88`,
              borderRadius: '1.5rem', padding: '2rem 1.75rem',
              width: '100%', maxWidth: 420,
              boxShadow: `0 0 80px ${C.gold}33`,
              textAlign: 'center',
              animation: 'victoryPop 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <p style={{ fontSize: '3rem', margin: '0 0 0.75rem', filter: `drop-shadow(0 0 20px ${C.gold})` }}>🏆</p>
              <p style={{
                fontFamily: '"Cinzel", serif', fontWeight: 900,
                fontSize: '1.05rem', color: C.gold,
                margin: '0 0 0.5rem', letterSpacing: '0.06em',
              }}>¡PRIMERA VICTORIA FORJADA!</p>
              <p style={{
                fontFamily: '"Crimson Text", serif', fontSize: '0.98rem',
                color: 'rgba(255,255,255,0.75)', margin: '0 0 1.75rem', lineHeight: 1.5,
              }}>
                Completaste tu primer protocolo y desbloqueaste tu <strong style={{ color: C.gold }}>Código de Alianza</strong>. Ve a tu perfil para verlo y empezar a invitar guerreros.
              </p>
              <button onClick={handleVictoryContinue} style={{
                padding: '0.85em 2em',
                background: `linear-gradient(135deg, ${C.gold}33, ${C.gold}18)`,
                border: `1.5px solid ${C.gold}`,
                borderRadius: '0.6rem', color: C.gold,
                fontFamily: '"Cinzel", serif', fontSize: '0.8rem',
                fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
                boxShadow: `0 0 24px ${C.gold}44`,
              }}>👑 VER MI CÓDIGO DE ALIANZA</button>
              <style>{`
                @keyframes victoryPop {
                  from { opacity:0; transform: scale(0.9) translateY(10px); }
                  to   { opacity:1; transform: scale(1) translateY(0); }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Toast de recompensa */}
        {toast && <RewardToast reward={toast} onDone={() => setToast(null)} />}
        </div>
      </div>
    );
  };

  export default CommunityHub;
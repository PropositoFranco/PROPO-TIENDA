import styles from './LobbyScreen.module.css';

/**
 * LobbyScreen — pantalla principal del mapa (s-map)
 *
 * Props:
 *  gameState   {name, pts, streak, xp, xpMax, level, rankPos,
 *               dailyTitle, dailyPct, councilDone, chambers,
 *               bubbleText, maestroSrc}
 *  ranking     [{id, name, pts, isMe}]
 *  onNavigate  (screen: 'live' | 'admin' | 'podium') => void
 *  onEnterChamber (chamberId: 'c1'|'c2'|'c3') => void
 *  onTryCouncil   () => void
 */
export default function LobbyScreen({
  gameState = {},
  ranking = [],
  onNavigate,
  onEnterChamber,
  onTryCouncil,
}) {
  const {
    name        = 'Templario',
    pts         = 0,
    streak      = 0,
    xp          = 0,
    xpMax       = 150,
    level       = 1,
    rankPos     = '–',
    dailyTitle  = 'Reflexiona 10 minutos hoy',
    dailyPct    = 0,
    councilDone = 0,
    chambers    = { c1: 0, c2: 0, c3: 0 },
    bubbleText  = '✨ ¡Hoy es un gran día para crecer, Templario!',
    maestroSrc  = '',
  } = gameState;

  const xpPct      = Math.min(100, Math.round((xp / xpMax) * 100));
  const avatarInit = name ? name[0].toUpperCase() : 'T';

  const rankLabel = pts >= 500 ? '⚔️ Caballero'
                  : pts >= 200 ? '⚔️ Escudero'
                  :              '⚔️ Recluta';

  const posClass = (i) =>
    i === 0 ? styles.p1 : i === 1 ? styles.p2 : i === 2 ? styles.p3 : styles.pn;

  const posLabel = (i) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>

      {/* ── TOPBAR ── */}
      <div className={styles.topbar}>
        <div className={styles.playerAvatar}>
          <div className={styles.avatarRing} style={{ '--pct': `${xpPct}%` }}>
            <div className={styles.avatarInner}>{avatarInit}</div>
          </div>
          <div className={styles.levelBadge}>{level}</div>
        </div>

        <div className={styles.playerInfo}>
          <div className={styles.playerName}>{name}</div>
          <div className={styles.playerRank}>{rankLabel}</div>
          <div className={styles.xpBarWrap}>
            <div className={styles.xpBarFill} style={{ width: `${xpPct}%` }} />
          </div>
          <div className={styles.xpLabel}>{xp}/{xpMax} XP</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
          <div className={styles.resPill}>
            <span className={styles.pillIcon}>🪙</span>
            <span className={styles.pillVal}>{pts.toLocaleString()} pts</span>
          </div>
          <div className={styles.streakPill}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span className={styles.pillVal}>{streak} días</span>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div className={styles.heroTitle}>TEMPLO DEL PROPÓSITO</div>
        <div className={styles.heroSub}>Tu Camino · Tu Legado · Tu Templo</div>
        <div className={styles.orn}>
          <div className={styles.ornLine} />
          <div className={styles.ornSm} />
          <div className={styles.ornGem} />
          <div className={styles.ornSm} />
          <div className={styles.ornLine} />
        </div>
      </div>

      {/* ── MAESTRO ── */}
      <div className={styles.maestroWrap}>
        <div className={styles.speechBubble}>{bubbleText}</div>
        <div className={styles.maestroGlow} />
        <img className={styles.maestroImg} alt="Templario" src={maestroSrc} />
      </div>

      {/* ── PROGRESS CARDS ── */}
      <div className={styles.progressSection}>
        <div className={`${styles.progCard} ${styles.gold}`}>
          <span className={styles.progIcon}>⚡</span>
          <div className={styles.progVal}>{pts.toLocaleString()}</div>
          <div className={styles.progLbl}>Puntos</div>
        </div>
        <div className={`${styles.progCard} ${styles.teal}`}>
          <span className={styles.progIcon}>🏆</span>
          <div className={styles.progVal}>#{rankPos}</div>
          <div className={styles.progLbl}>Ranking</div>
        </div>
        <div className={`${styles.progCard} ${styles.fire}`}>
          <span className={styles.progIcon}>🔥</span>
          <div className={styles.progVal}>{streak}</div>
          <div className={styles.progLbl}>Racha</div>
        </div>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className={styles.sectionHeader}>
        <div className={styles.secTitle}>⚔️ Misiones del Templo</div>
        <button className={styles.secBtn} onClick={() => onNavigate?.('live')}>
          Ver todas →
        </button>
      </div>

      {/* ── CARDS GRID ── */}
      <div className={styles.cardsGrid}>

        {/* C1 — Claridad Absoluta */}
        <div
          className={`${styles.mcard} ${chambers.c1 >= 100 ? styles.completed : ''}`}
          onClick={() => onEnterChamber?.('c1')}
        >
          <div className={styles.mcardGlowRing} />
          <div className={styles.cardIconWrap}>
            <div className={styles.cardIconBg} style={{ background: 'linear-gradient(135deg,#1A3A1A,#0A2A0A)' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>🕯️</span>
              <div className={styles.cardIconShine} />
            </div>
            <div className={styles.cardIconGlow} style={{ background: 'radial-gradient(circle,rgba(46,213,115,.4),transparent)' }} />
          </div>
          <div className={styles.cardName}>Claridad Absoluta</div>
          <div className={styles.cardPts}><span className={styles.bolt}>⚡</span> +50 PTS</div>
          <div className={styles.cardProgress}>
            <div className={styles.cardProgressFill}
              style={{ width: `${chambers.c1 || 0}%`, background: 'linear-gradient(90deg,#2ED573,#7BF5A4)' }} />
          </div>
        </div>

        {/* C2 — Dominio Interior */}
        <div
          className={`${styles.mcard} ${styles.featured} ${chambers.c2 >= 100 ? styles.completed : ''}`}
          onClick={() => onEnterChamber?.('c2')}
        >
          <div className={styles.mcardGlowRing} />
          <div className={`${styles.cardBadge} ${styles.badgeNew}`}>Activa</div>
          <div className={styles.cardIconWrap}>
            <div className={styles.cardIconBg} style={{ background: 'linear-gradient(135deg,#2A1A0A,#1A0A00)' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>⭐</span>
              <div className={styles.cardIconShine} />
            </div>
            <div className={styles.cardIconGlow} style={{ background: 'radial-gradient(circle,rgba(255,149,0,.5),transparent)' }} />
          </div>
          <div className={styles.cardName}>Dominio Interior</div>
          <div className={styles.cardPts}><span className={styles.bolt}>⚡</span> +50 PTS</div>
          <div className={styles.cardProgress}>
            <div className={styles.cardProgressFill}
              style={{ width: `${chambers.c2 || 0}%`, background: 'linear-gradient(90deg,#FF6B00,#F4C542)' }} />
          </div>
        </div>

        {/* C3 — Estrategia Mental */}
        <div
          className={`${styles.mcard} ${chambers.c3 >= 100 ? styles.completed : ''}`}
          onClick={() => onEnterChamber?.('c3')}
        >
          <div className={styles.mcardGlowRing} />
          <div className={styles.cardIconWrap}>
            <div className={styles.cardIconBg} style={{ background: 'linear-gradient(135deg,#0A1A2A,#051020)' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>🧠</span>
              <div className={styles.cardIconShine} />
            </div>
            <div className={styles.cardIconGlow} style={{ background: 'radial-gradient(circle,rgba(112,160,255,.5),transparent)' }} />
          </div>
          <div className={styles.cardName}>Estrategia Mental</div>
          <div className={styles.cardPts}><span className={styles.bolt}>⚡</span> +50 PTS</div>
          <div className={styles.cardProgress}>
            <div className={styles.cardProgressFill}
              style={{ width: `${chambers.c3 || 0}%`, background: 'linear-gradient(90deg,#70A0FF,#A0C0FF)' }} />
          </div>
        </div>

        {/* COUNCIL — Prueba del Consejo (locked) */}
        <div
          className={`${styles.mcard} ${styles.locked}`}
          onClick={onTryCouncil}
        >
          <div className={styles.mcardGlowRing} />
          <div className={`${styles.cardBadge} ${styles.badgeLocked}`}>🔒 Bloqueada</div>
          <div className={styles.cardIconWrap}>
            <div className={styles.cardIconBg}
              style={{ background: 'linear-gradient(135deg,#1A0A2A,#100820)', opacity: 0.6 }}>
              <span style={{ position: 'relative', zIndex: 1 }}>👁️</span>
              <div className={styles.cardIconShine} />
            </div>
          </div>
          <div className={styles.cardName} style={{ color: '#8A7A60' }}>Prueba del Consejo</div>
          <div className={styles.cardPts} style={{ opacity: 0.4 }}>
            <span className={styles.bolt}>⚡</span> +100 · ×2
          </div>
          <div className={styles.councilLbl}>🔒 {councilDone}/2 pruebas</div>
          <div className={styles.cardProgress}>
            <div className={styles.cardProgressFill}
              style={{ width: `${(councilDone / 2) * 100}%`, background: '#7B2FBE' }} />
          </div>
        </div>

      </div>

      {/* ── QUEST BANNER ── */}
      <div className={styles.questBanner}>
        <div className={styles.qbIcon}>🌟</div>
        <div className={styles.qbInfo}>
          <div className={styles.qbLabel}>🌙 Misión Diaria</div>
          <div className={styles.qbTitle}>{dailyTitle}</div>
          <div className={styles.qbProg}>
            <div className={styles.qbBar}>
              <div className={styles.qbBarFill} style={{ width: `${dailyPct}%` }} />
            </div>
            <span className={styles.qbPct}>{dailyPct}%</span>
          </div>
        </div>
        <div className={styles.qbReward}>
          <div className={styles.qbRewardVal}>🪙 250</div>
          <div className={styles.qbRewardLbl}>Recompensa</div>
        </div>
      </div>

      {/* ── RANK STRIP ── */}
      <div className={styles.rankStrip}>
        <div className={styles.rankHeader}>
          <div className={styles.rankTitle}>🏛️ Ranking del Templo</div>
          <div className={styles.liveDot}>
            <div className={styles.ldot} />
            <span>EN VIVO</span>
          </div>
        </div>
        <div className={styles.rankRows}>
          {ranking.slice(0, 5).map((row, i) => (
            <div key={row.id ?? i} className={`${styles.rankRow} ${row.isMe ? styles.me : ''}`}>
              <div className={`${styles.rpos} ${posClass(i)}`}>{posLabel(i)}</div>
              <div className={styles.ravatar}>{(row.name?.[0] ?? '?').toUpperCase()}</div>
              <div className={styles.rname}>
                {row.name}
                {row.isMe && <span className={styles.rmeTag}>TÚ</span>}
              </div>
              <div className={styles.rpts}>{(row.pts ?? 0).toLocaleString()} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FULL RANKING BTN ── */}
      <div style={{ padding: '.8rem 1rem 2.5rem', display: 'flex', justifyContent: 'center' }}>
        <button
          className={styles.btnGhost}
          onClick={() => onNavigate?.('live')}
          style={{ width: '100%', maxWidth: 580, fontSize: '.72rem' }}
        >
          📊 Ranking Completo · <span>{ranking.length} jugadores</span>
        </button>
      </div>

    </div>
  );
}
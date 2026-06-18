import maestroImg from '../../assets/proposito_actualizacion.png';

export default function MaintenancePage({ message }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#03000f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Cinzel', Georgia, serif",
      color: '#d4af37',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <style>{`
        @keyframes pulse {
          0%,100% { filter: drop-shadow(0 0 18px rgba(212,175,55,0.5)); }
          50%      { filter: drop-shadow(0 0 40px rgba(212,175,55,1)); }
        }
      `}</style>
      <img
        src={maestroImg}
        alt="Mantenimiento"
        style={{
          width: 'clamp(140px, 30vw, 280px)',
          marginBottom: '28px',
          animation: 'pulse 2.4s ease-in-out infinite',
        }}
      />
      <h1 style={{
        fontSize: 'clamp(16px, 3.5vw, 28px)',
        letterSpacing: '7px',
        marginBottom: '20px',
        textShadow: '0 0 30px rgba(212,175,55,0.8)',
      }}>
        ACTUALIZACIÓN EN CURSO
      </h1>
      <p style={{
        fontSize: '13px',
        letterSpacing: '2px',
        color: 'rgba(212,175,55,0.55)',
        maxWidth: '380px',
        lineHeight: '2',
      }}>
        {message || 'Estamos mejorando el Templo. Volvemos pronto.'}
      </p>
    </div>
  );
}
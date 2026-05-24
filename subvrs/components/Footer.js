import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '48px 40px 32px',
      marginTop: '80px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '40px',
        marginBottom: '48px',
      }} className="footer-grid">

        <div>
          <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '0.05em', marginBottom: '6px' }}>SUBVRS</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Torino, Italy</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[['/', 'Home'], ['/events', 'Events'], ['/artists', 'Artists'], ['/media', 'Media']].map(([href, label]) => (
            <Link key={href} href={href} style={{
              fontSize: '12px', color: 'var(--text2)', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
            >{label}</Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <a href="https://instagram.com/subvrs.011" target="_blank" rel="noopener" style={{
            fontSize: '12px', color: 'var(--text2)', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
          >Instagram</a>
          <span style={{ fontSize: '12px', color: 'var(--border2)', fontWeight: 500 }}>@subvrs.011</span>
        </div>
      </div>

      <div style={{
        paddingTop: '24px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text2)' }}>© 2026 SUBVRS</span>
        <span style={{ fontSize: '11px', color: 'var(--text2)' }}>subvrs.it</span>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}

import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '40px 32px',
      marginTop: '80px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '24px',
    }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '0.05em', marginBottom: '4px' }}>SUBVRS</div>
        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Torino, Italy</div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {[['/', 'Home'], ['/events', 'Events'], ['/media', 'Media'], ['/upload', 'Upload (Staff)']].map(([href, label]) => (
          <Link key={href} href={href} style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <a href="https://instagram.com/subvrs.011" target="_blank" rel="noopener"
          style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Instagram
        </a>
        <a href="https://ra.co" target="_blank" rel="noopener"
          style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Resident Advisor
        </a>
        <a href="https://xceed.me" target="_blank" rel="noopener"
          style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Xceed
        </a>
      </div>

      <div style={{ width: '100%', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text2)' }}>© 2026 SUBVRS. All rights reserved.</span>
        <span style={{ fontSize: '11px', color: 'var(--text2)' }}>subvrs.it</span>
      </div>
    </footer>
  );
}

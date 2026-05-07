import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(10,9,8,0.85)',
        padding: '0 32px',
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '0.05em' }}>
          SUBVRS
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="nav-links">
          {[['/', 'Home'], ['/events', 'Events'], ['/media', 'Media']].map(([href, label]) => (
            <Link key={href} href={href} style={{
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: router.pathname === href ? 'var(--text)' : 'var(--text2)',
              borderBottom: router.pathname === href ? '1px solid var(--accent)' : '1px solid transparent',
              paddingBottom: '2px',
              transition: 'color 0.2s',
            }}>{label}</Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SocialLinks />
          <button onClick={() => setOpen(!open)} className="hamburger" aria-label="menu"
            style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', padding: '4px', cursor: 'pointer' }}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {open && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          {[['/', 'Home'], ['/events', 'Events'], ['/media', 'Media']].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              fontSize: '20px', fontWeight: 700, letterSpacing: '0.05em',
              color: router.pathname === href ? 'var(--accent)' : 'var(--text)',
            }}>{label}</Link>
          ))}
          <div style={{ marginTop: '8px' }}><SocialLinks /></div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
}

export function SocialLinks() {
  const linkStyle = {
    color: 'var(--text2)', transition: 'color 0.2s', display: 'flex', alignItems: 'center',
  };

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {/* Instagram */}
      <a href="https://instagram.com/subvrs.011" target="_blank" rel="noopener" aria-label="Instagram" style={linkStyle}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
      >
        <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>

      {/* Resident Advisor */}
      <a href="https://ra.co" target="_blank" rel="noopener" aria-label="Resident Advisor" style={{ ...linkStyle, fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
      >RA</a>

      {/* Xceed */}
      <a href="https://xceed.me" target="_blank" rel="noopener" aria-label="Xceed" style={{ ...linkStyle, fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
      >XC</a>
    </div>
  );
}

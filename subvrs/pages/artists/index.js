import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const ARTISTS = [
  {
    slug: 'matt',
    name: 'Matt',
    number: '01',
    label: 'DJ Set',
    origin: 'Veneto → Barcellona → Torino',
    born: '2002',
    genres: ['House', 'Tech House', 'Progressive House', 'Minimal Tech'],
    bio: "Nato e cresciuto nel Veneto, ha cominciato a sperimentare con la musica da ragazzino, quell'età in cui non sai ancora che stai costruendo qualcosa. Qualche anno a Barcellona, dove il clubbing non è uno stile di vita ma una religione, poi Torino. Il suo set si muove tra house e tech house, costruzione lenta, groove che ti tirano dentro senza accorgertene, nessun fronzolo. Non segue trend. Segue la pista.",
    photo: '/images/matt.jpeg',
    instagram: 'matt_gaspa_',
    color: 'var(--accent)',
    events: ['DISCOPO — Capodoglio, Torino — Mag 2026'],
  },
  {
    slug: 'gabriele-goduti',
    name: 'Gabriele Goduti',
    number: '02',
    label: 'DJ Set',
    origin: 'Torino',
    born: '2002',
    genres: ['House', 'Electro', 'Deep Tech', 'Techno', 'Minimal'],
    bio: "Classe 2002. I suoi set hanno un'acidità che non si spiega, si sente. Loop ipnotici, percussioni secche, sequenze che sembrano uscire da un club sotterraneo di Berlino anni Novanta. Suona cose che non trovi nelle playlist, e probabilmente non è un caso. Underground per scelta, non per postura.",
    photo: '/images/gabrielegouti.jpeg',
    instagram: 'gabriele_goduti_',
    color: 'var(--violet)',
    events: ['DISCOPO — Capodoglio, Torino — Mag 2026'],
  },
];

function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, -rect.top / total)));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  return progress;
}

// Smooth opacity: fade in [e0→e1], hold, fade out [x0→x1]
function fade(p, e0, e1, x0, x1) {
  if (p <= e0) return 0;
  if (p <= e1) return (p - e0) / (e1 - e0);
  if (x0 == null) return 1;
  if (p <= x0) return 1;
  if (p <= x1) return 1 - (p - x0) / (x1 - x0);
  return 0;
}

// Smooth translateY: enter from yIn, exit to yOut
function slide(p, e0, e1, x0, x1, yIn = 32, yOut = -32) {
  if (p <= e0) return yIn;
  if (p <= e1) return yIn * (1 - (p - e0) / (e1 - e0));
  if (x0 == null) return 0;
  if (p <= x0) return 0;
  if (p <= x1) return yOut * ((p - x0) / (x1 - x0));
  return yOut;
}

function ArtistSection({ artist }) {
  const sectionRef = useRef(null);
  const p = useScrollProgress(sectionRef);

  // Dark overlay on top of photo: starts transparent, becomes fully opaque by ~70% scroll
  // This makes the photo "get darker and darker until it disappears"
  const overlayOpacity = Math.min(1, p * 1.45);

  // Absolute-fill layer driven by continuous scroll progress
  const layer = (e0, e1, x0, x1, yIn = 32, yOut = -32) => ({
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: fade(p, e0, e1, x0, x1),
    transform: `translateY(${slide(p, e0, e1, x0, x1, yIn, yOut)}px)`,
    transition: 'none',
    willChange: 'opacity, transform',
    pointerEvents: fade(p, e0, e1, x0, x1) > 0.05 ? 'auto' : 'none',
  });

  // Top bar fades in as intro fades out
  const barOpacity = fade(p, 0.22, 0.36);

  // Genre font size scales with count
  const gSize = `clamp(${Math.max(26, 50 - artist.genres.length * 2)}px, ${Math.max(4.5, 9.5 - artist.genres.length)}vw, ${Math.max(52, 108 - artist.genres.length * 10)}px)`;

  return (
    <div ref={sectionRef} style={{ position: 'relative', height: '400vh' }}>
      <div style={{
        position: 'sticky', top: '60px',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        background: '#0a0908',
      }}>

        {/* Photo — always present as background */}
        {artist.photo && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <img
              src={artist.photo} alt={artist.name}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                filter: 'brightness(0.52)',
                display: 'block',
              }}
            />
            {/* Static bottom-to-top vignette for readability */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,9,8,0) 0%, rgba(10,9,8,0.25) 50%, rgba(10,9,8,0.85) 80%, rgba(10,9,8,1) 100%)',
            }} />
            {/* Scroll-driven dark overlay — photo darkens progressively */}
            <div style={{
              position: 'absolute', inset: 0,
              background: '#0a0908',
              opacity: overlayOpacity,
              transition: 'none',
              willChange: 'opacity',
            }} />
          </div>
        )}

        {/* Top bar — slides in as intro fades */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', zIndex: 10,
          background: 'rgba(10,9,8,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          opacity: barOpacity,
          transform: `translateY(${(1 - barOpacity) * -14}px)`,
          transition: 'none',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)' }}>
            {artist.number} — {artist.name.toUpperCase()}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: artist.color }}>
            {artist.label}
          </span>
        </div>

        {/* Content area */}
        <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: '3px' }}>

          {/* INTRO — photo is bright, name fills screen */}
          <div style={{
            ...layer(0, 0.05, 0.20, 0.38, 0, -32),
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: '40px 40px 52px',
          }}>
            <div style={{
              position: 'absolute', top: '28px', right: '40px',
              width: '1px', height: '80px', background: artist.color, opacity: 0.6,
            }} />
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: artist.color, marginBottom: '20px' }}>
              {artist.number} — SUBVRS ARTISTS
            </div>
            <h2 style={{ fontSize: 'clamp(52px, 9.5vw, 118px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: '28px' }}>
              {artist.name}
            </h2>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '13px', color: 'var(--text2)', fontWeight: 500, flexWrap: 'wrap' }}>
              <span>{artist.origin}</span>
              <span style={{ color: 'var(--border2)' }}>·</span>
              <span>Classe {artist.born}</span>
            </div>
            {/* Scroll hint — disappears quickly */}
            <div style={{
              position: 'absolute', bottom: '40px', right: '40px',
              fontSize: '10px', color: 'var(--text2)', letterSpacing: '0.2em',
              textTransform: 'uppercase', writingMode: 'vertical-rl',
              opacity: fade(p, 0, 0.04, 0.10, 0.20),
              transition: 'none',
            }}>Scroll</div>
          </div>

          {/* BIO — split layout, photo now quite dark */}
          <div style={{ ...layer(0.24, 0.38, 0.52, 0.64) }} className="grid-panel">
            <div className="grid-left" style={{
              borderRight: '1px solid var(--border)',
              padding: '48px 40px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '20px' }}>
                {artist.origin}
              </div>
              <h3 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: '24px' }}>
                {artist.name}
              </h3>
              <div style={{ width: '36px', height: '2px', background: artist.color }} />
            </div>
            <div className="grid-right" style={{ padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '32px' }}>
                Bio
              </div>
              <p style={{ fontSize: 'clamp(15px, 1.6vw, 19px)', lineHeight: 1.85, color: 'var(--text)', fontWeight: 400, maxWidth: '520px' }}>
                {artist.bio}
              </p>
            </div>
          </div>

          {/* SOUND — pure black background, genres in big type */}
          <div style={{
            ...layer(0.52, 0.65, 0.78, 0.88),
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '40px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '40px' }}>
              Il suono
            </div>
            <div>
              {artist.genres.map((genre, i) => (
                <div key={genre} style={{
                  fontSize: gSize,
                  fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em',
                  color: i === 0
                    ? 'var(--text)'
                    : `rgba(240,236,228,${Math.max(0.06, 0.30 - i * 0.055)})`,
                  marginBottom: '2px',
                }}>
                  {genre}
                </div>
              ))}
            </div>
            <div style={{
              position: 'absolute', bottom: '32px', right: '40px',
              fontSize: '88px', fontWeight: 900, letterSpacing: '-0.05em',
              color: 'rgba(240,236,228,0.03)', userSelect: 'none', lineHeight: 1,
            }}>
              {artist.number}
            </div>
          </div>

          {/* CONNECT — Instagram + events */}
          <div style={{ ...layer(0.78, 0.90, null, null) }} className="grid-panel">
            <div className="grid-left" style={{
              borderRight: '1px solid var(--border)',
              padding: '48px 40px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '28px' }}>
                Live con SUBVRS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {artist.events.map((ev, i) => (
                  <div key={i} style={{
                    padding: '18px 22px',
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: '4px', fontSize: '13px', fontWeight: 600,
                    color: 'var(--text)', lineHeight: 1.5,
                  }}>
                    {ev}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid-right" style={{ padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '32px' }}>
                Seguilo
              </div>
              {artist.instagram ? (
                <a
                  href={`https://instagram.com/${artist.instagram}`}
                  target="_blank" rel="noopener"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '18px',
                    fontSize: 'clamp(22px, 3.2vw, 40px)', fontWeight: 800,
                    color: 'var(--text)', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = artist.color}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: artist.color, minWidth: '24px' }}>IG</span>
                  @{artist.instagram}
                </a>
              ) : (
                <span style={{ fontSize: '15px', color: 'var(--text2)', fontStyle: 'italic' }}>Profilo in arrivo.</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--border)' }}>
          <div style={{ height: '100%', background: artist.color, width: `${p * 100}%`, transition: 'none' }} />
        </div>
      </div>

      <style jsx>{`
        .grid-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .grid-panel { grid-template-columns: 1fr; overflow-y: auto; }
          .grid-left { border-right: none !important; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}

export default function Artists() {
  return (
    <>
      <Head>
        <title>Artists — SUBVRS</title>
        <meta name="description" content="I DJ di SUBVRS. Scorri per scoprire la loro storia e il loro sound." />
      </Head>

      {/* Page starts directly with artists — no division */}
      {ARTISTS.map(artist => (
        <div key={artist.slug} id={artist.slug}>
          <ArtistSection artist={artist} />
        </div>
      ))}

      <section style={{
        padding: '60px 40px',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '20px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)' }}>
          SUBVRS — {ARTISTS.length} artisti
        </div>
        <Link href="/events" className="btn-outline">Vedi gli eventi →</Link>
      </section>
    </>
  );
}

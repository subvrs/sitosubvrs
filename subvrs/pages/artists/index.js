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
    genres: ['Minimal House', 'Tech House', 'Deep House'],
    bio: "Viene dal Veneto. Ha cominciato a sperimentare con la musica da ragazzino — quell'età in cui non sai ancora che stai costruendo qualcosa. Qualche anno a Barcellona, dove il clubbing non è uno stile di vita ma una religione, poi Torino. Il suo set si muove tra minimal house e tech house: costruzione lenta, groove che ti tirano dentro senza accorgertene, nessun fronzolo. Non segue trend. Segue il dancefloor.",
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
    genres: ['Acid', 'Minimal', 'Underground'],
    bio: "Stesso anno, universo diverso. I suoi set hanno un'acidità che non si spiega — si sente. Loop ipnotici, percussioni secche, sequenze che sembrano uscire da un club sotterraneo di Berlino anni Novanta. Suona cose che non trovi nelle playlist, e probabilmente non è un caso. Underground per scelta, non per postura.",
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

// Interpolate opacity: fade in [e0→e1], hold, fade out [x0→x1]
function fade(p, e0, e1, x0, x1) {
  if (p <= e0) return 0;
  if (p <= e1) return (p - e0) / (e1 - e0);
  if (x0 == null || p <= x0) return 1;
  if (p <= x1) return 1 - (p - x0) / (x1 - x0);
  return 0;
}

// Interpolate translateY: slides in from yIn, slides out to yOut
function slide(p, e0, e1, x0, x1, yIn = 28, yOut = -28) {
  if (p <= e0) return yIn;
  if (p <= e1) return yIn * (1 - (p - e0) / (e1 - e0));
  if (x0 == null || p <= x0) return 0;
  if (p <= x1) return yOut * ((p - x0) / (x1 - x0));
  return yOut;
}

function ArtistSection({ artist }) {
  const sectionRef = useRef(null);
  const p = useScrollProgress(sectionRef);

  // Each layer: fade in, hold, fade out — with overlapping ranges for smooth crossfade
  // Intro:   visible 0 → 0.35
  // Bio:     visible 0.22 → 0.62
  // Sound:   visible 0.50 → 0.88
  // Connect: visible 0.76 → 1

  const layer = (e0, e1, x0, x1, yIn = 28, yOut = -28) => ({
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: fade(p, e0, e1, x0, x1),
    transform: `translateY(${slide(p, e0, e1, x0, x1, yIn, yOut)}px)`,
    transition: 'none',
    willChange: 'opacity, transform',
    pointerEvents: fade(p, e0, e1, x0, x1) > 0.05 ? 'auto' : 'none',
  });

  const barVisible = fade(p, 0.18, 0.3);

  return (
    <div ref={sectionRef} style={{ position: 'relative', height: '400vh' }}>
      <div style={{
        position: 'sticky', top: '60px',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Photo background — fades out as intro ends */}
        {artist.photo && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            opacity: fade(p, 0, 0.04, 0.2, 0.38),
            transition: 'none', willChange: 'opacity',
          }}>
            <img
              src={artist.photo} alt={artist.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(0.45)' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,9,8,0.1) 0%, rgba(10,9,8,0.2) 40%, rgba(10,9,8,0.75) 72%, rgba(10,9,8,1) 100%)',
            }} />
          </div>
        )}

        {/* Top bar — appears as intro fades out */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '60px', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px',
          background: 'rgba(10,9,8,0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
          opacity: barVisible,
          transform: `translateY(${(1 - barVisible) * -10}px)`,
          transition: 'none',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)' }}>
            {artist.number} — {artist.name.toUpperCase()}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: artist.color }}>
            {artist.label}
          </span>
        </div>

        {/* Panels */}
        <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: '3px' }}>

          {/* INTRO */}
          <div style={{ ...layer(0, 0.04, 0.2, 0.35, 0, -28), display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px 40px 52px' }}>
            <div style={{ position: 'absolute', top: '32px', right: '40px', width: '1px', height: '80px', background: artist.color, opacity: 0.5 }} />
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: artist.color, marginBottom: '24px' }}>
              {artist.number} — SUBVRS ARTISTS
            </div>
            <h2 style={{ fontSize: 'clamp(52px, 9.5vw, 118px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: '32px' }}>
              {artist.name}
            </h2>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', color: 'var(--text2)', fontWeight: 500, flexWrap: 'wrap' }}>
              <span>{artist.origin}</span>
              <span style={{ color: 'var(--border2)' }}>·</span>
              <span>Classe {artist.born}</span>
            </div>
            <div style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '10px', color: 'var(--text2)', letterSpacing: '0.2em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
              Scroll
            </div>
          </div>

          {/* BIO */}
          <div style={{ ...layer(0.22, 0.36, 0.50, 0.62) }} className="grid-panel">
            <div className="grid-left" style={{ borderRight: '1px solid var(--border)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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

          {/* SOUND */}
          <div style={{ ...layer(0.50, 0.63, 0.76, 0.88), display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '48px' }}>
              Il suono
            </div>
            <div>
              {artist.genres.map((genre, i) => (
                <div key={genre} style={{
                  fontSize: 'clamp(42px, 8vw, 100px)',
                  fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.025em',
                  color: i === 0 ? 'var(--text)' : i === 1 ? 'rgba(240,236,228,0.3)' : 'rgba(240,236,228,0.08)',
                  marginBottom: '4px',
                }}>
                  {genre}
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '32px', right: '40px', fontSize: '88px', fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(240,236,228,0.03)', userSelect: 'none', lineHeight: 1 }}>
              {artist.number}
            </div>
          </div>

          {/* CONNECT */}
          <div style={{ ...layer(0.76, 0.88, null, null) }} className="grid-panel">
            <div className="grid-left" style={{ borderRight: '1px solid var(--border)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '28px' }}>
                Live con SUBVRS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {artist.events.map((ev, i) => (
                  <div key={i} style={{ padding: '18px 22px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: 'clamp(22px, 3.2vw, 40px)', fontWeight: 800, color: 'var(--text)', transition: 'color 0.2s' }}
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

      <section style={{ padding: '140px 40px 80px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px' }}>
          Chi suona
        </div>
        <h1 style={{ fontSize: 'clamp(52px, 10vw, 120px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.9, marginBottom: '28px' }}>
          ARTISTS
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text2)', maxWidth: '400px', lineHeight: 1.65, marginBottom: '44px' }}>
          Scorri per scoprire i DJ di SUBVRS — la loro storia, il loro sound.
        </p>
        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
          {ARTISTS.map(a => (
            <a key={a.slug} href={`#${a.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text2)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
            >
              <span style={{ color: a.color, fontSize: '10px' }}>{a.number}</span>
              {a.name}
            </a>
          ))}
        </div>
      </section>

      {ARTISTS.map(artist => (
        <div key={artist.slug} id={artist.slug}>
          <ArtistSection artist={artist} />
        </div>
      ))}

      <section style={{ padding: '60px 40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)' }}>
          SUBVRS — {ARTISTS.length} artisti
        </div>
        <Link href="/events" className="btn-outline">Vedi gli eventi →</Link>
      </section>
    </>
  );
}

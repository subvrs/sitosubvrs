import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export async function getServerSideProps() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });
  const nextEvent = (events || []).find(e => e.status === 'upcoming') || (events || [])[0] || null;
  return { props: { nextEvent } };
}

export default function Home({ nextEvent }) {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const hero = heroRef.current;
      if (!hero) return;
      const heroH = hero.offsetHeight;
      if (videoRef.current) {
        const opacity = Math.max(0, 1 - (scrollY / (heroH * 0.6)));
        videoRef.current.style.opacity = opacity;
      }
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${scrollY * 0.35}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Head>
        <title>SUBVRS — House. Disco. Torino.</title>
        <meta name="description" content="SUBVRS è un collettivo di eventi musicali basato a Torino. House, disco, disco house." />
      </Head>

      <section ref={heroRef} style={{
        position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '60px 40px 80px', overflow: 'hidden',
      }}>
        <div ref={videoRef} style={{ position: 'absolute', inset: 0, zIndex: 0, transition: 'opacity 0.05s linear' }}>
          <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }}>
            <source src="/images/hero-video.mp4" type="video/mp4" />
          </video>
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,9,8,0.0) 0%, rgba(10,9,8,0.2) 40%, rgba(10,9,8,0.7) 75%, rgba(10,9,8,1) 100%)' }} />
        <div style={{ position: 'absolute', top: '80px', right: '40px', zIndex: 2, width: '1px', height: '120px', background: 'var(--accent)', opacity: 0.6 }} />

        <div ref={textRef} style={{ position: 'relative', zIndex: 2, willChange: 'transform' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '24px' }}>
            @SUBVRS.011 — Torino, Italy
          </div>
          <h1 style={{ fontSize: 'clamp(60px, 11vw, 160px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em', marginBottom: '32px', whiteSpace: 'nowrap' }}>
            SUBVRS
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text2)', maxWidth: '480px', lineHeight: 1.6, marginBottom: '40px', fontWeight: 400 }}>
            Selezione musicale. Vibrazioni. House, disco e tutto quello che ti fa ballare.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/events" className="btn-primary">Prossimi eventi</Link>
            <Link href="/media" className="btn-outline">Gallery</Link>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '32px', right: '40px', zIndex: 2, fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.15em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>Scroll</div>
      </section>

      {nextEvent && (
        <section style={{ padding: '80px 40px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '24px' }}>
            {nextEvent.status === 'past' ? 'Ultimo evento' : 'Prossimo evento'}
          </div>

          <Link href={`/events/${nextEvent.id}`}>
            <div className="event-banner" style={{
              display: 'grid',
              gridTemplateColumns: nextEvent.flyer ? '3fr 2fr' : '1fr',
              height: '420px',
              border: '1px solid var(--border)', borderRadius: '8px',
              overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ padding: '36px', background: 'var(--bg2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1 }}>{nextEvent.name}</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(nextEvent.genre || []).map(g => <span key={g} className="tag violet">{g}</span>)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
                  {[
                    ['Data', new Date(nextEvent.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })],
                    ['Orario', `${nextEvent.time} — ${nextEvent.end_time}`],
                    ['Venue', nextEvent.venue],
                    ['Ingresso', nextEvent.entry],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--bg2)', padding: '14px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>Vedi tutti i dettagli →</div>
              </div>

              {nextEvent.flyer && (
                <div style={{ overflow: 'hidden', height: '100%' }}>
                  <img src={nextEvent.flyer} alt={nextEvent.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', transition: 'transform 0.4s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                </div>
              )}
            </div>
          </Link>

          <style jsx>{`
            .event-banner {
              grid-template-columns: ${nextEvent.flyer ? '3fr 2fr' : '1fr'};
              height: 420px;
            }
            @media (max-width: 768px) {
              .event-banner {
                grid-template-columns: 1fr !important;
                height: auto !important;
              }
            }
          `}</style>
        </section>
      )}

      <section style={{ padding: '80px 40px', borderTop: '1px solid var(--border)', display: 'flex', gap: '80px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px' }}>Chi siamo</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '24px' }}>
            COME AS<br />YOU ARE.
          </h2>
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text2)', marginBottom: '16px' }}>
            Siamo un gruppo di amici che vengono da mondi diversi e questo, alla fine, è il motivo per cui funziona.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text2)', marginBottom: '16px' }}>
            Backgrounds diversi significano gusti diversi, occhi diversi, modi diversi di stare in un posto. Significa che quando organizziamo una serata, sappiamo come fare sentire a casa chiunque entri.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text2)' }}>
            La nostra selezione musicale è fuori dal comune ma il punto non è fare i difficili. Il punto è farti scoprire qualcosa che non sapevi di amare, in un ambiente dove vieni per stare bene, non per fare scena.
          </p>
        </div>
      </section>
    </>
  );
}

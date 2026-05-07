import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import events from '../data/events.json';

export default function Home() {
  const nextEvent = events.find(e => e.status === 'upcoming') || events[0];
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
          <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35)' }}>
            <source src="/images/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(10,9,8,0.1) 0%, rgba(10,9,8,0.5) 60%, rgba(10,9,8,1) 100%)',
        }} />

        <div style={{ position: 'absolute', top: '80px', right: '40px', zIndex: 2, width: '1px', height: '120px', background: 'var(--accent)', opacity: 0.6 }} />

        <div ref={textRef} style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', willChange: 'transform' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '24px' }}>
            @SUBVRS.011 — Torino, Italy
          </div>

          <h1 style={{
            fontSize: 'clamp(80px, 16vw, 200px)', fontWeight: 900,
            lineHeight: 0.9, letterSpacing: '-0.02em',
            marginBottom: '32px', whiteSpace: 'nowrap',
          }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '8px' }}>
                {nextEvent.status === 'past' ? 'Ultimo evento' : 'Prossimo evento'}
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.02em' }}>{nextEvent.name}</h2>
            </div>
            <Link href={`/events/${nextEvent.id}`} className="btn-outline">Vedi dettagli →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)' }}>
            {[
              ['Data', new Date(nextEvent.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })],
              ['Orario', `${nextEvent.time} — ${nextEvent.endTime}`],
              ['Venue', nextEvent.venue],
              ['Ingresso', nextEvent.entry],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--bg2)', padding: '28px 24px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ padding: '80px 40px', borderTop: '1px solid var(--border)', display: 'flex', gap: '80px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px' }}>Chi siamo</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '24px' }}>
            GOD LISTENS<br />HOUSE MUSIC.
          </h2>
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text2)', marginBottom: '16px' }}>
            SUBVRS è un collettivo di eventi musicali nato a Torino. Creiamo spazi dove la musica è il protagonista assoluto — selezioni curate, location che contano, atmosfera che rimane.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text2)' }}>
            House, disco, disco house e tutto quello che ti fa muovere dalla sera fino all'alba.
          </p>
        </div>
      </section>
    </>
  );
}

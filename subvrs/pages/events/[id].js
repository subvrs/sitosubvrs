import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export async function getServerSideProps({ params }) {
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single();
  if (!event) return { notFound: true };
  return { props: { event } };
}

export default function EventPage({ event }) {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const heroRef = useRef(null);
  const overlayRef = useRef(null);
  const isPast = event.status === 'past';
  const date = new Date(event.date);
  const lineup = event.lineup || [];

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const heroH = heroRef.current.offsetHeight;
      if (overlayRef.current) {
        const opacity = Math.max(0, 1 - (scrollY / (heroH * 0.7)));
        overlayRef.current.style.opacity = opacity;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Head>
        <title>{event.name} — SUBVRS</title>
        <meta name="description" content={event.description} />
      </Head>

      {/* HERO with horizontal flyer + parallax fade */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'flex-end', padding: '40px', overflow: 'hidden' }}>
        <div ref={overlayRef} style={{ position: 'absolute', inset: 0, zIndex: 0, transition: 'opacity 0.05s linear' }}>
          {event.flyer && (
            <img src={event.flyer} alt={event.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(0.55)' }}
            />
          )}
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,9,8,0.1) 0%, rgba(10,9,8,0.6) 60%, rgba(10,9,8,1) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link href="/events" style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '24px' }}>
            ← Tutti gli eventi
          </Link>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {(event.genre || []).map(g => <span key={g} className="tag violet">{g}</span>)}
            {isPast && <span className="tag past">Evento passato</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(48px, 10vw, 100px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.9 }}>
            {event.name}
          </h1>
        </div>
      </section>

      {/* MAIN */}
      <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '60px', maxWidth: '1200px', margin: '0 auto' }} className="event-grid">

        <div>
          {/* Description */}
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '17px', lineHeight: 1.8, color: 'var(--text2)' }}>{event.description}</p>
          </div>

          {/* LINEUP */}
          {lineup.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <SectionTitle>Lineup</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {lineup.map((artist, i) => (
                  <div key={i}
                    onClick={() => setSelectedArtist(artist)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '20px 24px', background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)'; }}
                  >
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{artist.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--violet2)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>{artist.role}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {artist.time && <span style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'monospace' }}>{artist.time}</span>}
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Profilo →</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '10px' }}>Clicca su un artista per vedere il profilo</div>
            </div>
          )}

          {/* INFO GRID */}
          <div style={{ marginBottom: '48px' }}>
            <SectionTitle>Info</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2px' }}>
              {[
                ['Data', date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                ['Orario', `${event.time} — ${event.end_time}`],
                ['Venue', event.venue],
                ['Città', event.city],
                ['Ingresso', event.entry],
                ['Dress code', event.dress_code],
                ['Età', event.age_limit],
                ...(event.happy_hour ? [['Happy Hour', event.happy_hour]] : []),
              ].map(([label, val]) => val ? (
                <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{val}</div>
                </div>
              ) : null)}
            </div>
          </div>

          {/* PHOTOS */}
          {(event.photos || []).length > 0 && (
            <div>
              <SectionTitle>Gallery</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px' }}>
                {event.photos.map((photo, i) => (
                  <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: '4px' }}>
                    <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div>
          <div style={{ position: 'sticky', top: '80px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '28px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
              {date.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1, marginBottom: '4px' }}>
              {date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '24px' }}>{event.time} — {event.end_time}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{event.venue}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '28px' }}>{event.address}</div>

            {isPast ? (
              <div style={{ background: 'rgba(158,152,144,0.1)', border: '1px solid rgba(158,152,144,0.2)', borderRadius: '4px', padding: '14px', textAlign: 'center', fontSize: '13px', color: 'var(--text2)', fontWeight: 600 }}>
                Evento concluso
              </div>
            ) : (
              <a href={event.ticket_link} target="_blank" rel="noopener" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                Ottieni biglietti
              </a>
            )}

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>Stile musicale</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(event.genre || []).map(g => <span key={g} className="tag violet">{g}</span>)}
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { if (navigator.share) navigator.share({ title: event.name, url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); alert('Link copiato!'); } }}
                className="btn-outline" style={{ width: '100%', textAlign: 'center', fontSize: '12px' }}>
                Condividi evento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ARTIST POPUP */}
      {selectedArtist && (
        <div onClick={() => setSelectedArtist(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
          backdropFilter: 'blur(8px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: '12px', padding: '40px', maxWidth: '480px', width: '100%',
            position: 'relative',
          }}>
            <button onClick={() => setSelectedArtist(null)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer',
            }}>✕</button>

            {selectedArtist.photo && (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', marginBottom: '20px', border: '2px solid var(--border2)' }}>
                <img src={selectedArtist.photo} alt={selectedArtist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {!selectedArtist.photo && (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg3)', border: '2px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}>
                {selectedArtist.name.charAt(0)}
              </div>
            )}

            <div style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px' }}>{selectedArtist.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--violet2)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>{selectedArtist.role}</div>

            {selectedArtist.bio ? (
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text2)' }}>{selectedArtist.bio}</p>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text2)', fontStyle: 'italic' }}>Nessuna bio disponibile per questo artista.</p>
            )}

            {selectedArtist.time && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text2)' }}>
                Set time: <strong style={{ color: 'var(--text)' }}>{selectedArtist.time}</strong>
              </div>
            )}

            {selectedArtist.instagram && (
              <a href={`https://instagram.com/${selectedArtist.instagram}`} target="_blank" rel="noopener"
                style={{ display: 'inline-block', marginTop: '16px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                @{selectedArtist.instagram} →
              </a>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .event-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {children}
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

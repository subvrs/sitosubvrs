import Head from 'next/head';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export async function getServerSideProps() {
  const { data: events } = await supabase
    .from('events')
    .select('id, name, date, photos')
    .order('date', { ascending: false });
  return { props: { events: events || [] } };
}

export default function Media({ events }) {
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const eventsWithPhotos = events.filter(e => e.photos && e.photos.length > 0);
  const allPhotos = eventsWithPhotos.flatMap(e =>
    e.photos.map(p => ({ src: p, event: e.name, eventId: e.id, date: e.date }))
  );

  const filteredPhotos = selected
    ? allPhotos.filter(p => p.eventId === selected)
    : allPhotos;

  return (
    <>
      <Head><title>Media — SUBVRS</title></Head>

      <div style={{ padding: '60px 40px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>Foto & Video</div>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '40px' }}>MEDIA</h1>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '48px' }}>
          <button onClick={() => setSelected(null)} style={{ background: selected === null ? 'var(--accent)' : 'transparent', border: `1px solid ${selected === null ? 'var(--accent)' : 'var(--border2)'}`, color: selected === null ? '#fff' : 'var(--text2)', padding: '8px 18px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>Tutti</button>
          {eventsWithPhotos.map(e => (
            <button key={e.id} onClick={() => setSelected(e.id)} style={{ background: selected === e.id ? 'var(--accent)' : 'transparent', border: `1px solid ${selected === e.id ? 'var(--accent)' : 'var(--border2)'}`, color: selected === e.id ? '#fff' : 'var(--text2)', padding: '8px 18px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>{e.name}</button>
          ))}
        </div>
      </div>

      {filteredPhotos.length > 0 ? (
        <div style={{ padding: '0 40px 80px' }}>
          <div style={{ columns: '3 250px', gap: '4px' }}>
            {filteredPhotos.map((photo, i) => (
              <div key={i} onClick={() => setLightbox(photo)} style={{ breakInside: 'avoid', marginBottom: '4px', cursor: 'pointer', overflow: 'hidden', borderRadius: '2px' }}>
                <img src={photo.src} alt={photo.event} style={{ width: '100%', display: 'block', transition: 'transform 0.3s, filter 0.3s' }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.filter = 'brightness(0.8)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.filter = 'brightness(1)'; }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Nessuna foto ancora</div>
          <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Le foto dei nostri eventi appariranno qui dopo ogni serata.</div>
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', cursor: 'zoom-out' }}>
          <img src={lightbox.src} alt={lightbox.event} style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{lightbox.event}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{new Date(lightbox.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </>
  );
}

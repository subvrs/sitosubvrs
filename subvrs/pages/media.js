import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const getThumbUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_800,q_75,f_auto/');
};

const getFullUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_90,f_auto/');
};

export async function getServerSideProps() {
  const { data: events } = await supabase
    .from('events')
    .select('id, name, date, photos, featured_photos, photos_public')
    .order('date', { ascending: false });
  const visible = (events || []).filter(e => e.photos_public !== false);
  return { props: { events: visible } };
}

export default function Media({ events }) {
  const [lightbox, setLightbox] = useState(null); // { src, event, eventId, date, list, index }
  const [verified, setVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadTarget, setDownloadTarget] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('subvrs_email');
    const expiry = localStorage.getItem('subvrs_expiry');
    if (saved && expiry && new Date(expiry) > new Date()) {
      setVerified(true);
      setUserEmail(saved);
    }
  }, []);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') navLightbox(1);
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const navLightbox = (dir) => {
    setLightbox(lb => {
      if (!lb) return null;
      const next = lb.index + dir;
      if (next < 0 || next >= lb.list.length) return lb;
      return { ...lb.list[next], list: lb.list, index: next };
    });
  };

  const openLightbox = (photo, list, index) => setLightbox({ ...photo, list, index });

  const formatEventDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

  const handleDownloadClick = (photo) => {
    if (verified) {
      triggerDownload(photo.src);
    } else {
      setDownloadTarget(photo);
      setShowAuth(true);
      setStep('email');
      setError(null);
      setEmail('');
      setOtp('');
    }
  };

  const triggerDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subvrs-photo.jpg';
    link.target = '_blank';
    link.click();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, photo_url: downloadTarget?.src || '', event_id: downloadTarget?.eventId || '' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) setStep('otp');
    else setError(data.error || 'Errore invio email.');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, photo_url: downloadTarget?.src || '' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('subvrs_email', email);
      localStorage.setItem('subvrs_expiry', expiry);
      setVerified(true);
      setUserEmail(email);
      setShowAuth(false);
      if (downloadTarget) triggerDownload(downloadTarget.src);
    } else {
      setError(data.error || 'Codice non valido.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('subvrs_email');
    localStorage.removeItem('subvrs_expiry');
    setVerified(false);
    setUserEmail('');
  };

  const bestPhotos = events.flatMap(e =>
    (e.featured_photos || []).map(p => ({ src: p, event: e.name, eventId: e.id, date: e.date }))
  );

  const eventsWithPhotos = events.filter(e => e.photos && e.photos.length > 0);

  return (
    <>
      <Head><title>Media — SUBVRS</title></Head>

      {/* Header */}
      <div style={{ padding: '60px 40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)' }}>Foto & Video</div>
          {verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>✓ Sessione attiva — puoi scaricare tutte le foto</span>
              <button onClick={handleLogout} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Poppins' }}>Esci</button>
            </div>
          )}
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '64px' }}>MEDIA</h1>
      </div>

      {/* BEST OF */}
      <section style={{ padding: '0 40px 80px' }}>
        <SectionHeader label="Selezione" title="Best of" count={bestPhotos.length} />
        {bestPhotos.length > 0 ? (
          <Gallery photos={bestPhotos} onOpen={openLightbox} onDownload={handleDownloadClick} />
        ) : (
          <EmptyState text="Stiamo scegliendo le foto migliori — torna presto." />
        )}
      </section>

      {/* SEZIONE PER OGNI EVENTO */}
      {events.map(ev => {
        const photos = (ev.photos || []).map(p => ({ src: p, event: ev.name, eventId: ev.id, date: ev.date }));
        return (
          <section key={ev.id} style={{ padding: '0 40px 80px' }}>
            <SectionHeader label={formatEventDate(ev.date)} title={ev.name} count={photos.length} />
            {photos.length > 0 ? (
              <Gallery photos={photos} onOpen={openLightbox} onDownload={handleDownloadClick} />
            ) : (
              <EmptyState text="Le foto di questo evento appariranno qui." />
            )}
          </section>
        );
      })}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', cursor: 'zoom-out' }}
        >
          <img
            src={getFullUrl(lightbox.src)}
            alt={lightbox.event}
            style={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />

          {lightbox.index > 0 && (
            <button onClick={e => { e.stopPropagation(); navLightbox(-1); }}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', fontSize: '22px', cursor: 'pointer' }}>‹</button>
          )}
          {lightbox.index < lightbox.list.length - 1 && (
            <button onClick={e => { e.stopPropagation(); navLightbox(1); }}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', fontSize: '22px', cursor: 'pointer' }}>›</button>
          )}

          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{lightbox.event}</span>
            <button onClick={() => handleDownloadClick(lightbox)} className="btn-primary" style={{ fontSize: '12px', padding: '8px 20px' }}>Scarica foto</button>
          </div>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Auth popup */}
      {showAuth && (
        <div onClick={() => setShowAuth(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backdropFilter: 'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '40px', maxWidth: '420px', width: '100%', position: 'relative' }}>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>

            {step === 'email' && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Accesso download</div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Inserisci la tua email</h3>
                <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '28px', lineHeight: 1.6 }}>Inserisci la tua email — ti mandiamo un codice. Verificata una volta, puoi scaricare tutte le foto che vuoi per le prossime 24 ore senza dover fare nulla.</p>
                <form onSubmit={handleSendOtp}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="la.tua@email.com" style={{ marginBottom: '12px' }} required />
                  {error && <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '12px' }}>{error}</div>}
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Invio...' : 'Invia codice'}
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Verifica email</div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Controlla la mail</h3>
                <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '28px', lineHeight: 1.6 }}>Codice inviato a <strong style={{ color: 'var(--text)' }}>{email}</strong>. Valido per 10 minuti.</p>
                <form onSubmit={handleVerifyOtp}>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
                    style={{ marginBottom: '12px', fontSize: '28px', fontWeight: 900, letterSpacing: '0.3em', textAlign: 'center' }} required />
                  {error && <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '12px' }}>{error}</div>}
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Verifica...' : 'Conferma e scarica'}
                  </button>
                </form>
                <button onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer', marginTop: '12px', display: 'block', width: '100%', textAlign: 'center' }}>
                  Cambia email
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SectionHeader({ label, title, count }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{title}</h2>
        {count > 0 && <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500 }}>{count} foto</span>}
      </div>
    </div>
  );
}

function Gallery({ photos, onOpen, onDownload }) {
  return (
    <div style={{ columns: '3 250px', gap: '4px' }}>
      {photos.map((photo, i) => (
        <div
          key={i}
          style={{ breakInside: 'avoid', marginBottom: '4px', position: 'relative', overflow: 'hidden', borderRadius: '2px' }}
          onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity = '0'}
        >
          <img
            src={photo.src.replace('/upload/', '/upload/w_800,q_75,f_auto/')}
            alt={photo.event}
            onClick={() => onOpen(photo, photos, i)}
            loading="lazy"
            style={{ width: '100%', display: 'block', cursor: 'zoom-in' }}
          />
          <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', gap: '12px' }}>
            <button onClick={() => onOpen(photo, photos, i)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Vedi</button>
            <button onClick={() => onDownload(photo)} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Scarica</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '8px' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📸</div>
      <div style={{ fontSize: '14px', color: 'var(--text2)' }}>{text}</div>
    </div>
  );
}

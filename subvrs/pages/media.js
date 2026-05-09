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
  const [downloadPhoto, setDownloadPhoto] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // email | otp | done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const eventsWithPhotos = events.filter(e => e.photos && e.photos.length > 0);
  const allPhotos = eventsWithPhotos.flatMap(e =>
    e.photos.map(p => ({ src: p, event: e.name, eventId: e.id, date: e.date }))
  );
  const filteredPhotos = selected ? allPhotos.filter(p => p.eventId === selected) : allPhotos;

  const openDownload = (photo) => {
    setDownloadPhoto(photo);
    setEmail('');
    setOtp('');
    setStep('email');
    setError(null);
    setLightbox(null);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, photo_url: downloadPhoto.src, event_id: downloadPhoto.eventId }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) setStep('otp');
    else setError(data.error || 'Errore invio email.');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError(null);
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, photo_url: downloadPhoto.src }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setStep('done');
      // Trigger download
      const link = document.createElement('a');
      link.href = data.photo_url;
      link.download = 'subvrs-photo.jpg';
      link.target = '_blank';
      link.click();
    } else {
      setError(data.error || 'Codice non valido.');
    }
  };

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
              <div key={i} style={{ breakInside: 'avoid', marginBottom: '4px', position: 'relative', overflow: 'hidden', borderRadius: '2px' }}
                onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity = '0'}
              >
                <img src={photo.src} alt={photo.event} onClick={() => setLightbox(photo)}
                  style={{ width: '100%', display: 'block', cursor: 'zoom-in' }}
                />
                <div className="overlay" style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s', gap: '12px',
                }}>
                  <button onClick={() => setLightbox(photo)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    Vedi
                  </button>
                  <button onClick={() => openDownload(photo)} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    Scarica
                  </button>
                </div>
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

      {/* LIGHTBOX */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', cursor: 'zoom-out' }}>
          <img src={lightbox.src} alt={lightbox.event} style={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{lightbox.event}</span>
            <button onClick={(e) => { e.stopPropagation(); openDownload(lightbox); }} className="btn-primary" style={{ fontSize: '12px', padding: '8px 20px' }}>
              Scarica foto
            </button>
          </div>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* DOWNLOAD POPUP */}
      {downloadPhoto && (
        <div onClick={() => setDownloadPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backdropFilter: 'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '40px', maxWidth: '420px', width: '100%', position: 'relative' }}>
            <button onClick={() => setDownloadPhoto(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>

            {step === 'email' && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Download foto</div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Inserisci la tua email</h3>
                <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '28px', lineHeight: 1.6 }}>Ti mandiamo un codice per verificare la tua identità. Niente spam, promesso.</p>
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
                <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '28px', lineHeight: 1.6 }}>Abbiamo inviato un codice a <strong style={{ color: 'var(--text)' }}>{email}</strong>. Inseriscilo qui sotto.</p>
                <form onSubmit={handleVerifyOtp}>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
                    style={{ marginBottom: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '0.3em', textAlign: 'center' }} required />
                  {error && <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '12px' }}>{error}</div>}
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Verifica...' : 'Scarica foto'}
                  </button>
                </form>
                <button onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer', marginTop: '12px', display: 'block', width: '100%', textAlign: 'center' }}>
                  Cambia email
                </button>
              </>
            )}

            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Download avviato!</h3>
                <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>Se il download non parte automaticamente, clicca qui sotto.</p>
                <a href={downloadPhoto.src} download target="_blank" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
                  Scarica di nuovo
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

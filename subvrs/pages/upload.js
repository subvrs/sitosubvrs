import Head from 'next/head';
import { useState } from 'react';
import events from '../data/events.json';

const UPLOAD_PASSWORD = 'subvrs2026';

export default function Upload() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id || '');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState([]);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === UPLOAD_PASSWORD) { setAuth(true); setPwError(false); }
    else { setPwError(true); }
  };

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    setFiles(arr);
    const urls = arr.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const handleUpload = async () => {
    if (!files.length || !selectedEvent) return;
    setUploading(true);

    const uploadedUrls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'subvrs_events');
      formData.append('folder', `subvrs/${selectedEvent}`);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/dvjxx6syx/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setUploaded(uploadedUrls);
    setUploading(false);
    setDone(true);
  };

  if (!auth) {
    return (
      <>
        <Head><title>Upload Staff — SUBVRS</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>
              Area riservata
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '32px' }}>Staff Upload</h1>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Password staff"
                  style={{ borderColor: pwError ? 'var(--accent)' : undefined }}
                />
                {pwError && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px' }}>Password errata.</div>}
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Accedi</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Upload Foto — SUBVRS Staff</title></Head>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
          Staff area
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '8px' }}>Upload foto</h1>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '48px' }}>
          Carica le foto dell'evento. Appariranno automaticamente nella gallery pubblica.
        </p>

        {done ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Upload completato!</div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '32px' }}>
              {uploaded.length} foto caricate con successo.
            </div>
            <button onClick={() => { setFiles([]); setPreviews([]); setDone(false); setUploaded([]); }} className="btn-outline">
              Carica altre foto
            </button>
          </div>
        ) : (
          <>
            {/* Select event */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '10px' }}>
                Seleziona evento
              </label>
              <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name} — {new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</option>
                ))}
              </select>
            </div>

            {/* Drag & drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById('file-input').click()}
              style={{
                border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border2)'}`,
                borderRadius: '8px', padding: '60px 40px', textAlign: 'center',
                cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                background: drag ? 'rgba(232,71,26,0.04)' : 'var(--bg2)',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📷</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Trascina le foto qui</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>oppure clicca per selezionare</div>
              <input id="file-input" type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)} />
            </div>

            {/* Preview */}
            {previews.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>
                  {previews.length} foto selezionate
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '4px' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
                style={{ width: '100%', opacity: uploading ? 0.7 : 1, position: 'relative' }}
              >
                {uploading ? `Caricamento in corso...` : `Carica ${files.length} foto`}
              </button>
            )}

            {uploading && (
              <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text2)', textAlign: 'center' }}>
                Attendi, non chiudere la pagina...
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        <div style={{ marginTop: '48px', padding: '24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>Note</div>
          <ul style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8, paddingLeft: '16px' }}>
            <li>Formati supportati: JPG, PNG, WEBP</li>
            <li>Seleziona l'evento corretto prima di caricare</li>
            <li>Le foto appaiono in galleria entro pochi secondi</li>
            <li>Per rimuovere foto contatta il team</li>
          </ul>
        </div>
      </div>
    </>
  );
}

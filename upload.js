import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UPLOAD_PASSWORD = 'subvrs2026';
const CLOUD_NAME = 'dvjxx6syx';
const UPLOAD_PRESET = 'subvrs_events';

export default function Upload() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (auth) loadEvents();
  }, [auth]);

  const loadEvents = async () => {
    const { data } = await supabase.from('events').select('id, name, date').order('date', { ascending: false });
    setEvents(data || []);
    if (data && data.length > 0) setSelectedEvent(data[0].id);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === UPLOAD_PASSWORD) { setAuth(true); setPwError(false); }
    else setPwError(true);
  };

  const handleFiles = (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (!files.length || !selectedEvent) return;
    setUploading(true);
    setProgress(0);

    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `subvrs/${selectedEvent}`);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url);
      } catch (err) {
        console.error('Upload error:', err);
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    // Get existing photos for this event
    const { data: eventData } = await supabase
      .from('events')
      .select('photos')
      .eq('id', selectedEvent)
      .single();

    const existingPhotos = eventData?.photos || [];
    const allPhotos = [...existingPhotos, ...uploadedUrls];

    // Save all photos back to Supabase
    await supabase
      .from('events')
      .update({ photos: allPhotos })
      .eq('id', selectedEvent);

    setUploadedCount(uploadedUrls.length);
    setUploading(false);
    setDone(true);
  };

  if (!auth) {
    return (
      <>
        <Head><title>Upload Staff — SUBVRS</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>Area riservata</div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '32px' }}>Staff Upload</h1>
            <form onSubmit={handleLogin}>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password staff"
                style={{ marginBottom: '12px', borderColor: pwError ? 'var(--accent)' : undefined }} />
              {pwError && <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '12px' }}>Password errata.</div>}
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
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Staff area</div>
        <h1 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '8px' }}>Upload foto</h1>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '48px' }}>
          Le foto appaiono automaticamente nella gallery pubblica dopo il caricamento.
        </p>

        {done ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Upload completato!</div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '32px' }}>
              {uploadedCount} foto caricate e pubblicate nella gallery.
            </div>
            <button onClick={() => { setFiles([]); setPreviews([]); setDone(false); setUploadedCount(0); }} className="btn-outline">
              Carica altre foto
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '10px' }}>
                Seleziona evento
              </label>
              <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById('file-input').click()}
              style={{
                border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border2)'}`,
                borderRadius: '8px', padding: '60px 40px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
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

            {uploading && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                  <span>Caricamento in corso...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {files.length > 0 && (
              <button className="btn-primary" onClick={handleUpload} disabled={uploading}
                style={{ width: '100%', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? `Caricamento... ${progress}%` : `Carica ${files.length} foto`}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

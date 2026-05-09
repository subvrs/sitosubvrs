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
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (auth) loadEvents(); }, [auth]);

  useEffect(() => {
    if (selectedEvent) loadPhotos(selectedEvent);
  }, [selectedEvent]);

  const loadEvents = async () => {
    const { data } = await supabase.from('events').select('id, name, date').order('date', { ascending: false });
    setEvents(data || []);
    if (data && data.length > 0) setSelectedEvent(data[0].id);
  };

  const loadPhotos = async (eventId) => {
    const { data } = await supabase.from('events').select('photos').eq('id', eventId).single();
    setExistingPhotos(data?.photos || []);
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
    setMsg(null);

    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `subvrs/${selectedEvent}`);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url);
      } catch (err) { console.error(err); }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    const allPhotos = [...existingPhotos, ...uploadedUrls];
    await supabase.from('events').update({ photos: allPhotos }).eq('id', selectedEvent);
    setExistingPhotos(allPhotos);
    setFiles([]);
    setPreviews([]);
    setUploading(false);
    setMsg({ type: 'success', text: `${uploadedUrls.length} foto caricate con successo!` });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = async (photoUrl) => {
    if (!confirm('Eliminare questa foto?')) return;
    const newPhotos = existingPhotos.filter(p => p !== photoUrl);
    await supabase.from('events').update({ photos: newPhotos }).eq('id', selectedEvent);
    setExistingPhotos(newPhotos);
    setMsg({ type: 'success', text: 'Foto eliminata.' });
    setTimeout(() => setMsg(null), 2000);
  };

  const handleDeleteAll = async () => {
    if (!confirm('Eliminare TUTTE le foto di questo evento?')) return;
    await supabase.from('events').update({ photos: [] }).eq('id', selectedEvent);
    setExistingPhotos([]);
    setMsg({ type: 'success', text: 'Tutte le foto eliminate.' });
    setTimeout(() => setMsg(null), 2000);
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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>Staff area</div>
        <h1 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '40px' }}>Gestione foto</h1>

        {/* Event selector */}
        <div style={{ marginBottom: '40px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '10px' }}>Evento</label>
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.name} — {new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            padding: '12px 20px', borderRadius: '6px', marginBottom: '24px', fontSize: '14px', fontWeight: 600,
            background: msg.type === 'success' ? 'rgba(0,200,100,0.1)' : 'rgba(232,71,26,0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(0,200,100,0.3)' : 'rgba(232,71,26,0.3)'}`,
            color: msg.type === 'success' ? '#00c864' : 'var(--accent)',
          }}>{msg.text}</div>
        )}

        {/* Existing photos */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)' }}>
              Foto caricate ({existingPhotos.length})
            </div>
            {existingPhotos.length > 0 && (
              <button onClick={handleDeleteAll} style={{
                background: 'none', border: '1px solid rgba(232,71,26,0.3)', color: 'var(--accent)',
                padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}>Elimina tutte</button>
            )}
          </div>

          {existingPhotos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', fontSize: '14px' }}>
              Nessuna foto per questo evento
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {existingPhotos.map((photo, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => handleDelete(photo)} style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff',
                    width: '28px', height: '28px', borderRadius: '50%', fontSize: '14px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload new photos */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px' }}>
            Aggiungi foto
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => document.getElementById('file-input').click()}
            style={{
              border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: '8px', padding: '48px 40px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: drag ? 'rgba(232,71,26,0.04)' : 'var(--bg2)',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📷</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Trascina le foto qui</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>oppure clicca per selezionare</div>
            <input id="file-input" type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)} />
          </div>

          {previews.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>{previews.length} foto selezionate</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '4px' }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                <span>Caricamento...</span><span>{progress}%</span>
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
        </div>
      </div>
    </>
  );
}

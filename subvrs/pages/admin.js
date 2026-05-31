import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'subvrsadmin2026';
const CLOUD_NAME = 'dvjxx6syx';
const UPLOAD_PRESET = 'subvrs_events';
const GENRE_OPTIONS = ['House', 'Disco', 'Disco House', 'Techno House', 'Afro House', 'Deep House', 'Tech House', 'Funk'];
const EMPTY_ARTIST = { name: '', role: 'DJ Set', time: '', bio: '', instagram: '', photo: '' };

const EMPTY_EVENT = {
  id: '', name: '', date: '', time: '22:00', end_time: 'till late',
  venue: '', city: 'Torino', address: '', genre: [],
  description: '', happy_hour: '', entry: 'Ingresso libero con accredito obbligatorio',
  dress_code: 'Smart casual', age_limit: '18+', ticket_link: '', status: 'upcoming', flyer: '',
  lineup: [{ ...EMPTY_ARTIST }],
  featured_photos: [],
  photos_public: true,
};

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('list'); // list | create | edit
  const [form, setForm] = useState({ ...EMPTY_EVENT });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [photoLightbox, setPhotoLightbox] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDrag, setUploadDrag] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    if (auth) loadEvents();
  }, [auth]);

  const loadEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
    setEvents(data || []);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) setAuth(true);
    else setPwError(true);
  };

  const updateField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleGenre = (g) => setForm(f => ({
    ...f, genre: f.genre.includes(g) ? f.genre.filter(x => x !== g) : [...f.genre, g],
  }));

  const updateLineup = (i, key, val) => setForm(f => {
    const l = [...f.lineup]; l[i] = { ...l[i], [key]: val }; return { ...f, lineup: l };
  });

  const addArtist = () => setForm(f => ({ ...f, lineup: [...f.lineup, { ...EMPTY_ARTIST }] }));
  const removeArtist = (i) => setForm(f => ({ ...f, lineup: f.lineup.filter((_, idx) => idx !== i) }));

  const toggleFeatured = (photoUrl) => setForm(f => {
    const featured = f.featured_photos || [];
    return {
      ...f,
      featured_photos: featured.includes(photoUrl)
        ? featured.filter(u => u !== photoUrl)
        : [...featured, photoUrl],
    };
  });

  const handleUploadFiles = (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    setUploadFiles(arr);
    setUploadPreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (!uploadFiles.length || !form.id) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadMsg(null);
    const uploaded = [];
    for (let i = 0; i < uploadFiles.length; i++) {
      const fd = new FormData();
      fd.append('file', uploadFiles[i]);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', `subvrs/${form.id}`);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.secure_url) uploaded.push(data.secure_url);
      } catch (err) { console.error(err); }
      setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
    }
    const newPhotos = [...(form.photos || []), ...uploaded];
    await supabase.from('events').update({ photos: newPhotos }).eq('id', form.id);
    setForm(f => ({ ...f, photos: newPhotos }));
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploading(false);
    setUploadMsg({ type: 'success', text: `${uploaded.length} foto caricate!` });
    setTimeout(() => setUploadMsg(null), 3000);
  };

  const handleDeletePhoto = async (photoUrl) => {
    if (!confirm('Eliminare questa foto?')) return;
    await fetch('/api/delete-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: photoUrl, event_id: form.id }),
    });
    setForm(f => ({
      ...f,
      photos: (f.photos || []).filter(p => p !== photoUrl),
      featured_photos: (f.featured_photos || []).filter(p => p !== photoUrl),
    }));
    if (photoLightbox !== null) setPhotoLightbox(null);
  };

  const generateId = (name, date) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `${slug}-${date.slice(0, 7)}`;
  };

  const handleSave = async () => {
    if (!form.name || !form.date) { setMsg({ type: 'error', text: 'Nome e data obbligatori' }); return; }
    setSaving(true);
    setMsg(null);

    const payload = {
      ...form,
      id: form.id || generateId(form.name, form.date),
      lineup: form.lineup.filter(a => a.name),
      photos: form.photos || [],
    };

    const { error } = view === 'create'
      ? await supabase.from('events').insert([payload])
      : await supabase.from('events').update(payload).eq('id', payload.id);

    setSaving(false);
    if (error) {
      setMsg({ type: 'error', text: `Errore: ${error.message}` });
    } else {
      setMsg({ type: 'success', text: view === 'create' ? 'Evento creato!' : 'Evento aggiornato!' });
      await loadEvents();
      setTimeout(() => { setView('list'); setMsg(null); }, 1500);
    }
  };

  const handleEdit = (event) => {
    setForm({
      ...event,
      lineup: event.lineup || [{ ...EMPTY_ARTIST }],
      featured_photos: event.featured_photos || [],
      photos_public: event.photos_public !== false,
    });
    setPhotoLightbox(null);
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploadMsg(null);
    setView('edit');
    setMsg(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;
    setDeleting(id);
    await supabase.from('events').delete().eq('id', id);
    await loadEvents();
    setDeleting(null);
  };

  const handleNew = () => {
    setForm({ ...EMPTY_EVENT, lineup: [{ ...EMPTY_ARTIST }] });
    setPhotoLightbox(null);
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploadMsg(null);
    setView('create');
    setMsg(null);
  };

  if (!auth) {
    return (
      <>
        <Head><title>Admin — SUBVRS</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '32px' }}>Admin</h1>
            <form onSubmit={handleLogin}>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password admin"
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
      <Head><title>Admin — SUBVRS</title></Head>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Area admin</div>
            <h1 style={{ fontSize: '36px', fontWeight: 900 }}>
              {view === 'list' ? 'Gestione eventi' : view === 'create' ? 'Nuovo evento' : 'Modifica evento'}
            </h1>
          </div>
          {view === 'list' ? (
            <button onClick={handleNew} className="btn-primary">+ Nuovo evento</button>
          ) : (
            <button onClick={() => setView('list')} className="btn-outline">← Torna alla lista</button>
          )}
        </div>

        {/* MESSAGE */}
        {msg && (
          <div style={{
            padding: '14px 20px', borderRadius: '6px', marginBottom: '24px', fontSize: '14px', fontWeight: 600,
            background: msg.type === 'success' ? 'rgba(0,200,100,0.1)' : 'rgba(232,71,26,0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(0,200,100,0.3)' : 'rgba(232,71,26,0.3)'}`,
            color: msg.type === 'success' ? '#00c864' : 'var(--accent)',
          }}>{msg.text}</div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {events.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                Nessun evento. Creane uno!
              </div>
            )}
            {events.map(ev => (
              <div key={ev.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '4px', gap: '16px', flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>{ev.name}</span>
                    <span className={`tag ${ev.status === 'past' ? 'past' : ''}`}>{ev.status === 'past' ? 'Passato' : 'Upcoming'}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} — {ev.venue}</span>
                    {ev.photos && ev.photos.length > 0 && ev.photos_public === false && (
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '3px', padding: '2px 6px' }}>🔒 Foto private</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(ev)} className="btn-outline" style={{ fontSize: '12px', padding: '8px 16px' }}>Modifica</button>
                  <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id}
                    style={{ fontSize: '12px', padding: '8px 16px', background: 'none', border: '1px solid rgba(232,71,26,0.3)', color: 'var(--accent)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600 }}>
                    {deleting === ev.id ? '...' : 'Elimina'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORM VIEW (create or edit) */}
        {(view === 'create' || view === 'edit') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <Field label="Nome evento">
              <input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="es. DISCOPO" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Data"><input type="date" value={form.date} onChange={e => updateField('date', e.target.value)} /></Field>
              <Field label="Orario inizio"><input type="time" value={form.time} onChange={e => updateField('time', e.target.value)} /></Field>
            </div>

            <Field label="Orario fine">
              <input value={form.end_time} onChange={e => updateField('end_time', e.target.value)} placeholder="es. till late" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Venue"><input value={form.venue} onChange={e => updateField('venue', e.target.value)} /></Field>
              <Field label="Città"><input value={form.city} onChange={e => updateField('city', e.target.value)} /></Field>
            </div>

            <Field label="Indirizzo completo">
              <input value={form.address} onChange={e => updateField('address', e.target.value)} />
            </Field>

            <Field label="Stile musicale">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {GENRE_OPTIONS.map(g => (
                  <button key={g} type="button" onClick={() => toggleGenre(g)} style={{
                    padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                    border: form.genre.includes(g) ? '1px solid var(--violet)' : '1px solid var(--border2)',
                    background: form.genre.includes(g) ? 'rgba(123,108,255,0.15)' : 'transparent',
                    color: form.genre.includes(g) ? 'var(--violet2)' : 'var(--text2)', transition: 'all 0.15s',
                  }}>{g}</button>
                ))}
              </div>
            </Field>

            <Field label="Descrizione">
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={4} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Ingresso"><input value={form.entry} onChange={e => updateField('entry', e.target.value)} /></Field>
              <Field label="Dress code"><input value={form.dress_code} onChange={e => updateField('dress_code', e.target.value)} /></Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Età minima"><input value={form.age_limit} onChange={e => updateField('age_limit', e.target.value)} /></Field>
              <Field label="Happy Hour (opzionale)"><input value={form.happy_hour || ''} onChange={e => updateField('happy_hour', e.target.value)} placeholder="es. fino alle 22:00" /></Field>
            </div>

            <Field label="Link ticket">
              <input value={form.ticket_link} onChange={e => updateField('ticket_link', e.target.value)} placeholder="https://dice.fm/..." />
            </Field>

            <Field label="URL flyer (immagine)">
              <input value={form.flyer} onChange={e => updateField('flyer', e.target.value)} placeholder="/images/nome-flyer.jpg oppure URL esterno" />
            </Field>

            <Field label="Stato evento">
              <select value={form.status} onChange={e => updateField('status', e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="past">Passato</option>
              </select>
            </Field>

            {/* LINEUP */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                Lineup <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '14px' }}>
                {form.lineup.map((artist, i) => (
                  <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 36px', gap: '8px', marginBottom: '12px' }}>
                      <input value={artist.name} onChange={e => updateLineup(i, 'name', e.target.value)} placeholder="Nome artista" />
                      <select value={artist.role} onChange={e => updateLineup(i, 'role', e.target.value)}>
                        <option value="DJ Set">DJ Set</option>
                        <option value="B2B DJ Set">B2B DJ Set</option>
                        <option value="Live">Live</option>
                        <option value="Opening">Opening</option>
                      </select>
                      <input type="time" value={artist.time} onChange={e => updateLineup(i, 'time', e.target.value)} />
                      <button type="button" onClick={() => removeArtist(i)}
                        style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: '4px', height: '40px', fontSize: '16px', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <input value={artist.instagram || ''} onChange={e => updateLineup(i, 'instagram', e.target.value)} placeholder="Instagram handle (senza @)" />
                      <input value={artist.photo || ''} onChange={e => updateLineup(i, 'photo', e.target.value)} placeholder="URL foto artista" />
                    </div>
                    <textarea value={artist.bio || ''} onChange={e => updateLineup(i, 'bio', e.target.value)} placeholder="Bio artista (opzionale)" rows={2}
                      style={{ fontSize: '13px' }} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addArtist} className="btn-outline" style={{ fontSize: '12px', padding: '8px 18px' }}>+ Aggiungi artista</button>
            </div>

            {/* UPLOAD FOTO */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                Upload foto
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {view === 'create' ? (
                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', fontSize: '13px', lineHeight: 1.6 }}>
                  Salva prima l&apos;evento — l&apos;upload foto sarà disponibile nella schermata di modifica.
                </div>
              ) : (
                <>
                  {uploadMsg && (
                    <div style={{ padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 600,
                      background: uploadMsg.type === 'success' ? 'rgba(0,200,100,0.1)' : 'rgba(232,71,26,0.1)',
                      border: `1px solid ${uploadMsg.type === 'success' ? 'rgba(0,200,100,0.3)' : 'rgba(232,71,26,0.3)'}`,
                      color: uploadMsg.type === 'success' ? '#00c864' : 'var(--accent)',
                    }}>{uploadMsg.text}</div>
                  )}

                  <div
                    onDragOver={e => { e.preventDefault(); setUploadDrag(true); }}
                    onDragLeave={() => setUploadDrag(false)}
                    onDrop={e => { e.preventDefault(); setUploadDrag(false); handleUploadFiles(e.dataTransfer.files); }}
                    onClick={() => document.getElementById('admin-file-input').click()}
                    style={{
                      border: `2px dashed ${uploadDrag ? 'var(--accent)' : 'var(--border2)'}`,
                      borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer',
                      background: uploadDrag ? 'rgba(232,71,26,0.04)' : 'var(--bg2)', transition: 'all 0.2s',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>📷</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Trascina le foto qui</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>oppure clicca per selezionare</div>
                    <input id="admin-file-input" type="file" multiple accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleUploadFiles(e.target.files)} />
                  </div>

                  {uploadPreviews.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>{uploadPreviews.length} foto selezionate</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '4px' }}>
                        {uploadPreviews.map((src, i) => (
                          <div key={i} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                        <span>Caricamento...</span><span>{uploadProgress}%</span>
                      </div>
                      <div style={{ background: 'var(--bg3)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {uploadFiles.length > 0 && (
                    <button type="button" className="btn-primary" onClick={handleUpload} disabled={uploading}
                      style={{ width: '100%', opacity: uploading ? 0.7 : 1 }}>
                      {uploading ? `Caricamento... ${uploadProgress}%` : `Carica ${uploadFiles.length} foto`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* VISIBILITÀ FOTO */}
            {form.photos && form.photos.length > 0 && (
              <Field label="Visibilità foto nella pagina Media">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => updateField('photos_public', !form.photos_public)}
                    style={{
                      width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                      background: form.photos_public !== false ? 'var(--accent)' : 'var(--border2)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '3px',
                      left: form.photos_public !== false ? '25px' : '3px',
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                  <span style={{ fontSize: '13px', color: form.photos_public !== false ? 'var(--text)' : 'var(--text2)', fontWeight: 600 }}>
                    {form.photos_public !== false ? 'Pubbliche — visibili nella pagina Media' : 'Private — nascoste dalla pagina Media'}
                  </span>
                </div>
              </Field>
            )}

            {/* FOTO EVENTO — viewer + Best of */}
            {form.photos && form.photos.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  Foto evento
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'none' }}>
                    {form.photos.length} foto · {(form.featured_photos || []).length} in evidenza
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Clicca su una foto per visualizzarla o scaricarla. Usa ★ per aggiungerla/rimuoverla dal &ldquo;Best of&rdquo;.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                  {form.photos.map((photoUrl, i) => {
                    const isFeatured = (form.featured_photos || []).includes(photoUrl);
                    return (
                      <div key={i} style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', border: `2px solid ${isFeatured ? 'var(--accent)' : 'transparent'}`, transition: 'border-color 0.15s' }}>
                        <img
                          src={photoUrl}
                          alt=""
                          onClick={() => setPhotoLightbox(i)}
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', cursor: 'zoom-in', opacity: isFeatured ? 1 : 0.6, transition: 'opacity 0.15s' }}
                        />
                        <button
                          type="button"
                          onClick={() => toggleFeatured(photoUrl)}
                          title={isFeatured ? 'Rimuovi dal Best of' : 'Aggiungi al Best of'}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: isFeatured ? 'var(--accent)' : 'rgba(0,0,0,0.6)',
                            border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', color: '#fff', fontWeight: 900, cursor: 'pointer',
                          }}>★</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHOTO LIGHTBOX (admin) */}
            {photoLightbox !== null && form.photos && form.photos[photoLightbox] && (
              <div
                onClick={() => setPhotoLightbox(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
              >
                <img
                  src={form.photos[photoLightbox]}
                  alt=""
                  onClick={e => e.stopPropagation()}
                  style={{ maxHeight: '80vh', maxWidth: '80vw', objectFit: 'contain', borderRadius: '4px' }}
                />

                {/* Prev / Next */}
                {photoLightbox > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setPhotoLightbox(prev => prev - 1); }}
                    style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer' }}>‹</button>
                )}
                {photoLightbox < form.photos.length - 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); setPhotoLightbox(prev => prev + 1); }}
                    style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer' }}>›</button>
                )}

                {/* Bottom bar */}
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', alignItems: 'center' }}
                >
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    {photoLightbox + 1} / {form.photos.length}
                  </span>
                  <a
                    href={form.photos[photoLightbox]}
                    download
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.05em' }}
                  >Scarica</a>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(form.photos[photoLightbox])}
                    style={{
                      background: (form.featured_photos || []).includes(form.photos[photoLightbox]) ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '9px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    }}>
                    {(form.featured_photos || []).includes(form.photos[photoLightbox]) ? '★ In evidenza' : '☆ Best of'}
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleDeletePhoto(form.photos[photoLightbox]); }}
                    style={{ background: 'rgba(232,71,26,0.2)', border: '1px solid rgba(232,71,26,0.4)', color: 'var(--accent)', padding: '9px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    Elimina
                  </button>
                </div>

                <button
                  onClick={() => setPhotoLightbox(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-primary"
              style={{ padding: '16px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvataggio...' : view === 'create' ? 'Crea evento' : 'Salva modifiche'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>{label}</label>
      {children}
    </div>
  );
}

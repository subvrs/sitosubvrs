import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'subvrsadmin2026';
const GENRE_OPTIONS = ['House', 'Disco', 'Disco House', 'Techno House', 'Afro House', 'Deep House', 'Tech House', 'Funk'];
const EMPTY_ARTIST = { name: '', role: 'DJ Set', time: '', bio: '', instagram: '', photo: '' };

const EMPTY_EVENT = {
  id: '', name: '', date: '', time: '22:00', end_time: 'till late',
  venue: '', city: 'Torino', address: '', genre: [],
  description: '', happy_hour: '', entry: 'Ingresso libero con accredito obbligatorio',
  dress_code: 'Smart casual', age_limit: '18+', ticket_link: '', status: 'upcoming', flyer: '',
  lineup: [{ ...EMPTY_ARTIST }],
  featured_photos: [],
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
    setForm({ ...event, lineup: event.lineup || [{ ...EMPTY_ARTIST }], featured_photos: event.featured_photos || [] });
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
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                    {new Date(ev.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} — {ev.venue}
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

            {/* FOTO IN EVIDENZA */}
            {form.photos && form.photos.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  Foto in evidenza — &ldquo;Best of&rdquo;
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'none' }}>
                    {(form.featured_photos || []).length} selezionate
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Clicca sulle foto per aggiungerle o rimuoverle dalla sezione &ldquo;Best of&rdquo; nella pagina Media.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                  {form.photos.map((photoUrl, i) => {
                    const isFeatured = (form.featured_photos || []).includes(photoUrl);
                    return (
                      <div key={i} onClick={() => toggleFeatured(photoUrl)} style={{
                        position: 'relative', cursor: 'pointer', borderRadius: '4px', overflow: 'hidden',
                        border: `2px solid ${isFeatured ? 'var(--accent)' : 'transparent'}`,
                        transition: 'border-color 0.15s',
                      }}>
                        <img src={photoUrl} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', opacity: isFeatured ? 1 : 0.55, transition: 'opacity 0.15s' }} />
                        {isFeatured && (
                          <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--accent)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', fontWeight: 900 }}>★</div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

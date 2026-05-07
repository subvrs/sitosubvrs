import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export async function getServerSideProps() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });
  return { props: { events: events || [] } };
}

export default function Events({ events }) {
  const upcoming = events.filter(e => e.status === 'upcoming');
  const past = events.filter(e => e.status === 'past');

  return (
    <>
      <Head><title>Events — SUBVRS</title></Head>

      <div style={{ padding: '60px 40px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '12px' }}>
          Tutti gli eventi
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: '60px' }}>
          EVENTS
        </h1>
      </div>

      {upcoming.length > 0 && (
        <section style={{ padding: '0 40px 60px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '24px' }}>Prossimi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {upcoming.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section style={{ padding: '0 40px 80px' }}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '48px', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text2)' }}>Passati</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {past.map(e => <EventRow key={e.id} event={e} past />)}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text2)' }}>Nessun evento ancora. Stay tuned.</div>
      )}
    </>
  );
}

function EventRow({ event, past }) {
  const date = new Date(event.date);
  const day = date.toLocaleDateString('it-IT', { day: '2-digit' });
  const month = date.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();

  return (
    <Link href={`/events/${event.id}`}>
      <div style={{
        display: 'grid', gridTemplateColumns: '80px 1fr auto',
        alignItems: 'center', gap: '24px', padding: '24px',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '4px', transition: 'all 0.2s', opacity: past ? 0.6 : 1, cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.opacity = past ? '0.6' : '1'; }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>{day}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: past ? 'var(--text2)' : 'var(--accent)' }}>{month} {year}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800 }}>{event.name}</span>
            {past ? <span className="tag past">Passato</span> : <span className="tag">Upcoming</span>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>{event.venue}, {event.city}</span>
            <span>{event.time} — {event.end_time}</span>
            {(event.genre || []).slice(0, 2).map(g => <span key={g} style={{ color: 'var(--violet2)' }}>{g}</span>)}
          </div>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>Dettagli →</div>
      </div>
    </Link>
  );
}

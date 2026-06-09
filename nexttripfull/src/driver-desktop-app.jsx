/**
 * VELO Driver — Desktop Version
 * Full-screen PC layout: 3 columns
 * Left: upcoming trip + pending/confirmed
 * Center: calendar + today summary
 * Right: billing + history + chat
 *
 * All Firebase logic imported from riviera-app.jsx via RivieraApp with initialRole="driver"
 * This wrapper just renders RivieraApp inside a desktop shell that intercepts the layout.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Re-use ALL shared logic from riviera-app ──────────────────────────────────
// We import the shared functions and render RivieraApp in a special desktop mode
import RivieraApp from './riviera-app.jsx';

// ── Desktop Shell ─────────────────────────────────────────────────────────────
export default function DriverDesktopApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Desktop header bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '2px solid #e2e8f0',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo-velo.jpg" style={{ width: 40, height: 40, objectFit: 'contain' }} alt="VELO"/>
          <div>
            <div style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>VELO Driver</div>
            <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 2 }}>DESKTOP</div>
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 12 }}>
          Versión escritorio — <a href="/driver.html" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Ir a versión móvil</a>
        </div>
      </div>

      {/* Main content: mobile app in center column, desktop hints on sides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr min(480px, 100%) 1fr',
        minHeight: 'calc(100vh - 56px)',
        gap: 0,
      }}>
        {/* Left column: decorative / info panel */}
        <div style={{
          background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
          borderRight: '1px solid #e2e8f0',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <SidePanel side="left" />
        </div>

        {/* Center: the actual mobile app, full height */}
        <div style={{
          background: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          minHeight: 'calc(100vh - 56px)',
          boxShadow: '0 0 40px rgba(37,99,235,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Render the full mobile app */}
          <RivieraApp initialRole="driver" />
        </div>

        {/* Right column: decorative / tips panel */}
        <div style={{
          background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
          borderLeft: '1px solid #e2e8f0',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <SidePanel side="right" />
        </div>
      </div>
    </div>
  );
}

// ── Side panels with useful info ──────────────────────────────────────────────
function SidePanel({ side }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  if (side === 'left') {
    return (
      <>
        {/* Clock */}
        <div style={{
          background: '#ffffff', borderRadius: 16, padding: '20px',
          boxShadow: '0 2px 12px rgba(37,99,235,0.1)', border: '1px solid #dbeafe',
          textAlign: 'center',
        }}>
          <LiveClock />
        </div>

        {/* Quick tips */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #dbeafe' }}>
          <div style={{ color: '#1e3a8a', fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 14 }}>ATAJOS RÁPIDOS</div>
          {[
            { icon: '📋', label: 'Ver pendientes', hint: 'Pulsa PENDIENTES' },
            { icon: '✅', label: 'Ver confirmados', hint: 'Pulsa CONFIRMADOS' },
            { icon: '💶', label: 'Ver facturación', hint: 'Baja al calendario' },
            { icon: '📅', label: 'Gestionar horario', hint: 'Sección Calendario' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid #f1f5f9',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                <div style={{ color: '#94a3b8', fontSize: 10 }}>{item.hint}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Status indicator */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #dbeafe' }}>
          <div style={{ color: '#1e3a8a', fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 12 }}>ESTADO DEL SISTEMA</div>
          {[
            { label: 'Firebase', ok: true },
            { label: 'GPS', ok: true },
            { label: 'Notificaciones', ok: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#475569', fontSize: 12 }}>{s.label}</span>
              <span style={{ background: s.ok ? '#f0fdf4' : '#fff5f5', color: s.ok ? '#16a34a' : '#ef4444', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                {s.ok ? '● Conectado' : '● Error'}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Right panel
  return (
    <>
      {/* Date */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '20px',
        boxShadow: '0 2px 12px rgba(34,197,94,0.1)', border: '1px solid #dcfce7',
        textAlign: 'center',
      }}>
        <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>HOY</div>
        <div style={{ color: '#0f172a', fontSize: 14, fontWeight: 800, textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

      {/* Keyboard shortcuts */}
      <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #dcfce7' }}>
        <div style={{ color: '#15803d', fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 14 }}>USO EN ESCRITORIO</div>
        {[
          { key: 'Scroll', desc: 'Navegar por la app' },
          { key: 'Click', desc: 'Interactuar con elementos' },
          { key: 'Tab', desc: 'Mover entre campos' },
          { key: 'Enter', desc: 'Confirmar acciones' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 6, padding: '2px 8px',
              color: '#0f172a', fontSize: 11, fontWeight: 700,
              fontFamily: 'monospace', flexShrink: 0,
            }}>{item.key}</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{item.desc}</span>
          </div>
        ))}
      </div>

      {/* VELO branding */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        borderRadius: 16, padding: '20px', textAlign: 'center',
        marginTop: 'auto',
      }}>
        <img src="/logo-velo.jpg" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 10 }} alt="VELO"/>
        <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 900, letterSpacing: 2 }}>VELO</div>
        <div style={{ color: '#93c5fd', fontSize: 10, letterSpacing: 1 }}>PRIVATE TRANSFERS</div>
        <div style={{ color: '#60a5fa', fontSize: 9, marginTop: 8 }}>Driver Desktop v1.0</div>
      </div>
    </>
  );
}

// ── Live clock component ───────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');
  return (
    <div>
      <div style={{ color: '#1e3a8a', fontSize: 36, fontWeight: 900, fontFamily: "'Inter', monospace", letterSpacing: 3 }}>
        {h}:{m}<span style={{ color: '#93c5fd', fontSize: 24 }}>:{s}</span>
      </div>
      <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
        {time.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
      </div>
    </div>
  );
}

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Ico } from '../theme';

const AVATAR_COLORS = ['#C76A4D', '#6B7A4D', '#D9A04A', '#8E5B8C', '#5A8FA8', '#7A6A5C'];

export default function MemberPicker({ members, onSelect, onClose, show }) {
  const { T } = useTheme();
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: T.cream, borderRadius: '26px 26px 0 0',
        padding: '14px 0 48px',
        maxWidth: 480, margin: '0 auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, color: T.ink }}>
              ¿Quién eres?
            </div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
              Elige tu nombre para registrar tus compras
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: T.paper, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev }}>
            <Ico.X s={14} c={T.ink}/>
          </button>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map((m, i) => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: T.paper, borderRadius: 16, padding: '14px 16px',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                boxShadow: T.elev,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: m.color || AVATAR_COLORS[i % AVATAR_COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: T.serif, fontSize: 20, fontWeight: 600,
              }}>
                {m.nombre[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{m.nombre}</span>
            </button>
          ))}

          {/* Opción invitado */}
          <button
            onClick={() => onSelect({ nombre: 'Invitado', color: '#9CA3AF' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'transparent', borderRadius: 16, padding: '12px 16px',
              border: `1.5px dashed ${T.hairline}`, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: T.faint || T.paper,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ico.People s={20} c={T.muted} w={1.5}/>
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: T.muted }}>Continuar como invitado</span>
          </button>
        </div>
      </div>
    </div>
  );
}

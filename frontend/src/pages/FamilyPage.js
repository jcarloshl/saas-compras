import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Ico } from '../theme';

export default function FamilyPage() {
  const { T } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: T.cream, boxSizing: 'border-box',
      fontFamily: T.sans, color: T.ink, maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '52px 20px 16px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: T.paper, boxShadow: T.elev, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ico.ChevL s={18} c={T.ink} w={2}/>
        </button>
        <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 26, letterSpacing: -0.5 }}>
          Familia
        </h1>
      </div>

      {/* Placeholder content */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 40px', textAlign: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 72 }}>👨‍👩‍👧‍👦</div>
        <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 24, letterSpacing: -0.3 }}>
          Próximamente
        </h2>
        <p style={{ margin: 0, color: T.muted, fontSize: 15, lineHeight: 1.5, maxWidth: 280 }}>
          Las listas compartidas con tu familia llegarán pronto.
        </p>
      </div>
    </div>
  );
}

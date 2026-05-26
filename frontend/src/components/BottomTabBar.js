import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Ico } from '../theme';

const TABS = [
  { k: 'home',   label: 'Listas',      Icon: Ico.List,   to: '/dashboard' },
  { k: 'cat',    label: 'Categorías',  Icon: Ico.Grid,   to: '/catalog'   },
  { k: 'hist',   label: 'Historial',   Icon: Ico.Clock,  to: '/history'   },
  { k: 'family', label: 'Familia',     Icon: Ico.People, to: '/family'    },
];

export default function BottomTabBar({ active }) {
  const { T } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      maxWidth: 480, margin: '0 auto',
      paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      paddingTop: 20,
      background: `linear-gradient(to top, ${T.cream} 60%, transparent)`,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        background: T.paper,
        borderRadius: 28,
        boxShadow: T.elev,
        padding: '8px 4px',
        margin: '0 16px',
        pointerEvents: 'auto',
      }}>
        {TABS.map(({ k, label, Icon, to }) => {
          const isActive = k === active;
          return (
            <button
              key={k}
              onClick={() => navigate(to)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 8px',
                borderRadius: 20,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? T.ink : T.muted,
                fontFamily: T.sans,
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                transition: 'color .15s',
              }}
            >
              <Icon s={22} c={isActive ? T.primary : T.muted} w={isActive ? 2 : 1.8}/>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

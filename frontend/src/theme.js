import React from 'react';

export const T = {
  cream:   '#F7F1E8',
  paper:   '#FFFFFF',
  paperHi: '#FBF6EE',
  ink:     '#2A1F18',
  muted:   '#7A6A5C',
  hairline:'rgba(42,31,24,0.08)',
  olive:   '#6B7A4D',
  mustard: '#D9A04A',
  plum:    '#8E5B8C',
  primary: '#C76A4D',
  elev:    '0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(80,40,20,0.05)',
  elevHi:  '0 8px 24px rgba(80,40,20,0.12)',
  serif:   '"Newsreader", "Iowan Old Style", Georgia, serif',
  sans:    '"Manrope", -apple-system, system-ui, sans-serif',
};

export const CATEGORIAS = [
  'Frutas y Verduras',
  'Carnes y Pescados',
  'Lácteos y Huevos',
  'Panadería',
  'Almacén / Despensa',
  'Bebidas',
  'Limpieza del Hogar',
  'Higiene Personal',
  'Snacks y Dulces',
  'Congelados',
  'Otros',
];

export const CAT_META = {
  'Frutas y Verduras':  { emoji: '🥬', color: '#6B7A4D' },
  'Carnes y Pescados':  { emoji: '🥩', color: '#C76A4D' },
  'Lácteos y Huevos':   { emoji: '🥛', color: '#D9A04A' },
  'Panadería':          { emoji: '🥖', color: '#D9A04A' },
  'Almacén / Despensa': { emoji: '🍝', color: '#8E5B8C' },
  'Bebidas':            { emoji: '🧃', color: '#5A8FA8' },
  'Limpieza del Hogar': { emoji: '🧴', color: '#5A8FA8' },
  'Higiene Personal':   { emoji: '🧼', color: '#5A8FA8' },
  'Snacks y Dulces':    { emoji: '🍫', color: '#D9A04A' },
  'Congelados':         { emoji: '🧊', color: '#5A8FA8' },
  'Otros':              { emoji: '📦', color: '#7A6A5C' },
};

export const Ico = {
  Plus:    ({ s=20, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Check:   ({ s=18, c='currentColor', w=2.2 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  X:       ({ s=18, c='currentColor', w=2   }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  ChevL:   ({ s=18, c='currentColor', w=2   }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevR:   ({ s=14, c='currentColor', w=2   }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clock:   ({ s=22, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={w}/><path d="M12 7.5V12l3 2" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Grid:    ({ s=22, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke={c} strokeWidth={w}/></svg>,
  Sparkle: ({ s=18, c='currentColor', w=1.6 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke={c} strokeWidth={w} strokeLinejoin="round"/></svg>,
  Search:  ({ s=18, c='currentColor', w=1.8 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth={w}/><path d="M20 20l-3.5-3.5" stroke={c} strokeWidth={w} strokeLinecap="round"/></svg>,
  Trash:   ({ s=16, c='currentColor', w=1.6 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h16M9 6V4h6v2M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit:    ({ s=16, c='currentColor', w=1.6 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18 2l3 3-9 9-4 1 1-4 9-9z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

export function Spinner({ size = 22, color = '#C76A4D' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid rgba(199,106,77,0.25)`,
      borderTopColor: color,
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'cesta-spin 0.7s linear infinite',
      flexShrink: 0,
    }}/>
  );
}

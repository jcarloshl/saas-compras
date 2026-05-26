import React from 'react';

export default function APillTag({ children, color, bg, T }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      borderRadius: 99,
      background: bg || T.paperHi,
      color: color || T.muted,
      fontFamily: T.sans,
      fontSize: 11,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

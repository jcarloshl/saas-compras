import React from 'react';

export default function AAvatar({ initials, color, size = 32, ring = false, T }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      color: '#fff',
      fontFamily: T.sans,
      fontWeight: 600,
      fontSize: Math.round(size * 0.42),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: ring ? `0 0 0 2px ${T.cream}` : undefined,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}

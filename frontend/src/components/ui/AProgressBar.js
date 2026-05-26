import React from 'react';

export default function AProgressBar({ value, total, color, height = 6, T }) {
  const pct = total > 0 ? Math.min(100, Math.max(2, (value / total) * 100)) : 0;
  return (
    <div style={{ width: '100%', height, background: T.hairline, borderRadius: 99 }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: color,
        borderRadius: 99,
        transition: 'width .3s',
      }}/>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../api';
import { T, CAT_META, Ico, Spinner } from '../theme';

function getPeriodOptions() {
  const options = [{ value: 'all', label: 'Todo el historial' }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function formatMonto(val) {
  return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('all');
  const [items, setItems] = useState([]);
  const [montoTotal, setMontoTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const periodOptions = getPeriodOptions();

  const fetchHistory = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await historyAPI.get(period);
      setItems(res.data.items);
      setMontoTotal(res.data.monto_total_periodo ?? null);
    } catch {
      setError('No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const byCategory = items.reduce((acc, item) => {
    const cat = item.categoria || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categories = Object.keys(byCategory).sort();

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, paddingBottom: 60 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '56px 20px 0', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '0 14px 0 10px', height: 40, borderRadius: 12, background: T.paper,
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: T.elev,
            fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.sans,
          }}>
            <Ico.ChevL s={16} c={T.ink} /> Listas
          </button>
        </div>

        {/* Title */}
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Historial</div>
          <h1 style={{ margin: '2px 0 0', fontFamily: T.serif, fontWeight: 500, fontSize: 30, letterSpacing: -0.6 }}>
            Lo que compraste
          </h1>
        </div>

        {/* Period selector */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            background: T.paper, borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: T.elev,
          }}>
            <Ico.Clock s={18} c={T.muted} />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: T.sans, padding: 0,
              }}
            >
              {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <Ico.ChevR s={14} c={T.muted} w={2} />
          </div>
        </div>

        {error && (
          <div style={{
            margin: '14px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA',
            color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner size={32} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.5 }}>🛍️</div>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 22, fontWeight: 500 }}>
              Sin compras en este período
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>
              Los artículos aparecen aquí cuando los marcás como comprados en tus listas.
            </p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div style={{ padding: '14px 20px 0' }}>
              <div style={{
                background: T.paperHi, borderRadius: 14, padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: `1px solid ${T.hairline}`,
              }}>
                <div style={{ fontSize: 13, color: T.muted }}>
                  <strong style={{ color: T.ink, fontWeight: 700 }}>{items.length}</strong>{' '}
                  artículo{items.length !== 1 ? 's' : ''} comprado{items.length !== 1 ? 's' : ''}
                </div>
                {montoTotal != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>💰</span>
                    <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 18, color: T.olive, letterSpacing: -0.3 }}>
                      ${formatMonto(montoTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* By category */}
            <div style={{ padding: '20px 16px 0' }}>
              {categories.map((cat, ci) => {
                const meta = CAT_META[cat] || { emoji: '📦', color: T.muted };
                return (
                  <div key={cat} style={{ marginTop: ci === 0 ? 0 : 22 }}>
                    <div style={{ padding: '0 8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        padding: '3px 9px', borderRadius: 99, background: '#F1E5D2',
                        fontSize: 11, fontWeight: 600, color: T.ink,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <span>{meta.emoji}</span>{cat}
                      </span>
                      <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
                        {byCategory[cat].length}
                      </span>
                    </div>
                    <div style={{ background: T.paper, borderRadius: 18, overflow: 'hidden', boxShadow: T.elev }}>
                      {byCategory[cat].map((item, idx) => (
                        <div key={item.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 14px',
                          borderTop: idx === 0 ? 'none' : `1px solid ${T.hairline}`,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.1 }}>
                              {item.articulo}
                              {item.cantidad && item.cantidad !== '1' && (
                                <span style={{ color: T.muted, fontWeight: 500 }}> · {item.cantidad}</span>
                              )}
                            </div>
                            <div style={{ marginTop: 2, fontSize: 11, color: T.muted }}>
                              {item.list_name}
                              {item.agregado_por && ` · ${item.agregado_por}`}
                            </div>
                          </div>
                          <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 500, flexShrink: 0 }}>
                            {formatDate(item.fecha_compra)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

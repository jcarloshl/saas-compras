import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { statsAPI } from '../api';
import { CAT_META, Ico, Spinner, tileBg } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const WHO_COLORS = ['#C76A4D', '#6B7A4D', '#D9A04A', '#8E5B8C', '#5A8FA8'];

function formatUltima(dias) {
  if (dias === null || dias === undefined) return '—';
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return `${dias}d`;
}

export default function ProductDetailPage() {
  const { articulo } = useParams();
  const nombre       = decodeURIComponent(articulo || '');
  const navigate     = useNavigate();
  const { T, dark }  = useTheme();

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!nombre) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await statsAPI.getArticulo(nombre);
        setStats(res.data);
      } catch {
        setError('No se pudieron cargar las estadísticas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nombre]);

  const catMeta    = CAT_META[stats?.categoria_mas_frecuente] || { emoji: '📦', color: T.muted };
  const recurrente = (stats?.semanas_distintas || 0) > 2;

  return (
    <div style={{
      minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink,
      maxWidth: 480, margin: '0 auto', boxSizing: 'border-box', paddingBottom: 96,
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
          <Ico.ChevL s={18} c={T.ink} w={2} />
        </button>

        <div style={{
          fontFamily: T.serif, fontSize: 18, fontWeight: 500, letterSpacing: -0.3,
          flex: 1, textAlign: 'center', padding: '0 12px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {nombre}
        </div>

        {/* Decorativos */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: T.paper, boxShadow: T.elev,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ico.Heart s={18} c={T.muted} w={1.8} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner size={36} />
        </div>

      ) : error ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>⚠️</div>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button
            onClick={() => { setLoading(true); setError(''); statsAPI.getArticulo(nombre).then(r => { setStats(r.data); setLoading(false); }).catch(() => { setError('No se pudieron cargar las estadísticas.'); setLoading(false); }); }}
            style={{
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: T.primary, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: T.sans,
            }}
          >
            Reintentar
          </button>
        </div>

      ) : stats && (
        <>
          {/* ── Hero ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 24px 24px', gap: 14,
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: 24,
              background: tileBg(dark, 0),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 52, boxShadow: T.elev,
            }}>
              {catMeta.emoji}
            </div>

            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: -0.5, textAlign: 'center' }}>
              {stats.articulo}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Categoría */}
              <span style={{
                padding: '4px 12px', borderRadius: 99, background: '#F1E5D2',
                fontSize: 12, fontWeight: 600, color: T.ink,
              }}>
                {stats.categoria_mas_frecuente}
              </span>
              {/* Badge recurrente */}
              {recurrente && (
                <span style={{
                  padding: '4px 12px', borderRadius: 99,
                  background: 'rgba(107,122,77,0.12)', border: `1px solid rgba(107,122,77,0.3)`,
                  fontSize: 12, fontWeight: 600, color: T.olive,
                }}>
                  Recurrente
                </span>
              )}
            </div>
          </div>

          {/* ── Stats grid 3 cols ── */}
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{
              background: T.paper, borderRadius: 20, boxShadow: T.elev,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              overflow: 'hidden',
            }}>
              {[
                { label: 'TOTAL', value: stats.total_veces > 0 ? stats.total_veces : '—' },
                { label: 'ESTE AÑO', value: stats.veces_este_anio > 0 ? stats.veces_este_anio : '—' },
                { label: 'ÚLTIMA', value: formatUltima(stats.dias_desde_ultima) },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: '18px 12px', textAlign: 'center',
                    borderLeft: i > 0 ? `1px solid ${T.hairline}` : 'none',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: T.muted, marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: -0.5, color: T.ink }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
            {/* Nota: sin precio por ítem — PurchaseHistory no lo guarda */}
          </div>

          {/* ── Quién lo añade más ── */}
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{ background: T.paper, borderRadius: 20, boxShadow: T.elev, padding: '18px 18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: T.muted, marginBottom: 16, textTransform: 'uppercase' }}>
                Quién lo añade más
              </div>

              {stats.quien_anade_mas.length === 0 ? (
                <div style={{ fontSize: 14, color: T.muted }}>Solo tú</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.quien_anade_mas.map((p, i) => (
                    <div key={p.nombre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.nombre}</span>
                        <span style={{ fontSize: 12, color: T.muted }}>{p.porcentaje}%</span>
                      </div>
                      <div style={{ height: 6, background: T.hairline, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: 6, borderRadius: 99,
                          background: WHO_COLORS[i % WHO_COLORS.length],
                          width: `${p.porcentaje}%`,
                          transition: 'width 400ms ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estado vacío */}
          {stats.total_veces === 0 && (
            <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>
                Sin historial aún. Aparecerá aquí después de marcarlo como comprado.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Botón fijo inferior ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        padding: 'calc(16px + env(safe-area-inset-bottom, 0px)) 20px 20px',
        background: `linear-gradient(to top, ${T.cream} 70%, transparent)`,
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => navigate('/catalog', { replace: true })}
          style={{
            width: '100%', height: 54, borderRadius: 16, border: 'none',
            background: T.paper, boxShadow: T.elevHi,
            fontSize: 15, fontWeight: 600, color: T.ink, fontFamily: T.sans,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, pointerEvents: 'auto',
          }}
        >
          <Ico.ChevL s={16} c={T.muted} w={2} />
          Volver al catálogo
        </button>
      </div>
    </div>
  );
}

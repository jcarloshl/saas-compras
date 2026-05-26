import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { CAT_META, Ico, Spinner } from '../theme';
import { budgetAPI } from '../api';
import AProgressBar from '../components/ui/AProgressBar';

function mesActual() { return new Date().toISOString().slice(0, 7); }
function formatMes(ym) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}
function formatMonto(val) {
  return Number(val).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(d.toISOString().slice(0, 7));
  }
  return opts;
}

export default function BudgetPage() {
  const { T } = useTheme();
  const navigate = useNavigate();

  const [mes, setMes] = useState(mesActual());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [saving, setSaving] = useState(false);

  const months = buildMonthOptions();

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetAPI.get(mes);
      setData(res.data);
      setLimitInput(res.data.monto_limite ? String(Math.round(res.data.monto_limite)) : '');
    } catch {
      setError('No se pudo cargar el presupuesto');
    } finally { setLoading(false); }
  }, [mes]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const handleSaveLimit = async (e) => {
    e.preventDefault();
    const val = parseFloat(limitInput.replace(/\./g, '').replace(',', '.'));
    if (!val || val <= 0) return;
    setSaving(true);
    try {
      await budgetAPI.upsert(mes, val);
      await fetchBudget();
      setShowLimitForm(false);
    } catch {
      setError('Error al guardar el presupuesto');
    } finally { setSaving(false); }
  };

  const gasto = data?.gasto_actual ?? null;
  const limite = data?.monto_limite ?? null;
  const porcentaje = data?.porcentaje ?? null;
  const alerta = porcentaje !== null && porcentaje >= 80;

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, maxWidth: 480, margin: '0 auto', paddingBottom: 40, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.paper, boxShadow: T.elev, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico.ChevL s={18} c={T.ink} w={2}/>
        </button>
        <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 26, letterSpacing: -0.5, flex: 1 }}>Presupuesto</h1>
      </div>

      {/* Selector de mes */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8, overflowX: 'auto' }} className="scroll-x">
        {months.map(m => (
          <button key={m} onClick={() => setMes(m)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: 'none', background: m === mes ? T.primary : T.paper, color: m === mes ? '#fff' : T.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans, boxShadow: T.elev }}>
            {formatMes(m)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ margin: '0 20px 16px', background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '10px 14px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')}><Ico.X s={14} c="#B91C1C"/></button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size={32}/>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tarjeta principal */}
          <div style={{ background: alerta ? '#FFF5F5' : T.paper, borderRadius: 20, padding: 20, boxShadow: T.elev, border: alerta ? `1.5px solid #FECACA` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: alerta ? '#B91C1C' : T.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {alerta ? '⚠ Cerca del límite' : 'Gasto del mes'}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.8, color: T.ink, marginTop: 4 }}>
                  {gasto !== null ? `$${formatMonto(gasto)}` : '–'}
                </div>
                {limite !== null && (
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
                    de ${formatMonto(limite)} presupuestados
                  </div>
                )}
              </div>
              <button onClick={() => setShowLimitForm(true)} style={{ padding: '7px 13px', borderRadius: 10, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>
                {limite ? 'Editar' : 'Definir límite'}
              </button>
            </div>
            {limite !== null && (
              <>
                <AProgressBar
                  value={Math.min(gasto ?? 0, limite)}
                  total={limite}
                  color={alerta ? '#B91C1C' : T.olive}
                  height={8}
                  T={T}
                />
                {porcentaje !== null && (
                  <div style={{ fontSize: 12, color: alerta ? '#B91C1C' : T.muted, marginTop: 6, textAlign: 'right', fontWeight: 600 }}>
                    {porcentaje}% utilizado
                  </div>
                )}
              </>
            )}
            {limite === null && (
              <div style={{ marginTop: 10, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
                Define un límite mensual para ver tu progreso de gasto.
              </div>
            )}
          </div>

          {/* Breakdown por categoría */}
          {data?.por_categoria?.length > 0 && (
            <div style={{ background: T.paper, borderRadius: 20, padding: '16px 18px', boxShadow: T.elev }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
                Artículos por categoría
              </div>
              {(() => {
                const total = data.por_categoria.reduce((s, c) => s + c.cantidad, 0);
                return data.por_categoria.map(cat => {
                  const emoji = CAT_META[cat.categoria]?.emoji || '📦';
                  const pct = total > 0 ? Math.round(cat.cantidad / total * 100) : 0;
                  return (
                    <div key={cat.categoria} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15 }}>{emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{cat.categoria}</span>
                        </div>
                        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{cat.cantidad} art. · {pct}%</span>
                      </div>
                      <AProgressBar value={cat.cantidad} total={total} color={CAT_META[cat.categoria]?.color || T.primary} height={5} T={T}/>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {gasto === null && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 13.5 }}>
              No hay compras registradas en {formatMes(mes)}.
            </div>
          )}
        </div>
      )}

      {/* Modal definir límite */}
      {showLimitForm && (
        <div onClick={() => setShowLimitForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.cream, borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', width: '100%', maxWidth: 480, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>
            <h3 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 20, letterSpacing: -0.3, marginBottom: 6, color: T.ink }}>
              Límite para {formatMes(mes)}
            </h3>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
              Ingresa el monto máximo que quieres gastar este mes.
            </p>
            <form onSubmit={handleSaveLimit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: T.muted, fontWeight: 600 }}>$</span>
                <input
                  autoFocus type="number" min="1" placeholder="Ej: 150000"
                  value={limitInput} onChange={e => setLimitInput(e.target.value)}
                  style={{ width: '100%', background: T.paper, borderRadius: 12, padding: '14px 16px 14px 28px', fontSize: 15, color: T.ink, boxShadow: T.elev, border: 'none', fontFamily: T.sans, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowLimitForm(false)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`, fontSize: 13.5, fontWeight: 600, color: T.ink, background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {saving ? <Spinner size={18} color="#fff"/> : <Ico.Check s={16} c="#fff" w={2.5}/>}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsAPI, listsAPI } from '../api';
import { CAT_META, Ico, Spinner } from '../theme';

const BG      = 'linear-gradient(180deg, #2A1F18 0%, #3F2B1F 100%)';
const WHITE   = '#F1E7DA';
const MUTED   = '#A09080';
const PRIMARY = '#C76A4D';
const MUSTARD = '#E0B259';
const SERIF   = '"Newsreader", "Iowan Old Style", Georgia, serif';
const SANS    = '"Manrope", -apple-system, system-ui, sans-serif';

export default function ShoppingModePage() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [listInfo,   setListInfo]   = useState(null);
  const [items,      setItems]      = useState([]);
  const [currentIdx, setIdx]        = useState(0);
  const [done,       setDone]       = useState(false);
  const [monto,      setMonto]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [advancing,  setAdvancing]  = useState(false);
  const [apiError,   setApiError]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [precio,     setPrecio]     = useState('');
  const [precioAcum, setPrecioAcum] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsRes, listRes] = await Promise.all([
          itemsAPI.getAll(id),
          listsAPI.get(id),
        ]);
        const pendientes = itemsRes.data.items.filter(i => !i.comprado);
        setItems(pendientes);
        setListInfo(listRes.data);
        if (pendientes.length === 0) setDone(true);
      } catch {
        // si falla la carga, ir a pantalla de finalización vacía
        setDone(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (done && precioAcum > 0 && monto === '') {
      setMonto(String(precioAcum.toFixed(2)));
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (precioActual = '') => {
    const parsed = parseFloat(precioActual);
    if (precioActual !== '' && !isNaN(parsed)) {
      setPrecioAcum(prev => prev + parsed);
    }
    setPrecio('');
    const next = currentIdx + 1;
    if (next >= items.length) setDone(true);
    else setIdx(next);
  };

  const handleCheck = async () => {
    setAdvancing(true);
    setApiError(null);
    try {
      const payload = { comprado: true };
      const parsed = parseFloat(precio);
      if (precio !== '' && !isNaN(parsed)) payload.precio = parsed;
      await itemsAPI.update(id, items[currentIdx].id, payload);
      advance(precio);
    } catch {
      setApiError('No se pudo registrar. ¿Reintentar?');
    } finally {
      setAdvancing(false);
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const valor = parseFloat(monto) || null;
      await listsAPI.update(id, { monto_total: valor });
    } catch {
      // silencioso — el usuario puede saltar
    } finally {
      setSaving(false);
      navigate(`/lists/${id}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: BG, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: SANS,
      }}>
        <Spinner size={32} color={MUSTARD} />
      </div>
    );
  }

  const item      = items[currentIdx];
  const nextItem  = items[currentIdx + 1];
  const total     = items.length;
  const pct       = total > 0 ? (currentIdx / total) * 100 : 0;
  const catEmoji  = item ? (CAT_META[item.categoria]?.emoji || '🛒') : '🛒';

  return (
    <div style={{
      minHeight: '100vh', background: BG, boxSizing: 'border-box',
      fontFamily: SANS, color: WHITE, display: 'flex', flexDirection: 'column',
      maxWidth: 480, margin: '0 auto', position: 'relative',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 16px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: 'rgba(255,255,255,0.08)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ico.X s={18} c={WHITE} w={2} />
        </button>

        <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Modo compra
          </div>
          {listInfo && (
            <div style={{ fontSize: 14, color: WHITE, fontWeight: 500, marginTop: 2 }}>
              {listInfo.name}
            </div>
          )}
        </div>

        {!done && (
          <div style={{
            minWidth: 48, height: 28, background: 'rgba(255,255,255,0.10)',
            borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: WHITE, padding: '0 10px',
          }}>
            {currentIdx + 1}/{total}
          </div>
        )}
        {done && <div style={{ width: 48 }} />}
      </div>

      {/* ── Progress bar ── */}
      {!done && (
        <div style={{ height: 4, background: 'rgba(255,255,255,0.10)', margin: '0 20px 0' }}>
          <div style={{
            height: 4, background: MUSTARD, borderRadius: 2,
            width: `${pct}%`, transition: 'width 300ms ease',
          }} />
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {!done ? (
          /* ── Ítem actual ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 32px 0',
          }}>
            {/* Emoji categoría */}
            <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 24 }}>
              {catEmoji}
            </div>

            {/* Nombre */}
            <div style={{
              fontFamily: SERIF, fontSize: 44, fontWeight: 400, textAlign: 'center',
              lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 12,
              color: WHITE,
            }}>
              {item.articulo}
            </div>

            {/* Cantidad */}
            {item.cantidad && (
              <div style={{ fontSize: 20, color: MUSTARD, fontWeight: 500, marginBottom: 16 }}>
                {item.cantidad}
              </div>
            )}

            {/* Quién lo añadió */}
            {item.agregado_por && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.07)', borderRadius: 99,
                padding: '6px 14px', marginBottom: 12,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: PRIMARY, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: WHITE,
                }}>
                  {item.agregado_por.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: MUTED }}>
                  {item.agregado_por} lo añadió
                </span>
              </div>
            )}

            {/* Precio opcional */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.07)', borderRadius: 16,
              padding: '10px 16px', marginTop: 16,
              border: precio ? '1px solid rgba(199,106,77,0.5)' : '1px solid transparent',
              transition: 'border-color 200ms ease',
            }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, color: MUTED }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio (opcional)"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                inputMode="decimal"
                style={{
                  fontFamily: SANS, fontSize: 18, fontWeight: 500,
                  color: WHITE, background: 'transparent',
                  border: 'none', outline: 'none', width: 160,
                }}
              />
            </div>

            {/* Error API */}
            {apiError && (
              <div style={{ fontSize: 13, color: MUSTARD, textAlign: 'center', marginBottom: 8 }}>
                {apiError}
              </div>
            )}

            {/* Preview siguiente */}
            {nextItem && (
              <div style={{ fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 8 }}>
                Siguiente: <span style={{ color: 'rgba(241,231,218,0.6)' }}>{nextItem.articulo}</span>
                {nextItem.cantidad ? ` · ${nextItem.cantidad}` : ''}
              </div>
            )}
          </div>
        ) : (
          /* ── Pantalla de finalización ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 32px 0', gap: 12,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(199,106,77,0.15)', border: `2px solid ${PRIMARY}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Ico.Check s={36} c={PRIMARY} w={2.5} />
            </div>

            <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: WHITE }}>
              ¡Listo!
            </div>

            <div style={{ fontSize: 15, color: MUTED, textAlign: 'center', marginBottom: 8 }}>
              ¿Cuánto gastaste en total?
              {precioAcum > 0 && (
                <div style={{ fontSize: 12, color: PRIMARY, marginTop: 4 }}>
                  Suma ingresada: ${precioAcum.toFixed(2)}
                </div>
              )}
            </div>

            <div style={{ position: 'relative', textAlign: 'center' }}>
              <span style={{
                fontFamily: SERIF, fontSize: 28, color: MUTED,
                position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)',
              }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                style={{
                  fontFamily: SERIF, fontSize: 52, fontWeight: 400,
                  color: WHITE, background: 'transparent', border: 'none',
                  outline: 'none', textAlign: 'center', width: 220,
                  borderBottom: `1.5px solid rgba(255,255,255,0.15)`,
                  paddingBottom: 4,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Bottom buttons ── */}
        <div style={{ padding: '24px 20px calc(40px + env(safe-area-inset-bottom, 0px))' }}>

          {!done ? (
            <div style={{ display: 'flex', gap: 10 }}>
              {/* No hay */}
              <button
                onClick={() => advance('')}
                disabled={advancing}
                style={{
                  flex: 1, height: 56, borderRadius: 16, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: WHITE,
                  fontSize: 15, fontWeight: 600, cursor: advancing ? 'not-allowed' : 'pointer',
                  opacity: advancing ? 0.5 : 1, fontFamily: SANS,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                No hay
              </button>

              {/* Tachar y seguir */}
              <button
                onClick={handleCheck}
                disabled={advancing}
                style={{
                  flex: 2, height: 56, borderRadius: 16, border: 'none',
                  background: PRIMARY, color: WHITE,
                  fontSize: 15, fontWeight: 600, cursor: advancing ? 'not-allowed' : 'pointer',
                  opacity: advancing ? 0.7 : 1, fontFamily: SANS,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {advancing
                  ? <Spinner size={18} color={WHITE} />
                  : <Ico.Check s={18} c={WHITE} w={2.5} />
                }
                Tachar y seguir
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Saltar */}
              <button
                onClick={() => navigate(`/lists/${id}`)}
                style={{
                  flex: 1, height: 56, borderRadius: 16, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: WHITE,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                Saltar
              </button>

              {/* Guardar */}
              <button
                onClick={handleGuardar}
                disabled={saving || !monto}
                style={{
                  flex: 2, height: 56, borderRadius: 16, border: 'none',
                  background: saving || !monto ? 'rgba(199,106,77,0.4)' : PRIMARY,
                  color: WHITE, fontSize: 15, fontWeight: 600,
                  cursor: saving || !monto ? 'not-allowed' : 'pointer',
                  fontFamily: SANS,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {saving ? <Spinner size={18} color={WHITE} /> : <Ico.Check s={18} c={WHITE} w={2.5} />}
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

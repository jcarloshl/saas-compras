import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { listsAPI, itemsAPI, catalogAPI } from '../api';
import { CATEGORIAS, CAT_META, Ico, Spinner, detectarCategoria } from '../theme';
import AAvatar from '../components/ui/AAvatar';

const AVATAR_COLORS = ['#C76A4D', '#6B7A4D', '#D9A04A', '#8E5B8C', '#5A8FA8', '#7A6A5C'];
const avatarColor = (name) => name ? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] : AVATAR_COLORS[0];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatMonto(val) {
  return Number(val).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function ListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { T } = useTheme();

  const inp = {
    width: '100%', background: T.paper, borderRadius: 12,
    padding: '12px 14px', fontSize: 15, color: T.ink,
    boxShadow: T.elev, border: 'none', fontFamily: T.sans,
    boxSizing: 'border-box',
  };

  const [listInfo, setListInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, comprados: 0, pendientes: 0, porcentaje: 0 });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const getAgregadoPor = () => {
    try { return JSON.parse(localStorage.getItem('cesta_member'))?.nombre || user?.username || ''; } catch { return user?.username || ''; }
  };
  const [form, setForm] = useState({ articulo: '', cantidad: '1', categoria: 'Otros', agregado_por: getAgregadoPor() });
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [filterCat, setFilterCat] = useState('Todas');
  const [showToast, setShowToast] = useState(false);
  const [editingMonto, setEditingMonto] = useState(false);
  const [montoInput, setMontoInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceToast, setVoiceToast] = useState('');
  const recognitionRef = useRef(null);
  const voiceModeRef = useRef(false);
  const submitByVoiceRef = useRef(null);
  const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const fetchData = useCallback(async () => {
    try {
      const itemsRes = await itemsAPI.getAll(id);
      setItems(itemsRes.data.items);
      setStats(itemsRes.data.stats);
    } catch {
      setError('Error al cargar la lista');
    } finally {
      setLoading(false);
    }
    try {
      const listRes = await listsAPI.get(id);
      setListInfo(listRes.data);
    } catch {}
    try {
      const catalogRes = await catalogAPI.getAll();
      setCatalog(catalogRes.data);
    } catch {}
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveMonto = async () => {
    const val = parseFloat(montoInput.replace(',', '.'));
    if (isNaN(val) || val < 0) { setEditingMonto(false); return; }
    try {
      await listsAPI.update(id, { monto_total: val });
      setListInfo(prev => ({ ...prev, monto_total: val }));
    } catch {}
    setEditingMonto(false);
  };

  const handleEditMonto = () => {
    setMontoInput(listInfo?.monto_total != null ? String(listInfo.monto_total) : '');
    setEditingMonto(true);
  };

  const handleArticuloChange = useCallback((value) => {
    const catDetectada = value.length >= 2 ? detectarCategoria(value) : 'Otros';
    setForm(f => ({
      ...f,
      articulo: value,
      categoria: f.categoria === 'Otros' || f._autocat ? catDetectada : f.categoria,
      _autocat: catDetectada !== 'Otros',
    }));
    if (value.length >= 2) {
      setSuggestions(
        catalog.filter(c => c.articulo.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
      );
    } else {
      setSuggestions([]);
    }
  }, [catalog]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) { recognitionRef.current.stop(); }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'es-CL';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript.trim();
      handleArticuloChange(text);
      if (last.isFinal) {
        setIsListening(false);
        if (voiceModeRef.current) {
          submitByVoiceRef.current?.(text);
        }
      }
    };
    rec.onerror = () => { setIsListening(false); if (voiceModeRef.current) startListening(); };
    rec.onend = () => setIsListening(false);

    setIsListening(true);
    rec.start();
  }, [handleArticuloChange]);

  const selectSuggestion = (item) => {
    setForm(f => ({ ...f, articulo: item.articulo, categoria: item.categoria }));
    setSuggestions([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.articulo.trim()) return;
    stopListening();
    voiceModeRef.current = false;
    setVoiceMode(false);
    setAdding(true);
    const categoria = form.categoria !== 'Otros' ? form.categoria : detectarCategoria(form.articulo.trim());
    try {
      const res = await itemsAPI.add(id, form.articulo.trim(), form.cantidad, categoria, form.agregado_por);
      setItems(prev => [...prev, res.data]);
      setStats(prev => {
        const total = prev.total + 1;
        return { total, pendientes: prev.pendientes + 1, comprados: prev.comprados, porcentaje: total > 0 ? Math.round(prev.comprados / total * 100) : 0 };
      });
      const nuevoArticulo = form.articulo.trim();
      setCatalog(prev => {
        if (prev.some(c => c.articulo.toLowerCase() === nuevoArticulo.toLowerCase())) return prev;
        return [...prev, { articulo: nuevoArticulo, categoria }]
          .sort((a, b) => a.articulo.toLowerCase().localeCompare(b.articulo.toLowerCase()));
      });
      setForm(f => ({ ...f, articulo: '', cantidad: '1', categoria: 'Otros', _autocat: false }));
      setSuggestions([]);
    } catch {
      setError('Error al agregar artículo');
    } finally {
      setAdding(false);
    }
  };

  const submitByVoice = useCallback(async (text) => {
    if (!text.trim()) {
      if (voiceModeRef.current) startListening();
      return;
    }
    try {
      const res = await itemsAPI.add(id, text.trim(), '1', form.categoria || 'Otros', form.agregado_por);
      setItems(prev => [...prev, res.data]);
      setStats(prev => {
        const total = prev.total + 1;
        return { total, pendientes: prev.pendientes + 1, comprados: prev.comprados, porcentaje: total > 0 ? Math.round(prev.comprados / total * 100) : 0 };
      });
      const art = text.trim();
      setCatalog(prev => {
        if (prev.some(c => c.articulo.toLowerCase() === art.toLowerCase())) return prev;
        return [...prev, { articulo: art, categoria: form.categoria || 'Otros' }]
          .sort((a, b) => a.articulo.toLowerCase().localeCompare(b.articulo.toLowerCase()));
      });
      setForm(f => ({ ...f, articulo: '' }));
      setSuggestions([]);
      setVoiceToast(art);
      setTimeout(() => setVoiceToast(''), 2000);
    } catch {
      setError('Error al agregar por voz');
    }
    if (voiceModeRef.current) startListening();
  }, [id, form.categoria, form.agregado_por, startListening]);

  useEffect(() => { submitByVoiceRef.current = submitByVoice; }, [submitByVoice]);

  const handleToggle = async (item) => {
    const prevItems = items;
    const prevStats = stats;
    const newVal = !item.comprado;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, comprado: newVal } : i));
    setStats(prev => {
      const comprados = newVal ? prev.comprados + 1 : prev.comprados - 1;
      const pendientes = prev.total - comprados;
      if (pendientes === 0 && prev.total > 0) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      return { ...prev, comprados, pendientes, porcentaje: prev.total > 0 ? Math.round(comprados / prev.total * 100) : 0 };
    });
    try {
      await itemsAPI.update(id, item.id, { comprado: newVal });
    } catch {
      setItems(prevItems);
      setStats(prevStats);
    }
  };

  const handleDelete = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setStats(prev => {
      const comprados = item.comprado ? prev.comprados - 1 : prev.comprados;
      const total = prev.total - 1;
      return { total, comprados, pendientes: total - comprados, porcentaje: total > 0 ? Math.round(comprados / total * 100) : 0 };
    });
    try {
      await itemsAPI.delete(id, itemId);
    } catch {
      fetchData();
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Vaciar todos los artículos de esta lista?')) return;
    try {
      await itemsAPI.reset(id);
      setItems([]);
      setStats({ total: 0, comprados: 0, pendientes: 0, porcentaje: 0 });
    } catch {
      setError('Error al vaciar la lista');
    }
  };

  const normalizarCategoria = (cat) => CATEGORIAS.includes(cat) ? cat : 'Otros';

  const filteredItems = filterCat === 'Todas'
    ? items
    : items.filter(i => normalizarCategoria(i.categoria) === filterCat);

  const grouped = filteredItems.reduce((acc, item) => {
    const cat = normalizarCategoria(item.categoria);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32}/>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, paddingBottom: 120 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '52px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            width: 40, height: 40, borderRadius: 12, background: T.paper, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev, cursor: 'pointer',
          }}>
            <Ico.ChevL s={18} c={T.ink}/>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} style={{
              padding: '0 14px', height: 36, borderRadius: 10,
              background: 'transparent', border: `1px solid ${T.hairline}`,
              fontSize: 12.5, fontWeight: 600, color: T.muted, fontFamily: T.sans, cursor: 'pointer',
            }}>Vaciar</button>
            <button onClick={() => navigate(`/lists/${id}/shop`)} style={{
              padding: '0 16px', height: 36, borderRadius: 10,
              background: T.primary, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, fontFamily: T.sans, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Ico.Check s={14} c="#fff" w={2.5}/>
              Comprar
            </button>
          </div>
        </div>

        {/* Title + subtitle + monto */}
        <div style={{ padding: '16px 24px 0' }}>
          <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: 30, letterSpacing: -0.6 }}>
            {listInfo?.name || 'Lista'}
          </h1>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {listInfo?.created_at && (
              <span style={{ fontSize: 12, color: T.muted }}>
                {formatDate(listInfo.created_at)}
              </span>
            )}
            {editingMonto ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: T.muted }}>$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoInput}
                  onChange={e => setMontoInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveMonto(); if (e.key === 'Escape') setEditingMonto(false); }}
                  style={{
                    width: 110, padding: '3px 8px', borderRadius: 8,
                    border: `1.5px solid ${T.primary}`, background: T.paper,
                    color: T.ink, fontSize: 13, fontFamily: T.sans,
                  }}
                />
                <button onClick={handleSaveMonto} style={{
                  background: T.primary, color: '#fff', border: 'none',
                  borderRadius: 8, padding: '3px 10px', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', fontFamily: T.sans,
                }}>OK</button>
                <button onClick={() => setEditingMonto(false)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 2,
                }}>
                  <Ico.X s={14} c={T.muted}/>
                </button>
              </span>
            ) : (
              <span
                onClick={handleEditMonto}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: 99, cursor: 'pointer',
                  background: listInfo?.monto_total != null ? T.paperHi : T.hairline,
                  color: listInfo?.monto_total != null ? T.olive : T.muted,
                  fontSize: 12, fontWeight: 600,
                }}
                title="Tocar para editar monto"
              >
                {listInfo?.monto_total != null
                  ? <>💰 ${formatMonto(listInfo.monto_total)} registrado <Ico.Edit s={11} c={T.olive}/></>
                  : <>💰 Monto no registrado <Ico.Edit s={11} c={T.muted}/></>
                }
              </span>
            )}
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: T.hairline, borderRadius: 99 }}>
                <div style={{
                  width: `${Math.max(2, stats.porcentaje)}%`, height: '100%',
                  background: stats.pendientes === 0 ? T.olive : T.primary, borderRadius: 99, transition: 'width .3s',
                }}/>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                {stats.comprados}<span style={{ color: T.muted, fontWeight: 500 }}>/{stats.total}</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            margin: '16px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA',
            color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {error}
            <button onClick={() => setError('')}><Ico.X s={16} c="#B91C1C"/></button>
          </div>
        )}

        {/* Category filter chips */}
        <div className="scroll-x" style={{ padding: '20px 20px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['Todas', ...CATEGORIAS].map(cat => {
            const active = filterCat === cat;
            const meta = CAT_META[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{
                flexShrink: 0, padding: '7px 12px', borderRadius: 99,
                background: active ? T.ink : T.paper,
                color: active ? '#fff' : T.muted,
                fontSize: 12.5, fontWeight: 600, fontFamily: T.sans,
                boxShadow: active ? 'none' : T.elev, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {meta && <span style={{ fontSize: 13 }}>{meta.emoji}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div style={{ padding: '20px 16px 0' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.5 }}>🥬🍞🥚</div>
              <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.ink }}>
                {filterCat === 'Todas' ? 'Lista vacía' : `Sin artículos en ${filterCat}`}
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>
                {filterCat === 'Todas'
                  ? 'Toca el botón de abajo para agregar el primer artículo.'
                  : 'Cambia el filtro para ver otros artículos.'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catItems], gi) => {
              const meta = CAT_META[cat] || { emoji: '📦', color: T.muted };
              return (
                <div key={cat} style={{ marginTop: gi === 0 ? 0 : 22 }}>
                  {/* Categoría header — uppercase */}
                  <div style={{ padding: '0 8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.muted }}>
                      {meta.emoji} {cat}
                    </span>
                    <span style={{ fontSize: 11, color: T.faint || T.muted, fontWeight: 500 }}>{catItems.length}</span>
                  </div>
                  <div style={{ background: T.paper, borderRadius: 20, overflow: 'hidden', boxShadow: T.elev }}>
                    {catItems.map((item, idx) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        borderTop: idx === 0 ? 'none' : `1px solid ${T.hairline}`,
                      }}>
                        {/* Checkbox */}
                        <button onClick={() => handleToggle(item)} style={{
                          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                          background: item.comprado ? T.primary : 'transparent',
                          border: item.comprado ? `1.5px solid ${T.primary}` : `1.5px solid rgba(42,31,24,0.2)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}>
                          {item.comprado && <Ico.Check s={14} c="#fff"/>}
                        </button>

                        {/* Name + qty */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 500, color: T.ink,
                            textDecoration: item.comprado ? 'line-through' : 'none',
                            opacity: item.comprado ? 0.45 : 1,
                          }}>{item.articulo}</div>
                          {(item.cantidad && item.cantidad !== '1') ? (
                            <div style={{ marginTop: 2, fontSize: 12, color: T.muted, opacity: item.comprado ? 0.5 : 1 }}>
                              × {item.cantidad}
                            </div>
                          ) : null}
                        </div>

                        {/* Avatar de quien añadió (solo si no comprado) */}
                        {!item.comprado && item.agregado_por && (
                          <AAvatar
                            initials={item.agregado_por[0].toUpperCase()}
                            color={avatarColor(item.agregado_por)}
                            size={26}
                            T={T}
                          />
                        )}

                        {/* Delete */}
                        <button onClick={() => handleDelete(item.id)} style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: 'transparent', border: `1px solid ${T.hairline}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}>
                          <Ico.Trash s={14} c={T.muted}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating add bar */}
      <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 10, padding: '0 16px' }}>
        <div style={{
          maxWidth: 480, margin: '0 auto',
          background: T.ink, borderRadius: 24, padding: '10px 10px 10px 20px',
          boxShadow: T.elevHi, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Área de texto — abre formulario sin mic */}
          <button
            onClick={() => setShowForm(true)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14.5 }}>Añadir producto…</span>
          </button>
          {/* Botón mic — abre formulario Y activa reconocimiento de voz */}
          <button
            onClick={() => { setShowForm(true); if (hasSpeech) { voiceModeRef.current = true; setVoiceMode(true); startListening(); } }}
            style={{
              width: 40, height: 40, borderRadius: 14,
              background: isListening ? T.mustard : T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0,
              transform: isListening ? 'scale(1.1)' : 'scale(1)',
              transition: 'background .2s, transform .2s',
            }}
          >
            <Ico.Mic s={18} c="#fff" w={2}/>
          </button>
        </div>
      </div>

      {/* Add form bottom sheet */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => { stopListening(); voiceModeRef.current = false; setVoiceMode(false); setShowForm(false); setSuggestions([]); }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: T.cream, borderRadius: '24px 24px 0 0',
            padding: '14px 0 40px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
            maxWidth: 480, margin: '0 auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>
            {voiceMode && (
              <div style={{
                margin: '0 16px 12px',
                background: T.primary + '18',
                borderRadius: 12, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{isListening ? '🔴' : '⏳'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>
                      {isListening ? 'Escuchando…' : 'Procesando…'}
                    </div>
                    {voiceToast && (
                      <div style={{ fontSize: 11.5, color: T.muted }}>✓ {voiceToast} agregado</div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { voiceModeRef.current = false; setVoiceMode(false); stopListening(); }}
                  style={{
                    padding: '5px 12px', borderRadius: 99, border: `1px solid ${T.primary}`,
                    background: 'transparent', color: T.primary, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: T.sans,
                  }}
                >
                  Detener
                </button>
              </div>
            )}
            <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 19, letterSpacing: -0.3, color: T.ink }}>Añadir producto</span>
              <button
                onClick={() => { stopListening(); voiceModeRef.current = false; setVoiceMode(false); setShowForm(false); setSuggestions([]); }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.elev, border: 'none', cursor: 'pointer' }}
              >
                <Ico.X s={14} c={T.ink}/>
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                {/* Artículo label + mic toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Artículo *</label>
                  {hasSpeech && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                        background: isListening ? T.primary : T.paper,
                        color: isListening ? '#fff' : T.muted,
                        fontSize: 11.5, fontWeight: 600, fontFamily: T.sans,
                        boxShadow: isListening ? 'none' : T.elev,
                        transition: 'background .2s',
                      }}
                    >
                      <Ico.Mic s={13} c={isListening ? '#fff' : T.muted} w={2}/>
                      {isListening ? 'Escuchando…' : 'Dictar'}
                    </button>
                  )}
                </div>
                <input
                  type="text" style={{ ...inp, outline: isListening ? `2px solid ${T.primary}` : 'none' }}
                  placeholder={isListening ? '🎙 Habla ahora…' : '¿Qué necesitas?'}
                  value={form.articulo} onChange={e => handleArticuloChange(e.target.value)}
                  autoFocus={!isListening} required
                />
                {suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 200,
                    background: T.paper, borderRadius: 12, boxShadow: T.elevHi,
                    overflow: 'hidden', marginBottom: 4,
                  }}>
                    {suggestions.map((s, i) => (
                      <div key={i} onMouseDown={() => selectSuggestion(s)} style={{
                        padding: '11px 14px', cursor: 'pointer',
                        borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 18 }}>{CAT_META[s.categoria]?.emoji || '📦'}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{s.articulo}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{s.categoria}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: '0 0 80px' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Cantidad</label>
                  <input type="text" style={{ ...inp, textAlign: 'center' }} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Categoría</label>
                  <select style={{ ...inp, paddingRight: 8 }} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={adding} style={{
                height: 52, borderRadius: 14, background: T.primary, color: '#fff',
                fontFamily: T.sans, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                opacity: adding ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
              }}>
                {adding && <Spinner size={18} color="#fff"/>}
                Agregar artículo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast: compras completadas */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: T.ink, color: '#fff', borderRadius: 20,
          padding: '14px 24px', boxShadow: T.elevHi,
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          ¡Compras listas!
        </div>
      )}
    </div>
  );
}

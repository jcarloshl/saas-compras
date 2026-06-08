import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { recipesAPI } from '../api';
import { Ico, Spinner } from '../theme';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { T } = useTheme();

  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [searched, setSearched]     = useState(false);
  const [searchError, setSearchError] = useState('');

  const [selected, setSelected]     = useState(null);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    setSearched(false);
    try {
      const res = await recipesAPI.search(query.trim());
      setResults(res.data.results || []);
      setSearched(true);
    } catch (err) {
      if (err.response?.data?.code === 'no_credentials') {
        setSearchError('Las credenciales de Edamam no están configuradas. Agrega EDAMAM_APP_ID y EDAMAM_APP_KEY al entorno.');
      } else {
        setSearchError('No se pudo buscar. Revisa tu conexión e intenta de nuevo.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleCreateList = async () => {
    if (!selected) return;
    setCreating(true);
    setCreateError('');
    try {
      const createRes = await recipesAPI.toList(selected.label, selected.ingredientes || []);
      navigate(`/lists/${createRes.data.list_id}`);
    } catch {
      setCreateError('Error al crear la lista. Intenta de nuevo.');
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: T.sans, color: T.ink, maxWidth: 480, margin: '0 auto', boxSizing: 'border-box', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.paper, boxShadow: T.elev, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Ico.ChevL s={20} c={T.ink} w={2}/>
        </button>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, color: T.ink }}>Recetas</div>
          <div style={{ fontSize: 12, color: T.muted }}>Busca y arma tu lista de ingredientes</div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ padding: '20px 20px 0', display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ej: pollo al horno, pasta..."
          style={{
            flex: 1, background: T.paper, border: 'none', borderRadius: 14,
            padding: '13px 16px', fontSize: 15, color: T.ink,
            boxShadow: T.elev, fontFamily: T.sans, boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          style={{
            width: 48, height: 48, borderRadius: 14, background: T.primary,
            border: 'none', cursor: searching || !query.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: searching || !query.trim() ? 0.5 : 1, flexShrink: 0,
          }}
        >
          {searching ? <Spinner size={18} color="#fff"/> : <Ico.Search s={18} c="#fff" w={2}/>}
        </button>
      </form>

      {searchError && (
        <div style={{ margin: '12px 20px 0', background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.5 }}>
          {searchError}
        </div>
      )}

      {/* Results */}
      <div style={{ padding: '16px 20px 0' }}>
        {searching ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
            <Spinner size={32}/>
            <span style={{ fontSize: 13, color: T.muted }}>Buscando recetas…</span>
          </div>
        ) : searched && results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ fontSize: 48 }}>🍽</div>
            <p style={{ marginTop: 12, fontWeight: 600, fontSize: 16, color: T.ink }}>Sin resultados</p>
            <p style={{ color: T.muted, fontSize: 13.5 }}>Prueba con otro término de búsqueda</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 14, marginTop: 0 }}>
              {results.length} recetas encontradas
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {results.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => { setSelected(recipe); setCreateError(''); }}
                  style={{
                    background: T.paper, borderRadius: 18, overflow: 'hidden',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    boxShadow: T.elev, padding: 0,
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={recipe.label}
                      style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '10px 12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.3, marginBottom: 4 }}>
                      {recipe.label}
                    </div>
                    {recipe.source && (
                      <div style={{ fontSize: 11, color: T.muted }}>{recipe.source}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56 }}>🥘</div>
            <p style={{ marginTop: 14, fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, letterSpacing: -0.3 }}>
              Busca una receta
            </p>
            <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.6, maxWidth: 280, margin: '8px auto 0' }}>
              Escribe el nombre de un plato y te mostramos los ingredientes para crear tu lista de compras.
            </p>
          </div>
        )}
      </div>

      {/* Bottom-sheet: detalle de receta */}
      {selected && (
        <div
          onClick={() => { if (!creating) setSelected(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.cream, borderRadius: '26px 26px 0 0', width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
          >
            {/* Grabber */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 8px', flexShrink: 0 }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: T.hairline }}/>
            </div>

            {/* Imagen */}
            {selected.image && (
              <div style={{ margin: '0 16px 14px', borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={selected.image}
                  alt={selected.label}
                  style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            {/* Título */}
            <div style={{ padding: '0 20px 10px', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, color: T.ink, lineHeight: 1.25 }}>
                {selected.label}
              </h2>
              {selected.source && (
                <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{selected.source}</div>
              )}
            </div>

            {/* Ingredientes (scrollable) */}
            <div style={{ padding: '0 16px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
                Ingredientes ({(selected.ingredientLines || []).length})
              </div>
              <div style={{ background: T.paper, borderRadius: 14, overflow: 'hidden', boxShadow: T.elev }}>
                {(selected.ingredientLines || []).map((line, i) => (
                  <div
                    key={i}
                    style={{ padding: '10px 14px', fontSize: 13.5, color: T.ink, borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`, lineHeight: 1.4 }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 16px 36px', flexShrink: 0 }}>
              {createError && (
                <div style={{ marginBottom: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
                  {createError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelected(null)}
                  disabled={creating}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `1px solid ${T.hairline}`, fontSize: 13.5, fontWeight: 600, color: T.ink, background: 'transparent', cursor: creating ? 'default' : 'pointer', fontFamily: T.sans }}
                >
                  Cerrar
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={creating}
                  style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: T.primary, color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: creating ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: T.sans }}
                >
                  {creating ? <Spinner size={18} color="#fff"/> : <Ico.Plus s={16} c="#fff" w={2.4}/>}
                  {creating ? 'Creando lista…' : 'Crear lista de compras'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

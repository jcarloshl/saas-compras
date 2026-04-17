import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { listsAPI, itemsAPI } from '../api';

const CATEGORIAS = [
  'Frutas y Verduras',
  'Carnes y Pescados',
  'Lácteos y Huevos',
  'Panadería',
  'Bebidas',
  'Limpieza',
  'Higiene Personal',
  'Congelados',
  'Enlatados y Conservas',
  'Snacks y Dulces',
  'Otros',
];

const CATEGORIA_COLORS = {
  'Frutas y Verduras': 'success',
  'Carnes y Pescados': 'danger',
  'Lácteos y Huevos': 'warning',
  'Panadería': 'warning',
  'Bebidas': 'info',
  'Limpieza': 'primary',
  'Higiene Personal': 'primary',
  'Congelados': 'info',
  'Enlatados y Conservas': 'secondary',
  'Snacks y Dulces': 'danger',
  'Otros': 'secondary',
};

export default function ListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listInfo, setListInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, comprados: 0, pendientes: 0, porcentaje: 0 });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form nuevo artículo
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    articulo: '',
    cantidad: '1',
    categoria: 'Otros',
    agregado_por: user?.username || '',
  });
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Filtro por categoría
  const [filterCat, setFilterCat] = useState('Todas');
  const [showToast, setShowToast] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Carga crítica: artículos y stats de la lista
      const itemsRes = await itemsAPI.getAll(id);
      setItems(itemsRes.data.items);
      setStats(itemsRes.data.stats);
    } catch {
      setError('Error al cargar la lista');
    } finally {
      setLoading(false);
    }
    // Nombre de la lista (no crítico — solo para mostrar en la navbar)
    try {
      const listRes = await listsAPI.get(id);
      setListInfo(listRes.data);
    } catch {
      // ignorar; la navbar mostrará el valor por defecto 'Lista'
    }
    // Catálogo para autocompletar (no crítico — no bloquea la carga de artículos)
    try {
      const catalogRes = await itemsAPI.getCatalog(id);
      setCatalog(catalogRes.data);
    } catch {
      // ignorar
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Autocompletar
  const handleArticuloChange = (value) => {
    setForm(f => ({ ...f, articulo: value }));
    if (value.length >= 1) {
      const filtered = catalog.filter(c =>
        c.articulo.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item) => {
    setForm(f => ({ ...f, articulo: item.articulo, categoria: item.categoria }));
    setSuggestions([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.articulo.trim()) return;
    setAdding(true);
    try {
      const res = await itemsAPI.add(
        id,
        form.articulo.trim(),
        form.cantidad,
        form.categoria,
        form.agregado_por
      );
      setItems(prev => [...prev, res.data]);
      setStats(prev => ({
        total: prev.total + 1,
        pendientes: prev.pendientes + 1,
        comprados: prev.comprados,
        porcentaje: prev.total + 1 > 0
          ? Math.round(prev.comprados / (prev.total + 1) * 100)
          : 0,
      }));
      // Agregar al catálogo local si no existe ya (para autocompletar inmediatamente)
      const nuevoArticulo = form.articulo.trim();
      setCatalog(prev => {
        if (prev.some(c => c.articulo.toLowerCase() === nuevoArticulo.toLowerCase())) return prev;
        return [...prev, { articulo: nuevoArticulo, categoria: form.categoria }]
          .sort((a, b) => a.articulo.toLowerCase().localeCompare(b.articulo.toLowerCase()));
      });
      setForm(f => ({ ...f, articulo: '', cantidad: '1', categoria: 'Otros' }));
      setSuggestions([]);
    } catch {
      setError('Error al agregar artículo');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item) => {
    const newVal = !item.comprado;
    // Actualizar UI optimistamente
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, comprado: newVal } : i));
    setStats(prev => {
      const comprados = newVal ? prev.comprados + 1 : prev.comprados - 1;
      const pendientes = prev.total - comprados;
      if (pendientes === 0 && prev.total > 0) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      return {
        ...prev,
        comprados,
        pendientes,
        porcentaje: prev.total > 0 ? Math.round(comprados / prev.total * 100) : 0,
      };
    });
    try {
      await itemsAPI.update(id, item.id, { comprado: newVal });
    } catch {
      // Revertir si falla
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, comprado: item.comprado } : i));
    }
  };

  const handleDelete = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setStats(prev => {
      const comprados = item.comprado ? prev.comprados - 1 : prev.comprados;
      const total = prev.total - 1;
      return {
        total,
        comprados,
        pendientes: total - comprados,
        porcentaje: total > 0 ? Math.round(comprados / total * 100) : 0,
      };
    });
    try {
      await itemsAPI.delete(id, itemId);
    } catch {
      fetchData(); // Refetch si falla
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

  // Normaliza categorías desconocidas (ej: del backend) a 'Otros'
  const normalizarCategoria = (cat) =>
    CATEGORIAS.includes(cat) ? cat : 'Otros';

  // Items filtrados por categoría
  const filteredItems = filterCat === 'Todas'
    ? items
    : items.filter(i => normalizarCategoria(i.categoria) === filterCat);

  // Agrupar por categoría para mostrar
  const grouped = filteredItems.reduce((acc, item) => {
    const cat = normalizarCategoria(item.categoria);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="spinner-center mt-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary mb-3">
        <div className="container">
          <button
            className="btn btn-link text-white p-0 me-3"
            onClick={() => navigate('/dashboard')}
          >
            ← Volver
          </button>
          <span className="navbar-brand mb-0">
            🛒 {listInfo?.name || 'Lista'}
          </span>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={handleReset}
          >
            Vaciar
          </button>
        </div>
      </nav>

      <div className="container pb-5">
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* Stats bar */}
        <div className="stats-bar d-flex flex-wrap gap-3 align-items-center mb-3">
          <span className="badge bg-secondary">{stats.total} total</span>
          <span className="badge bg-success">{stats.comprados} comprados</span>
          <span className="badge bg-warning text-dark">{stats.pendientes} pendientes</span>
          <div className="flex-fill">
            <div className="progress">
              <div
                className="progress-bar bg-success"
                style={{ width: `${stats.porcentaje}%` }}
              />
            </div>
            <small className="text-muted">{stats.porcentaje}%</small>
          </div>
        </div>

        {/* Filtro por categoría */}
        <div className="d-flex gap-2 flex-wrap mb-3">
          {['Todas', ...CATEGORIAS].map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Formulario agregar */}
        <div className="card mb-4">
          <div className="card-body">
            {!showForm ? (
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => setShowForm(true)}
              >
                + Agregar artículo
              </button>
            ) : (
              <form onSubmit={handleAdd}>
                <div className="row g-2">
                  {/* Artículo con autocompletar */}
                  <div className="col-12 col-sm-5 position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Artículo *"
                      value={form.articulo}
                      onChange={e => handleArticuloChange(e.target.value)}
                      autoFocus
                      required
                    />
                    {suggestions.length > 0 && (
                      <ul className="list-group position-absolute w-100 shadow-sm"
                        style={{ zIndex: 200, top: '100%' }}>
                        {suggestions.map((s, i) => (
                          <li
                            key={i}
                            className="list-group-item list-group-item-action py-1 small"
                            style={{ cursor: 'pointer' }}
                            onMouseDown={() => selectSuggestion(s)}
                          >
                            {s.articulo}
                            <span className="text-muted ms-2">({s.categoria})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="col-auto">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cantidad"
                      value={form.cantidad}
                      onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                      style={{ width: '8ch' }}
                    />
                  </div>
                  <div className="col col-sm-3">
                    <div className="input-group">
                      <span className="input-group-text">Categoría</span>
                      <select
                        className="form-select"
                        value={form.categoria}
                        onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                      >
                        {CATEGORIAS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-12 col-sm-2 d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-success flex-fill"
                      disabled={adding}
                    >
                      {adding ? <span className="spinner-border spinner-border-sm" /> : 'Agregar'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => { setShowForm(false); setSuggestions([]); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Items agrupados */}
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <h6>No hay artículos</h6>
            <p className="small">Agrega el primero usando el botón de arriba</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="mb-3">
              <h6 className="text-muted small fw-semibold text-uppercase mb-2">
                <span className={`badge bg-${CATEGORIA_COLORS[cat] || 'secondary'} me-2`}>
                  {catItems.length}
                </span>
                {cat}
              </h6>
              <div className="card">
                <ul className="list-group list-group-flush">
                  {catItems.map(item => (
                    <li
                      key={item.id}
                      className={`list-group-item item-row d-flex align-items-center gap-2 py-2 ${item.comprado ? 'comprado' : ''}`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={item.comprado}
                        onChange={() => handleToggle(item)}
                      />
                      {/* Nombre + cantidad */}
                      <div className="flex-fill">
                        <span className="item-name">{item.articulo}</span>
                        {item.cantidad && item.cantidad !== '1' && (
                          <span className="text-muted small ms-2">× {item.cantidad}</span>
                        )}
                        {item.agregado_por && (
                          <span className="text-muted small ms-2">— {item.agregado_por}</span>
                        )}
                      </div>
                      {/* Eliminar */}
                      <button
                        className="btn btn-link text-danger p-0"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar"
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast: compras completadas */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1055,
            minWidth: '220px',
            textAlign: 'center',
          }}
        >
          <div className="toast show align-items-center text-bg-success border-0 shadow-lg">
            <div className="d-flex justify-content-center align-items-center gap-2 p-3">
              <span style={{ fontSize: '1.4rem' }}>🎉</span>
              <strong>¡Compras listas!</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

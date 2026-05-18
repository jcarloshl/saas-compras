import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { historyAPI } from '../api';

const CATEGORIA_COLORS = {
  'Frutas y Verduras': 'success',
  'Carnes y Pescados': 'danger',
  'Lácteos y Huevos': 'warning',
  'Panadería': 'warning',
  'Almacén / Despensa': 'secondary',
  'Bebidas': 'info',
  'Limpieza del Hogar': 'primary',
  'Higiene Personal': 'primary',
  'Snacks y Dulces': 'warning',
  'Congelados': 'info',
  'Otros': 'secondary',
};

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
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatMonto(val) {
  return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [period, setPeriod] = useState('all');
  const [items, setItems] = useState([]);
  const [montoTotal, setMontoTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const periodOptions = getPeriodOptions();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Agrupar por categoría
  const byCategory = items.reduce((acc, item) => {
    const cat = item.categoria || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(byCategory).sort();

  return (
    <div>
      <nav className="navbar navbar-dark bg-primary mb-4">
        <div className="container">
          <button
            className="btn btn-link text-white text-decoration-none p-0 navbar-brand"
            onClick={() => navigate('/dashboard')}
          >
            ← Mis Listas
          </button>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small">Hola, {user?.username}</span>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">Historial de compras</h5>
          <select
            className="form-select form-select-sm w-auto"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="card text-center py-5">
            <div className="card-body">
              <div style={{ fontSize: '2.5rem' }}>🛍️</div>
              <h6 className="mt-2">Sin artículos comprados en este período</h6>
              <p className="text-muted small">
                Los artículos aparecen aquí cuando los marcas como comprados en tus listas.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="alert alert-light border mb-3 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>
                <strong>{items.length}</strong> artículo{items.length !== 1 ? 's' : ''} comprado{items.length !== 1 ? 's' : ''}
              </span>
              {montoTotal != null && (
                <span className="fw-semibold text-success">
                  💰 Total: ${formatMonto(montoTotal)}
                </span>
              )}
            </div>

            {categories.map(cat => (
              <div key={cat} className="mb-4">
                <h6 className="d-flex align-items-center gap-2 mb-2">
                  <span className={`badge bg-${CATEGORIA_COLORS[cat] || 'secondary'}`}>{cat}</span>
                  <span className="text-muted small fw-normal">{byCategory[cat].length} artículo{byCategory[cat].length !== 1 ? 's' : ''}</span>
                </h6>
                <div className="list-group">
                  {byCategory[cat].map(item => (
                    <div key={item.id} className="list-group-item list-group-item-action py-2 px-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="fw-semibold">{item.articulo}</span>
                          {item.cantidad && item.cantidad !== '1' && (
                            <span className="text-muted ms-2 small">× {item.cantidad}</span>
                          )}
                          {item.agregado_por && (
                            <span className="text-muted ms-2 small">— {item.agregado_por}</span>
                          )}
                        </div>
                        <div className="text-end">
                          <div className="text-muted small">{formatDate(item.fecha_compra)}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.list_name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

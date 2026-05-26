import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

// Páginas
const LoginPage          = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage      = React.lazy(() => import('./pages/DashboardPage'));
const ListPage           = React.lazy(() => import('./pages/ListPage'));
const ShoppingModePage   = React.lazy(() => import('./pages/ShoppingModePage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = React.lazy(() => import('./pages/ResetPasswordPage'));
const HistoryPage        = React.lazy(() => import('./pages/HistoryPage'));
const CatalogPage        = React.lazy(() => import('./pages/CatalogPage'));
const FamilyPage         = React.lazy(() => import('./pages/FamilyPage'));
const BudgetPage         = React.lazy(() => import('./pages/BudgetPage'));
const ProductDetailPage  = React.lazy(() => import('./pages/ProductDetailPage'));

const Fallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#F7F1E8',
    fontFamily: 'Manrope,sans-serif', color: '#7A6A5C', fontSize: 14,
  }}>
    Cargando…
  </div>
);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Fallback />;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              {/* /lists/:id/shop debe ir ANTES de /lists/:id */}
              <Route path="/lists/:id/shop" element={<ProtectedRoute><ShoppingModePage /></ProtectedRoute>} />
              <Route path="/lists/:id" element={<ProtectedRoute><ListPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
              <Route path="/family" element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />
              <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
              <Route path="/product/:articulo" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

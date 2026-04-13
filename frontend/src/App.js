import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Páginas (a crear)
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ListPage = React.lazy(() => import('./pages/ListPage'));

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container mt-5 text-center">Cargando...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={<div className="container mt-5 text-center">Cargando...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lists/:id"
              element={
                <ProtectedRoute>
                  <ListPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

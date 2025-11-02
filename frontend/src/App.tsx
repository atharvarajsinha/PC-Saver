import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Databases } from './pages/Databases';
import { DatabaseForm } from './pages/DatabaseForm';
import { Test } from './pages/Test';
import { Compare } from './pages/Compare';
import { Profile } from './pages/Profile';
import { Homepage } from './pages/Homepage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />

            <Route
              path="/databases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Databases />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/databases/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DatabaseForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/databases/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DatabaseForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/test"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Test />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Compare />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import '@/App.css';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { api } from '@/api';
import { Create } from '@/pages/Create';
import { Dashboard } from '@/pages/Dashboard';
import { Detail } from '@/pages/Detail';
import { Login } from '@/pages/Login';
import { User as UserType } from '@/types';

interface RequireAuthProps {
  user: UserType | null;
  children: ReactNode;
}

// Renders children if logged in, redirects if not
function RequireAuth({ user, children }: RequireAuthProps) {
  if (user === null) {
    return <Navigate to="/login" replace />; // `replace` prevents a redirect loop if back button used
  }
  return <>{children}</>;
}

// Root component
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

// Holds auth state and defines all routes
function AppRoutes() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const wasLoggedIn = useRef(false);

  const navigate = useNavigate();

  // Check for existing session so a page refresh doesn't log the user out
  useEffect(() => {
    api<UserType>('GET', '/user')
      .then((data) => {
        setUser(data);
        wasLoggedIn.current = true;
      })
      .catch(() => {
        if (wasLoggedIn.current) {
          // Session expired
          setUser(null);
          navigate('/login?expired=1');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Centralized logout so the session-check effect doesn't race and
  // show the "session expired" banner after an intentional sign-out
  async function logout() {
    wasLoggedIn.current = false;
    await api('POST', '/logout');
    setUser(null);
    navigate('/login');
  }

  if (loading) return null; // Waits until session check finishes

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth user={user}>
            <Dashboard user={user} onLogout={logout} />
          </RequireAuth>
        }
      />
      <Route
        path="/login"
        element={
          <Login user={user} setUser={setUser} />
        }
      />
      <Route
        path="/policies/:id"
        element={
          <RequireAuth user={user}>
            <Detail user={user} onLogout={logout} />
          </RequireAuth>
        }
      />
      <Route
        path="/create"
        element={
          <RequireAuth user={user}>
            <Create user={user} onLogout={logout} />
          </RequireAuth>
        }
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;

import '@/App.css';

import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { api } from '@/api';
import { Create } from '@/pages/Create';
import { Dashboard } from '@/pages/Dashboard';
import { Detail } from '@/pages/Detail';
import { Login } from '@/pages/Login';
import { User as UserType } from '@/types';

interface RequireAuthProps {
  user: UserType | null;
  children: React.ReactNode;
}

// Renders children if logged in, redirects if not
function RequireAuth({ user, children }: RequireAuthProps) {
  if (user === null) {
    return <Navigate to="/login" replace />; // `replace` prevents a redirect loop if back button used
  }
  return <>{children}</>;
}

// Root component; sets up the router.
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
          // Session expired. Login page will show the banner
          setUser(null);
          navigate('/login?expired=1');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Spoof user for development
  // useEffect(() => {
  //   setUser({ id: 1, name: 'Dev User', email: 'dev@example.com' });
  //   setLoading(false);
  // }, []);

  if (loading) return null; // Waits until session check finishes

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth user={user}>
            <Dashboard user={user} setUser={setUser} />
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
            <Detail user={user} setUser={setUser} />
          </RequireAuth>
        }
      />
      <Route
        path="/create"
        element={
          <RequireAuth user={user}>
            <Create user={user} setUser={setUser} />
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

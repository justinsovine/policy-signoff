import './App.css';

import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { api } from './api';
import { Create } from './pages/Create.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Detail } from './pages/Detail.tsx';
import { Login } from './pages/Login.tsx';
import { User as UserType } from './types';

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
  const [wasLoggedIn, setWasLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Check for existing session so a page refresh doesn't log the user out
  // useEffect(() => {
  //   api<UserType>('GET', '/user')
  //     .then((u) => {
  //       setUser(u);
  //       setWasLoggedIn(true); // Not used yet
  //     })
  //     .catch(() => {
  //       if (wasLoggedIn) {
  //         // Session expired. Login page will show the banner
  //         navigate('/login?expired=1');
  //       }
  //     })
  //     .finally(() => setLoading(false));
  // }, []); // [] means don't re-run this when state changes, only run once

  useEffect(() => {
    setUser({ id: 1, name: 'Dev User', email: 'dev@example.com' });
    setLoading(false);
  }, []);

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

import './App.css';
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Detail } from './pages/Detail.tsx';
import { Create } from './pages/Create.tsx';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/policies/:id" element={<Detail />} />
          <Route path="/create" element={<Create />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App;

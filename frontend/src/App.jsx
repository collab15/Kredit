import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard     from './pages/Dashboard';
import Users         from './pages/Users';
import Organizations from './pages/Organizations';
import Favours       from './pages/Favours';
import Transactions  from './pages/Transactions';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg text-slate-200">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/users"         element={<Users />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/favours"       element={<Favours />} />
            <Route path="/transactions"  element={<Transactions />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0d1117',
            border: '1px solid #1e2a3a',
            color: '#e2e8f0',
            fontFamily: 'Sora, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#07090f' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#07090f' } },
        }}
      />
    </BrowserRouter>
  );
}
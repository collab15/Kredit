import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Topbar from './components/Topbar';

import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Organizations from './pages/Organizations';
import Favours from './pages/Favours';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-white relative overflow-hidden">

        {/* Ambient background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full" />

          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[140px] rounded-full" />
        </div>

        {/* Noise overlay */}
        <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <Topbar />

        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/favours" element={<Favours />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16161F',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

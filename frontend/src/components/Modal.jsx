import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-surface border border-bdr rounded-2xl w-full ${maxWidth} animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh]`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-bdr sticky top-0 bg-surface z-10">
          <h2 className="font-semibold text-sm tracking-wide" style={{ color: '#1C0F06' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 transition-all"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { usersApi } from '../api/client';

export default function UserLookupInput({ value, onChange, onResolved, excludeId, placeholder = 'Enter username…', required }) {
  const [status, setStatus] = useState('idle');
  const [info,   setInfo]   = useState(null);

  useEffect(() => {
    onResolved?.(null);
    setInfo(null);
    if (!value.trim()) { setStatus('idle'); return; }
    setStatus('loading');
    const t = setTimeout(async () => {
      try {
        const { data } = await usersApi.lookup(value.trim().toLowerCase());
        if (excludeId && data.user_id === excludeId) {
          setStatus('notfound'); setInfo(null); onResolved?.(null); return;
        }
        setInfo(data); setStatus('found'); onResolved?.(data);
      } catch {
        setInfo(null); setStatus('notfound'); onResolved?.(null);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [value]);

  const borderCls =
    status === 'found'    ? '!border-green-500' :
    status === 'notfound' ? '!border-danger'     : '';

  return (
    <div>
      <div className="relative">
        <input
          className={`k-input pr-9 ${borderCls}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {status === 'loading' && (
            <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'found' && <CheckCircle size={14} className="text-green-500" />}
          {status === 'notfound' && <XCircle size={14} className="text-danger" />}
        </div>
      </div>
      {status === 'found' && info && (
        <p className="text-xs text-green-600 mt-1 ml-1 font-medium">
          {info.first_name ? `${info.first_name} ${info.last_name || ''}`.trim() : info.username}
          {info.balance != null ? ` — ⚡ ${parseFloat(info.balance).toLocaleString()}` : ''}
        </p>
      )}
      {status === 'notfound' && (
        <p className="text-xs text-danger mt-1 ml-1">User not found</p>
      )}
    </div>
  );
}

import { useState } from 'react';
import api from '../api';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@tfood.ng');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.data.user.role !== 'admin') {
        setError('Only administrators can access this panel');
        return;
      }
      localStorage.setItem('tfood_admin_token', res.data.data.token);
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1a1a2e' }}>
      <div className="card" style={{ width: 400 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8, color: '#ff6b35' }}>TFood Admin</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>Sign in to manage the platform</p>
        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 16 }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

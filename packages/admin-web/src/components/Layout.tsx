import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export default function Layout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const linkStyle = (isActive: boolean) => ({
    display: 'block',
    padding: '10px 20px',
    color: isActive ? '#ff6b35' : '#fff',
    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderRadius: '6px',
    marginBottom: '4px',
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 240, background: '#1a1a2e', color: '#fff', padding: '20px 0' }}>
        <div style={{ padding: '0 20px', marginBottom: 30, fontSize: 22, fontWeight: 700 }}>
          TFood Admin
        </div>
        <div style={{ padding: '0 12px' }}>
          {[
            { to: '/', label: 'Dashboard' },
            { to: '/vendors', label: 'Vendors' },
            { to: '/users', label: 'Users' },
            { to: '/disputes', label: 'Disputes' },
          ].map((link) => (
            <NavLink key={link.to} to={link.to} end style={({ isActive }) => linkStyle(isActive)}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button onClick={onLogout} className="btn btn-secondary" style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

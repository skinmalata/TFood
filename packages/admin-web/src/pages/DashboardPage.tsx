import { useEffect, useState } from 'react';
import api from '../api';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  if (!data) return <div className="card">Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Dashboard</h1>
      <div className="grid">
        <div className="stat-card"><div className="label">Total Users</div><div className="value">{data.totalUsers}</div></div>
        <div className="stat-card"><div className="label">Total Vendors</div><div className="value">{data.totalVendors}</div></div>
        <div className="stat-card"><div className="label" style={{ color: '#856404' }}>Pending Vendors</div><div className="value" style={{ color: '#856404' }}>{data.pendingVendors}</div></div>
        <div className="stat-card"><div className="label" style={{ color: '#0c5460' }}>Active Orders</div><div className="value" style={{ color: '#0c5460' }}>{data.activeOrders}</div></div>
        <div className="stat-card"><div className="label">Total Revenue</div><div className="value">₦{Number(data.totalRevenue).toLocaleString()}</div></div>
        <div className="stat-card"><div className="label" style={{ color: '#721c24' }}>Open Disputes</div><div className="value" style={{ color: '#721c24' }}>{data.openDisputes}</div></div>
      </div>

      {data.dailyRevenue?.length > 0 && (
        <div className="card">
          <h2>Revenue (Last 7 Days)</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
            {data.dailyRevenue.map((d: any) => (
              <div key={d.date} style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(d.date).toLocaleDateString('en-NG', { weekday: 'short' })}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>₦{Number(d.revenue).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

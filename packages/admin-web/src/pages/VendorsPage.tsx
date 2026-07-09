import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const statusBadge: Record<string, string> = {
  pending: 'badge badge-warning',
  vetting: 'badge badge-info',
  approved: 'badge badge-success',
  rejected: 'badge badge-danger',
  suspended: 'badge badge-secondary',
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const fetch = () => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get('/admin/vendors', { params }).then((res) => setVendors(res.data.data)).catch(console.error);
  };

  useEffect(() => { fetch(); }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/admin/vendors/${id}/status`, { status });
    fetch();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Vendors</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'pending', 'vetting', 'approved', 'rejected', 'suspended'].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Business</th><th>Owner</th><th>Email</th><th>Cuisine</th><th>Rating</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link to={`/vendors/${v.id}`} style={{ fontWeight: 600, color: '#ff6b35' }}>{v.business_name}</Link>
                </td>
                <td>{v.first_name} {v.last_name}</td>
                <td>{v.email}</td>
                <td>{v.cuisine_type}</td>
                <td>★ {v.rating}</td>
                <td><span className={statusBadge[v.status] || ''}>{v.status}</span></td>
                <td>
                  <select
                    value={v.status}
                    onChange={(e) => updateStatus(v.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="vetting">Vetting</option>
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="suspended">Suspend</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

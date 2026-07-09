import { useEffect, useState } from 'react';
import api from '../api';

const statusBadge: Record<string, string> = {
  open: 'badge badge-danger',
  under_review: 'badge badge-warning',
  resolved: 'badge badge-success',
  dismissed: 'badge badge-secondary',
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const fetch = () => {
    const params: any = {};
    if (filter) params.status = filter;
    api.get('/admin/disputes', { params }).then((res) => setDisputes(res.data.data)).catch(console.error);
  };

  useEffect(() => { fetch(); }, [filter]);

  const resolve = async (id: number, status: string, adminNotes: string) => {
    await api.patch(`/admin/disputes/${id}/resolve`, { status, adminNotes });
    fetch();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Disputes</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'open', 'under_review', 'resolved', 'dismissed'].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr><th>Order</th><th>Raised By</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id}>
                <td style={{ fontFamily: 'monospace' }}>{d.order_number}</td>
                <td>{d.first_name} {d.last_name}</td>
                <td>{d.reason}</td>
                <td><span className={statusBadge[d.status] || ''}>{d.status}</span></td>
                <td>{new Date(d.created_at).toLocaleDateString()}</td>
                <td>
                  {d.status === 'open' || d.status === 'under_review' ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => {
                        const notes = prompt('Admin notes:');
                        if (notes !== null) resolve(d.id, 'resolved', notes);
                      }}>Resolve</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => resolve(d.id, 'dismissed', '')}>Dismiss</button>
                    </div>
                  ) : <span style={{ color: '#666', fontSize: 13 }}>Closed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

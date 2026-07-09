import { useEffect, useState } from 'react';
import api from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('');

  const fetch = () => {
    const params: any = {};
    if (roleFilter) params.role = roleFilter;
    api.get('/admin/users', { params }).then((res) => setUsers(res.data.data)).catch(console.error);
  };

  useEffect(() => { fetch(); }, [roleFilter]);

  const toggleStatus = async (id: number) => {
    await api.patch(`/admin/users/${id}/toggle-status`);
    fetch();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Users</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'consumer', 'vendor', 'admin'].map((r) => (
          <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter(r)}>
            {r || 'All'}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-info' : u.role === 'vendor' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span></td>
                <td>{u.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleStatus(u.id)}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

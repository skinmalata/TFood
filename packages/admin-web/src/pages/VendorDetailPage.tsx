import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function VendorDetailPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [vendorRes, docsRes] = await Promise.all([
        api.get(`/vendors/public/${id}`),
        api.get(`/admin/vendors/${id}/documents`),
      ]);
      setVendor({ ...vendorRes.data.data, documents: docsRes.data.data });
    };
    fetchData().catch(console.error);
  }, [id]);

  if (!vendor) return <div className="card">Loading...</div>;

  return (
    <div>
      <Link to="/vendors" style={{ color: '#ff6b35', marginBottom: 16, display: 'block' }}>&larr; Back to Vendors</Link>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>{vendor.business_name}</h1>

      <div className="grid">
        <div className="card">
          <h2>Details</h2>
          <div style={{ lineHeight: 2 }}>
            <div><strong>Owner:</strong> {vendor.first_name} {vendor.last_name}</div>
            <div><strong>Cuisine:</strong> {vendor.cuisine_type}</div>
            <div><strong>Address:</strong> {vendor.business_address}</div>
            <div><strong>Rating:</strong> ★ {vendor.rating}</div>
            <div><strong>Total Orders:</strong> {vendor.totalOrders || vendor.total_orders}</div>
            <div><strong>Delivery Radius:</strong> {vendor.delivery_radius}km</div>
            <div><strong>Hours:</strong> {vendor.opening_hours} - {vendor.closing_hours}</div>
          </div>
        </div>
        <div className="card">
          <h2>Documents</h2>
          {vendor.documents?.length > 0 ? vendor.documents.map((d: any) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <div>
                <strong>{d.type.replace('_', ' ').toUpperCase()}</strong>
                <div style={{ fontSize: 12, color: '#666' }}>{d.verified_at ? 'Verified' : 'Pending'}</div>
              </div>
              <div>
                {!d.verified_at && (
                  <button className="btn btn-sm btn-primary" onClick={async () => {
                    await api.patch(`/admin/documents/${d.id}/verify`);
                    window.location.reload();
                  }}>Verify</button>
                )}
              </div>
            </div>
          )) : <p style={{ color: '#666' }}>No documents uploaded</p>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Menu Items ({vendor.menuItems?.length || 0})</h2>
        <table>
          <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Available</th><th>Prep Time</th></tr></thead>
          <tbody>
            {vendor.menuItems?.map((m: any) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>₦{Number(m.price).toLocaleString()}</td>
                <td>{m.category}</td>
                <td>{m.is_available ? <span className="badge badge-success">Yes</span> : <span className="badge badge-danger">No</span>}</td>
                <td>{m.preparation_time || '-'} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

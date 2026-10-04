import { api } from '@/lib/api';
import { Truck, MapPin, Package, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function DispatchDashboard() {
  const orders = await api.get('/orders').catch(() => []);
  // In a real app we would fetch drops. For this demo we'll use orders directly.
  const todayOrders = orders.filter((o: any) => new Date(o.deliveryDate).toDateString() === new Date().toDateString());

  const confirmedCount = todayOrders.filter((o: any) => o.status === 'CONFIRMED').length;
  const deliveredCount = todayOrders.filter((o: any) => o.status === 'DELIVERED').length;

  return (
    <div className="admin-theme" style={{ minHeight: '100vh', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Dispatch Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage drops, coordinate delivery runs, and monitor drivers.</p>
        </div>
        <Link href="/api/auth/logout" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Logout</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
              <Package size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Pending Dispatches</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{confirmedCount}</p>
        </div>
        
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '10px', color: '#10b981' }}>
              <CheckCircle size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Delivered Drops</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{deliveredCount}</p>
        </div>
      </div>

      <div className="premium-card">
        <h3 style={{ marginBottom: '16px' }}>Today&apos;s Runs</h3>
        {todayOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No orders scheduled for delivery today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todayOrders.map((order: any) => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{order.employee?.company?.name || 'Company Drop'}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>{order.address?.label || order.address?.address || 'HQ'}</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{order.lines?.reduce((sum: number, line: any) => sum + line.quantity, 0) || 1} items • Delivery Time: {order.deliveryTime}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', 
                    background: order.status === 'DELIVERED' ? '#d1fae5' : order.status === 'CONFIRMED' ? '#dbeafe' : '#f3f4f6', 
                    color: order.status === 'DELIVERED' ? '#059669' : order.status === 'CONFIRMED' ? '#2563eb' : '#4b5563' 
                  }}>
                    {order.status}
                  </span>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={order.status === 'DELIVERED'}>
                    <Truck size={14} /> Assign Driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

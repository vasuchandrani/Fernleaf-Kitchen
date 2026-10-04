import { api } from '@/lib/api';
import Link from 'next/link';
import { Users, ClipboardList, Utensils, Plus, DollarSign, TrendingUp } from 'lucide-react';

export default async function AdminDashboard() {
  const [companies, orders, dishes, invoices] = await Promise.all([
    api.get('/companies').catch(() => []),
    api.get('/orders').catch(() => []),
    api.get('/catalogue/dishes').catch(() => []),
    api.get('/invoices').catch(() => []),
  ]);

  const today = new Date().toISOString().split('T')[0];
  
  const todaysOrders = orders.filter((o: any) => o.deliveryDate.startsWith(today));

  const totalOrders = todaysOrders.length;
  const placedOrders = todaysOrders.filter((o: any) => o.status === 'PLACED').length;
  const confirmedOrders = todaysOrders.filter((o: any) => o.status === 'CONFIRMED').length;
  const totalRevenue = todaysOrders
    .filter((o: any) => o.status !== 'CANCELLED')
    .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    
  const unpaidInvoicesAmount = invoices
    .filter((inv: any) => !inv.isPaid)
    .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    
  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back to Fernleaf Kitchen Admin.</p>
        </div>
        <div className="page-heading-actions">
          <Link href="/admin/companies" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={20} /> New Order
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '10px', color: '#10b981' }}>
              <ClipboardList size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Today&apos;s Orders</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalOrders}</p>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
              <TrendingUp size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Today&apos;s Placed / Confirmed</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{placedOrders} / {confirmedOrders}</p>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '10px', color: '#f59e0b' }}>
              <DollarSign size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Unpaid Invoices</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>${(unpaidInvoicesAmount / 100).toFixed(2)}</p>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#fce7f3', borderRadius: '10px', color: '#ec4899' }}>
              <DollarSign size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Today&apos;s Gross Revenue</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>${(totalRevenue / 100).toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="premium-card">
          <h3 style={{ marginBottom: '16px' }}>Recent Orders</h3>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.slice(0, 5).map((o: any) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <p style={{ fontWeight: 500 }}>Order #{o.id}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.employee?.company?.name || 'Unknown'}</p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                    background: o.status === 'PLACED' ? '#dbeafe' : o.status === 'CONFIRMED' ? '#d1fae5' : o.status === 'DRAFT' ? '#f3f4f6' : '#fef2f2',
                    color: o.status === 'PLACED' ? '#2563eb' : o.status === 'CONFIRMED' ? '#059669' : o.status === 'DRAFT' ? '#4b5563' : '#ef4444',
                  }}>{o.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="premium-card">
          <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/admin/companies" className="btn-secondary" style={{ textDecoration: 'none', width: '100%' }}>
              <Plus size={18} /> Create New Order
            </Link>
            <Link href="/admin/companies" className="btn-secondary" style={{ textDecoration: 'none', width: '100%' }}>
              <Users size={18} /> Manage Companies
            </Link>
            <Link href="/admin/catalogue" className="btn-secondary" style={{ textDecoration: 'none', width: '100%' }}>
              <Utensils size={18} /> Manage Catalogue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

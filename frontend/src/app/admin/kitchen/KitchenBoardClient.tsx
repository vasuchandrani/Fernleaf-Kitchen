'use client';
import { useState, useMemo } from 'react';
import { Utensils, CheckCircle, Clock } from 'lucide-react';

export default function KitchenBoardClient({ initialOrders }: { initialOrders: any[] }) {
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    return initialOrders.filter(o => {
      const orderDate = new Date(o.deliveryDate).toISOString().slice(0, 10);
      if (dateFilter && orderDate !== dateFilter) return false;

      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      
      // Only show orders that are past Draft phase
      if (o.status === 'DRAFT' || o.status === 'CANCELLED') return false;

      return true;
    });
  }, [initialOrders, dateFilter, statusFilter]);

  let totalPrepUnits = 0;
  let doneUnits = 0;
  
  filteredOrders.forEach((o: any) => {
    o.lines?.forEach((l: any) => {
      l.combinations?.forEach((c: any) => {
        totalPrepUnits += c.quantity;
        if (c.kitchenStatus === 'DONE') {
          doneUnits += c.quantity;
        }
      });
    });
  });

  return (
    <div className="animate-fade-in">
      <div className="page-heading order-view-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Kitchen board</h1>
          <p className="page-subtitle">Monitor kitchen operations and cooking schedules.</p>
        </div>
        <div className="page-heading-actions order-view-filters">
        <div>
          <input
            className="input-field"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter kitchen orders by delivery date"
          />
        </div>
        <div>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter kitchen orders by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '10px', color: '#10b981' }}>
              <Utensils size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Total Prep Units</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalPrepUnits}</p>
        </div>
        
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
              <CheckCircle size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Units Completed</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{doneUnits}</p>
        </div>
        
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '10px', color: '#f59e0b' }}>
              <Clock size={22} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Pending Units</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalPrepUnits - doneUnits}</p>
        </div>
      </div>

      <div className="premium-card">
        <h3 style={{ marginBottom: '16px' }}>Order Details & Timeline</h3>
        {filteredOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No orders match your current filters.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', background: 'var(--bg-light)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Order #</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Company</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Date & Time</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Prep Units</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Order Status</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Kitchen Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => {
                  let orderUnits = 0;
                  let orderDone = 0;
                  order.lines?.forEach((l: any) => l.combinations?.forEach((c: any) => {
                    orderUnits += c.quantity;
                    if (c.kitchenStatus === 'DONE') orderDone += c.quantity;
                  }));

                  let kitchenStatus = 'NOT STARTED';
                  if (orderDone > 0 && orderDone < orderUnits) kitchenStatus = 'STARTED';
                  if (orderDone === orderUnits && orderUnits > 0) kitchenStatus = 'DONE';

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>#{order.id}</td>
                      <td style={{ padding: '14px 16px' }}>{order.employee?.company?.name || 'Unknown'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>
                        {new Date(order.deliveryDate).toLocaleDateString()} at {order.deliveryTime}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 500 }}>
                        {orderDone} / {orderUnits}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                         <span style={{ 
                            fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', 
                            background: order.status === 'DELIVERED' ? '#d1fae5' : order.status === 'CONFIRMED' ? '#dbeafe' : '#fef3c7', 
                            color: order.status === 'DELIVERED' ? '#059669' : order.status === 'CONFIRMED' ? '#2563eb' : '#d97706' 
                          }}>
                            {order.status}
                          </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                         <span style={{ 
                            fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', 
                            background: kitchenStatus === 'DONE' ? '#d1fae5' : kitchenStatus === 'STARTED' ? '#fef3c7' : '#f3f4f6', 
                            color: kitchenStatus === 'DONE' ? '#059669' : kitchenStatus === 'STARTED' ? '#d97706' : '#4b5563' 
                          }}>
                            {kitchenStatus}
                          </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

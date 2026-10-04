'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardList, Search, Calendar, Eye, SlidersHorizontal, X, Utensils, CheckCircle, Clock, AlertCircle, ChefHat } from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#f8fafc', color: '#64748b', label: 'Draft' },
  PLACED: { bg: '#dbeafe', color: '#2563eb', label: 'Placed' },
  CONFIRMED: { bg: '#d1fae5', color: '#059669', label: 'Confirmed' },
  COOKING: { bg: '#fef3c7', color: '#d97706', label: 'Cooking' },
  DISPATCH: { bg: '#fef9c3', color: '#ca8a04', label: 'Dispatch' },
  OUT_FOR_DELIVERY: { bg: '#e0e7ff', color: '#4f46e5', label: 'Out for Delivery' },
  DELIVERED: { bg: '#dcfce7', color: '#16a34a', label: 'Delivered' },
  CANCELLED: { bg: '#fef2f2', color: '#ef4444', label: 'Cancelled' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/orders');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CLIENT-SIDE FILTERING (instant, no loading) ---------- */
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          o.employee?.name?.toLowerCase().includes(q) ||
          o.employee?.company?.name?.toLowerCase().includes(q) ||
          `#${o.id}`.includes(q) ||
          o.status.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedDate) {
        const orderDate = new Date(o.deliveryDate).toISOString().slice(0, 10);
        if (orderDate !== selectedDate) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery, selectedDate]);

  /* ---------- Status counts for filter badges ---------- */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Orders</h1>
          <p className="page-subtitle">Review every order, update a delivery, or open the kitchen board.</p>
        </div>

      </div>

      <div className="premium-card filters-card">
        <div className="filter-title"><SlidersHorizontal size={16} /> Filter orders <span>{filteredOrders.length} shown</span></div>
        <div className="filter-grid">
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 240px',
          maxWidth: '320px',
        }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            placeholder="Search orders, employees, companies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field"
            style={{
              paddingLeft: '36px',
              padding: '9px 12px 9px 36px',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <input className="input-field" type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)} aria-label="Filter by delivery date" />

        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by order status">
          <option value="">All statuses ({statusCounts[''] || 0})</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label} ({statusCounts[key] || 0})</option>
          ))}
        </select>
        {(statusFilter || selectedDate || searchQuery) && (
          <button className="btn-secondary clear-filters" onClick={() => { setStatusFilter(''); setSelectedDate(''); setSearchQuery(''); }}>
            <X size={14} /> Clear
          </button>
        )}
        </div>
      </div>

      {/* ====== CONTENT ====== */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner-lg" />
        </div>
      ) : <OrderListView orders={filteredOrders} />}
    </div>
  );
}

/* ================================================================== */
/* ORDER LIST VIEW                                                     */
/* ================================================================== */
function OrderListView({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return (
      <div className="premium-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
        <ClipboardList size={56} style={{ margin: '0 auto 16px', opacity: 0.15, color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No orders found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try adjusting your filters or create an order from the Companies tab.</p>
      </div>
    );
  }

  return (
    <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={thStyle}>Order</th>
              <th style={thStyle}>Company</th>
              <th style={thStyle}>Employee</th>
              <th style={thStyle}>Delivery Date</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={{ ...thStyle, width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>#{order.id}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{order.employee?.company?.name || '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: 'var(--text-muted)' }}>{order.employee?.name || '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{order.deliveryTime}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: sc.bg,
                      color: sc.color,
                      letterSpacing: '0.02em',
                    }}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>${(order.totalAmount / 100).toFixed(2)}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link href={`/admin/orders/${order.id}`} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ecfdf5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-light)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        fontWeight: 500,
      }}>
        Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

/* ================================================================== */
/* KITCHEN BOARD VIEW                                                  */
/* ================================================================== */
function KitchenBoardView({ orders, stats }: { orders: any[]; stats: any }) {
  const progressPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  /* Group orders by station */
  const stationGroups = useMemo(() => {
    const groups: Record<string, { station: string; units: any[] }> = {};
    orders.forEach(order => {
      order.lines?.forEach((line: any) => {
        line.combinations?.forEach((combo: any) => {
          const station = combo.kitchenStationName || line.kitchenStationName || 'Unassigned';
          if (!groups[station]) groups[station] = { station, units: [] };
          groups[station].units.push({
            ...combo,
            orderId: order.id,
            dishName: line.dishName,
            employeeName: order.employee?.name,
            companyName: order.employee?.company?.name,
            deliveryTime: order.deliveryTime,
          });
        });
      });
    });
    return Object.values(groups);
  }, [orders]);

  return (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <StatCard icon={<Utensils size={20} />} label="Total Prep Units" value={stats.total} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard icon={<CheckCircle size={20} />} label="Completed" value={stats.done} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard icon={<Clock size={20} />} label="In Progress" value={stats.started} iconBg="#fef3c7" iconColor="#f59e0b" />
        <StatCard icon={<AlertCircle size={20} />} label="Pending" value={stats.pending} iconBg="#fef2f2" iconColor="#ef4444" />
      </div>

      {/* Progress Bar */}
      <div className="premium-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Overall Kitchen Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{progressPct}%</span>
        </div>
        <div style={{
          height: '10px',
          borderRadius: '8px',
          background: '#f1f5f9',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            borderRadius: '8px',
            background: progressPct === 100 ? '#16a34a' : 'linear-gradient(90deg, #10b981, #059669)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <ChefHat size={56} style={{ margin: '0 auto 16px', opacity: 0.15, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No orders for the kitchen</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active orders match your current filters.</p>
        </div>
      ) : (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Delivery</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Prep Units</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Order Status</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Kitchen Progress</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  let orderUnits = 0, orderDone = 0, orderStarted = 0;
                  order.lines?.forEach((l: any) => l.combinations?.forEach((c: any) => {
                    orderUnits += c.quantity;
                    if (c.kitchenStatus === 'DONE') orderDone += c.quantity;
                    else if (c.kitchenStatus === 'STARTED') orderStarted += c.quantity;
                  }));

                  const pct = orderUnits > 0 ? Math.round((orderDone / orderUnits) * 100) : 0;
                  let kitchenLabel = 'Not Started';
                  let kitchenColor = { bg: '#f3f4f6', color: '#6b7280' };
                  if (orderDone === orderUnits && orderUnits > 0) {
                    kitchenLabel = 'Done';
                    kitchenColor = { bg: '#dcfce7', color: '#16a34a' };
                  } else if (orderDone > 0 || orderStarted > 0) {
                    kitchenLabel = 'In Progress';
                    kitchenColor = { bg: '#fef3c7', color: '#d97706' };
                  }

                  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                          #{order.id}
                        </Link>
                      </td>
                      <td style={tdStyle}>{order.employee?.company?.name || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{order.employee?.name || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.85rem' }}>
                          {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {order.deliveryTime}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{orderDone}/{orderUnits}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px',
                          fontWeight: 700, background: sc.bg, color: sc.color,
                        }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <div style={{ width: '60px', height: '6px', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${pct}%`, borderRadius: '4px',
                              background: pct === 100 ? '#16a34a' : '#10b981', transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px',
                            fontWeight: 700, background: kitchenColor.bg, color: kitchenColor.color,
                          }}>
                            {kitchenLabel}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-light)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''} in kitchen
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* STAT CARD                                                           */
/* ================================================================== */
function StatCard({ icon, label, value, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: number; iconBg: string; iconColor: string;
}) {
  return (
    <div className="premium-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          padding: '10px',
          background: iconBg,
          borderRadius: '10px',
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

/* ================================================================== */
/* SHARED STYLES                                                       */
/* ================================================================== */
const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  color: 'var(--text-muted)',
  fontWeight: 600,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  background: 'var(--bg-light)',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '0.9rem',
};

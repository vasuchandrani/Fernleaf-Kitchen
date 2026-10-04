'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Receipt, Truck, Clock, Calendar, Building2, User, Edit3, Save, X, MapPin } from 'lucide-react';

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

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PLACED', 'CANCELLED'],
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COOKING', 'DELIVERED', 'CANCELLED'],
  COOKING: ['DISPATCH', 'DELIVERED', 'CANCELLED'],
  DISPATCH: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ deliveryTime: '', deliveryDate: '' });
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    params.then(p => {
      setOrderId(p.id);
      fetchOrder(p.id);
    });
  }, [params]);

  const fetchOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/proxy/orders/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data);
      setEditData({
        deliveryTime: data.deliveryTime || '',
        deliveryDate: data.deliveryDate?.split('T')[0] || '',
      });
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setEditing(false);
      }
    } catch { /* */ } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/proxy/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
      }
    } catch { /* */ } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '80px' }}>
        <h2 style={{ marginBottom: '12px' }}>Order not found</h2>
        <Link href="/admin/orders" style={{ color: 'var(--primary)', fontWeight: 500 }}>← Back to Orders</Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
  const allowedTransitions = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <Link href="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '24px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Order #{order.id}</h1>
            <span style={{
              padding: '6px 16px', borderRadius: '24px', fontSize: '0.8rem',
              fontWeight: 700, background: sc.bg, color: sc.color, letterSpacing: '0.02em',
            }}>
              {sc.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> {order.employee?.name || '—'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> {order.employee?.company?.name || '—'}
            </span>
          </div>
        </div>

        {/* Status Transition Buttons */}
        {allowedTransitions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {allowedTransitions.map(status => {
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
              const isDanger = status === 'CANCELLED';
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={statusUpdating}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem',
                    fontWeight: 600, border: isDanger ? '1px solid #fecaca' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: isDanger ? '#fef2f2' : cfg.bg,
                    color: isDanger ? '#ef4444' : cfg.color,
                  }}
                >
                  → {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Order Items */}
        <div className="premium-card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Receipt size={18} style={{ color: 'var(--primary)' }} /> Order Items
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {order.lines?.map((line: any, lineIdx: number) => (
              <div key={line.id} style={{
                padding: '16px 0',
                borderBottom: lineIdx < order.lines.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{
                        background: 'var(--primary)', color: 'white', borderRadius: '6px',
                        padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, minWidth: '28px', textAlign: 'center',
                      }}>
                        {line.quantity}×
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{line.dishName}</span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-light)',
                      borderRadius: '4px', color: 'var(--text-muted)', fontWeight: 500,
                    }}>
                      SKU: {line.dishSku}
                    </span>

                    {/* Combinations */}
                    {line.combinations?.map((combo: any, comboIdx: number) => (
                      <div key={comboIdx} style={{
                        marginTop: '10px', paddingLeft: '16px',
                        borderLeft: '2px solid var(--border)',
                      }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Combo: {combo.quantity}× @ ${(combo.unitPrice / 100).toFixed(2)} each
                        </div>
                        {combo.options?.map((opt: any, oIdx: number) => (
                          <div key={oIdx} style={{
                            fontSize: '0.82rem', color: 'var(--text-muted)',
                            display: 'flex', justifyContent: 'space-between', maxWidth: '300px',
                          }}>
                            <span>+ {opt.optionName}</span>
                            <span style={{ fontWeight: 500 }}>${(opt.optionPrice / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                    ${(line.lineTotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '20px', marginTop: '8px', borderTop: '2px solid var(--border)',
          }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>Order Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              ${(order.totalAmount / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right: Delivery Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', margin: 0 }}>
                <Truck size={18} style={{ color: 'var(--primary)' }} /> Delivery Info
              </h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                  padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  <Edit3 size={12} /> Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleSaveEdit} disabled={saving} style={{
                    background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px',
                    padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    <Save size={12} /> {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                    padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow icon={<Calendar size={15} />} label="Delivery Date"
                editing={editing}
                value={editing
                  ? <input type="date" className="input-field" style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                      value={editData.deliveryDate}
                      onChange={e => setEditData({ ...editData, deliveryDate: e.target.value })} />
                  : new Date(order.deliveryDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
                }
              />
              <InfoRow icon={<Clock size={15} />} label="Delivery Time"
                editing={editing}
                value={editing
                  ? <input type="time" className="input-field" style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                      value={editData.deliveryTime}
                      onChange={e => setEditData({ ...editData, deliveryTime: e.target.value })} />
                  : order.deliveryTime
                }
              />
            </div>
          </div>

          {/* Order Timeline */}
          <div className="premium-card">
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {['DRAFT', 'PLACED', 'CONFIRMED', 'COOKING', 'DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step, idx) => {
                const statusOrder = ['DRAFT', 'PLACED', 'CONFIRMED', 'COOKING', 'DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                const currentIdx = statusOrder.indexOf(order.status);
                const stepIdx = statusOrder.indexOf(step);
                const isActive = stepIdx <= currentIdx && order.status !== 'CANCELLED';
                const isCurrent = step === order.status;
                const cfg = STATUS_CONFIG[step] || STATUS_CONFIG.DRAFT;

                return (
                  <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '20px' }}>
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: isCurrent ? cfg.color : isActive ? 'var(--primary)' : 'var(--border)',
                        border: isCurrent ? `3px solid ${cfg.bg}` : 'none',
                        boxShadow: isCurrent ? `0 0 0 2px ${cfg.color}` : 'none',
                        transition: 'all 0.2s',
                      }} />
                      {idx < 6 && (
                        <div style={{
                          width: '2px', height: '24px',
                          background: isActive ? 'var(--primary)' : 'var(--border)',
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.82rem', fontWeight: isCurrent ? 700 : 500,
                      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                      paddingBottom: idx < 6 ? '12px' : '0',
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              {order.status === 'CANCELLED' && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>Cancelled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, editing }: { icon: React.ReactNode; label: string; value: React.ReactNode; editing?: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: editing ? 400 : 600, fontSize: '0.95rem' }}>{value}</div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle } from 'lucide-react';

interface Invoice {
  id: number;
  companyId: number;
  invoiceNumber: string;
  totalAmount: number;
  isPaid: boolean;
  company: { name: string, billingEmail: string };
  _count: { orders: number };
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/invoices');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoices = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/proxy/invoices/generate', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.invoicesCreated === 0) {
        alert('No new delivered orders to invoice.');
      } else {
        alert(`Successfully generated ${data.invoicesCreated} new invoices.`);
      }
      fetchInvoices();
    } catch (e) {
      console.error(e);
      alert('Failed to generate invoices.');
    } finally {
      setGenerating(false);
    }
  };

  const markAsPaid = async (id: number) => {
    if (!confirm('Are you sure you want to mark this invoice as Paid?')) return;
    try {
      await fetch(`/api/proxy/invoices/${id}/pay`, { method: 'PATCH' });
      fetchInvoices();
    } catch {}
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Billing & Invoices</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate and track company invoices.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={generateInvoices} 
          disabled={generating}
          style={{ padding: '12px 24px' }}
        >
          {generating ? 'Generating...' : 'Generate New Invoices'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3>No Invoices Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Click &quot;Generate New Invoices&quot; to bill companies for delivered orders.</p>
        </div>
      ) : (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', background: 'var(--bg-light)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Invoice #</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Company</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Orders</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{inv.company.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.company.billingEmail}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>{inv._count.orders}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>${(inv.totalAmount / 100).toFixed(2)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {inv.isPaid ? (
                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: '#dcfce7', color: '#16a34a' }}>
                          PAID
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, background: '#fef3c7', color: '#d97706' }}>
                          UNPAID
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {!inv.isPaid && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => markAsPaid(inv.id)}
                        >
                          <CheckCircle size={14} style={{ marginRight: '4px' }} /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

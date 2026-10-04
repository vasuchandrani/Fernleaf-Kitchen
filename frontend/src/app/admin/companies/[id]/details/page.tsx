import { api } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft, Users, Mail, MapPin, Tag, ShoppingCart, Building2 } from 'lucide-react';
import AddEmployeeDialog from '../AddEmployeeDialog';
import BulkAddEmployeesDialog from '../BulkAddEmployeesDialog';
import ChangeTierDialog from './ChangeTierDialog';
import EmployeeActions from './EmployeeActions';

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [company, tiers] = await Promise.all([
    api.get(`/companies/${id}`).catch(() => null),
    api.get('/pricing/tiers').catch(() => [])
  ]);

  if (!company) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Company not found</h2>
        <Link href="/admin/companies" style={{ color: 'var(--primary)', marginTop: '16px', display: 'inline-block' }}>← Back to Companies</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link href="/admin/companies" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '24px', textDecoration: 'none', fontSize: '0.9rem' }}>
        <ChevronLeft size={16} /> Back to Companies
      </Link>

      <section className="premium-card" style={{ marginBottom: '24px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#ecfdf5', color: 'var(--primary)' }}><Building2 size={25} /></div>
          <div>
          <p className="eyebrow">Company management</p>
          <h1 style={{ marginBottom: '8px' }}>{company.name}</h1>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Mail size={14} /> {company.billingEmail}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
              <Tag size={14} /> {company.priceTier?.name || 'Standard'}
              <ChangeTierDialog companyId={company.id} currentTierId={company.priceTierId} tiers={tiers} />
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/admin/companies/${company.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
            <ShoppingCart size={16} style={{ marginRight: '4px' }} /> Create Order
          </Link>
          <BulkAddEmployeesDialog companyId={company.id} />
          <AddEmployeeDialog companyId={company.id} />
        </div>
      </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Metric label="Employees" value={company.employees?.length || 0} />
        <Metric label="Delivery addresses" value={company.addresses?.length || 0} />
        <Metric label="Catalogue" value={company.priceTier?.name || 'Default'} />
      </div>
      </section>

      {/* Addresses */}
      {company.addresses && company.addresses.length > 0 && (
        <div className="premium-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} /> Delivery Addresses
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {company.addresses.map((addr: any) => (
              <div key={addr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{addr.label}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{addr.address}</p>
                </div>
                {addr.isDefault && <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#d1fae5', color: '#059669', borderRadius: '8px', fontWeight: 'bold' }}>Default</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="premium-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: '20px', flexWrap: 'wrap' }}>
          <div><h3 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} /> Employees</h3><p style={{ color: 'var(--text-muted)', fontSize: '.85rem', margin: 0 }}>People eligible to receive meals from this company.</p></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{company.employees?.length || 0} total</span>
        </div>
        {!company.employees || company.employees.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No employees found. Click &quot;Add Employee&quot; to add one.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Name</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Email</th>
                  <th style={{ padding: '12px 8px' }} />
                </tr>
              </thead>
              <tbody>
                {company.employees.map((emp: any) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>{emp.email}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}><EmployeeActions companyId={company.id} employee={emp} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-light)' }}><div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div><strong style={{ fontSize: '1rem' }}>{value}</strong></div>;
}

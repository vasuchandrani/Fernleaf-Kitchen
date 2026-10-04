import { api } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft, Users, Mail, MapPin, Tag, ShoppingCart } from 'lucide-react';
import AddEmployeeDialog from '../AddEmployeeDialog';
import BulkAddEmployeesDialog from '../BulkAddEmployeesDialog';
import ChangeTierDialog from './ChangeTierDialog';

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
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
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} /> Employees ({company.employees?.length || 0})
        </h3>
        {!company.employees || company.employees.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No employees found. Click &quot;Add Employee&quot; to add one.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Name</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {company.employees.map((emp: any) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>{emp.email}</td>
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

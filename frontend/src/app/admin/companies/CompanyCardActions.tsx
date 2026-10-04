'use client';

import { DeleteCompanyButton, EditCompanyButton } from './CompanyActions';

export default function CompanyCardActions({ company }: { company: { id: number; name: string; billingEmail: string } }) {
  return (
    <div
      style={{ display: 'flex', gap: 6 }}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
    >
      <EditCompanyButton company={company} />
      <DeleteCompanyButton companyId={company.id} companyName={company.name} />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function KitchenNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-kitchen-nav" aria-label="Kitchen sections">
      <Link href="/kitchen" className={pathname === '/kitchen' ? 'active' : ''} aria-current={pathname === '/kitchen' ? 'page' : undefined}>Dashboard</Link>
      <Link href="/kitchen/orders" className={pathname.startsWith('/kitchen/orders') ? 'active' : ''} aria-current={pathname.startsWith('/kitchen/orders') ? 'page' : undefined}>Orders</Link>
    </nav>
  );
}

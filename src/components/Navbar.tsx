import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

interface NavbarProps {
  showNewInvoice?: boolean;
}

export function Navbar({ showNewInvoice = false }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-border bg-card">
      <Link href="/dashboard" className="text-xl font-bold">
        Gig<span className="text-accent">Desk</span>
      </Link>
      {showNewInvoice && (
        <Link href="/dashboard/invoices/new">
          <Button>+ New invoice</Button>
        </Link>
      )}
    </nav>
  );
}

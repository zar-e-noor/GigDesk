'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Invoice {
  id: string;
  client_name: string;
  invoice_number: string;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid';
  due_date: string;
  public_token: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('freelancer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
      } else {
        setInvoices(data || []);
      }
      setLoading(false);
    };

    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('invoices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `freelancer_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInvoices((prev) => [payload.new as Invoice, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === payload.new.id ? (payload.new as Invoice) : inv
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setInvoices((prev) => prev.filter((inv) => inv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar showNewInvoice />
        <div className="p-8">
          <div className="text-center text-ink-soft">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar showNewInvoice />
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-2">Your invoices</h1>
        <p className="text-ink-soft mb-6">Updates live — no need to refresh.</p>

        {invoices.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-ink mb-2">No invoices yet</h3>
            <p className="text-ink-soft mb-6">Create your first invoice to get started</p>
            <Link href="/dashboard/invoices/new">
              <Button>Create your first invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-4">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-4">
                    Invoice #
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-4">
                    Total
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-4">
                    Due
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {invoice.client_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-ink-soft">
                      {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                          <Button variant="ghost" className="px-3 py-1 text-sm">
                            Edit
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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

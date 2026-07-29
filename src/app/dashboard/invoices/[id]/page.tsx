'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  items: any[];
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid';
  due_date: string;
  public_token: string;
  signature_url: string;
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const resolvedParams = params;

  useEffect(() => {
    const fetchInvoice = async () => {
      const { id } = await resolvedParams;
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching invoice:', error);
        router.push('/dashboard');
        return;
      }

      setInvoice(data);
      setLoading(false);
    };

    fetchInvoice();
  }, [resolvedParams, router]);

  const copyPublicLink = () => {
    if (invoice) {
      const link = `${window.location.origin}/invoice/${invoice.public_token}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const markAsPaid = async () => {
    if (!invoice) return;
    
    setMarkingPaid(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);

      if (error) throw error;

      setInvoice({ ...invoice, status: 'paid' });
    } catch (err: any) {
      console.error('Error marking as paid:', err);
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice');
    }
  };

  const publishInvoice = async () => {
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);

      if (error) throw error;

      setInvoice({ ...invoice, status: 'sent' });
    } catch (err: any) {
      console.error('Error publishing invoice:', err);
      alert('Failed to publish invoice');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusSteps = ['draft', 'sent', 'viewed', 'signed', 'paid'] as const;
  const getCurrentStepIndex = () => {
    if (!invoice) return -1;
    return statusSteps.indexOf(invoice.status);
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

  if (!invoice) {
    return null;
  }

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar showNewInvoice />
      <div className="p-8 max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-ink-soft hover:text-accent mb-6 inline-block">
          ← Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold text-ink mb-2">Invoice {invoice.invoice_number}</h1>
        <p className="text-ink-soft mb-8">
          {invoice.client_name} · {formatCurrency(invoice.total, invoice.currency)} · Due {invoice.due_date ? formatDate(invoice.due_date) : '—'}
        </p>

        <div className="flex items-center gap-2 mb-8">
          {statusSteps.map((step, index) => (
            <div key={step} className="flex items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  index <= currentStepIndex
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-ink-soft'
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
              {index < statusSteps.length - 1 && (
                <div className="w-8 h-px bg-border mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-soft mb-1">Public link</p>
            <p className="text-ink font-mono text-sm">
              {invoice.status === 'draft' ? 'Invoice not published yet' : `${window.location.origin}/invoice/${invoice.public_token}`}
            </p>
          </div>
          {invoice.status === 'draft' ? (
            <Button onClick={publishInvoice}>
              Publish & Get Link
            </Button>
          ) : (
            <Button variant="ghost" onClick={copyPublicLink}>
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-ink mb-4">Line Items</h3>
          <div className="space-y-3">
            {invoice.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="text-ink">{item.description}</p>
                  <p className="text-sm text-ink-soft">
                    Qty: {item.quantity} × Rate: {formatCurrency(item.rate, invoice.currency)}
                  </p>
                </div>
                <p className="font-semibold text-ink">
                  {formatCurrency(item.quantity * item.rate, invoice.currency)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
            <span className="font-semibold text-ink">Total</span>
            <span className="text-xl font-bold text-ink">
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>

        {invoice.signature_url && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-ink mb-4">Client Signature</h3>
            <img
              src={invoice.signature_url}
              alt="Client signature"
              className="max-h-32 border border-border rounded-lg"
            />
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          {(invoice.status === 'draft' || invoice.status === 'sent') && (
            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
              <Button variant="ghost">
                Edit Invoice
              </Button>
            </Link>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200"
          >
            Delete
          </button>
          {invoice.status !== 'paid' && (
            <Button onClick={markAsPaid} disabled={markingPaid}>
              {markingPaid ? 'Marking as paid...' : 'Mark as paid'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

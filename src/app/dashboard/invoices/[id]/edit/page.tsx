'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const resolvedParams = params;

  useEffect(() => {
    const fetchInvoice = async () => {
      const { id } = await resolvedParams;
      setInvoiceId(id);
      
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

      setClientName(data.client_name);
      setDueDate(data.due_date || '');
      setItems(data.items || [{ description: '', quantity: 1, rate: 0 }]);
      setLoading(false);
    };

    fetchInvoice();
  }, [resolvedParams, router]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index][field] = value as never;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.rate > 0);
    if (validItems.length === 0) {
      setError('At least one valid line item is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          client_name: clientName,
          items: validItems,
          total: calculateTotal(),
          due_date: dueDate || null,
        })
        .eq('id', invoiceId);

      if (error) throw error;

      router.push(`/dashboard/invoices/${invoiceId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar showNewInvoice={false} />
        <div className="p-8">
          <div className="text-center text-ink-soft">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar showNewInvoice={false} />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-2">Edit invoice</h1>
        <p className="text-ink-soft mb-8">Total updates automatically as you add items.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ahmed Studios"
            />
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-soft mb-3">
              Line items
            </label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <div className="flex-3 flex-grow">
                  <Input
                    label=""
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description (e.g. Logo design)"
                    className="mb-0"
                  />
                </div>
               <div className="w-28 relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium z-10 pointer-events-none">
    Qty:
  </span>
  <Input
    type="number"
    value={item.quantity}
    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
    className="mb-0 pl-11"
    min="1"
  />
</div>

<div className="w-36 relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium z-10 pointer-events-none">
    Rate:
  </span>
  <Input
    type="number"
    value={item.rate}
    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
    className="mb-0 pl-12"
    min="0"
  />
</div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={addItem}
              className="mt-2"
            >
              + Add item
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <div className="text-xl font-bold text-ink">
            Total: PKR {calculateTotal().toLocaleString()}
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/invoices/${invoiceId}`}>
              <Button variant="ghost" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

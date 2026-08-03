'use client';

import { useState } from 'react';
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

export default function NewInvoicePage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const generateInvoiceNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'INV-0001';

    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('freelancer_id', user.id)
      .order('invoice_number', { ascending: false })
      .limit(1);

    const lastNumber = invoices?.[0]?.invoice_number || 'INV-0000';
    const num = parseInt(lastNumber.replace('INV-', '')) + 1;
    return `INV-${String(num).padStart(4, '0')}`;
  };

  const generatePublicToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSaveDraft = async () => {
    await saveInvoice('draft');
  };

  const handleSaveAndSend = async () => {
    await saveInvoice('sent');
  };

  const saveInvoice = async (status: 'draft' | 'sent') => {
    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.rate > 0);
    if (validItems.length === 0) {
      setError('At least one valid line item is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const invoiceNumber = await generateInvoiceNumber();
      const publicToken = generatePublicToken();

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          freelancer_id: user.id,
          client_name: clientName,
          invoice_number: invoiceNumber,
          items: validItems,
          total: calculateTotal(),
          currency: 'PKR',
          status,
          due_date: dueDate || null,
          public_token: publicToken,
        })
        .select()
        .single();

      if (error) throw error;

      if (status === 'sent') {
        router.push(`/dashboard/invoices/${data.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar showNewInvoice={false} />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink mb-2">New invoice</h1>
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
                <div className="w-24">
                  <Input
                    label=""
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    placeholder="Qty"
                    className="mb-0"
                    min="1"
                  />
                </div>
                <div className="w-32">
                  <Input
                    label=""
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    placeholder="Rate"
                    className="mb-0"
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
            <Button
              variant="ghost"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              Save draft
            </Button>
            <Button
              onClick={handleSaveAndSend}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save & get link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  items: any[];
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid';
  due_date: string;
  signature_url: string;
  freelancer_name: string;
  business_name: string;
}

export default function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const resolvedParams = params;

  useEffect(() => {
    const fetchInvoice = async () => {
      const { token } = await resolvedParams;
      
      try {
        const response = await fetch(`/api/public-invoice/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch invoice');
        }

        setInvoice(data);

        // Update status to 'viewed' if it's 'draft' or 'sent'
        if (data.status === 'draft' || data.status === 'sent') {
          await fetch(`/api/public-invoice/${token}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'viewed' }),
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [resolvedParams]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    lastX.current = clientX - rect.left;
    lastY.current = clientY - rect.top;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    lastX.current = x;
    lastY.current = y;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!invoice || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if canvas is empty
    const pixelBuffer = new Uint32Array(
      ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    const isEmpty = !pixelBuffer.some(color => color !== 0);

    if (isEmpty) {
      setError('Please sign before accepting');
      return;
    }

    setSigning(true);
    setError('');

    try {
      // Convert canvas to data URL
      const signatureData = canvas.toDataURL('image/png');

      // Upload to Supabase Storage
      const fileName = `signature-${invoice.id}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, signatureData.split(',')[1], {
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      // Update invoice with signature URL and status
      const { token } = await resolvedParams;
      const response = await fetch(`/api/public-invoice/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          signature_url: publicUrl,
          status: 'signed' 
        }),
      });

      if (!response.ok) throw new Error('Failed to update invoice');

      setSigned(true);
      setInvoice({ ...invoice, signature_url: publicUrl, status: 'signed' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-ink-soft">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-ink mb-2">Invoice not found</h3>
          <p className="text-ink-soft">{error || 'This invoice may have been deleted or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">
              {invoice.business_name || invoice.freelancer_name}
            </h1>
            <p className="text-sm text-ink-soft">Invoice {invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-soft">Bill to</p>
            <p className="font-semibold text-ink">{invoice.client_name}</p>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-4 py-3">
                  Description
                </th>
                <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-4 py-3">
                  Qty
                </th>
                <th className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-4 py-3">
                  Rate
                </th>
                <th className="text-right text-xs font-semibold text-ink-soft uppercase tracking-wider px-4 py-3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={index} className="border-t border-border">
                  <td className="px-4 py-3 text-ink">{item.description}</td>
                  <td className="px-4 py-3 text-ink-soft">{item.quantity}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatCurrency(item.rate, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink">
                    {formatCurrency(item.quantity * item.rate, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-right mb-8">
          <div className="text-2xl font-bold text-ink">
            Total: {formatCurrency(invoice.total, invoice.currency)}
          </div>
        </div>

        {invoice.status === 'signed' || invoice.status === 'paid' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">✓</div>
            <h3 className="font-semibold text-green-800 mb-2">
              Invoice {invoice.status === 'paid' ? 'paid' : 'signed'}
            </h3>
            <p className="text-sm text-green-600">
              {invoice.status === 'paid' 
                ? 'This invoice has been marked as paid.'
                : 'Thank you for signing this invoice.'}
            </p>
            {invoice.signature_url && (
              <img
                src={invoice.signature_url}
                alt="Signature"
                className="max-h-24 mx-auto mt-4 border border-green-200 rounded"
              />
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-2">
              Sign below to accept this invoice
            </label>
            <canvas
              ref={canvasRef}
              width={600}
              height={140}
              className="w-full border-2 border-dashed border-border rounded-lg bg-gray-50 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-4 py-2 border border-border rounded-lg text-ink hover:bg-gray-50 transition-colors font-medium"
                disabled={signing}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={signing || signed}
                className="flex-1 bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {signing ? 'Signing...' : signed ? 'Signed!' : 'Sign & accept'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

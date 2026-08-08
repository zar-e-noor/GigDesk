import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_name, description, amount, quantity } = body;

    if (!client_name || !description || !amount) {
      return NextResponse.json(
        { error: 'client_name, description, and amount are required' },
        { status: 400 }
      );
    }

    const qty = quantity || 1;

    // Use service role key to bypass RLS for extension invoice creation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('invoice_number', { ascending: false })
      .limit(1);

    const lastNumber = lastInvoice?.[0]?.invoice_number || 'INV-0000';
    const num = parseInt(lastNumber.replace('INV-', '')) + 1;
    const invoiceNumber = `INV-${String(num).padStart(4, '0')}`;

    // Generate public token
    const publicToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        freelancer_id: 'extension-user', // Placeholder - extension creates invoices without auth
        client_name: client_name,
        invoice_number: invoiceNumber,
        items: [
          {
            description: description,
            quantity: qty,
            rate: amount,
          }
        ],
        total: amount * qty,
        currency: 'PKR',
        status: 'sent',
        due_date: null,
        public_token: publicToken,
      })
      .select()
      .single();

    if (error || !invoice) {
      console.error('Invoice creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      public_token: publicToken,
      invoice_number: invoiceNumber 
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

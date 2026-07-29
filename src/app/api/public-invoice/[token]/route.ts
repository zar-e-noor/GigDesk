import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Use service role key to bypass RLS for public invoice access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch invoice by public_token
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        profiles:freelancer_id (
          full_name,
          business_name
        )
      `)
      .eq('public_token', token)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Return invoice data (no sensitive info like freelancer_id)
    return NextResponse.json({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_name: invoice.client_name,
      items: invoice.items,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      due_date: invoice.due_date,
      signature_url: invoice.signature_url,
      created_at: invoice.created_at,
      freelancer_name: invoice.profiles?.full_name,
      business_name: invoice.profiles?.business_name,
    });
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Use service role key to bypass RLS for public invoice updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build update object
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.signature_url) updateData.signature_url = body.signature_url;

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('public_token', token)
      .select()
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating public invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Use service role key to bypass RLS for public signature submission
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { signature_url } = body;

    if (!signature_url) {
      return NextResponse.json(
        { error: 'signature_url is required' },
        { status: 400 }
      );
    }

    // Update invoice with signature URL and status
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({
        signature_url: signature_url,
        status: 'signed',
      })
      .eq('public_token', token)
      .select()
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error submitting signature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

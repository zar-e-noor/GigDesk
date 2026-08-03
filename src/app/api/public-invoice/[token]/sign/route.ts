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

    const { signature_data } = body;

    if (!signature_data) {
      return NextResponse.json(
        { error: 'signature_data is required' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present and convert to Buffer
    const base64Data = signature_data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload signature to Supabase Storage using service role key
    const fileName = `signature-${token}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload signature' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    // Update invoice with signature URL and status using service role key
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({
        signature_url: publicUrl,
        status: 'signed',
      })
      .eq('public_token', token)
      .select()
      .single();

    if (error || !invoice) {
      console.error('Invoice update error:', error);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, signature_url: publicUrl });
  } catch (error) {
    console.error('Error submitting signature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

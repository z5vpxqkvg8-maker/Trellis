// app/api/customer-insights/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const engagementId = formData.get('engagementId') as string | null;
    const file = formData.get('file') as File | null;

    if (!engagementId || !file) {
      return NextResponse.json(
        { error: 'Missing engagementId or file' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = `${engagementId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('customer-insights')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from('customer_insights_documents')
      .insert({
        engagement_id: engagementId,
        file_path: filePath,
        original_file_name: file.name,
        mime_type: file.type || null,
      });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unexpected error while uploading' },
      { status: 500 }
    );
  }
}

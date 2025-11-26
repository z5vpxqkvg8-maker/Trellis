// app/api/financials/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  FinancialDocumentMeta,
  FinancialDocumentRow,
} from '../../engagement/[engagementId]/financials/types';

export const runtime = 'nodejs';

const FINANCIAL_DOCS_BUCKET = 'financial-documents';

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase env vars missing in /api/financials route');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

type FinancialDocumentPayload = {
  engagementId: string;
  docType: string | null;
  filePath: string;
  originalFileName: string;
  mimeType: string | null;
  meta?: FinancialDocumentMeta;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | FinancialDocumentPayload
      | null;

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { engagementId, docType, filePath, originalFileName, mimeType, meta } =
      body;

    if (!engagementId || !filePath || !originalFileName) {
      return NextResponse.json(
        { error: 'engagementId, filePath and originalFileName are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('financial_documents')
      .insert({
        engagement_id: engagementId,
        doc_type: docType,
        file_path: filePath,
        original_file_name: originalFileName,
        mime_type: mimeType,
        meta: meta ?? null,
      })
      .select(
        'id, engagement_id, doc_type, file_path, original_file_name, mime_type, uploaded_at, meta'
      )
      .single<FinancialDocumentRow>();

    if (error || !data) {
      console.error('Error inserting financial_documents row:', error);
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ document: data });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/financials:', err);
    const message =
      err?.message && typeof err.message === 'string'
        ? err.message
        : 'Unexpected error while uploading';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// -------- DELETE for "Remove" button --------

type DeletePayload = {
  id: string;
  filePath: string;
};

export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as DeletePayload | null;

    if (!body || !body.id || !body.filePath) {
      return NextResponse.json(
        { error: 'id and filePath are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 1) Remove file from storage
    const { error: storageError } = await supabase.storage
      .from(FINANCIAL_DOCS_BUCKET)
      .remove([body.filePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      );
    }

    // 2) Remove metadata row
    const { error: dbError } = await supabase
      .from('financial_documents')
      .delete()
      .eq('id', body.id);

    if (dbError) {
      console.error('Error deleting financial_documents row:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete document metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/financials:', err);
    const message =
      err?.message && typeof err.message === 'string'
        ? err.message
        : 'Unexpected error while removing document';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hasAuthenticatedAdminSession } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'book-covers';

function invalidBookInput(title: string, author: string, price: number, stock: number) {
  return !title || !author || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock <= 0;
}

async function ensureBookCoversBucket(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data: bucket } = await supabase.storage.getBucket(BUCKET_NAME);

  if (!bucket) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    if (error && !error.message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }

  const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
  if (updateError) {
    throw updateError;
  }
}

async function uploadCover(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  file: File,
) {
  await ensureBookCoversBucket(supabase);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl;
}

export async function GET(request: NextRequest) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ books: data });
}

export async function POST(request: NextRequest) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const author = String(formData.get('author') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const price = Number(formData.get('price'));
    const stock = Number(formData.get('stock'));
    const isbn = String(formData.get('isbn') || '').trim() || null;
    const coverImageUrl = String(formData.get('coverImageUrl') || '').trim();
    const coverFile = formData.get('coverFile');

    if (invalidBookInput(title, author, price, stock)) {
      return NextResponse.json({ error: 'Title, author, price, and stock are required. Price and stock must be positive.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    let cover_image_url = coverImageUrl || null;
    if (coverFile instanceof File && coverFile.size > 0) {
      cover_image_url = await uploadCover(supabase, coverFile);
    }

    const { data, error } = await supabase
      .from('books')
      .insert({ title, author, description, price, stock, isbn, cover_image_url, is_active: true })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ book: data }, { status: 201 });
  } catch (error) {
    console.error('[admin books] Failed to create book:', error);
    return NextResponse.json({ error: 'Unable to create book.' }, { status: 500 });
  }
}

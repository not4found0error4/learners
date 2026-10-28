import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hasAuthenticatedAdminSession } from '@/lib/adminAuth';
import { isValidCategorySlug } from '@/lib/categories';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const BUCKET_NAME = 'book-covers';

type RouteContext = { params: Promise<{ id: string }> };

function invalidBookInput(title: string, price: number, stock: number, weightGrams: number) {
  return (
    !title ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(stock) ||
    stock <= 0 ||
    !Number.isInteger(weightGrams) ||
    weightGrams <= 0
  );
}

async function uploadCover(supabase: ReturnType<typeof createSupabaseAdminClient>, file: File) {
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

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const { data, error } = await createSupabaseAdminClient()
    .from('books')
    .select('id, title, description, price, stock, weight_grams, isbn, cover_image_url, categories, is_bestseller, class_level, language')
    .eq('id', id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ book: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const supabase = createSupabaseAdminClient();

  if (typeof body.is_active === 'boolean' && Object.keys(body).length === 1) {
    const { error } = await supabase.from('books').update({ is_active: body.is_active }).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Use the multipart form endpoint to update book details.' }, { status: 400 });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const price = Number(formData.get('price'));
    const stock = Number(formData.get('stock'));
    const weightGrams = Number(formData.get('weight_grams'));
    const isbn = String(formData.get('isbn') || '').trim() || null;
    const coverImageUrl = String(formData.get('coverImageUrl') || '').trim();
    const categories = Array.from(new Set(
      formData.getAll('categories').filter(
        (value): value is string => typeof value === 'string' && isValidCategorySlug(value),
      ),
    ));
    const rawIsBestseller = formData.get('is_bestseller');
    const classLevelValue = formData.get('class_level');
    const languageValue = formData.get('language');
    const coverFile = formData.get('coverFile');
    const isBestseller = rawIsBestseller === 'true';
    const classLevel = typeof classLevelValue === 'string' ? classLevelValue.trim() || null : null;
    const language = typeof languageValue === 'string' ? languageValue.trim() || 'English' : 'English';

    if (invalidBookInput(title, price, stock, weightGrams)) {
      return NextResponse.json({ error: 'Title, price, stock, and weight are required. Price, stock, and weight must be positive, with weight a whole number.' }, { status: 400 });
    }
    if (
      (rawIsBestseller !== null && rawIsBestseller !== 'true' && rawIsBestseller !== 'false')
    ) {
      return NextResponse.json({ error: 'Please choose a valid bestseller value.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    let cover_image_url = coverImageUrl || null;
    if (coverFile instanceof File && coverFile.size > 0) {
      cover_image_url = await uploadCover(supabase, coverFile);
    }

    const { error } = await supabase
      .from('books')
      .update({
        title,
        description,
        price,
        stock,
        weight_grams: weightGrams,
        isbn,
        cover_image_url,
        categories,
        is_bestseller: isBestseller,
        class_level: classLevel,
        language,
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin books] Failed to update book:', error);
    return NextResponse.json({ error: 'Unable to update book.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await hasAuthenticatedAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const { data, error } = await createSupabaseAdminClient()
    .from('books')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) {
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'This book is referenced by existing orders and cannot be deleted. Deactivate it instead to preserve order history.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('faculty')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,faculty_id.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { full_name, email, department, designation } = body;

  if (!full_name || !email) {
    return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 });
  }

  const { count } = await supabaseAdmin.from('faculty').select('*', { count: 'exact', head: true });
  const year_prefix = new Date().getFullYear();
  const faculty_id = `FAC-${year_prefix}-${String((count || 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('faculty')
    .insert({ faculty_id, full_name, email, department, designation, status: 'Active' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

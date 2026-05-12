import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/students — list with search & pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('students')
    .select('*, programs(name, code, degree_type)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}

// POST /api/students — create new student
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { full_name, email, program_id, year, semester, status, phone } = body;

  if (!full_name || !email || !program_id) {
    return NextResponse.json({ error: 'full_name, email, program_id are required' }, { status: 400 });
  }

  // Generate student ID
  const year_prefix = new Date().getFullYear();
  const { count } = await supabaseAdmin.from('students').select('*', { count: 'exact', head: true });
  const student_id = `STU-${year_prefix}-${String((count || 0) + 1).padStart(4, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('students')
    .insert({ student_id, full_name, email, program_id, year: year || 1, semester: semester || 1, status: status || 'Active', phone })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

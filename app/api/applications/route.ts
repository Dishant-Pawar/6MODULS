import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('applications')
    .select('*, programs(name, code)', { count: 'exact' })
    .order('applied_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicant_name, email, program_id, phone } = body;

  if (!applicant_name || !email || !program_id) {
    return NextResponse.json({ error: 'applicant_name, email, program_id required' }, { status: 400 });
  }

  const { count } = await supabaseAdmin.from('applications').select('*', { count: 'exact', head: true });
  const application_id = `APP-${String(9000 + (count || 0) + 1)}`;

  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert({ application_id, applicant_name, email, program_id, phone, status: 'Applied' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';

  let query = supabaseAdmin
    .from('grievances')
    .select('*, students(full_name, student_id)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { count } = await supabaseAdmin.from('grievances').select('*', { count: 'exact', head: true });
  const ticket_id = `GRV-${String((count || 0) + 1).padStart(3, '0')}`;
  const { data, error } = await supabaseAdmin
    .from('grievances')
    .insert({ ...body, ticket_id, status: 'Open' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

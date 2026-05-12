import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('transactions')
    .select('*, students(full_name, student_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, amount, type, gateway, reference } = body;

  const { count } = await supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true });
  const txn_id = `TXN-${String(99000 + (count || 0) + 1)}`;

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert({ txn_id, student_id, amount, type, gateway, reference, status: 'Processing' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

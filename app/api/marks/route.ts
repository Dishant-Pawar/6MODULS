import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const course_id = searchParams.get('course_id') || '';

  let query = supabaseAdmin
    .from('marks')
    .select('*, students(full_name, student_id), courses(name, code)')
    .order('created_at', { ascending: false });

  if (course_id) query = query.eq('course_id', course_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, course_id, exam_type, theory_marks, practical_marks, theory_max, practical_max } = body;

  const { data, error } = await supabaseAdmin
    .from('marks')
    .upsert({
      student_id, course_id, exam_type,
      theory_marks, practical_marks,
      theory_max: theory_max || 50,
      practical_max: practical_max || 50,
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,course_id,exam_type' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

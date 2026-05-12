import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // 1. Perform the update
  const { data: updatedExam, error: updateError } = await supabaseAdmin
    .from('exams')
    .update(body)
    .eq('id', id)
    .select('*, courses(program_id)')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 2. If status is now 'Completed', generate marks records for students in that program
  if (body.status === 'Completed') {
    try {
      const courseId = updatedExam.course_id;
      const examType = updatedExam.exam_type;
      const programId = (updatedExam.courses as any)?.program_id;

      if (programId) {
        // Fetch students in this program
        const { data: students } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('program_id', programId);

        if (students && students.length > 0) {
          const marksRows = students.map(s => ({
            student_id: s.id,
            course_id: courseId,
            exam_type: examType,
            theory_marks: 0,
            theory_max: 100,
            practical_marks: 0,
            practical_max: 0
          }));

          // Upsert to avoid duplicates
          await supabaseAdmin
            .from('marks')
            .upsert(marksRows, { onConflict: 'student_id,course_id,exam_type' });
        }
      }
    } catch (err) {
      console.error('Failed to generate marks records:', err);
      // We don't return error here because the exam update itself succeeded
    }
  }

  return NextResponse.json({ data: updatedExam });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from('exams').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

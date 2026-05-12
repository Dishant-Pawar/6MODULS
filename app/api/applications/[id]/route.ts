import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from('applications').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // 1. Fetch the application before update to check status and get all fields
  const { data: existingApp, error: fetchError } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();
    
  if (fetchError || !existingApp) {
    return NextResponse.json({ error: fetchError?.message || "Application not found" }, { status: 500 });
  }

  // 2. Perform the update
  const { data: updatedApp, error: updateError } = await supabaseAdmin
    .from('applications')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 3. Logic for auto-adding student if status changed to 'Admitted'
  const isNowAdmitted = body.status === 'Admitted' || (updatedApp.status === 'Admitted' && !body.status);
  const wasNotAdmitted = existingApp.status !== 'Admitted';

  if (isNowAdmitted && wasNotAdmitted) {
    // Check if student already exists by email to prevent duplicate records
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', existingApp.email)
      .maybeSingle();

    if (!existingStudent) {
      // Generate a new Student ID
      const yearPrefix = new Date().getFullYear();
      const { count } = await supabaseAdmin
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      const student_id = `STU-${yearPrefix}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Insert into students table
      const { error: insertError } = await supabaseAdmin
        .from('students')
        .insert({
          student_id,
          full_name: existingApp.applicant_name,
          email: existingApp.email,
          phone: existingApp.phone,
          program_id: existingApp.program_id,
          year: 1,
          semester: 1,
          status: 'Active'
        });

      if (insertError) {
        console.error("Auto-add student failed:", insertError.message);
      }
    }
  }

  // 4. Logic for auto-removing student if status changed to 'Rejected'
  const isNowRejected = body.status === 'Rejected' || (updatedApp.status === 'Rejected' && !body.status);
  const wasNotRejected = existingApp.status !== 'Rejected';

  if (isNowRejected && wasNotRejected) {
    // Remove student from students table by email
    const { error: deleteError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('email', existingApp.email);

    if (deleteError) {
      console.error("Auto-remove student failed:", deleteError.message);
    }
  }

  return NextResponse.json({ data: updatedApp });
}

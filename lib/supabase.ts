import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (uses service role key - bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Types
export type Student = {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  program_id: string;
  year: number;
  semester: number;
  status: 'Active' | 'On Leave' | 'Exchange' | 'Graduated' | 'Inactive';
  created_at: string;
  programs?: Program;
};

export type Program = {
  id: string;
  name: string;
  code: string;
  degree_type: string;
  duration_years: number;
  department?: string;
};

export type Faculty = {
  id: string;
  faculty_id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  status: string;
};

export type Application = {
  id: string;
  application_id: string;
  applicant_name: string;
  email: string;
  program_id: string;
  status: 'Applied' | 'Screening' | 'Pending Deposit' | 'Admitted' | 'Rejected';
  documents_verified: number;
  documents_total: number;
  applied_at: string;
  programs?: Program;
};

export type Transaction = {
  id: string;
  txn_id: string;
  student_id?: string;
  amount: number;
  type: string;
  status: 'Settled' | 'Processing' | 'Failed' | 'Pending';
  gateway?: string;
  created_at: string;
  students?: Student;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  credits: number;
  program_id: string;
  semester?: number;
  faculty_id?: string;
  room?: string;
  faculty?: Faculty;
};

export type Mark = {
  id: string;
  student_id: string;
  course_id: string;
  exam_type: string;
  theory_marks?: number;
  theory_max: number;
  practical_marks?: number;
  practical_max: number;
  students?: Student;
  courses?: Course;
};

export type Exam = {
  id: string;
  course_id: string;
  exam_type: string;
  scheduled_at: string;
  room?: string;
  duration_minutes: number;
  total_marks?: number;
  status?: string;
  courses?: Course;
};

export type Event = {
  id: string;
  title: string;
  description?: string;
  event_type?: string;
  scheduled_at: string;
  venue?: string;
  status: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  priority: string;
  created_at: string;
};

export type Grievance = {
  id: string;
  ticket_id: string;
  student_id: string;
  category?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  students?: Student;
};

export type PlacementDrive = {
  id: string;
  job_title: string;
  job_type: string;
  package_lpa?: number;
  scheduled_at?: string;
  status: string;
  openings: number;
  companies?: { name: string; industry: string };
};

export type HostelRoom = {
  id: string;
  room_number: string;
  block: string;
  floor?: number;
  capacity: number;
  occupied: number;
  status: string;
};

export type LibraryBook = {
  id: string;
  isbn?: string;
  title: string;
  author?: string;
  category?: string;
  total_copies: number;
  available_copies: number;
};

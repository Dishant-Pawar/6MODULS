-- ============================================================
-- ScholarSphere ERP - Complete Database Schema
-- ============================================================

-- 1. PEOPLE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  degree_type text NOT NULL, -- 'B.Tech', 'M.Sc', 'MBA', 'Ph.D', etc
  duration_years int NOT NULL DEFAULT 4,
  department text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL, -- e.g. STU-2023-0891
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  program_id uuid REFERENCES public.programs(id),
  year int NOT NULL DEFAULT 1,
  semester int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Active', -- 'Active', 'On Leave', 'Exchange', 'Graduated', 'Inactive'
  date_of_birth date,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id text UNIQUE NOT NULL, -- e.g. FAC-2020-001
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  department text,
  designation text, -- 'Professor', 'Associate Professor', etc.
  specialization text,
  status text NOT NULL DEFAULT 'Active',
  joined_at date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ADMISSIONS & FINANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text UNIQUE NOT NULL, -- e.g. APP-9021
  applicant_name text NOT NULL,
  email text NOT NULL,
  phone text,
  program_id uuid REFERENCES public.programs(id),
  status text NOT NULL DEFAULT 'Applied', -- 'Applied', 'Screening', 'Pending Deposit', 'Admitted', 'Rejected'
  documents_verified int DEFAULT 0,
  documents_total int DEFAULT 3,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs(id),
  academic_year text NOT NULL, -- e.g. '2024-25'
  base_tuition numeric NOT NULL,
  lab_fees numeric DEFAULT 0,
  material_fees numeric DEFAULT 0,
  other_fees numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id text UNIQUE NOT NULL, -- e.g. TXN-099281
  student_id uuid REFERENCES public.students(id),
  application_id uuid REFERENCES public.applications(id),
  amount numeric NOT NULL,
  type text NOT NULL, -- 'Tuition', 'Application Fee', 'Lab Fee', 'Deposit', etc.
  status text NOT NULL DEFAULT 'Processing', -- 'Settled', 'Processing', 'Failed', 'Pending'
  gateway text, -- 'Stripe', 'Razorpay', 'Wire Transfer'
  reference text,
  created_at timestamptz DEFAULT now()
);

-- 3. ACADEMIC OPERATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- e.g. CS-401
  name text NOT NULL,
  credits int DEFAULT 3,
  program_id uuid REFERENCES public.programs(id),
  semester int,
  faculty_id uuid REFERENCES public.faculty(id),
  room text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  day_of_week text NOT NULL, -- 'Monday', 'Tuesday', etc.
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id),
  course_id uuid REFERENCES public.courses(id),
  date date NOT NULL,
  status text NOT NULL DEFAULT 'Present', -- 'Present', 'Absent', 'Late'
  session_pin text,
  marked_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id, date)
);

CREATE TABLE IF NOT EXISTS public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id),
  course_id uuid REFERENCES public.courses(id),
  exam_type text NOT NULL, -- 'Midterm', 'Final', 'Lab', 'Internal'
  theory_marks numeric,
  theory_max numeric DEFAULT 50,
  practical_marks numeric,
  practical_max numeric DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id, exam_type)
);

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  exam_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  room text,
  duration_minutes int DEFAULT 120,
  created_at timestamptz DEFAULT now()
);

-- 4. CAMPUS SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text UNIQUE NOT NULL,
  block text NOT NULL,
  floor int,
  capacity int DEFAULT 2,
  occupied int DEFAULT 0,
  amenities text[],
  status text DEFAULT 'Available', -- 'Available', 'Full', 'Maintenance'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hostel_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id),
  room_id uuid REFERENCES public.hostel_rooms(id),
  allocated_at date DEFAULT CURRENT_DATE,
  vacated_at date,
  status text DEFAULT 'Active', -- 'Active', 'Vacated'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn text UNIQUE,
  title text NOT NULL,
  author text,
  category text,
  total_copies int DEFAULT 1,
  available_copies int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.library_books(id),
  student_id uuid REFERENCES public.students(id),
  issued_at date DEFAULT CURRENT_DATE,
  due_at date,
  returned_at date,
  fine_amount numeric DEFAULT 0,
  status text DEFAULT 'Issued', -- 'Issued', 'Returned', 'Overdue'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  stops text[],
  departure_time time,
  vehicle_number text,
  capacity int DEFAULT 40,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- 5. ENGAGEMENT & SUPPORT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text, -- 'Workshop', 'Seminar', 'Cultural', 'Sports', etc.
  scheduled_at timestamptz NOT NULL,
  venue text,
  organizer_id uuid REFERENCES public.faculty(id),
  max_participants int,
  status text DEFAULT 'Upcoming', -- 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id),
  student_id uuid REFERENCES public.students(id),
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  target_audience text DEFAULT 'All', -- 'All', 'Students', 'Faculty', specific program
  priority text DEFAULT 'Normal', -- 'Normal', 'High', 'Urgent'
  published_by uuid REFERENCES public.faculty(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL, -- e.g. GRV-001
  student_id uuid REFERENCES public.students(id),
  category text, -- 'Academic', 'Infrastructure', 'Fee', 'Hostel', etc.
  title text NOT NULL,
  description text,
  status text DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Closed'
  priority text DEFAULT 'Normal',
  assigned_to uuid REFERENCES public.faculty(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. PLACEMENTS & ANALYTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  hr_contact text,
  hr_email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placement_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  job_title text NOT NULL,
  job_type text DEFAULT 'Full-Time', -- 'Full-Time', 'Internship', 'Part-Time'
  package_lpa numeric, -- lakhs per annum
  min_cgpa numeric DEFAULT 6.0,
  eligible_programs uuid[], -- array of program IDs
  scheduled_at timestamptz,
  status text DEFAULT 'Upcoming', -- 'Upcoming', 'Ongoing', 'Completed'
  openings int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placement_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id uuid REFERENCES public.placement_drives(id),
  student_id uuid REFERENCES public.students(id),
  status text DEFAULT 'Applied', -- 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
  offer_letter_url text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(drive_id, student_id)
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- OPEN POLICIES (Admin ERP - all authenticated can read/write)
-- ============================================================

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'programs','students','faculty','applications','fee_structures',
    'transactions','courses','schedules','attendance','marks','exams',
    'hostel_rooms','hostel_allocations','library_books','library_issues',
    'transport_routes','events','event_registrations','announcements',
    'grievances','companies','placement_drives','placement_applications'
  ] LOOP
    EXECUTE format('CREATE POLICY "allow_anon_read_%s" ON public.%I FOR SELECT TO anon USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_anon_all_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.programs (id, name, code, degree_type, duration_years, department) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'B.Sc. Computer Science', 'BSC-CS', 'B.Sc', 4, 'Computer Science'),
  ('a0000001-0000-0000-0000-000000000002', 'M.Sc. Data Analytics', 'MSC-DA', 'M.Sc', 2, 'Computer Science'),
  ('a0000001-0000-0000-0000-000000000003', 'B.A. Graphic Design', 'BA-GD', 'B.A', 3, 'Arts & Design'),
  ('a0000001-0000-0000-0000-000000000004', 'B.Eng. Mechanical Engineering', 'BENG-ME', 'B.Eng', 4, 'Engineering'),
  ('a0000001-0000-0000-0000-000000000005', 'MBA Finance', 'MBA-FIN', 'MBA', 2, 'Business'),
  ('a0000001-0000-0000-0000-000000000006', 'B.Tech Computer Science', 'BTECH-CS', 'B.Tech', 4, 'Computer Science'),
  ('a0000001-0000-0000-0000-000000000007', 'Ph.D Computer Science', 'PHD-CS', 'Ph.D', 5, 'Computer Science')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.students (id, student_id, full_name, email, program_id, year, semester, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'STU-2023-0891', 'Elena Rodriguez', 'elena.r@student.imperial.edu', 'a0000001-0000-0000-0000-000000000001', 2, 4, 'Active'),
  ('b0000001-0000-0000-0000-000000000002', 'STU-2022-1402', 'Marcus Chen', 'm.chen23@student.imperial.edu', 'a0000001-0000-0000-0000-000000000002', 1, 2, 'Exchange'),
  ('b0000001-0000-0000-0000-000000000003', 'STU-2021-0045', 'Sarah Jenkins', 's.jenkins@student.imperial.edu', 'a0000001-0000-0000-0000-000000000003', 3, 1, 'On Leave'),
  ('b0000001-0000-0000-0000-000000000004', 'STU-2024-3310', 'David Kim', 'd.kim.99@student.imperial.edu', 'a0000001-0000-0000-0000-000000000004', 1, 1, 'Active'),
  ('b0000001-0000-0000-0000-000000000005', 'STU-2024-0001', 'Aisha Patel', 'a.patel@student.imperial.edu', 'a0000001-0000-0000-0000-000000000006', 1, 1, 'Active'),
  ('b0000001-0000-0000-0000-000000000006', 'STU-2023-0521', 'James Doe', 'j.doe@student.imperial.edu', 'a0000001-0000-0000-0000-000000000005', 2, 3, 'Active'),
  ('b0000001-0000-0000-0000-000000000007', 'STU-2022-0834', 'Anna Smith', 'a.smith@student.imperial.edu', 'a0000001-0000-0000-0000-000000000001', 2, 4, 'Active'),
  ('b0000001-0000-0000-0000-000000000008', 'STU-2021-0112', 'Rahul Jain', 'r.jain@student.imperial.edu', 'a0000001-0000-0000-0000-000000000007', 2, 3, 'Active')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.faculty (id, faculty_id, full_name, email, department, designation, status) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'FAC-2018-001', 'Alan Turing', 'a.turing@imperial.edu', 'Computer Science', 'Professor', 'Active'),
  ('c0000001-0000-0000-0000-000000000002', 'FAC-2020-005', 'Grace Hopper', 'g.hopper@imperial.edu', 'Computer Science', 'Associate Professor', 'Active'),
  ('c0000001-0000-0000-0000-000000000003', 'FAC-2022-010', 'Prof. Davis', 'davis@imperial.edu', 'Engineering', 'Assistant Professor', 'Active')
ON CONFLICT (faculty_id) DO NOTHING;

INSERT INTO public.courses (id, code, name, credits, program_id, semester, faculty_id, room) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'CS-401', 'Advanced Algorithms', 4, 'a0000001-0000-0000-0000-000000000006', 7, 'c0000001-0000-0000-0000-000000000001', 'Room 304'),
  ('d0000001-0000-0000-0000-000000000002', 'SE-300', 'Software Engineering', 3, 'a0000001-0000-0000-0000-000000000006', 5, 'c0000001-0000-0000-0000-000000000002', 'Room 201'),
  ('d0000001-0000-0000-0000-000000000003', 'CS-302', 'Database Systems', 3, 'a0000001-0000-0000-0000-000000000001', 5, 'c0000001-0000-0000-0000-000000000001', 'Room 105'),
  ('d0000001-0000-0000-0000-000000000004', 'PHY-101', 'Engineering Physics', 3, 'a0000001-0000-0000-0000-000000000006', 1, 'c0000001-0000-0000-0000-000000000003', 'Lab 2A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.applications (application_id, applicant_name, email, program_id, status, documents_verified, documents_total) VALUES
  ('APP-9021', 'Elena Rodriguez', 'e.rodriguez@gmail.com', 'a0000001-0000-0000-0000-000000000001', 'Applied', 0, 3),
  ('APP-9022', 'Marcus Chen', 'm.chen@gmail.com', 'a0000001-0000-0000-0000-000000000004', 'Applied', 0, 3),
  ('APP-8840', 'Sarah Jenkins', 's.jenkins@gmail.com', 'a0000001-0000-0000-0000-000000000002', 'Screening', 2, 3),
  ('APP-8102', 'David Kim', 'd.kim@gmail.com', 'a0000001-0000-0000-0000-000000000001', 'Pending Deposit', 3, 3)
ON CONFLICT (application_id) DO NOTHING;

INSERT INTO public.fee_structures (program_id, academic_year, base_tuition, lab_fees, material_fees, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000006', '2024-25', 12000, 800, 0, true),
  ('a0000001-0000-0000-0000-000000000005', '2024-25', 24000, 0, 1200, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.transactions (txn_id, student_id, amount, type, status, gateway) VALUES
  ('TXN-099281', 'b0000001-0000-0000-0000-000000000006', 2500.00, 'Tuition', 'Settled', 'Stripe'),
  ('TXN-099282', 'b0000001-0000-0000-0000-000000000007', 1200.00, 'Lab Fee', 'Processing', 'Razorpay'),
  ('TXN-099283', 'b0000001-0000-0000-0000-000000000008', 500.00, 'Application Fee', 'Failed', 'Wire Transfer')
ON CONFLICT (txn_id) DO NOTHING;

INSERT INTO public.marks (student_id, course_id, exam_type, theory_marks, theory_max, practical_marks, practical_max) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'Midterm', 42, 50, 48, 50),
  ('b0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002', 'Midterm', 35, 50, 40, 50)
ON CONFLICT (student_id, course_id, exam_type) DO NOTHING;

INSERT INTO public.exams (course_id, exam_type, scheduled_at, room) VALUES
  ('d0000001-0000-0000-0000-000000000003', 'Midterm', now() + interval '1 day' + interval '10 hours', 'Hall A'),
  ('d0000001-0000-0000-0000-000000000004', 'Lab Viva', now() + interval '2 days' + interval '14 hours', 'Lab 2A')
ON CONFLICT DO NOTHING;

INSERT INTO public.hostel_rooms (room_number, block, floor, capacity, occupied, status) VALUES
  ('A-101', 'Block A', 1, 2, 2, 'Full'),
  ('A-102', 'Block A', 1, 2, 1, 'Available'),
  ('B-201', 'Block B', 2, 3, 0, 'Available'),
  ('B-202', 'Block B', 2, 2, 2, 'Full')
ON CONFLICT (room_number) DO NOTHING;

INSERT INTO public.library_books (isbn, title, author, category, total_copies, available_copies) VALUES
  ('978-0-13-110362-7', 'The C Programming Language', 'Kernighan & Ritchie', 'Computer Science', 5, 3),
  ('978-0-20-131595-5', 'The Pragmatic Programmer', 'Hunt & Thomas', 'Software Engineering', 3, 2),
  ('978-0-59-651798-1', 'JavaScript: The Good Parts', 'Douglas Crockford', 'Web Development', 4, 4)
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO public.events (title, description, event_type, scheduled_at, venue, status) VALUES
  ('Tech Summit 2024', 'Annual technology conference featuring industry speakers', 'Seminar', now() + interval '7 days', 'Main Auditorium', 'Upcoming'),
  ('Placement Drive - TechCorp', 'Campus recruitment drive for B.Tech final year', 'Placement', now() + interval '3 days', 'Conference Hall', 'Upcoming'),
  ('Annual Sports Meet', 'Inter-department sports competition', 'Sports', now() + interval '14 days', 'Sports Complex', 'Upcoming')
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (title, content, target_audience, priority) VALUES
  ('Exam Schedule Released', 'The midterm examination schedule has been published. Please check your student portal.', 'Students', 'High'),
  ('Campus WiFi Maintenance', 'Scheduled maintenance on Saturday 2-4 AM. Expect brief outages.', 'All', 'Normal'),
  ('Placement Registration Open', 'Final year students: Register for TechCorp placement drive by Friday.', 'Students', 'Urgent')
ON CONFLICT DO NOTHING;

INSERT INTO public.companies (name, industry, hr_email) VALUES
  ('TechCorp Solutions', 'Information Technology', 'hr@techcorp.com'),
  ('FinServe Analytics', 'Finance', 'careers@finserve.com'),
  ('BuildRight Engineering', 'Engineering', 'hr@buildright.com')
ON CONFLICT DO NOTHING;

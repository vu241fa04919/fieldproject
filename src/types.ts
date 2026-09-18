export interface College {
  id: string;
  college_code: string;
  college_name: string;
  admin_password_hash: string;
  setup_complete: boolean;
  created_at?: string;
}

export interface Course {
  id: string;
  college_code: string;
  college_id: string;
  course_name: string;
  section_count: number;
  students_per_section: number;
  created_at?: string;
}

export interface Section {
  id: string;
  college_code: string;
  college_id: string;
  course_id: string;
  course_name: string;
  section_label: string;
  student_capacity: number;
  created_at?: string;
}

export interface Faculty {
  id: string;
  college_code: string;
  college_id: string;
  faculty_code: string;
  faculty_name: string;
  assigned_sections?: string[];
  created_at?: string;
}

export interface Student {
  id: string;
  college_code: string;
  college_id: string;
  student_code: string;
  student_name: string;
  password_hash: string;
  section_id: string;
  section_label: string;
  course_id: string;
  course_name: string;
  created_at?: string;
}

export interface Homework {
  id: string;
  college_code: string;
  college_id: string;
  faculty_id: string;
  faculty_code: string;
  faculty_name: string;
  course_id: string;
  course_name: string;
  section_id: string;
  section_label: string;
  title: string;
  description: string;
  due_date: string;
  created_date?: string;
}

export interface TimetableEntry {
  id: string;
  college_code: string;
  college_id: string;
  section_id: string;
  section_label: string;
  course_id: string;
  course_name: string;
  subject: string;
  faculty_id: string;
  faculty_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export interface DiscussionMessage {
  id: string;
  college_code: string;
  college_id: string;
  section_id: string;
  student_id: string;
  student_code: string;
  student_name: string;
  message: string;
  user_role: 'student' | 'faculty' | 'admin';
  created_date?: string;
}

export interface SessionData {
  role: 'admin' | 'faculty' | 'student';
  college_id: string;
  college_code: string;
  college_name: string;
  setup_complete?: boolean;
  // Faculty specific
  faculty_id?: string;
  faculty_code?: string;
  faculty_name?: string;
  // Student specific
  student_id?: string;
  student_code?: string;
  student_name?: string;
  section_id?: string;
  section_label?: string;
  course_id?: string;
  course_name?: string;
}

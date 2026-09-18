import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { db } from '../api/client';
import { getSession, hashPassword } from '../lib/auth';
import Layout from '../components/Layout';
import { Course, Section, Faculty, Student, SessionData } from '../types';
import { BookOpen, Users, GraduationCap, LayoutGrid, Plus, Trash2, Shield } from 'lucide-react';

const NAV = [
  { path: '/admin-dashboard', label: '📊 Overview' },
  { path: '/admin-dashboard/courses', label: '📚 Courses' },
  { path: '/admin-dashboard/faculty', label: '👨‍🏫 Faculty' },
  { path: '/admin-dashboard/students', label: '🎓 Students' },
];

function Overview({ s }: { s: SessionData }) {
  const [stats, setStats] = useState({ courses: 0, sections: 0, students: 0, faculty: 0 });

  useEffect(() => {
    Promise.all([
      db.entities.Course.filter({ college_id: s.college_id }),
      db.entities.Section.filter({ college_id: s.college_id }),
      db.entities.Student.filter({ college_id: s.college_id }),
      db.entities.Faculty.filter({ college_id: s.college_id }),
    ]).then(([c, sec, st, f]) =>
      setStats({
        courses: c.length,
        sections: sec.length,
        students: st.length,
        faculty: f.length,
      })
    );
  }, [s.college_id]);

  const cards = [
    { label: 'Active Courses', value: stats.courses, color: 'text-indigo-600', icon: BookOpen },
    { label: 'Total Sections', value: stats.sections, color: 'text-purple-600', icon: LayoutGrid },
    { label: 'Enrolled Students', value: stats.students, color: 'text-emerald-600', icon: GraduationCap },
    { label: 'Faculty Staff', value: stats.faculty, color: 'text-amber-600', icon: Users },
  ];

  return (
    <div id="admin-overview-tab" className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          <span>Administrator Overview</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{s.college_name}</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">College ID: {s.college_code}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
                <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-bold text-indigo-900 mb-1">College Management Controls</h3>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Use the navigation menu on the left to review configured courses and sections, provision faculty identifier access codes, and register new student accounts into their designated classroom cohorts.
        </p>
      </div>
    </div>
  );
}

function Courses({ s }: { s: SessionData }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newSectionCount, setNewSectionCount] = useState(2);
  const [newCapacity, setNewCapacity] = useState(30);

  const loadData = () => {
    Promise.all([
      db.entities.Course.filter({ college_id: s.college_id }),
      db.entities.Section.filter({ college_id: s.college_id }),
    ]).then(([c, sec]) => {
      setCourses(c);
      setSections(sec);
    });
  };

  useEffect(() => {
    loadData();
  }, [s.college_id]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const crs = await db.entities.Course.create({
      college_code: s.college_code,
      college_id: s.college_id,
      course_name: newCourseName.trim(),
      section_count: Number(newSectionCount),
      students_per_section: Number(newCapacity),
    });

    for (let i = 1; i <= Number(newSectionCount); i++) {
      await db.entities.Section.create({
        college_code: s.college_code,
        college_id: s.college_id,
        course_id: crs.id,
        course_name: crs.course_name,
        section_label: `Section ${i}`,
        student_capacity: Number(newCapacity),
      });
    }

    setNewCourseName('');
    setShowAddCourse(false);
    loadData();
  };

  return (
    <div id="admin-courses-tab" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Courses & Sections</h1>
          <p className="text-xs text-slate-500">Degree programs and class cohorts</p>
        </div>
        <button
          onClick={() => setShowAddCourse((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddCourse ? 'Close' : 'Add Course'}</span>
        </button>
      </div>

      {showAddCourse && (
        <form onSubmit={handleAddCourse} className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Add New Course</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Course Name</label>
              <input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g. Mechanical Engineering"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Number of Sections</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newSectionCount}
                onChange={(e) => setNewSectionCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Capacity / Section</label>
              <input
                type="number"
                min="1"
                max="200"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Create Course & Sections
          </button>
        </form>
      )}

      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <b className="text-base font-semibold text-slate-900">{c.course_name}</b>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.section_count} sections · {c.students_per_section} student capacity per section
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {sections
                .filter((sec) => sec.course_id === c.id)
                .map((sec) => (
                  <span
                    key={sec.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                  >
                    {sec.section_label} ({sec.student_capacity} max)
                  </span>
                ))}
            </div>
          </div>
        ))}

        {!courses.length && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
            No courses set up yet.
          </div>
        )}
      </div>
    </div>
  );
}

function FacultySection({ s }: { s: SessionData }) {
  const [list, setList] = useState<Faculty[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    db.entities.Faculty.filter({ college_id: s.college_id }).then(setList);
  }, [s.college_id]);

  async function add() {
    if (!code.trim()) return;
    const r = await db.entities.Faculty.create({
      college_code: s.college_code,
      college_id: s.college_id,
      faculty_code: code.trim().toUpperCase(),
      faculty_name: name.trim() || code.trim().toUpperCase(),
      assigned_sections: [],
    });
    setList((p) => [...p, r]);
    setCode('');
    setName('');
  }

  async function del(id: string) {
    await db.entities.Faculty.delete(id);
    setList((p) => p.filter((f) => f.id !== id));
  }

  return (
    <div id="admin-faculty-tab" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Faculty Credentials</h1>
        <p className="text-xs text-slate-500">
          Faculty access codes allow teachers to authenticate into their portal
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Add Faculty Member</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code: FAC-201"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono sm:w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Faculty Name (e.g. Prof. Alan Turing)"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={add}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
        {list.map((f) => (
          <div key={f.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-sm bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-100">
                {f.faculty_code}
              </span>
              <span className="text-sm font-medium text-slate-800">{f.faculty_name}</span>
            </div>
            <button
              onClick={() => del(f.id)}
              className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
              title="Delete Faculty"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {!list.length && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No faculty members added yet.
          </div>
        )}
      </div>
    </div>
  );
}

function StudentsSection({ s }: { s: SessionData }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [f, setF] = useState({ name: '', code: '', pw: '', course_id: '', section_id: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      db.entities.Student.filter({ college_id: s.college_id }),
      db.entities.Section.filter({ college_id: s.college_id }),
      db.entities.Course.filter({ college_id: s.college_id }),
    ]).then(([st, sec, c]) => {
      setStudents(st);
      setSections(sec);
      setCourses(c);
    });
  }, [s.college_id]);

  const filtSections = sections.filter((sec) => sec.course_id === f.course_id);

  async function add() {
    if (!f.name || !f.code || !f.pw || !f.section_id || !f.course_id) {
      setErr('Please fill out all student registration fields.');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      const sec = sections.find((s) => s.id === f.section_id);
      const crs = courses.find((c) => c.id === f.course_id);
      const pwHash = await hashPassword(f.pw);

      const r = await db.entities.Student.create({
        college_code: s.college_code,
        college_id: s.college_id,
        student_code: f.code.trim().toUpperCase(),
        student_name: f.name.trim(),
        password_hash: pwHash,
        section_id: f.section_id,
        section_label: sec?.section_label || '',
        course_id: f.course_id,
        course_name: crs?.course_name || '',
      });

      setStudents((p) => [...p, r]);
      setF({ name: '', code: '', pw: '', course_id: '', section_id: '' });
    } catch (e) {
      console.error(e);
      setErr('Failed to enroll student.');
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    await db.entities.Student.delete(id);
    setStudents((p) => p.filter((st) => st.id !== id));
  }

  return (
    <div id="admin-students-tab" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Manage Students</h1>
        <p className="text-xs text-slate-500">
          Enroll students into academic courses and section cohorts
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Enroll New Student</h3>
        {err && <p className="text-xs text-red-600 font-medium">{err}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Student Name</label>
            <input
              value={f.name}
              onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Alex Johnson"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Student ID Code</label>
            <input
              value={f.code}
              onChange={(e) => setF((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. STU-1005"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Academic Course</label>
            <select
              value={f.course_id}
              onChange={(e) => setF((p) => ({ ...p, course_id: e.target.value, section_id: '' }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">Select Course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Section Cohort</label>
            <select
              value={f.section_id}
              disabled={!f.course_id}
              onChange={(e) => setF((p) => ({ ...p, section_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:opacity-50"
            >
              <option value="">Select Section...</option>
              {filtSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.section_label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Initial Password</label>
            <input
              type="password"
              value={f.pw}
              onChange={(e) => setF((p) => ({ ...p, pw: e.target.value }))}
              placeholder="Set student login password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <button
          disabled={busy}
          onClick={add}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{busy ? 'Enrolling...' : 'Enroll Student'}</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
        {students.map((st) => (
          <div key={st.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{st.student_name}</span>
                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {st.student_code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {st.course_name} · <span className="font-medium text-slate-700">{st.section_label}</span>
              </p>
            </div>
            <button
              onClick={() => del(st.id)}
              className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
              title="Delete Student"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {!students.length && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No students registered yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const go = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      go('/');
    } else if (!session.setup_complete) {
      go('/admin-setup');
    }
  }, [go, session]);

  if (!session) return null;

  return (
    <Layout session={session} nav={NAV}>
      <Routes>
        <Route index element={<Overview s={session} />} />
        <Route path="courses" element={<Courses s={session} />} />
        <Route path="faculty" element={<FacultySection s={session} />} />
        <Route path="students" element={<StudentsSection s={session} />} />
      </Routes>
    </Layout>
  );
}

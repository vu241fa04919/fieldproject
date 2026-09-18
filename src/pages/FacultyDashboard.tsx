import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { db } from '../api/client';
import { getSession } from '../lib/auth';
import Layout from '../components/Layout';
import { Course, Section, Homework, TimetableEntry, Student, SessionData } from '../types';
import { BookOpen, Calendar, Clock, Plus, Trash2, CheckCircle2, UserCheck } from 'lucide-react';

const NAV = [
  { path: '/faculty-dashboard', label: '🏠 Dashboard' },
  { path: '/faculty-dashboard/homework', label: '📝 Post Homework' },
  { path: '/faculty-dashboard/timetable', label: '📅 Timetable' },
  { path: '/faculty-dashboard/students', label: '🎓 Students' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Home({ s }: { s: SessionData }) {
  const [hws, setHws] = useState<Homework[]>([]);

  useEffect(() => {
    db.entities.Homework.filter({ college_id: s.college_id, faculty_id: s.faculty_id }).then(setHws);
  }, [s.college_id, s.faculty_id]);

  return (
    <div id="faculty-home-tab" className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Faculty Portal</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {s.faculty_name || s.faculty_code}
        </h1>
        <p className="text-xs text-slate-500">{s.college_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Homework Assignments Posted</p>
            <p className="text-3xl font-extrabold text-indigo-600">{hws.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Assigned Faculty Code</p>
            <p className="text-2xl font-bold font-mono text-slate-800 tracking-wider">
              {s.faculty_code}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">Recently Published Homework</h3>
        {hws.slice(0, 5).map((hw) => (
          <div key={hw.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <b className="text-sm font-semibold text-slate-900">{hw.title}</b>
              {hw.due_date && (
                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium">
                  Due: {hw.due_date}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {hw.course_name} · <span className="font-medium text-slate-700">{hw.section_label}</span>
            </p>
            {hw.description && (
              <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {hw.description}
              </p>
            )}
          </div>
        ))}

        {!hws.length && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
            No homework assignments published yet. Click "Post Homework" in the menu.
          </div>
        )}
      </div>
    </div>
  );
}

function PostHomework({ s }: { s: SessionData }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [f, setF] = useState({ title: '', desc: '', course_id: '', section_id: '', due: '' });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      db.entities.Section.filter({ college_id: s.college_id }),
      db.entities.Course.filter({ college_id: s.college_id }),
    ]).then(([sec, c]) => {
      setSections(sec);
      setCourses(c);
    });
  }, [s.college_id]);

  const filtSec = sections.filter((sec) => sec.course_id === f.course_id);

  async function post() {
    if (!f.title.trim() || !f.course_id || !f.section_id) {
      return setErr('Please specify title, course, and section.');
    }

    setBusy(true);
    setErr('');

    try {
      const sec = sections.find((x) => x.id === f.section_id);
      const crs = courses.find((c) => c.id === f.course_id);

      await db.entities.Homework.create({
        college_code: s.college_code,
        college_id: s.college_id,
        faculty_id: s.faculty_id || '',
        faculty_code: s.faculty_code || '',
        faculty_name: s.faculty_name || '',
        course_id: f.course_id,
        course_name: crs?.course_name || '',
        section_id: f.section_id,
        section_label: sec?.section_label || '',
        title: f.title.trim(),
        description: f.desc.trim(),
        due_date: f.due,
      });

      setF({ title: '', desc: '', course_id: '', section_id: '', due: '' });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } catch (e) {
      console.error(e);
      setErr('Failed to publish homework.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="faculty-homework-tab" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Post Homework & Alerts</h1>
        <p className="text-xs text-slate-500">
          Create assignments visible to students in target cohort sections
        </p>
      </div>

      {ok && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Homework assignment successfully posted!</span>
        </div>
      )}

      {err && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
          {err}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-xl space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
          <input
            value={f.title}
            onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Chapter 4 Exercises: Sorting Algorithms"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Description</label>
          <textarea
            value={f.desc}
            onChange={(e) => setF((p) => ({ ...p, desc: e.target.value }))}
            placeholder="Provide submission guidelines, problems, or reading requirements..."
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Section</label>
            <select
              value={f.section_id}
              disabled={!f.course_id}
              onChange={(e) => setF((p) => ({ ...p, section_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:opacity-50"
            >
              <option value="">Select Section...</option>
              {filtSec.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.section_label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
          <input
            type="date"
            value={f.due}
            onChange={(e) => setF((p) => ({ ...p, due: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <button
          disabled={busy}
          onClick={post}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
        >
          {busy ? 'Publishing...' : 'Publish Homework Assignment →'}
        </button>
      </div>
    </div>
  );
}

function Timetable({ s }: { s: SessionData }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [f, setF] = useState({
    subject: '',
    course_id: '',
    section_id: '',
    day: 'Monday',
    start: '09:00',
    end: '10:30',
  });
  const [adding, setAdding] = useState(false);

  const loadData = () => {
    Promise.all([
      db.entities.TimetableEntry.filter({ college_id: s.college_id }),
      db.entities.Section.filter({ college_id: s.college_id }),
      db.entities.Course.filter({ college_id: s.college_id }),
    ]).then(([e, sec, c]) => {
      setEntries(e);
      setSections(sec);
      setCourses(c);
    });
  };

  useEffect(() => {
    loadData();
  }, [s.college_id]);

  const filtSec = sections.filter((sec) => sec.course_id === f.course_id);

  async function add() {
    if (!f.subject.trim() || !f.course_id || !f.section_id) return;
    const sec = sections.find((x) => x.id === f.section_id);
    const crs = courses.find((c) => c.id === f.course_id);

    const r = await db.entities.TimetableEntry.create({
      college_code: s.college_code,
      college_id: s.college_id,
      section_id: f.section_id,
      section_label: sec?.section_label || '',
      course_id: f.course_id,
      course_name: crs?.course_name || '',
      subject: f.subject.trim(),
      faculty_id: s.faculty_id || '',
      faculty_name: s.faculty_name || '',
      day_of_week: f.day,
      start_time: f.start,
      end_time: f.end,
    });

    setEntries((p) => [...p, r]);
    setF({
      subject: '',
      course_id: '',
      section_id: '',
      day: 'Monday',
      start: '09:00',
      end: '10:30',
    });
    setAdding(false);
  }

  async function del(id: string) {
    await db.entities.TimetableEntry.delete(id);
    setEntries((p) => p.filter((e) => e.id !== id));
  }

  return (
    <div id="faculty-timetable-tab" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Schedule & Timetable</h1>
          <p className="text-xs text-slate-500">Configure weekly class lecture slots</p>
        </div>
        <button
          onClick={() => setAdding((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{adding ? 'Cancel' : 'Add Class Slot'}</span>
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Add Timetable Slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={f.subject}
              onChange={(e) => setF((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Subject / Topic"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <select
              value={f.course_id}
              onChange={(e) => setF((p) => ({ ...p, course_id: e.target.value, section_id: '' }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">Course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>
            <select
              value={f.section_id}
              disabled={!f.course_id}
              onChange={(e) => setF((p) => ({ ...p, section_id: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:opacity-50"
            >
              <option value="">Section...</option>
              {filtSec.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.section_label}
                </option>
              ))}
            </select>
            <select
              value={f.day}
              onChange={(e) => setF((p) => ({ ...p, day: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Start Time</label>
              <input
                type="time"
                value={f.start}
                onChange={(e) => setF((p) => ({ ...p, start: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">End Time</label>
              <input
                type="time"
                value={f.end}
                onChange={(e) => setF((p) => ({ ...p, end: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={add}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Save Slot
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {DAYS.map((day) => {
          const dayEntries = entries.filter((e) => e.day_of_week === day);
          if (!dayEntries.length) return null;

          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-wider uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>{day}</span>
              </div>
              <div className="space-y-2">
                {dayEntries.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border border-indigo-100">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {e.start_time} - {e.end_time}
                        </span>
                      </div>
                      <div>
                        <b className="text-sm font-semibold text-slate-900">{e.subject}</b>
                        <p className="text-xs text-slate-500">
                          {e.course_name} · {e.section_label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => del(e.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 transition-colors cursor-pointer"
                      title="Remove Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!entries.length && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
            No schedule entries added yet.
          </div>
        )}
      </div>
    </div>
  );
}

function StudentsDirectory({ s }: { s: SessionData }) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    db.entities.Student.filter({ college_id: s.college_id }).then(setStudents);
  }, [s.college_id]);

  return (
    <div id="faculty-students-tab" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Directory</h1>
        <p className="text-xs text-slate-500">
          Enrolled students across your college institution
        </p>
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
          </div>
        ))}

        {!students.length && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No enrolled students found in directory.
          </div>
        )}
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const go = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (!session || session.role !== 'faculty') {
      go('/');
    }
  }, [go, session]);

  if (!session) return null;

  return (
    <Layout session={session} nav={NAV}>
      <Routes>
        <Route index element={<Home s={session} />} />
        <Route path="homework" element={<PostHomework s={session} />} />
        <Route path="timetable" element={<Timetable s={session} />} />
        <Route path="students" element={<StudentsDirectory s={session} />} />
      </Routes>
    </Layout>
  );
}

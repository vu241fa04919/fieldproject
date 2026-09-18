import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../api/client';
import { verifyPassword, setSession } from '../lib/auth';
import { College } from '../types';
import { ArrowLeft, School, GraduationCap, BookOpen, CheckCircle, Search } from 'lucide-react';

export default function UserGate() {
  const go = useNavigate();
  const [step, setStep] = useState<'college' | 'role' | 'faculty' | 'student'>('college');
  const [college, setCollege] = useState<College | null>(null);
  const [collegeCode, setCollegeCode] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const back = () => {
    setErr('');
    if (step === 'college') go('/');
    else if (step === 'role') setStep('college');
    else setStep('role');
  };

  async function verifyCollege() {
    if (!collegeCode.trim()) return setErr('Enter College ID.');
    setBusy(true);
    setErr('');

    try {
      const res = await db.entities.College.filter({
        college_code: collegeCode.trim().toUpperCase(),
      });
      if (!res.length) {
        setBusy(false);
        return setErr('College ID not found. Access denied.');
      }
      setCollege(res[0]);
      setStep('role');
    } catch (e) {
      console.error(e);
      setErr('Verification failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function loginFaculty() {
    if (!facultyCode.trim()) return setErr('Enter Faculty ID.');
    setBusy(true);
    setErr('');

    try {
      const res = await db.entities.Faculty.filter({
        college_id: college!.id,
        faculty_code: facultyCode.trim().toUpperCase(),
      });

      if (!res.length) {
        setBusy(false);
        return setErr('Faculty ID not found in this college.');
      }

      setSession({
        role: 'faculty',
        college_id: college!.id,
        college_code: college!.college_code,
        college_name: college!.college_name,
        faculty_id: res[0].id,
        faculty_code: res[0].faculty_code,
        faculty_name: res[0].faculty_name,
      });

      go('/faculty-dashboard');
    } catch (e) {
      console.error(e);
      setErr('Faculty login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function loginStudent() {
    if (!studentCode.trim() || !password) {
      return setErr('Enter Student ID and password.');
    }

    setBusy(true);
    setErr('');

    try {
      const res = await db.entities.Student.filter({
        college_id: college!.id,
        student_code: studentCode.trim().toUpperCase(),
      });

      if (!res.length) {
        setBusy(false);
        return setErr('Student ID not found in this college.');
      }

      const match = await verifyPassword(password, res[0].password_hash);
      if (!match) {
        setBusy(false);
        return setErr('Incorrect password.');
      }

      const s = res[0];
      setSession({
        role: 'student',
        college_id: college!.id,
        college_code: college!.college_code,
        college_name: college!.college_name,
        student_id: s.id,
        student_code: s.student_code,
        student_name: s.student_name,
        section_id: s.section_id,
        section_label: s.section_label,
        course_id: s.course_id,
        course_name: s.course_name,
      });

      go('/student-dashboard');
    } catch (e) {
      console.error(e);
      setErr('Student login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="user-gate-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <button
          onClick={back}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl p-7 shadow-lg border border-slate-200/80">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Faculty & Student Portal</h2>
              <p className="text-xs text-slate-500">Access your academic assignments and schedule</p>
            </div>
          </div>

          {college && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold mb-4 border border-emerald-200/60">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{college.college_name}</span>
            </div>
          )}

          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium mb-4">
              {err}
            </div>
          )}

          {step === 'college' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter your College ID
                </label>
                <div className="relative">
                  <input
                    value={collegeCode}
                    onChange={(e) => {
                      setCollegeCode(e.target.value.toUpperCase());
                      setErr('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && verifyCollege()}
                    placeholder="COL-XXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Unique identifier assigned to your institution
                </p>
              </div>

              <button
                disabled={busy}
                onClick={verifyCollege}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                {busy ? 'Verifying...' : 'Verify College ID →'}
              </button>
            </div>
          )}

          {step === 'role' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium mb-2">Select your academic role:</p>
              <button
                onClick={() => {
                  setStep('faculty');
                  setErr('');
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Faculty / Teacher</p>
                  <p className="text-xs text-slate-500">Post homework, timetable, and view cohorts</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setStep('student');
                  setErr('');
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Student</p>
                  <p className="text-xs text-slate-500">Access homework, alerts, class schedule & discussions</p>
                </div>
              </button>
            </div>
          )}

          {step === 'faculty' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter Faculty ID Code
                </label>
                <input
                  value={facultyCode}
                  onChange={(e) => {
                    setFacultyCode(e.target.value.toUpperCase());
                    setErr('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && loginFaculty()}
                  placeholder="e.g. FAC-101"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                disabled={busy}
                onClick={loginFaculty}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                {busy ? 'Authenticating...' : 'Enter Faculty Portal →'}
              </button>
            </div>
          )}

          {step === 'student' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Student ID Code
                </label>
                <input
                  value={studentCode}
                  onChange={(e) => {
                    setStudentCode(e.target.value.toUpperCase());
                    setErr('');
                  }}
                  placeholder="e.g. STU-1001"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Student Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErr('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && loginStudent()}
                  placeholder="Enter password"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                disabled={busy}
                onClick={loginStudent}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20 mt-1"
              >
                {busy ? 'Authenticating...' : 'Enter Student Portal →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../api/client';
import { getSession, setSession } from '../lib/auth';
import { Trash2, Plus, ArrowRight, ArrowLeft, CheckCircle2, GraduationCap } from 'lucide-react';

interface CourseInput {
  name: string;
  sections: number;
  capacity: number;
}

export default function AdminSetup() {
  const go = useNavigate();
  const session = getSession();

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<CourseInput[]>([
    { name: '', sections: 2, capacity: 30 },
  ]);
  const [facultyCodes, setFacultyCodes] = useState<string[]>(['FAC-101']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  if (!session || session.role !== 'admin') {
    go('/');
    return null;
  }

  function updateCourse(i: number, k: keyof CourseInput, v: string | number) {
    setCourses((p) =>
      p.map((c, idx) => (idx === i ? { ...c, [k]: v } : c))
    );
  }

  async function save() {
    const valid = courses.filter((c) => c.name.trim());
    if (!valid.length) return setErr('Add at least one course.');

    setBusy(true);
    setErr('');

    try {
      for (const c of valid) {
        const rec = await db.entities.Course.create({
          college_code: session!.college_code,
          college_id: session!.college_id,
          course_name: c.name.trim(),
          section_count: Number(c.sections),
          students_per_section: Number(c.capacity),
        });

        for (let s = 1; s <= Number(c.sections); s++) {
          await db.entities.Section.create({
            college_code: session!.college_code,
            college_id: session!.college_id,
            course_id: rec.id,
            course_name: c.name.trim(),
            section_label: `Section ${s}`,
            student_capacity: Number(c.capacity),
          });
        }
      }

      for (const code of facultyCodes.filter((f) => f.trim())) {
        await db.entities.Faculty.create({
          college_code: session!.college_code,
          college_id: session!.college_id,
          faculty_code: code.trim().toUpperCase(),
          faculty_name: code.trim().toUpperCase(),
          assigned_sections: [],
        });
      }

      await db.entities.College.update(session!.college_id, { setup_complete: true });
      setSession({ ...session!, setup_complete: true });
      setDone(true);
    } catch (e) {
      console.error(e);
      setErr('Failed to complete setup. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div id="admin-setup-done-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg border border-slate-200/80 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Setup Complete!</h2>
          <p className="text-slate-600 text-sm mb-6">
            Your college structure has been successfully configured. You can now access your administrator dashboard.
          </p>
          <button
            onClick={() => go('/admin-dashboard')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <span>Go to Admin Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-setup-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Setup Wizard · Step {step} of 2</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{session.college_name}</h2>
          <p className="text-sm text-slate-500 font-mono">College ID: {session.college_code}</p>
        </div>

        {err && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium mb-4">
            {err}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900 mb-1">Configure Academic Courses</h3>
            <p className="text-xs text-slate-500 mb-5">
              Add degree programs or subjects with their initial section divisions and student capacities.
            </p>

            <div className="space-y-3.5 mb-5">
              {courses.map((c, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-indigo-900 uppercase">
                      Course {i + 1}
                    </span>
                    {courses.length > 1 && (
                      <button
                        onClick={() => setCourses((p) => p.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Remove Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Course Name
                      </label>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => updateCourse(i, 'name', e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Sections
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={c.sections}
                        onChange={(e) => updateCourse(i, 'sections', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={c.capacity}
                        onChange={(e) => updateCourse(i, 'capacity', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setCourses((p) => [...p, { name: '', sections: 2, capacity: 30 }])
              }
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-6 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Course</span>
            </button>

            <button
              onClick={() => {
                const valid = courses.filter((c) => c.name.trim());
                if (!valid.length) return setErr('Please specify at least one course.');
                setErr('');
                setStep(2);
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <span>Next: Faculty Identification Codes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900 mb-1">Initial Faculty IDs</h3>
            <p className="text-xs text-slate-500 mb-5">
              Assign codes to your professors and instructors so they can log into the faculty portal.
            </p>

            <div className="space-y-2.5 mb-5">
              {facultyCodes.map((code, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={code}
                    onChange={(e) =>
                      setFacultyCodes((p) =>
                        p.map((f, idx) => (idx === i ? e.target.value.toUpperCase() : f))
                      )
                    }
                    placeholder="FAC-101"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {facultyCodes.length > 1 && (
                    <button
                      onClick={() => setFacultyCodes((p) => p.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-600 p-2 cursor-pointer transition-colors"
                      title="Remove Faculty Code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setFacultyCodes((p) => [...p, `FAC-${100 + p.length + 1}`])
              }
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-6 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty Code</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                disabled={busy}
                onClick={save}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                {busy ? 'Saving...' : 'Finish & Launch College →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

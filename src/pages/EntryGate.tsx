import { useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Users } from 'lucide-react';

export default function EntryGate() {
  const go = useNavigate();

  return (
    <div
      id="entry-gate-page"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6"
    >
      <div className="w-full max-w-md text-center flex flex-col items-center">
        {/* App Logo */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 mb-4">
          <GraduationCap className="w-9 h-9" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
          College Works & Updates
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mb-8">
          Centralized academic platform for colleges, teachers, and students.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3.5">
          <button
            id="entry-admin-btn"
            onClick={() => go('/admin')}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2.5 cursor-pointer text-base"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>College Owner / Admin</span>
          </button>

          <button
            id="entry-user-btn"
            onClick={() => go('/user-gate')}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2.5 cursor-pointer text-base"
          >
            <Users className="w-5 h-5" />
            <span>Faculty / Student Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearSession } from '../lib/auth';
import { SessionData } from '../types';
import { LogOut, GraduationCap } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
}

interface LayoutProps {
  session: SessionData;
  nav: NavItem[];
  children: React.ReactNode;
}

export default function Layout({ session, nav, children }: LayoutProps) {
  const loc = useLocation();
  const go = useNavigate();

  const roleLabel =
    {
      admin: '🏛️ Admin',
      faculty: '📖 Faculty',
      student: '🎓 Student',
    }[session?.role] || '';

  const userName = session?.faculty_name || session?.student_name || session?.college_name || '';

  const handleSignOut = () => {
    clearSession();
    go('/');
  };

  return (
    <div id="cwu-layout" className="flex h-screen overflow-hidden font-sans bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        id="cwu-sidebar"
        className="w-56 bg-indigo-950 text-slate-100 flex flex-col shrink-0 border-r border-indigo-900 select-none"
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-indigo-900/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm tracking-tight leading-tight truncate">CW&U Portal</p>
            <p className="text-indigo-300 text-xs truncate mt-0.5" title={session?.college_name}>
              {session?.college_name}
            </p>
          </div>
        </div>

        {/* User / Role Badge */}
        <div className="px-4 py-3 border-b border-indigo-900/80 bg-indigo-950/40">
          <span className="inline-block bg-indigo-900/90 text-indigo-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
            {roleLabel}
          </span>
          <p className="text-indigo-50 text-sm font-semibold mt-1.5 truncate" title={userName}>
            {userName}
          </p>
          {session?.college_code && (
            <p className="text-indigo-400 font-mono text-[11px] mt-0.5">
              Code: {session.college_code}
            </p>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = loc.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-indigo-200/80 hover:text-white hover:bg-indigo-900/50'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-indigo-900/80">
          <button
            id="signout-button"
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-300 hover:text-red-100 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main id="cwu-main-content" className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

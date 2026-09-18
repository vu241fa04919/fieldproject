import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../api/client';
import { hashPassword, verifyPassword, generateCollegeCode, setSession } from '../lib/auth';
import { ArrowLeft, Copy, Check, Shield, KeyRound, PlusCircle } from 'lucide-react';

export default function AdminGate() {
  const go = useNavigate();
  const [mode, setMode] = useState<'' | 'login' | 'register'>('');
  const [f, setF] = useState({ name: '', code: '', pw: '', pw2: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function register() {
    if (!f.name.trim()) return setErr('Enter college name.');
    if (f.pw.length < 6) return setErr('Password must be at least 6 characters.');
    if (f.pw !== f.pw2) return setErr('Passwords do not match.');

    setBusy(true);
    setErr('');

    try {
      const code = generateCollegeCode();
      const pwHash = await hashPassword(f.pw);

      await db.entities.College.create({
        college_code: code,
        college_name: f.name.trim(),
        admin_password_hash: pwHash,
        setup_complete: false,
      });

      setDone(code);
    } catch (e) {
      console.error(e);
      setErr('Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    if (!f.code.trim() || !f.pw) return setErr('All fields are required.');

    setBusy(true);
    setErr('');

    try {
      const res = await db.entities.College.filter({ college_code: f.code.trim().toUpperCase() });
      if (!res.length) {
        setBusy(false);
        return setErr('College ID not found. Please check and try again.');
      }

      const college = res[0];
      const match = await verifyPassword(f.pw, college.admin_password_hash);
      if (!match) {
        setBusy(false);
        return setErr('Incorrect password.');
      }

      setSession({
        role: 'admin',
        college_id: college.id,
        college_code: college.college_code,
        college_name: college.college_name,
        setup_complete: college.setup_complete,
      });

      go(college.setup_complete ? '/admin-dashboard' : '/admin-setup');
    } catch (e) {
      console.error(e);
      setErr('Login error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function enterNew() {
    const res = await db.entities.College.filter({ college_code: done });
    if (res.length) {
      setSession({
        role: 'admin',
        college_id: res[0].id,
        college_code: done,
        college_name: res[0].college_name,
        setup_complete: false,
      });
      go('/admin-setup');
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(done);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (done) {
    return (
      <div id="admin-registered-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg border border-slate-200/80 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">College Registered!</h2>
          <p className="text-slate-600 text-sm mb-5">
            Your unique College ID is ready. Save this ID for your staff & students!
          </p>

          <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              Your College ID
            </p>
            <p className="text-3xl font-extrabold font-mono tracking-widest text-indigo-950">
              {done}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 mb-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to clipboard!' : 'Copy College ID'}</span>
          </button>

          <button
            onClick={enterNew}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            Continue to Setup &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-gate-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => (mode ? setMode('') : go('/'))}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl p-7 shadow-lg border border-slate-200/80">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Admin Portal</h2>
              <p className="text-xs text-slate-500">Institution Administrator Control Panel</p>
            </div>
          </div>

          {!mode && (
            <div className="space-y-3">
              <button
                id="admin-login-mode-btn"
                onClick={() => setMode('login')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Login to Existing College</p>
                  <p className="text-xs text-slate-500">I have my College ID and Admin Password</p>
                </div>
              </button>

              <button
                id="admin-register-mode-btn"
                onClick={() => setMode('register')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Register New College</p>
                  <p className="text-xs text-slate-500">Create a new college workspace and get an ID</p>
                </div>
              </button>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-4">
              {err && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                  {err}
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. State University of Technology"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    College ID
                  </label>
                  <input
                    type="text"
                    value={f.code}
                    onChange={(e) => set('code', e.target.value.toUpperCase())}
                    placeholder="COL-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={f.pw}
                  onChange={(e) => set('pw', e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={f.pw2}
                    onChange={(e) => set('pw2', e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                disabled={busy}
                onClick={mode === 'login' ? login : register}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-indigo-600/20 mt-2"
              >
                {busy ? 'Please wait...' : mode === 'login' ? 'Login as Admin →' : 'Register College →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

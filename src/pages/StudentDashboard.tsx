import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { db } from '../api/client';
import { getSession } from '../lib/auth';
import Layout from '../components/Layout';
import { Homework, TimetableEntry, DiscussionMessage, SessionData } from '../types';
import { Bell, Calendar, MessageSquare, Clock, Send, Lock, User } from 'lucide-react';

const NAV = [
  { path: '/student-dashboard', label: '🔔 Homework' },
  { path: '/student-dashboard/timetable', label: '📅 Timetable' },
  { path: '/student-dashboard/discussion', label: '💬 Discussion' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function HomeworkList({ s }: { s: SessionData }) {
  const [list, setList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.Homework.filter({ college_id: s.college_id, section_id: s.section_id }).then(
      (h) => {
        setList(
          h.sort(
            (a, b) =>
              new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
          )
        );
        setLoading(false);
      }
    );
  }, [s.college_id, s.section_id]);

  return (
    <div id="student-homework-tab" className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Bell className="w-4 h-4" />
          <span>Cohort Homework & Announcements</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Homework</h1>
        <p className="text-xs text-slate-500">
          {s.course_name} · <span className="font-semibold text-slate-700">{s.section_label}</span>
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading homework assignments...</div>
      ) : !list.length ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
          No homework assignments have been posted for your section yet.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((hw, i) => (
            <div
              key={hw.id}
              className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${
                i === 0
                  ? 'border-indigo-200 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {i === 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Latest
                    </span>
                  )}
                  <h3 className="text-base font-bold text-slate-900">{hw.title}</h3>
                </div>

                {hw.due_date && (
                  <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Due: {hw.due_date}
                  </span>
                )}
              </div>

              {hw.description && (
                <p className="text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">
                  {hw.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Posted by <span className="font-medium text-slate-700">{hw.faculty_name || hw.faculty_code}</span>
                </span>
                {hw.created_date && (
                  <>
                    <span>·</span>
                    <span>{new Date(hw.created_date).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentTimetable({ s }: { s: SessionData }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.TimetableEntry.filter({
      college_id: s.college_id,
      section_id: s.section_id,
    }).then((res) => {
      setEntries(res);
      setLoading(false);
    });
  }, [s.college_id, s.section_id]);

  return (
    <div id="student-timetable-tab" className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Calendar className="w-4 h-4" />
          <span>Class Timetable</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Weekly Schedule</h1>
        <p className="text-xs text-slate-500">
          {s.course_name} · <span className="font-semibold text-slate-700">{s.section_label}</span>
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading schedule...</div>
      ) : !entries.length ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
          No timetable schedule has been posted for your section yet.
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayEntries = entries.filter((e) => e.day_of_week === day);
            if (!dayEntries.length) return null;

            return (
              <div key={day} className="space-y-2">
                <p className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{day}</span>
                </p>
                <div className="space-y-2">
                  {dayEntries.map((e) => (
                    <div
                      key={e.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-mono font-bold border border-indigo-100 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {e.start_time} - {e.end_time}
                          </span>
                        </span>
                        <div>
                          <b className="text-sm font-semibold text-slate-900">{e.subject}</b>
                          <p className="text-xs text-slate-500">Instructor: {e.faculty_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DiscussionBox({ s }: { s: SessionData }) {
  const [msgs, setMsgs] = useState<DiscussionMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const res = await db.entities.DiscussionMessage.filter({
      college_id: s.college_id,
      section_id: s.section_id,
    });
    setMsgs(
      res
        .filter((m) => m.user_role === 'student')
        .sort(
          (a, b) =>
            new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime()
        )
    );
  };

  useEffect(() => {
    loadMessages();

    // Subscribe to real-time events
    const unsub = db.entities.DiscussionMessage.subscribe((ev) => {
      if (
        ev.type === 'create' &&
        ev.data.section_id === s.section_id &&
        ev.data.user_role === 'student'
      ) {
        setMsgs((p) => {
          if (p.some((m) => m.id === ev.data.id)) return p;
          return [...p, ev.data];
        });
      }
    });

    return unsub;
  }, [s.college_id, s.section_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function send() {
    if (!text.trim() || busy) return;

    setBusy(true);
    try {
      await db.entities.DiscussionMessage.create({
        college_code: s.college_code,
        college_id: s.college_id,
        section_id: s.section_id || '',
        student_id: s.student_id || '',
        student_code: s.student_code || '',
        student_name: s.student_name || '',
        message: text.trim(),
        user_role: 'student',
      });
      setText('');
      loadMessages();
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="student-discussion-tab" className="flex flex-col h-[calc(100vh-130px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-0.5">
            <MessageSquare className="w-4 h-4" />
            <span>Classroom Hub</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Section Discussion</h1>
          <p className="text-xs text-slate-500">
            {s.course_name} · <span className="font-semibold text-slate-700">{s.section_label}</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Students Only</span>
        </span>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {!msgs.length && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
              <MessageSquare className="w-8 h-8 mb-2 stroke-1" />
              <p>No messages yet in this section cohort.</p>
              <p className="text-xs text-slate-400 mt-1">Say hello to your classmates below!</p>
            </div>
          )}

          {msgs.map((m) => {
            const isMe = m.student_id === s.student_id;
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                    {m.student_name?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}

                <div className={`max-w-[75%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-semibold text-slate-700">{m.student_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({m.student_code})</span>
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200/60'
                    }`}
                  >
                    {m.message}
                  </div>

                  {m.created_date && (
                    <span
                      className={`block text-[10px] text-slate-400 mt-1 px-1 ${
                        isMe ? 'text-right' : 'text-left'
                      }`}
                    >
                      {new Date(m.created_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Message Input Box */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message to your section classmates..."
            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={send}
            disabled={!text.trim() || busy}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const go = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (!session || session.role !== 'student') {
      go('/');
    }
  }, [go, session]);

  if (!session) return null;

  return (
    <Layout session={session} nav={NAV}>
      <Routes>
        <Route index element={<HomeworkList s={session} />} />
        <Route path="timetable" element={<StudentTimetable s={session} />} />
        <Route path="discussion" element={<DiscussionBox s={session} />} />
      </Routes>
    </Layout>
  );
}

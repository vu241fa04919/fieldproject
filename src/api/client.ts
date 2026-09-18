import {
  College,
  Course,
  Section,
  Faculty,
  Student,
  Homework,
  TimetableEntry,
  DiscussionMessage,
} from '../types';

const STORAGE_PREFIX = 'cwu_data_';

type EntityMap = {
  colleges: College;
  courses: Course;
  sections: Section;
  faculty: Faculty;
  students: Student;
  homework: Homework;
  timetable: TimetableEntry;
  discussions: DiscussionMessage;
};

// Internal broadcast channel for live inter-tab and intra-app real-time communication
type SubscriptionCallback<T> = (event: { type: 'create' | 'update' | 'delete'; data: T }) => void;
const subscribers = new Set<SubscriptionCallback<DiscussionMessage>>();

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('cwu_realtime_channel');
    channel.onmessage = (event) => {
      if (event.data?.entity === 'discussions') {
        subscribers.forEach((cb) => {
          try {
            cb(event.data.payload);
          } catch (e) {
            console.error('Subscription callback error:', e);
          }
        });
      }
    };
  } catch {
    // Fallback if BroadcastChannel is blocked
  }
}

function notifySubscribers(payload: { type: 'create' | 'update' | 'delete'; data: DiscussionMessage }) {
  subscribers.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.error('Subscription error:', e);
    }
  });
  if (channel) {
    try {
      channel.postMessage({ entity: 'discussions', payload });
    } catch {
      // Ignore broadcast errors
    }
  }
}

function readStorage<K extends keyof EntityMap>(key: K): EntityMap[K][] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Failed to read ${key} from storage:`, err);
    return [];
  }
}

function writeStorage<K extends keyof EntityMap>(key: K, data: EntityMap[K][]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write ${key} to storage:`, err);
  }
}

function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Entity helper class
class EntityManager<T extends { id: string }, K extends keyof EntityMap> {
  constructor(private storageKey: K) {}

  async filter(criteria?: Partial<T>): Promise<T[]> {
    const list = readStorage(this.storageKey) as unknown as T[];
    if (!criteria || Object.keys(criteria).length === 0) {
      return [...list];
    }
    return list.filter((item) => {
      return Object.entries(criteria).every(([k, v]) => {
        if (v === undefined) return true;
        return (item as Record<string, unknown>)[k] === v;
      });
    });
  }

  async get(id: string): Promise<T | null> {
    const list = readStorage(this.storageKey) as unknown as T[];
    return list.find((item) => item.id === id) || null;
  }

  async create(data: Omit<T, 'id'> & Partial<Pick<T, 'id'>>): Promise<T> {
    const list = readStorage(this.storageKey) as unknown as T[];
    const newItem = {
      ...data,
      id: data.id || generateId(),
      created_date: (data as Record<string, unknown>).created_date || new Date().toISOString(),
    } as unknown as T;
    list.push(newItem);
    writeStorage(this.storageKey, list as unknown as EntityMap[K][]);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const list = readStorage(this.storageKey) as unknown as T[];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    writeStorage(this.storageKey, list as unknown as EntityMap[K][]);
    return list[index];
  }

  async delete(id: string): Promise<boolean> {
    const list = readStorage(this.storageKey) as unknown as T[];
    const filtered = list.filter((item) => item.id !== id);
    writeStorage(this.storageKey, filtered as unknown as EntityMap[K][]);
    return true;
  }
}

// Special EntityManager for DiscussionMessage with live subscription
class DiscussionEntityManager extends EntityManager<DiscussionMessage, 'discussions'> {
  override async create(data: Omit<DiscussionMessage, 'id'> & Partial<Pick<DiscussionMessage, 'id'>>): Promise<DiscussionMessage> {
    const item = await super.create(data);
    notifySubscribers({ type: 'create', data: item });
    return item;
  }

  subscribe(callback: SubscriptionCallback<DiscussionMessage>): () => void {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }
}

// Initialize seed data if database is fresh
export function initializeSeedData(): void {
  const existingColleges = readStorage('colleges');
  if (existingColleges.length > 0) return;

  const collegeId = 'col_demo_01';
  const collegeCode = 'COL-UNIV01';

  const demoCollege: College = {
    id: collegeId,
    college_code: collegeCode,
    college_name: 'Metropolitan State University',
    // SHA-256 of "password123" + "cwu_salt"
    admin_password_hash: 'a3ba795d85b6a050d079e1c855571b328b9c938a0335d9b490f13b16b287c704',
    setup_complete: true,
    created_at: new Date().toISOString(),
  };

  const course1Id = 'course_cs_01';
  const course2Id = 'course_ee_02';

  const demoCourses: Course[] = [
    {
      id: course1Id,
      college_code: collegeCode,
      college_id: collegeId,
      course_name: 'Computer Science & Engineering',
      section_count: 2,
      students_per_section: 35,
    },
    {
      id: course2Id,
      college_code: collegeCode,
      college_id: collegeId,
      course_name: 'Electrical & Electronics',
      section_count: 2,
      students_per_section: 30,
    },
  ];

  const sec1Id = 'sec_cs_1';
  const sec2Id = 'sec_cs_2';
  const sec3Id = 'sec_ee_1';
  const sec4Id = 'sec_ee_2';

  const demoSections: Section[] = [
    {
      id: sec1Id,
      college_code: collegeCode,
      college_id: collegeId,
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      section_label: 'Section 1',
      student_capacity: 35,
    },
    {
      id: sec2Id,
      college_code: collegeCode,
      college_id: collegeId,
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      section_label: 'Section 2',
      student_capacity: 35,
    },
    {
      id: sec3Id,
      college_code: collegeCode,
      college_id: collegeId,
      course_id: course2Id,
      course_name: 'Electrical & Electronics',
      section_label: 'Section 1',
      student_capacity: 30,
    },
    {
      id: sec4Id,
      college_code: collegeCode,
      college_id: collegeId,
      course_id: course2Id,
      course_name: 'Electrical & Electronics',
      section_label: 'Section 2',
      student_capacity: 30,
    },
  ];

  const fac1Id = 'fac_alan_01';
  const fac2Id = 'fac_ada_02';

  const demoFaculty: Faculty[] = [
    {
      id: fac1Id,
      college_code: collegeCode,
      college_id: collegeId,
      faculty_code: 'FAC-101',
      faculty_name: 'Dr. Alan Turing',
      assigned_sections: [sec1Id, sec2Id],
    },
    {
      id: fac2Id,
      college_code: collegeCode,
      college_id: collegeId,
      faculty_code: 'FAC-102',
      faculty_name: 'Prof. Ada Lovelace',
      assigned_sections: [sec1Id, sec3Id],
    },
  ];

  // SHA-256 of "student123" + "cwu_salt"
  const studentPwHash = 'de99fe800f2f0314825d1847163ec387be20fbb204914d41c5f298cf89c2e2f5';

  const stu1Id = 'stu_alex_01';
  const stu2Id = 'stu_beth_02';

  const demoStudents: Student[] = [
    {
      id: stu1Id,
      college_code: collegeCode,
      college_id: collegeId,
      student_code: 'STU-1001',
      student_name: 'Alex Johnson',
      password_hash: studentPwHash,
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      section_id: sec1Id,
      section_label: 'Section 1',
    },
    {
      id: stu2Id,
      college_code: collegeCode,
      college_id: collegeId,
      student_code: 'STU-1002',
      student_name: 'Beth Miller',
      password_hash: studentPwHash,
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      section_id: sec1Id,
      section_label: 'Section 1',
    },
  ];

  const demoHomework: Homework[] = [
    {
      id: 'hw_01',
      college_code: collegeCode,
      college_id: collegeId,
      faculty_id: fac1Id,
      faculty_code: 'FAC-101',
      faculty_name: 'Dr. Alan Turing',
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      section_id: sec1Id,
      section_label: 'Section 1',
      title: 'Algorithm Complexity & Big O Analysis',
      description: 'Implement merge sort and quick sort in TypeScript. Compare running times on random arrays of sizes 1k, 10k, and 100k elements.',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'hw_02',
      college_code: collegeCode,
      college_id: collegeId,
      faculty_id: fac2Id,
      faculty_code: 'FAC-102',
      faculty_name: 'Prof. Ada Lovelace',
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      section_id: sec1Id,
      section_label: 'Section 1',
      title: 'Database Normalization Exercise',
      description: 'Convert the given unnormalized sales transaction spreadsheet schema into 1NF, 2NF, and 3NF relational tables.',
      due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_date: new Date().toISOString(),
    },
  ];

  const demoTimetable: TimetableEntry[] = [
    {
      id: 'tt_01',
      college_code: collegeCode,
      college_id: collegeId,
      section_id: sec1Id,
      section_label: 'Section 1',
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      subject: 'Data Structures & Algorithms',
      faculty_id: fac1Id,
      faculty_name: 'Dr. Alan Turing',
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:30',
    },
    {
      id: 'tt_02',
      college_code: collegeCode,
      college_id: collegeId,
      section_id: sec1Id,
      section_label: 'Section 1',
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      subject: 'Operating Systems & Linux',
      faculty_id: fac2Id,
      faculty_name: 'Prof. Ada Lovelace',
      day_of_week: 'Monday',
      start_time: '11:00',
      end_time: '12:30',
    },
    {
      id: 'tt_03',
      college_code: collegeCode,
      college_id: collegeId,
      section_id: sec1Id,
      section_label: 'Section 1',
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      subject: 'Database Management Systems',
      faculty_id: fac2Id,
      faculty_name: 'Prof. Ada Lovelace',
      day_of_week: 'Wednesday',
      start_time: '10:00',
      end_time: '11:30',
    },
    {
      id: 'tt_04',
      college_code: collegeCode,
      college_id: collegeId,
      section_id: sec1Id,
      section_label: 'Section 1',
      course_id: course1Id,
      course_name: 'Computer Science & Engineering',
      subject: 'Computer Networks & Security',
      faculty_id: fac1Id,
      faculty_name: 'Dr. Alan Turing',
      day_of_week: 'Friday',
      start_time: '09:00',
      end_time: '10:30',
    },
  ];

  const demoDiscussions: DiscussionMessage[] = [
    {
      id: 'msg_01',
      college_code: collegeCode,
      college_id: collegeId,
      section_id: sec1Id,
      student_id: stu1Id,
      student_code: 'STU-1001',
      student_name: 'Alex Johnson',
      message: 'Hey everyone! Has anyone started the Big-O sorting analysis homework yet?',
      user_role: 'student',
      created_date: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    },
    {
      id: 'msg_02',
      college_code: collegeCode,
      college_id: collegeId,
      section_id: sec1Id,
      student_id: stu2Id,
      student_code: 'STU-1002',
      student_name: 'Beth Miller',
      message: 'Yes! Merge sort was straightforward. Make sure to test quicksort on already-sorted arrays too for worst case.',
      user_role: 'student',
      created_date: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
  ];

  writeStorage('colleges', [demoCollege]);
  writeStorage('courses', demoCourses);
  writeStorage('sections', demoSections);
  writeStorage('faculty', demoFaculty);
  writeStorage('students', demoStudents);
  writeStorage('homework', demoHomework);
  writeStorage('timetable', demoTimetable);
  writeStorage('discussions', demoDiscussions);
}

// Auto-initialize seed data if in browser
if (typeof window !== 'undefined') {
  initializeSeedData();
}

// Complete entities API: clean, standard, standalone implementation
export const db = {
  entities: {
    College: new EntityManager<College, 'colleges'>('colleges'),
    Course: new EntityManager<Course, 'courses'>('courses'),
    Section: new EntityManager<Section, 'sections'>('sections'),
    Faculty: new EntityManager<Faculty, 'faculty'>('faculty'),
    Student: new EntityManager<Student, 'students'>('students'),
    Homework: new EntityManager<Homework, 'homework'>('homework'),
    TimetableEntry: new EntityManager<TimetableEntry, 'timetable'>('timetable'),
    DiscussionMessage: new DiscussionEntityManager('discussions'),
  },
  resetDatabase() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX) || k === 'cwu_session')
      .forEach((k) => localStorage.removeItem(k));
    initializeSeedData();
  },
};

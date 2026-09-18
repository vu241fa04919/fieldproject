# 🎓 College Works & Updates (CW&U)

A full-featured College Management & Student Updates web application designed for educational institutions. Provides role-based portals for **College Administrators**, **Faculty Staff**, and **Students**.

> **Note on base44 removal:** All proprietary `@base44/sdk`, `@base44/vite-plugin`, base44 backend entities, and remote dependencies have been completely removed and rewritten into a pure, zero-lock-in, standalone TypeScript architecture.

---

## 🚀 Running in VS Code

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [VS Code](https://code.visualstudio.com/)

### Step-by-Step Setup

1. **Open the project in VS Code**:
   ```bash
   code .
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

---

## 🔑 Pre-seeded Demo Credentials

The application automatically seeds a fully-populated demo college so you can test all features immediately without manual setup:

### 🏛️ College Administrator Portal
- **College ID:** `COL-UNIV01`
- **Admin Password:** `password123`
- *Features:* View institution metrics, manage degree courses & sections, register faculty codes, and enroll students.

### 📖 Faculty / Teacher Portal
- **College ID:** `COL-UNIV01`
- **Faculty ID Code:** `FAC-101` *(Dr. Alan Turing)* or `FAC-102` *(Prof. Ada Lovelace)*
- *Features:* Post homework assignments with due dates and target sections, manage class timetables, and view student directory.

### 🎓 Student Portal
- **College ID:** `COL-UNIV01`
- **Student ID Code:** `STU-1001` *(Alex Johnson)* or `STU-1002` *(Beth Miller)*
- **Student Password:** `student123`
- *Features:* View section homework with status badges, check weekly class schedules, and participate in real-time student cohort discussions.

---

## 📁 Project Architecture

- `src/api/client.ts` — Clean, zero-external-dependency database & storage engine supporting CRUD operations (`College`, `Course`, `Section`, `Faculty`, `Student`, `Homework`, `TimetableEntry`, `DiscussionMessage`), live subscriptions, and persistence.
- `src/lib/auth.ts` — Secure client-side SHA-256 password hashing (via Web Crypto API), session handling, and college code generation.
- `src/types.ts` — TypeScript definitions for all domain entities and sessions.
- `src/components/Layout.tsx` — Responsive navigation layout with role badges, institution context, and logout handling.
- `src/pages/EntryGate.tsx` — Portal selector (Admin vs. Faculty/Student) with demo quick-start credentials.
- `src/pages/AdminGate.tsx` — Administrator login and new college registration with automated code generation.
- `src/pages/AdminSetup.tsx` — Onboarding wizard for courses, section cohorts, and faculty codes.
- `src/pages/AdminDashboard.tsx` — Administrator dashboard with analytics overview, course management, faculty credentials, and student enrollment.
- `src/pages/UserGate.tsx` — Verification gate and credentials login for teachers and students.
- `src/pages/FacultyDashboard.tsx` — Faculty workspace for posting homework, managing schedules, and viewing student lists.
- `src/pages/StudentDashboard.tsx` — Student hub for homework deadlines, class timetables, and live discussion messages.

---

## 🛠️ Build & Scripts

- `npm run dev` — Launch Vite dev server
- `npm run build` — Compile production web application
- `npm run preview` — Preview the production build locally

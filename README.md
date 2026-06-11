# 🎓 StudySync

**StudySync** is a premium, student-first platform designed to bridge the gap between academic isolation and social learning. Built specifically for students (with a focus on VTU engineering curriculum), it helps you find the right study circles, manage your focus, and sync your academic rhythm.

---

## ✨ Key Features

### 📅 Smart Scheduling & Focus
*   **Pomodoro Master:** A built-in, responsive Pomodoro timer to manage your deep work sessions (25min Focus / 5min Break).
*   **Quiet & Live Sessions:** Create "Quiet Deep Focus" rooms for introverts or "Live Discussion" sessions for active problem-solving.
*   **VTU Sync:** Automatically suggests study sessions based on your specific **Branch** and **Semester**.

### 💬 Study Circles
*   **Universal Communities:** Jump into massive subject-specific groups (e.g., DSA, COA, Maths) for instant doubt solving.
*   **Private Circles:** Form cozy, language-based (Mother Tongue matching) or location-based study squads.
*   **Real-time StudyHub:** Chat with members, join voice/video sessions, and share resources instantly.

### 🔔 Smart Notifications
*   **Lurker-Friendly Alerts:** Get notified when friends are studying quietly so you can join without the pressure of speaking.
*   **Rhythm Updates:** Stay updated on upcoming sessions in your groups.

---

## 🛠️ Technology Stack

*   **Frontend:** React 19 + Vite
*   **Styling:** Custom Modern CSS (Glassmorphism & Dark Mode)
*   **Icons:** Lucide React
*   **Backend/Database:** Supabase (PostgreSQL + Real-time + RLS)
*   **Authentication:** Supabase Auth (Email & Metadata)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js installed on your machine.
*   A Supabase account.

### Local Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/GDlion1/studysync.git
    cd studysync
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add your Supabase credentials plus a valid Google OAuth client ID and backend URL:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
    VITE_API_URL=https://your-backend.example.com
    ```

    Make sure your Google Cloud OAuth client has `http://localhost:5173` registered as an authorized JavaScript origin for local dev and `https://studysync-ten-xi.vercel.app` for your deployed site.

    In production (Vercel), also add the same values under Environment Variables so the build can access them.

4.  **Database Setup**:
    Run the `.sql` migration files located in the root directory inside your **Supabase SQL Editor**:
    *   `GROUPS_MIGRATION.sql`
    *   `ADVANCED_GROUPS_MIGRATION.sql`
    *   `RESOURCES_MIGRATION.sql`
    *   `SESSIONS_MIGRATION.sql`

5.  **Run the application**:
    ```bash
    npm run dev
    ```

---

## 📸 Screenshots & Feedback
I created this project to help my fellow students stay focused and connected. Feel free to explore the features!

**Feedback is welcome!** Reach out if you have ideas to improve the StudyHub or the Focus Timer.

---

## 📄 License
This project is for educational purposes. (ISC License)

# 📊 DBMS Project — Next.js + Supabase

This is a **Database Management System (DBMS)** project built using **Next.js (App Router)** and **Supabase** as the backend. Developed as part of my **second-year second-semester university coursework**, this project explores modern full-stack development with serverless Postgres, authentication, and real-time features.

> 🚧 This project is a work in progress. New features and improvements will be added soon.

---

## 🛠 Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) 14 (App Router, Server Components)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** TypeScript
- **Package Manager:** [pnpm](https://pnpm.io/)

---

## 📁 Project Structure

.
├── app/ # App router directory (routes, layouts, pages)
├── components/ # Reusable UI components
├── hooks/ # Custom React hooks
├── lib/ # Supabase client and utilities
├── middleware.ts # Authentication/route protection middleware
├── utils/ # Utility functions
├── public/ # Static assets
├── styles/ # Tailwind and global CSS config
├── tailwind.config.ts # Tailwind configuration
├── tsconfig.json # TypeScript configuration
├── package.json # Project metadata and scripts
├── README.md # Project documentation

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
2. Install Dependencies
bash
Copy
Edit
pnpm install
3. Set Up Environment Variables
Create a .env.local file in the root and add your Supabase credentials:

env
Copy
Edit
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-api-key
You can get these from the Supabase project dashboard under Project Settings → API.

4. Start the Development Server
bash
Copy
Edit
pnpm dev
Now navigate to http://localhost:3000 to view your app.

📌 Features (Planned)
 User authentication (login/signup)

 Dashboard with user-specific data

 CRUD operations with Supabase tables

 Admin panel (role-based access)

 Data visualization (charts, graphs)

 Responsive UI with Tailwind CSS


🗒 Notes
This is an academic project and still under development.

Feel free to fork, use, or contribute — just give proper credit.

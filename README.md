# 💰 Finance Dashboard

A full-stack financial management dashboard built with **Next.js**, **MongoDB**, and **Recharts** — featuring role-based access control, interactive data visualizations, and a clean, responsive UI.

**🚀 Live Demo:** [finance-dashboard-delta-two.vercel.app](https://finance-dashboard-delta-two.vercel.app)

---

## What is this?

This is a multi-user finance dashboard where different types of users (admins, analysts, and viewers) can log in and interact with financial data based on their role. It's designed to give teams a centralized place to track, visualize, and manage financial records — all in one clean interface.

Whether you're tracking income/expenses, reviewing records, or just exploring the charts, each user role gets a tailored experience with appropriate permissions.

---

## Features

- **Authentication System** — Secure JWT-based login and signup with cookie-based session management
- **Role-Based Access Control** — Three distinct roles: `Admin`, `Analyst`, and `Viewer`, each with different levels of access
- **Interactive Dashboard** — Visual charts and graphs powered by Recharts to make sense of financial data at a glance
- **Records Management** — Add, view, and manage financial records
- **Protected Routes** — Middleware ensures unauthenticated users are redirected to login, and already-logged-in users are redirected away from auth pages
- **Form Validation** — Input validation using Zod to keep data clean
- **Responsive Design** — Built with Tailwind CSS, works well across screen sizes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | MongoDB via Mongoose |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| HTTP Client | Axios |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** v18 or higher
- **npm** (comes with Node)
- A **MongoDB** database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/mayankgautam29/finance_dashboard.git
cd finance_dashboard
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Create a `.env.local` file in the root of the project and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

> **Note:** Never commit your `.env.local` file. It's already in `.gitignore`.

**4. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you should see the login page.

---

## Demo Accounts

Want to try it out without signing up? Use these demo credentials on the live site:

| Role | Email | Password |
|---|---|---|
| Admin | adminuser4@gmail.com | admin4123 |
| Analyst | analystuser@gmail.com | analyst123 |
| Viewer | user1@gmail.com | user123 |

Different roles give you different levels of access — try logging in as each one to see what changes.

---

## Project Structure

```
finance_dashboard/
├── src/
│   ├── app/
│   │   ├── auth/           # Login & signup pages
│   │   ├── dashboard/      # Main dashboard with charts
│   │   ├── records/        # Financial records page
│   │   ├── home/           # Landing/home page
│   │   └── api/            # API routes (auth, records, etc.)
│   ├── components/         # Reusable UI components
│   ├── lib/                # DB connection, helpers
│   └── models/             # Mongoose models (User, Record, etc.)
├── public/                 # Static assets
├── middleware.ts            # Route protection logic
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## How Authentication Works

The app uses a cookie-based JWT flow:

1. User logs in → server validates credentials → issues a signed JWT stored as an HTTP cookie
2. On every request, `middleware.ts` checks for the token cookie
3. If no token is found → redirect to `/auth/login`
4. If a token is found and the user tries to access login/signup → redirect to `/dashboard`
5. API routes under `/api/auth` are always public (no token required)

Passwords are hashed using **bcryptjs** before being stored in the database — plain text passwords are never saved.

---

## Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start the production server
npm start
```

---

## Deployment

This project is deployed on **Vercel** and works out of the box with zero extra configuration. To deploy your own copy:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add your environment variables (`MONGODB_URI`, `JWT_SECRET`) in the Vercel dashboard
4. Hit deploy — that's it

---

## Contributing

Contributions are welcome! If you find a bug or have an idea for a feature:

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes and commit them
4. Push to your fork and open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Author

Built by [Mayank Gautam](https://github.com/mayankgautam29)

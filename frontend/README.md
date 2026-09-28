# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
@'

# Construction Management System (CMS) — Frontend MVP

A residential construction tracking and multi-stakeholder workflow single-page application built with React, Vite, JavaScript, and Tailwind CSS.

---

## 1. Project Purpose & Workflow Chain

The system manages the core construction lifecycle:

- **Admin:** Registers construction sites, allocates ETB budgets, and assigns project stakeholders.
- **Lead Engineer:** Drafts milestone payment tranches, material requisitions, and technical CAD drawings.
- **House Holder (Property Owner):** Holds sole approval discretion—approves or requests revisions with feedback notes.
- **Operations Manager:** Fulfills operations only upon House Holder approval—disburses bank payments, logs bank transaction references, and verifies site material deliveries.

---

## 2. Technology Stack

- **Framework:** React 18+ (Functional Components & Hooks)
- **Build Tool:** Vite
- **Styling Engine:** Tailwind CSS v4 (@tailwindcss/vite)
- **Routing:** React Router v6+ with Role-Based Route Guards (`ProtectedRoute.jsx`)
- **State Management:** React Context API (`AuthContext.jsx`) & Service Layer Observer Pattern
- **Icons:** Lucide React
- **HTTP Client:** Axios (Pre-configured for future Node.js REST API)

---

## 3. Demo Accounts & Testing

All demo personas share the password: `password123`

| Role             | Demo Email                | Full Name         | Primary Responsibility              |
| :--------------- | :------------------------ | :---------------- | :---------------------------------- |
| **Admin**        | `admin@example.com`       | Alemayehu Tadesse | Portfolio oversight & site creation |
| **House Holder** | `householder@example.com` | Abebe Kebede      | Reviewing & approving tranches      |
| **Engineer**     | `engineer@example.com`    | Hana Worku        | Drafting technical requisitions     |
| **Manager**      | `manager@example.com`     | Daniel Hailu      | Payout settlement & material drops  |

---

## 4. Architecture: Service Layer Pattern

UI components never make direct API calls or hardcode data arrays. Instead, they interact via abstract services:

- `src/services/authService.js` -> Authentication & session persistence
- `src/services/projectService.js` -> Construction sites & progress metrics
- `src/services/requestService.js` -> 4-party requisition workflows
- `src/services/paymentService.js` -> Disbursement ledger & bank vouchers
- `src/services/materialService.js` -> Supply requisitions & delivery receipts
- `src/services/documentService.js` -> Blueprints, contracts, and archives

### Connecting to Node.js / Express Backend (Future Phase)

When you are ready to implement the Node.js/Express server in the `backend/` folder:

1. Update `src/services/api.js` with your backend URL (e.g. `http://localhost:5000/api`).
2. Replace the internal arrays in `src/services/*.js` with standard Axios calls:

   ```javascript
   // Before (Mock Development):
   return [...projectsStore];

   // After (Connected to Node.js Backend):
   const response = await apiClient.get("/projects");
   return response.data;
   ```

### 6. Final System Verification Checklist

1. **Bell Notification Center:** Click the bell icon in the top navbar. View unread notifications tailored to your active role, test clicking a notification to mark it read, or click **"Mark all read"**.
2. **Activity Audit Trail:** Click **"Activities"** in the sidebar. Inspect the chronological timeline showing which stakeholder approved, disbursed, or registered items with precise timestamps.
3. **Role-Based Handshake Review:**
   - **Admin:** Registers a project in `/admin/dashboard`.
   - **Engineer:** Submits a payment request in `/engineer/dashboard`.
   - **House Holder:** Inspects, adds comments, and approves it in `/house-holder/dashboard`.
   - **Manager:** Settles the payout with a bank reference in `/manager/dashboard`.
   - **Site Dossier:** Review the complete history under `/admin/projects/proj-001`.

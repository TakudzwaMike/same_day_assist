# Same Day Assist

Same Day Assist (Pty) Ltd is an enterprise-grade emergency dispatch, property compliance monitoring, and rapid security responder management platform.

This platform facilitates the dispatch of emergency assistance, coordinates cruiser tracking, conducts pre-compliance safety audits, and manages invoicing and sign-offs across multiple responsive interfaces.

---

## 🚀 System Architecture Overview

The codebase is organized into modular frontend panels and a dedicated backend event server:

1. **Customer Portal**:
   - Log emergency panic signals and non-emergency repair requests.
   - Review and approve compliance audit quotations.
   - Access historical tax statements and invoices.

2. **Contractor Responder Terminal**:
   - Real-time task board to accept dispatch tickets.
   - Interactive drawing canvas for customer verification and signature collection.
   - Dynamic GPS-coordinate simulation for patrol vehicle tracking.

3. **Administrator Command Hub**:
   - Central control room panel to audit customer enquiries.
   - Live cruiser status monitors to allocate closest units.
   - Auto-generated business reports and system event logs.

---

## 🛠️ Getting Started

### 📋 Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.x or later)
- **npm** (v9.x or later)

### 📦 Installation

1. Install local dependencies:
   ```bash
   npm install
   ```

2. Seed and configure the local SQLite database schema:
   ```bash
   npm run db:setup
   ```

---

## 💻 Running the Services

To run the application locally, start both the backend API and the frontend web clients:

### 1. Start the API Server
Starts the database connections and Express API endpoint watchers:
```bash
npm run server
```

### 2. Start the Vite Frontend Client
Starts the Vite dev server for browser interaction:
```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser to access the main interface.

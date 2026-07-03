# API Routes Reference Guide

This document catalogs the current set of API routes available in **AnvayaLab** along with their methods, parameters, and behaviors.

---

## 🔑 Authentication Routes

### `POST /api/signup`
* **Purpose:** Registers a new user and sends a verification email.
* **Payload:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
* **Behavior:** Checks for email duplicates. If unverified but existing, updates user password and resends OTP. Sends HTML email with OTP via Google SMTP.

### `POST /api/verify`
* **Purpose:** Verifies a user's email via the 6-digit OTP code.
* **Payload:**
  ```json
  {
    "email": "john@example.com",
    "code": "123456"
  }
  ```
* **Behavior:** Marks `isEmailVerified: true` in the DB and purges the verification document.

### `GET/POST /api/auth/[...nextauth]`
* **Purpose:** Handles application session management and provider logins.
* **Providers:** Google, GitHub, and email Credentials.
* **Callback Behavior:** OAuth sign-ins automatically synchronize with the MongoDB `users` collection in the `signIn` callback, setting `isEmailVerified: true` implicitly.

---

## 📁 Workspace Routes

### `GET /api/workspace`
* **Purpose:** Retrieves a flat list of all workspaces owned by the currently authenticated user.
* **Query Parameters:** None.

### `POST /api/workspace`
* **Purpose:** Creates a new workspace.
* **Payload:**
  ```json
  {
    "name": "My Workspace"
  }
  ```
* **Behavior:** Associates the workspace with the logged-in user (`ownerId`). Prevents workspace name duplicates for the same owner.

### `DELETE /api/workspace`
* **Purpose:** Cascades and deletes a workspace and all of its associated components.
* **Query Parameters:** `?id=[workspace_id]` (Required)
* **Behavior:** 
  1. Verifies workspace ownership.
  2. Finds all child collections belonging to the workspace.
  3. Purges all requests associated with those collection IDs.
  4. Purges all collections linked to the workspace.
  5. Removes the workspace document.

---

## 🗂️ Collection Routes

### `GET /api/collection`
* **Purpose:** Retrieves all collections belonging to a specific workspace.
* **Query Parameters:** `?workspaceId=[workspace_id]` (Required)
* **Behavior:** Verifies that the workspace belongs to the authenticated user.

### `POST /api/collection`
* **Purpose:** Creates a new collection inside a workspace.
* **Payload:**
  ```json
  {
    "name": "Auth API",
    "workspaceId": "64b0f9f3c713b1a29f864e22"
  }
  ```
* **Behavior:** Verifies workspace ownership and checks for duplicate collection names in the same workspace.

### `DELETE /api/collection`
* **Purpose:** Cascades and deletes a collection and its nested requests.
* **Query Parameters:** `?id=[collection_id]` (Required)
* **Behavior:**
  1. Finds the collection and verifies workspace ownership.
  2. Purges all HTTP requests associated with the collection.
  3. Deletes the collection document.

---

## ⚡ Request Routes

### `GET /api/requests`
* **Purpose:** Retrieves all requests belonging to a specific collection.
* **Query Parameters:** `?collectionId=[collection_id]` (Required)
* **Behavior:** Verifies collection ownership via workspace.

### `POST /api/requests`
* **Purpose:** Creates a new HTTP request in a collection.
* **Payload:**
  ```json
  {
    "collectionId": "64b0f9f3c713b1a29f864e23",
    "name": "Get User Details",
    "method": "GET",
    "url": "https://api.example.com/user",
    "description": "Fetch current user payload",
    "queryParams": [],
    "headers": [],
    "authentication": { "type": "none" },
    "body": { "type": "none", "content": "" }
  }
  ```
* **Behavior:** Validates request structure using Zod schema and verifies collection ownership.

### `PATCH /api/requests`
* **Purpose:** Updates an existing request.
* **Query Parameters:** `?id=[request_id]` (Required)
* **Payload:** Partial Request payload (only fields that need to be changed, e.g. `{ "url": "https://api.new-url.com" }`).
* **Behavior:** Verifies owner authorization and performs a partial update (`$set`) via Zod partial schema.

### `DELETE /api/requests`
* **Purpose:** Deletes an individual request.
* **Query Parameters:** `?id=[request_id]` (Required)
* **Behavior:** Verifies workspace ownership and removes the request.

### `POST /api/requests/run`
* **Purpose:** Proxy execution runner for sandboxed client HTTP requests (circumvents browser CORS limitations).
* **Payload:**
  ```json
  {
    "url": "https://jsonplaceholder.typicode.com/todos/1",
    "method": "GET",
    "queryParams": [],
    "headers": [],
    "authentication": { "type": "none" },
    "body": { "type": "none", "content": "" }
  }
  ```
* **Behavior:** Appends query parameters to the URL string, attaches active authentication values, and issues the dispatch request via Server-Side Axios. Returns status codes, execution duration (time), headers, and result payload object.

---

## 🕒 Request History Routes

### `GET /api/history`
* **Purpose:** Fetches log history items for requests inside a specified workspace.
* **Query Parameters:** `?workspaceId=[workspace_id]` (Required)
* **Behavior:** Retrieves history records sorted by creation timestamp descending.

### `POST /api/history`
* **Purpose:** Logs request executions in the database history collection.
* **Payload:**
  ```json
  {
    "workspaceId": "64b0f9f3c713b1a29f864e22",
    "method": "GET",
    "url": "https://api.example.com",
    "headers": "{}",
    "body": "",
    "status": 200,
    "responseTime": 150,
    "response": "..."
  }
  ```
* **Behavior:** Validates inputs using Zod, maps context to the logged-in user ID, and creates a history document record.

### `DELETE /api/history`
* **Purpose:** Clears history records for the current user in a specified workspace.
* **Query Parameters:** `?workspaceId=[workspace_id]` (Required)
* **Behavior:** Performs cascade delete on history models for user/workspace ID keys.

---

## 📦 Dependencies

Here is a catalog of the primary dependencies configured in the **AnvayaLab** structure, along with their installation commands:

### ⚙️ Core & Authentication
* **Next.js & React:** `next` (v16.2.9), `react` & `react-dom` (v19.2.4)
* **Authentication & Encryption:** `next-auth` (v4.24.14), `bcryptjs` (v3.0.3)
```bash
npm i next-auth bcryptjs
npm i -D @types/bcryptjs
```

### 🗃️ Database & Networking
* **Database ORM:** `mongoose` (v9.7.3)
* **HTTP Client:** `axios` (v1.18.1)
```bash
npm i mongoose axios
```

### 📋 Form Management & Validation
* **Form Builder & Validation:** `react-hook-form` (v7.80.0), `@hookform/resolvers` (v5.4.0), `zod` (v4.4.3)
```bash
npm i react-hook-form @hookform/resolvers zod
```

### 🎨 Styling, UI, & Animation
* **CSS, Primitives & Icons:** `tailwindcss` (v4.0.0), `@tailwindcss/postcss`, `framer-motion` (v12.42.2), `tw-animate-css` (v1.4.0), `sonner` (v2.0.7), `lucide-react` (v0.469.0)
* **Utilities:** `@radix-ui/react-label`, `@radix-ui/react-slot`, `@uidotdev/usehooks`, `class-variance-authority`, `clsx`, `tailwind-merge`
```bash
npm i framer-motion tw-animate-css sonner lucide-react @uidotdev/usehooks
npm i @radix-ui/react-label @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### 📧 Email Client
* **SMTP client & Templates:** `nodemailer` (v7.0.13), `react-email` (v6.6.5)
```bash
npm i nodemailer react-email
npm i -D @types/nodemailer
```

### 💻 Code Highlighting
* **Syntax Highlighter:** `shiki` (v4.3.1)
```bash
npm i shiki
```
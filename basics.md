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

---

## 📦 Dependencies

### Code Highlighting
```bash
npm install shiki
```

### Request Handler
```bash
npm install axios
```

### Email Client
```bash
npm install nodemailer
npm install -D @types/nodemailer
```
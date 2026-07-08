# Workspace Settings Implementation Plan

This document outlines the visual structure, layout, styles, and state-management mapping for the new **Workspace Global Settings** dashboard. It adapts the design mockups to your application's actual data schemas.

---

## 1. Structure & Layout Mapping

### Header & Metadata Bar
* **Title**: `Workspace Global Settings`
* **Badge**: `Developer Engine` (small mono status label)
* **Subtitle**: `Customize TLS policies, connection timeouts, cluster backups, and danger settings`
* **Icon**: `Settings` cog (Lucide)
* **Metadata Credentials Card**:
  * **Avatar**: Circular badge containing the first letter of the active user's name or email.
  * **Active Credentials**: `{session?.user?.email}` (Dynamic from NextAuth)
  * **Workspace Level**: `{activeWorkspace?.name || "Personal Workspace"}` 
    * *Implementation*: Displays the name of the active workspace to ground the mockup in your actual data.
  * **Server Nodes**: `Proxy Engine Online` 
    * *Implementation*: A premium status label indicating that the server-side API request router (`/api/requests/run`) is active and operational.

### Section 1: REST Sandbox Controls
Two-column grid containing input cards and toggles (SSL/TLS card has been removed for simplicity):
1. **HTTP Request Timeout (ms)**:
   * Description: `Maximum milliseconds allowed before killing an idle connection.`
   * Input element: Number field bound to state `timeout` (saves to `anvaya_settings_timeout_${workspaceId}`, default: `8000`).
   * Label: `Default: 8000ms`
2. **Max Response Size Limit (MB)**:
   * Description: `Maximum allowable response payload buffer size in megabytes.`
   * Input element: Number field bound to state `maxSize` (saves to `anvaya_settings_max_size_${workspaceId}`, default: `10`).
   * Label: `Default: 10MB`
3. **Follow Redirect Location headers**:
   * Description: `Automatically parse 3xx redirection headers to route subsequent requests.`
   * Toggle: Custom button styled as `ENABLED` / `DISABLED` (green when enabled).
   * State: `followRedirects` (boolean, saves to `anvaya_settings_follow_redirects_${workspaceId}`, default: `true`).

---

## 2. Section 2: Network Routing Proxy & Workspace Portability

### Network Routing Proxy
* **Title**: `ANVAYALAB CONNECTION PROXY`
* **Description**: `Proxy all sandbox API requests through our server-side proxy route to completely bypass browser-level CORS errors, secure hidden authentication credentials, and protect local host properties.`
* **Badges**:
  * `Always Active` (emerald green label)
  * `CORS proxy route: /api/requests/run` (dark code badge)

### Workspace Portability
* **Title**: `Export Full Workspace Archive`
* **Description**: `Downloads a unified backup JSON payload containing your entire history logs, local environments, and saved collection files.`
* **Action**: `Download Backup` button.
* **Mechanism**: Downloads a client-side generated JSON payload formatted as:
  ```json
  {
    "workspaceId": "active_id",
    "exportedAt": "timestamp",
    "environments": [...],
    "history": [...],
    "collections": [...]
  }
  ```

---

## 3. Section 3: Danger Zone (Red Accents)

1. **Purge Local Storage State**:
   * Description: `Instantly erases all local collection definitions, execution histories, and cached environment values. This action is irreversible.`
   * Action: `Purge All Local Cache` (renders a Radix AlertDialog confirmation to clear `localStorage` variables).
2. **Permanently Delete Account & Clusters**:
   * Description: `Terminating the account erases your workspace profiles, cluster connection nodes, API gateway triggers, and atomic databases.`
   * Action: `Delete Account` (renders a confirmation modal to submit a DELETE request to `/api/signup` or `/api/user` to permanently remove account data).

---

## 4. UI Stencil & Design Guidelines

### Color Tokens
* **Main Background**: `#000000` (Pitch Black)
* **Card Backgrounds**: `#030303` (Dark Charcoal / `bg-panel-charcoal`)
* **Borders**: `border-border-dark` (`#1a1a1f`)
* **Badges**: Font-mono with very low opacity green/grey backgrounds.

### Typography
* **Section Headers**: `tracking-widest uppercase text-text-muted text-[10px] font-mono font-bold mb-3`
* **Card Titles**: `text-xs font-semibold text-text-white mb-1`
* **Card Descriptions**: `text-[10px] text-text-muted leading-relaxed`

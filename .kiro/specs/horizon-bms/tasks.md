# Implementation Plan: Horizon Business Management System

## Overview

This implementation plan converts the technical design into actionable coding tasks organized into six phases. Each phase builds incrementally upon the previous one, ensuring stable foundations before moving to higher-level features. The plan covers Next.js/TypeScript setup, Supabase configuration, database schema creation, authentication flow implementation, protected routes middleware, UI components, and comprehensive testing.

---

## Tasks

### Phase 1: Project Setup & Infrastructure

- [x] 1. Initialize Next.js 14 project with TypeScript and Tailwind CSS
  - Create new Next.js 14 project with TypeScript configuration
  - Install and configure Tailwind CSS for styling
  - Set up project directory structure (lib, components, app directories)
  - Configure tsconfig.json with appropriate compiler options
  - _Requirements: 1.0 (foundational setup)_

- [x] 2. Install and configure Supabase dependencies
  - Install @supabase/ssr, @supabase/supabase-js packages
  - Install lucide-react for UI icons
  - Verify all dependencies lock correctly
  - _Requirements: 1.0 (foundational setup)_

- [x] 3. Create environment configuration and .env.local file
  - Create .env.example template with required variables
  - Document all required Supabase credentials
  - Set up development environment variables structure
  - _Requirements: 2.1 (Supabase Authentication Setup)_

---

### Phase 2: Supabase Configuration & Database Schema

- [x] 4. Create Supabase project and configure authentication
  - Set up Supabase project in dashboard
  - Enable email/password authentication
  - Disable email confirmation/verification requirement
  - Configure session TTL (recommended 7-30 days)
  - Retrieve and store NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment
  - Retrieve SUPABASE_SERVICE_KEY for server-side operations
  - _Requirements: 2.1 (Supabase Authentication Setup)_

- [x] 5. Create profiles table and supporting database infrastructure
  - Create `profiles` table with proper schema (id, email, username, first_name, last_name, role, is_active, created_at, updated_at)
  - Add table constraints: PRIMARY KEY, FOREIGN KEY to auth.users with ON DELETE CASCADE
  - Add CHECK constraint on role field (allowed values: admin, manager, employee)
  - Create indexes on role and is_active columns for query performance
  - Set created_at and updated_at defaults
  - _Requirements: 2.4 (User Profile & Role Mapping)_

- [x] 6. Configure Row-Level Security (RLS) policies for profiles table
  - Create RLS policy allowing users to read their own profile
  - Create RLS policy allowing service role to perform all operations
  - Verify authentication-based access restrictions
  - _Requirements: 5.0 (Role-Based Access Control)_

---

### Phase 3: Authentication & Client-Side Utilities

- [x] 7. Create Supabase client utilities (lib/supabase-client.ts and lib/supabase-server.ts)
  - Implement browser client factory using createBrowserClient
  - Implement server component client using createServerComponentClient
  - Implement middleware client for request handling
  - Export configured clients for use throughout application
  - _Requirements: 2.1 (Authentication Setup), 2.2 (Session Persistence)_

- [x] 8. Implement login authentication flow with form validation
  - Create app/login/page.tsx login page component
  - Implement email and password input fields with proper validation
  - Add client-side validation: both fields required before submission
  - Implement supabase.auth.signInWithPassword() integration
  - Display error messages for invalid credentials or missing fields
  - Redirect to /dashboard on successful authentication
  - Disable submit button during authentication attempt
  - _Requirements: 1.1, 1.3, 1.4 (User Authentication Without Email Verification)_

- [x] 9. Implement logout functionality
  - Add logout method using supabase.auth.signOut()
  - Implement logout button in Sidebar component
  - Ensure session cleared from storage after logout
  - Redirect user to /login after logout completion
  - _Requirements: 2.0 (Session Management)_

---

### Phase 4: Middleware & Route Protection

- [x] 10. Implement middleware.ts for session validation and route protection
  - Create middleware.ts in project root
  - Implement Supabase server client initialization in middleware
  - Add logic to refresh session tokens on each request
  - Implement route protection: redirect to /login if not authenticated
  - Implement redirect to /dashboard if user already logged in on /login page
  - Add isProtectedRoute() helper to define public/protected routes
  - Configure matcher for all routes except static assets
  - _Requirements: 2.2, 2.3 (Session Persistence), 3.0 (Silent Role-Based Redirect)_

- [x] 11. Test middleware session validation behavior
  - Verify middleware allows authenticated users to access protected routes
  - Verify middleware redirects unauthenticated users to /login
  - Verify authenticated users cannot access /login page (redirect to /dashboard)
  - Verify token refresh works correctly on each request
  - _Requirements: 2.2, 2.3, 2.4 (Session Management)_

---

### Phase 5: Dashboard Routing & Role-Based Access

- [x] 12. Create base dashboard page with silent role-based redirect logic
  - Create app/dashboard/page.tsx component
  - Fetch authenticated user from supabase.auth.getUser()
  - Fetch user profile including role from profiles table
  - Implement silent redirect using Next.js redirect() function based on role
  - Map roles to routes: admin → /dashboard/admin, manager → /dashboard/manager, employee → /dashboard/employee
  - Handle missing profile gracefully (redirect to /login)
  - Ensure no page render occurs before redirect
  - _Requirements: 3.1 (Silent Role-Based Redirect)_

- [x] 13. Create role-specific dashboard pages
  - Create app/dashboard/admin/page.tsx for admin dashboard
  - Create app/dashboard/manager/page.tsx for manager dashboard
  - Create app/dashboard/employee/page.tsx for employee dashboard
  - Each page verifies user role and enforces permissions
  - Each page displays role-specific content (placeholder content sufficient)
  - Redirect users attempting to access unauthorized dashboards to their designated dashboard
  - _Requirements: 3.3, 3.4 (Role-Based Dashboard Redirect), 5.1, 5.4 (Role-Based Access Control)_

- [x] 14. Verify dashboard routing and permission enforcement
  - Test that users are silently redirected to correct role dashboard on login
  - Test that users cannot access other role dashboards (redirected to correct dashboard)
  - Test that role changes redirect users on next page load
  - Verify no redirect loops occur
  - Test session persistence maintains correct dashboard access
  - _Requirements: 3.1, 3.2, 3.3, 3.4 (All dashboard requirements)_

---

### Phase 6: UI Components & Layout

- [x] 15. Create Sidebar navigation component (components/Sidebar.tsx)
  - Implement collapsible sidebar with expand/collapse toggle button
  - Add navigation links for Dashboard, My Tasks, Settings
  - Implement sidebar collapse state management in component state
  - Add responsive width transition between collapsed (w-20) and expanded (w-64) states
  - Show full text labels when expanded, icons only when collapsed
  - Add logout button at bottom of sidebar
  - _Requirements: 4.1, 4.2, 4.3, 4.4 (Collapsible Sidebar Navigation)_

- [x] 16. Implement sidebar state persistence with localStorage
  - Store sidebar collapse/expand state in localStorage when toggled
  - Retrieve stored sidebar state on component mount and restore it
  - Ensure state persists across browser sessions and page refreshes
  - Key: 'sidebar-collapsed', value: JSON boolean
  - _Requirements: 4.5 (Sidebar State Persistence)_

- [x] 17. Create dashboard layout component with responsive main content
  - Create app/dashboard/layout.tsx wrapping all dashboard pages
  - Integrate Sidebar component into layout
  - Implement main content area with flex layout
  - Ensure content area adjusts responsively when sidebar toggles
  - Add padding/spacing for content readability
  - Verify authentication at layout level (redirect to /login if no user)
  - _Requirements: 4.6 (Content Area Responsiveness), 3.0 (Dashboard Protection)_

- [x] 18. Style login page with Tailwind CSS
  - Apply gradient background (blue-50 to indigo-100)
  - Create centered login form card with shadow
  - Style input fields with proper focus states (ring-2, border colors)
  - Style submit button with hover effects and disabled state
  - Add error message display with red background styling
  - Ensure responsive design on mobile/tablet/desktop
  - _Requirements: 1.1, 1.3, 1.4 (Login UI)_

---

### Phase 7: Testing & Verification

- [x] 19. Test complete authentication flow
  - Test login with valid credentials (should authenticate and redirect to dashboard)
  - Test login with invalid email (should show error message)
  - Test login with invalid password (should show error message)
  - Test login with missing email field (should show validation error)
  - Test login with missing password field (should show validation error)
  - Verify no email verification email is sent
  - _Requirements: 1.1, 1.3, 1.4 (User Authentication)_

- [x] 20. Test session persistence across browser restarts
  - Login as user, note JWT token in cookies
  - Close browser completely or clear all tabs
  - Reopen browser and navigate to dashboard
  - Verify user is still authenticated (not redirected to /login)
  - Verify user's profile and role are correctly loaded
  - _Requirements: 2.1, 2.2, 2.3 (Session Persistence)_

- [x] 21. Test session expiration and token refresh
  - Login successfully and verify session created
  - Wait for session to approach expiration (or manually expire token)
  - Perform action that triggers token refresh
  - Verify system attempts token refresh before redirecting to /login
  - If refresh succeeds, verify user remains authenticated
  - If refresh fails, verify user redirected to /login
  - _Requirements: 2.4 (Session Expiration)_

- [x] 22. Test role-based access control enforcement
  - Create test users with different roles (admin, manager, employee)
  - Login as admin, verify redirect to /dashboard/admin
  - Attempt to access /dashboard/manager as admin (should redirect to /dashboard/admin)
  - Attempt to access /dashboard/employee as admin (should redirect to /dashboard/admin)
  - Repeat for manager and employee roles
  - Verify proper permission denial messages if accessing wrong dashboard directly
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.2, 5.4 (Dashboard Routing & Access Control)_

- [x] 23. Test sidebar functionality and state persistence
  - Verify sidebar collapses and expands on toggle button click
  - Verify text labels visible when expanded, hidden when collapsed
  - Verify icons visible in both states
  - Toggle sidebar, close browser, reopen browser
  - Verify sidebar state restored to previous state
  - Test on mobile viewport (may need to adjust expectations)
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6 (Sidebar Navigation)_

- [x] 24. Test security and edge cases
  - Verify JWT tokens stored in secure HTTP-only cookies
  - Verify CORS headers configured properly for Supabase
  - Test accessing protected routes without authentication (should redirect to /login)
  - Test accessing /login when authenticated (should redirect to /dashboard)
  - Verify no sensitive data exposed in localStorage
  - Verify token refresh mechanism works before expiration
  - _Requirements: 2.0, 3.0, 5.0 (All security-related requirements)_

- [x] 25. Final checkpoint - All tests pass and system stable
  - Run full test suite and verify all tests pass
  - Verify no console errors or warnings in browser/server logs
  - Verify responsive design works on desktop, tablet, mobile
  - Verify no redirect loops or unexpected behavior
  - Verify performance is acceptable (no noticeable delays)
  - Ask user if questions arise or if additional features needed
  - _Requirements: All requirements validated_

---

## Notes

- **Property-Based Testing**: The design includes 17 correctness properties (1-17). These should be verified through the test tasks above, ensuring each property is validated by corresponding test cases.
- **Test Sub-Tasks**: Test-related sub-tasks under implementation tasks are marked with `*` and are optional for MVP. Core implementation tasks must be completed.
- **Incremental Integration**: Each phase builds on the previous phase, ensuring stable foundation before adding complexity. Checkpoint at end of each phase.
- **Session Security**: Supabase handles session security (HTTP-only cookies, token refresh). Implementation focuses on proper usage of Supabase APIs.
- **No Email Verification**: Critical requirement - disable email confirmation in Supabase settings during Phase 2, step 4.
- **Silent Redirects**: Use Next.js `redirect()` function (server-side) to prevent client-side redirect loops in dashboard routing.
- **Role Mapping**: Always fetch role from `profiles` table, never trust client-side data for access control decisions.

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1", "2", "3"]
    },
    {
      "id": 1,
      "tasks": ["4", "5", "6"]
    },
    {
      "id": 2,
      "tasks": ["7", "8", "9"]
    },
    {
      "id": 3,
      "tasks": ["10"]
    },
    {
      "id": 4,
      "tasks": ["11", "12"]
    },
    {
      "id": 5,
      "tasks": ["13", "14"]
    },
    {
      "id": 6,
      "tasks": ["15", "16", "17", "18"]
    },
    {
      "id": 7,
      "tasks": ["19", "20", "21", "22", "23", "24"]
    },
    {
      "id": 8,
      "tasks": ["25"]
    }
  ]
}
```

---

## Implementation Ready

This task list is ready for implementation. You can begin executing tasks by:

1. Opening the tasks.md file in your editor
2. Clicking "Start task" next to task items to begin implementation
3. Completing one wave at a time, moving through phases sequentially
4. Running tests at each checkpoint to ensure system stability
5. Consulting the design.md and requirements.md files for detailed specifications

Each task contains specific references to requirements for full traceability. The implementation follows the design document's prescribed patterns and security considerations.

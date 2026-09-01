# Technical Design: Horizon Business Management System

## 1. System Architecture Overview

The Horizon Business Management System is built on a modern, scalable architecture combining Next.js for frontend/API layer with Supabase for authentication and data persistence. The design emphasizes seamless session management, role-based access control, and intuitive UI patterns.

### Technology Stack

- **Framework**: Next.js 14+ with TypeScript
- **Backend/Auth**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS
- **State Management**: React Context API (session state)
- **HTTP Client**: Fetch API / SWR for data fetching
- **Session Storage**: Supabase Auth (JWT tokens in secure cookies)

### High-Level Data Flow

```
User Credentials
    ↓
[Login Form] → Supabase Auth
    ↓
[Session Persisted in Cookie/localStorage]
    ↓
[Protected Route Middleware] → Check Token Validity
    ↓
[User Profile Lookup] → Fetch Role from Profiles Table
    ↓
[Role-Based Dashboard Route]
    ↓
[Layout with Sidebar Navigation]
```

---

## 2. Authentication & Session Management

### 2.1 Supabase Authentication Setup

**Configuration Requirements:**
- Supabase project initialized with custom authentication settings
- Email/Password authentication enabled (no email verification)
- Session TTL configured (recommended: 7-30 days for persistent sessions)
- JWT secret properly configured in environment variables

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-role-key]
```

**Client Initialization (lib/supabase.ts):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### 2.2 Authentication Flow (No Email Verification)

**Login Process:**
1. User submits email and password on login page
2. System validates both fields are provided
3. If invalid credentials submitted, deny access and display error
4. If valid credentials submitted:
   - Authenticate via `supabase.auth.signInWithPassword()`
   - Create session token automatically
   - Session stored in secure HTTP-only cookie by Supabase
   - No email verification triggered
5. Redirect to profile lookup (see 2.4)

**Signup (if enabled):**
- Similar flow but calls `supabase.auth.signUp()`
- Skip email confirmation step
- Auto-confirm user in database

### 2.3 Session Persistence Across Browser Restarts

**Mechanism:**
- Supabase Auth uses secure HTTP-only cookies by default
- JWT refresh tokens stored in cookie persist across browser restarts
- Session auto-refreshed on page load via middleware

**Session Restoration Flow:**
```
Page Load
  ↓
[Middleware checks for valid session]
  ↓
  If session valid:
    → Get user from `supabase.auth.getUser()`
    → Fetch profile (role)
    → Proceed with request
  ↓
  If session expired:
    → Attempt refresh token
    → If refresh succeeds → continue
    → If refresh fails → redirect to /login
```

**Key Files:**
- `middleware.ts` - Session validation on each request
- `lib/auth-context.tsx` - React context for session state
- `app/layout.tsx` - Root layout with session provider

### 2.4 User Profile & Role Mapping

**Profiles Table Schema (Supabase):**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
```

**Profile Lookup Logic (after login):**
1. After successful authentication, extract `user.id` from JWT
2. Query profiles table: `SELECT * FROM profiles WHERE id = $1`
3. Extract `role` field
4. Store in session context
5. Use for access control and dashboard routing

---

## 3. Protected Routes & Access Control

### 3.1 Middleware for Route Protection

**File: `middleware.ts` (root of project)**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as CookieOptions)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser()

  // Route access control
  const { pathname } = request.nextUrl

  // Redirect to login if not authenticated and accessing protected route
  if (!user && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if authenticated and accessing login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)',
  ],
}

function isProtectedRoute(pathname: string): boolean {
  const publicRoutes = ['/login', '/signup']
  return !publicRoutes.includes(pathname)
}
```

**Key Features:**
- Session token validation on every request
- Automatic redirect to login if token invalid/expired
- Prevents unauthenticated access to protected routes
- Avoids redirect loops by checking current page

### 3.2 Role-Based Route Protection

**Protected Route Component (app/dashboard/admin/page.tsx):**

```typescript
import { createServerComponentClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = createServerComponentClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin-specific content */}
    </div>
  )
}
```

---

## 4. Dashboard Routes & Role-Based Redirects

### 4.1 Dashboard Routing Architecture

**File Structure:**
```
app/
├── dashboard/
│   ├── page.tsx              # Base dashboard (silent redirect happens here)
│   ├── admin/
│   │   └── page.tsx          # Admin-only dashboard
│   ├── manager/
│   │   └── page.tsx          # Manager-only dashboard
│   └── employee/
│       └── page.tsx          # Employee-only dashboard
├── login/
│   └── page.tsx              # Login page
└── middleware.ts             # Route protection
```

### 4.2 Silent Role-Based Redirect Logic

**File: `app/dashboard/page.tsx`**

```typescript
import { createServerComponentClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = createServerComponentClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/login')
  }

  // Silent redirect based on role - NO user interaction required
  const roleRoutes: Record<string, string> = {
    admin: '/dashboard/admin',
    manager: '/dashboard/manager',
    employee: '/dashboard/employee',
  }

  const targetRoute = roleRoutes[profile.role]
  if (targetRoute) {
    redirect(targetRoute)
  }

  // Fallback if role not recognized
  redirect('/login')
}
```

**Why This Works:**
- Uses `redirect()` function (server-side, no client redirect loop)
- Runs at request time, not in browser
- No user-visible page render before redirect
- Prevents redirect loops by only redirecting once

### 4.3 Preventing Over-Redirect

**Key Principle:** Only redirect when user accesses `/dashboard` base route. Never redirect while user is on a specific route (`/dashboard/admin`, etc.) unless role changes.

**Role Change Detection:**
```typescript
// On login, store initial role in session
// On subsequent requests, compare with current role
// Only trigger redirect if role has changed AND user is on wrong dashboard
```

---

## 5. UI Components

### 5.1 Login Page (app/login/page.tsx)

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate both fields provided
    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    // No email verification - redirect immediately
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Horizon BMS
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### 5.2 Sidebar Navigation Component

**File: `components/Sidebar.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home, Users, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) {
      setIsCollapsed(JSON.parse(stored))
    }
  }, [])

  // Persist sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { href: '/dashboard/employee', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/employee/tasks', icon: Users, label: 'My Tasks' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gray-900 text-white transition-all duration-300 flex flex-col h-screen`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-xl font-bold">Horizon</h2>}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-600'
                  : 'hover:bg-gray-800'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-red-400"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
```

### 5.3 Responsive Layout Component

**File: `app/dashboard/layout.tsx`**

```typescript
import { Sidebar } from '@/components/Sidebar'
import { createServerComponentClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

---

## 6. Error Handling & Edge Cases

### 6.1 Session Expiration Handling

```typescript
// In middleware.ts - detect expired tokens
const { data: { user }, error } = await supabase.auth.getUser()

if (error?.status === 401 || !user) {
  // Session expired - redirect to login
  const refreshUrl = new URL('/login', request.url)
  refreshUrl.searchParams.set('expired', 'true')
  return NextResponse.redirect(refreshUrl)
}
```

### 6.2 Role Change Scenarios

**Scenario 1:** User with role "employee" navigates to `/dashboard/admin`
- Route checks role in database
- Redirects to `/dashboard/employee` (user's correct dashboard)

**Scenario 2:** Admin's role is downgraded to "employee" while logged in
- Dashboard shows correct content for current role
- On next page navigation, user is redirected to employee dashboard
- On login, user directed to employee dashboard

### 6.3 Missing Profile Handling

If user exists in `auth.users` but not in `profiles`:
- Redirect to login (force re-authentication)
- Create profile entry on signup (via trigger or API)

---

## 7. Data Security Considerations

### 7.1 Authentication Flow Security

✅ **Implemented:**
- JWT tokens in secure HTTP-only cookies (Supabase default)
- No passwords transmitted in client-side code
- HTTPS enforced in production
- CORS properly configured for Supabase

### 7.2 Authorization Checks

✅ **Required:**
- Every protected route checks user authentication AND role
- Database row-level security (RLS) enforces permissions server-side
- Never trust client-side role info for critical operations

### 7.3 Session Token Storage

✅ **Best Practice:**
- HTTP-only cookies (prevents JavaScript access)
- Secure flag set (HTTPS only)
- SameSite=Lax (prevents CSRF)
- Automatic refresh before expiration

---

## 8. Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Valid Credentials Grant Access

**For any** valid email and password combination submitted by a user, the system SHALL authenticate the user and grant access without requiring email verification.

**Validates: Requirements 1.1**

### Property 2: Invalid Credentials Deny Access

**For any** invalid email or password combination, the system SHALL deny access and display an appropriate error message.

**Validates: Requirements 1.3**

### Property 3: Required Fields Validation

**For any** login attempt where email or password field is empty or missing, the system SHALL prevent authentication and display a validation error.

**Validates: Requirements 1.4**

### Property 4: Session Token Creation

**For any** successful authentication, the system SHALL create a persistent session token that remains valid until expiration.

**Validates: Requirements 2.1**

### Property 5: Session Persistence Across Restarts

**For any** user with a valid, non-expired session token, the system SHALL restore the user's authenticated session after a browser restart or page refresh.

**Validates: Requirements 2.2, 2.3**

### Property 6: Expired Session Invalidation

**For any** session token that has exceeded its expiration time, the system SHALL invalidate the session and redirect the user to the login page on next access.

**Validates: Requirements 2.4**

### Property 7: Silent Dashboard Redirect

**For any** successfully authenticated user, the system SHALL automatically redirect to their role-specific dashboard without user interaction or page reload confirmation.

**Validates: Requirements 3.1**

### Property 8: Respect Current Location

**For any** user navigating within their allowed dashboard routes, the system SHALL maintain their current location and not forcibly redirect.

**Validates: Requirements 3.2**

### Property 9: Role Change Redirect

**For any** user whose role is modified while logged in, the system SHALL redirect to the new role's dashboard on the next page load.

**Validates: Requirements 3.3**

### Property 10: Permission-Based Access Denial

**For any** user attempting to access a dashboard for which their role lacks sufficient permissions, the system SHALL deny access and redirect to their designated role-specific dashboard.

**Validates: Requirements 3.4**

### Property 11: Sidebar Toggle State

**For any** number of sidebar toggle operations, each click SHALL alternate the sidebar between collapsed and expanded states.

**Validates: Requirements 4.2**

### Property 12: Sidebar Label Display

**For any** navigation item in the sidebar, the full text label SHALL be visible while the sidebar is in expanded state.

**Validates: Requirements 4.3**

### Property 13: Sidebar Icon Display

**For any** navigation item in the sidebar, only icons (or abbreviations) SHALL be visible while the sidebar is in collapsed state.

**Validates: Requirements 4.4**

### Property 14: Sidebar State Persistence

**For any** sidebar state (collapsed or expanded) toggled by a user, the system SHALL persist the preference and restore the same state on subsequent browser sessions.

**Validates: Requirements 4.5**

### Property 15: Content Area Responsiveness

**For any** toggle of the sidebar between collapsed and expanded states, the main content area SHALL adjust its width responsively to accommodate the sidebar width change.

**Validates: Requirements 4.6**

### Property 16: Permission Enforcement on All Actions

**For any** user attempting any action or resource access, the system SHALL enforce role-based permissions and deny access if the user's role lacks required permissions.

**Validates: Requirements 5.2, 5.4**

### Property 17: Immediate Role Permission Application

**For any** role assignment or modification for a user, the system SHALL immediately apply the new permission set on the next request or action.

**Validates: Requirements 5.3**

---

## 9. Implementation Checklist

### Phase 1: Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Supabase project
- [ ] Set up environment variables
- [ ] Create `supabase-client.ts` and server client utilities

### Phase 2: Authentication
- [ ] Create `profiles` table in Supabase
- [ ] Implement `middleware.ts` for session validation
- [ ] Create login page with form validation
- [ ] Test invalid/valid credential flows

### Phase 3: Session Management
- [ ] Test session persistence across page refreshes
- [ ] Verify token refresh mechanism
- [ ] Test session expiration handling
- [ ] Verify no email verification is triggered

### Phase 4: Dashboard & Routing
- [ ] Create base `/dashboard` page with silent redirect logic
- [ ] Create role-specific dashboard pages (admin, manager, employee)
- [ ] Implement role-based access checks
- [ ] Test redirect flows for all roles

### Phase 5: UI Components
- [ ] Build login page with Tailwind CSS
- [ ] Create Sidebar component with collapse/expand functionality
- [ ] Implement sidebar state persistence
- [ ] Create dashboard layout with responsive main content area

### Phase 6: Testing & Security
- [ ] Test all authentication flows
- [ ] Verify session persistence
- [ ] Test access control for each role
- [ ] Verify no redirect loops occur
- [ ] Security audit: token storage, CORS, HTTPS

---

## 10. Deployment Considerations

### Environment Setup
- Production Supabase project with proper security settings
- Environment variables securely configured
- HTTPS enforced on all routes
- Cookie secure flags set for production

### Monitoring
- Log authentication attempts (successes and failures)
- Track session expiration events
- Monitor role-based access denials
- Alert on suspicious activity patterns


'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

type AuthMode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message || 'Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (!email || !password || !fullName || !confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (authError) {
      setError(authError.message || 'Failed to create account')
      setLoading(false)
      return
    }
    if (!authData.user) {
      setError('Failed to create account')
      setLoading(false)
      return
    }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      role: 'employee',
    })
    if (profileError) {
      setError('Account created but profile setup failed. Please contact admin.')
      setLoading(false)
      return
    }
    setSuccess('Account created successfully! You can now sign in.')
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
    setLoading(false)
    setTimeout(() => { setMode('signin'); setSuccess('') }, 2000)
  }

  const handleSubmit = mode === 'signin' ? handleSignIn : handleSignUp

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(8, 12, 35, 0.68)' }} />
      {/* Subtle indigo tint */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 50%, rgba(139,92,246,0.08) 100%)' }} />

      {/* Card */}
      <div className="glass w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fade-in-up relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            DH
          </div>
          <h1 className="text-2xl font-bold gradient-text">Define Horizon</h1>
          <p className="text-slate-500 text-sm mt-1">Business Management System</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(241,245,249,0.8)' }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${mode === 'signin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="dh-input" disabled={loading} />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="dh-input" disabled={loading} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="dh-input" disabled={loading} />
            {mode === 'signup' && <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>}
          </div>
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="dh-input" disabled={loading} />
            </div>
          )}
          {success && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>{success}</div>
          )}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</div>
          )}
          <button type="submit" disabled={loading} className="dh-btn-primary w-full justify-center py-3 text-base mt-2">
            {loading
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-center text-slate-400 text-xs mt-5">
            By signing up, you agree to our terms of service. Your account will have employee access by default.
          </p>
        )}
      </div>
    </div>
  )
}

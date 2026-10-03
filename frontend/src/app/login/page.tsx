'use client'

import { useActionState, useState, useEffect } from 'react'
import { loginAction } from '../actions/auth'
import { useRouter } from 'next/navigation'

const testAccounts = [
  { role: 'Admin', email: 'admin@test.com', pass: 'Test@1234' },
  { role: 'Kitchen', email: 'kitchen@test.com', pass: 'Test@1234' },
  { role: 'Dispatch', email: 'dispatch@test.com', pass: 'Test@1234' },
  { role: 'Driver', email: 'driver@test.com', pass: 'Test@1234' },
]

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (state?.success && state.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state, router])

  const handleAutofill = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = testAccounts.find(acc => acc.role === e.target.value)
    if (selected) {
      setEmail(selected.email)
      setPassword(selected.pass)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans selection:bg-emerald-100 selection:text-emerald-900 relative">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-50/50 blur-3xl"></div>
         <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-50/50 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-[26rem] px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fernleaf Kitchen</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Welcome back. Please sign in to continue.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form action={formAction} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm text-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input 
                  type="password" 
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400 transition-all shadow-sm text-sm"
                  placeholder="••••••••"
                />
              </div>

              {state?.error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="font-medium">{state.error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending || !email || !password}
                className="w-full mt-2 py-3.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] transition-all flex justify-center items-center disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isPending ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Quick Login</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <div className="relative">
              <select 
                onChange={handleAutofill}
                defaultValue=""
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-shadow text-sm font-medium cursor-pointer hover:bg-gray-100"
              >
                <option value="" disabled>Select test account</option>
                {testAccounts.map(acc => (
                  <option key={acc.role} value={acc.role}>{acc.role}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
           <p className="text-xs text-gray-400 font-medium tracking-wide">SECURE STAFF PORTAL</p>
        </div>
      </div>
    </div>
  )
}

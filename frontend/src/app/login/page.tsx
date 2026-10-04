'use client'

import { useActionState, useState, useEffect } from 'react'
import { loginAction } from '../actions/auth'
import { useRouter } from 'next/navigation'
import CustomSelect from '@/components/CustomSelect'
import { ArrowRight, Lock, Mail, ChefHat, LayoutDashboard, Truck, Utensils } from 'lucide-react'

const testAccounts = [
  { role: 'Admin', email: 'admin@test.com', pass: 'Test@1234', icon: LayoutDashboard },
  { role: 'Kitchen', email: 'kitchen@test.com', pass: 'Test@1234', icon: ChefHat },
  { role: 'Dispatch', email: 'dispatch@test.com', pass: 'Test@1234', icon: Truck },
  { role: 'Driver', email: 'driver@test.com', pass: 'Test@1234', icon: Utensils },
]

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    if (state?.success && state.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state, router])

  const handleAutofill = (roleValue: string | number) => {
    const selected = testAccounts.find(acc => acc.role === roleValue)
    if (selected) {
      setEmail(selected.email)
      setPassword(selected.pass)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] font-sans selection:bg-emerald-200 selection:text-emerald-900 relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-emerald-300/40 to-emerald-100/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tl from-blue-300/30 to-blue-50/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
         <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-gradient-to-bl from-purple-200/20 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-[28rem] px-4 sm:px-6">
        <div className="text-center mb-10 transform transition-all duration-700 hover:scale-[1.02]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white mb-6 relative group">
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <Utensils className="w-10 h-10 text-emerald-600 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            Fernleaf Kitchen
          </h1>
          <p className="text-sm text-slate-500 mt-3 font-medium tracking-wide">
            Access the staff portal
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.15)]">
          <div className="p-8 sm:p-10">
            <form action={formAction} className="space-y-6">
              <div className="space-y-1.5 group relative">
                <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${focusedField === 'email' ? 'text-emerald-600' : 'text-slate-500'}`}>Email Address</label>
                <div className="relative flex items-center">
                  <div className={`absolute left-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all duration-300 text-[15px] font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group relative">
                <label className={`block text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${focusedField === 'password' ? 'text-emerald-600' : 'text-slate-500'}`}>Password</label>
                <div className="relative flex items-center">
                  <div className={`absolute left-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="password" 
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all duration-300 text-[15px] font-medium tracking-wider"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {state?.error && (
                <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl text-red-600 text-sm flex items-start animate-fade-in">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="font-semibold">{state.error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending || !email || !password}
                className="group w-full mt-4 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all duration-300 flex justify-center items-center disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5"
              >
                {isPending ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={18} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-slate-200/60"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Test Accounts</span>
              <div className="flex-grow border-t border-slate-200/60"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {testAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleAutofill(acc.role)}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 transition-all duration-200 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:shadow-sm"
                >
                  <acc.icon size={16} className={email === acc.email ? 'text-emerald-500' : 'text-slate-400'} />
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

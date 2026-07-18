import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Briefcase, KeyRound, Mail, Info, Scale, Calendar, FolderOpen, Eye, EyeOff, Globe } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signUp, isMock } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Destination route after login
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast('Account created successfully!', 'success');
      } else {
        await signIn(email, password);
        toast('Logged in successfully!', 'success');
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication');
      toast(err.message || 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white overflow-hidden flex font-sans selection:bg-blue-200">
      {/* LEFT SECTION - Background with features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black flex-col">
        {/* Professional Legal Background Overlay */}
        <div className="absolute inset-0">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          
          {/* Subtle pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(15,23,42,0.2)_25%,rgba(15,23,42,0.2)_50%,transparent_50%,transparent_75%,rgba(15,23,42,0.2)_75%,rgba(15,23,42,0.2))] bg-[length:60px_60px]" />
          
          {/* Decorative glow elements */}
          <div className="absolute top-20 right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Content - Flexbox layout */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full px-10 py-12">
          {/* Top Section */}
          <div className="space-y-6">
            <div className="inline-block">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                  <Briefcase size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Legal ERP</h1>
                  <p className="text-xs text-blue-200">Professional Management</p>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-3 max-w-lg">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Manage Every Case with Confidence.
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                A secure Legal ERP platform for advocates to manage cases, hearings, clients, legal documents and reminders.
              </p>
            </div>
          </div>

          {/* Bottom Section - Feature Badges */}
          <div className="space-y-2">
            {/* Badge 1 */}
            <div className="group backdrop-blur-lg bg-white/[0.08] border border-white/10 rounded-lg p-3 hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Scale size={16} className="text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs">Smart Case Tracking</h3>
                </div>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="group backdrop-blur-lg bg-white/[0.08] border border-white/10 rounded-lg p-3 hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Calendar size={16} className="text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs">Hearing Alerts</h3>
                </div>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="group backdrop-blur-lg bg-white/[0.08] border border-white/10 rounded-lg p-3 hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <FolderOpen size={16} className="text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs">Secure Document Management</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - Login Card */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-4 lg:px-8 bg-gradient-to-b from-white to-slate-50 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-sm">
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
            {/* Logo and Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto bg-gradient-to-br from-blue-600 to-blue-700 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Briefcase size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Welcome Back</h1>
                <p className="text-xs text-slate-600 mt-1">Sign in to your Legal ERP Dashboard.</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Demo Mode Notice */}
              {isMock && !isSignUp && (
                <div className="p-3 text-xs bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Demo:</strong> Use any email/password to sign in.
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700 block">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700 block">
                  Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-10 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-lg transition-all duration-300 transform hover:shadow-lg active:scale-95 border-none text-sm"
              >
                {submitting 
                  ? (isSignUp ? 'Creating...' : 'Signing In...') 
                  : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>

              {/* Divider - Hidden on very small screens */}
              <div className="hidden sm:flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Sign In Button - Hidden on very small screens */}
              <button
                type="button"
                className="hidden sm:flex w-full h-10 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 items-center justify-center gap-2 text-sm"
              >
                <Globe size={16} />
                Continue with Google
              </button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="text-center border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-600">
                {isSignUp 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg('');
                  }}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors focus:outline-none"
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-slate-200 pt-3 space-y-0.5">
              <p className="text-xs font-semibold text-slate-900">© 2026 Legal ERP System</p>
              <p className="text-xs text-slate-600">Designed for Law Professionals</p>
            </div>
          </div>

          {/* Mobile Background Banner - Only on very small screens */}
          <div className="lg:hidden sm:hidden mt-4 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white space-y-1">
            <h3 className="font-bold text-sm">Manage Every Case with Confidence.</h3>
            <p className="text-xs opacity-90">A secure Legal ERP platform for advocates to manage cases and legal documents.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

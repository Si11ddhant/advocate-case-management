import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Briefcase, KeyRound, Mail, Info } from 'lucide-react';

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
    <div className="relative overflow-hidden bg-slate-950 flex h-screen w-screen items-center justify-center px-4 font-sans selection:bg-primary/30">
      {/* Cosmic background glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[130px] animate-pulse duration-7000" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[150px] animate-pulse duration-[10s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[180px] pointer-events-none" />

      {/* Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-xl rounded-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        {/* Glow Header Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-teal-500" />

        <CardHeader className="text-center space-y-2.5 pt-8">
          <div className="mx-auto bg-gradient-to-tr from-primary to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-2">
            <Briefcase size={22} />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white">
            {isSignUp ? 'Create Advocate Account' : 'Advocate Workspace'}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 font-medium">
            {isSignUp 
              ? 'Register for the secure Case Management ERP' 
              : 'Enter your credentials to access the legal dashboard'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
                {errorMsg}
              </div>
            )}

            {isMock && !isSignUp && (
              <div className="p-3.5 text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-left flex items-start space-x-2 leading-relaxed">
                <Info size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
                <span>
                  <strong>Demo Mode Active:</strong> Database keys not set. Sign in using <em>any</em> email/password to initialize simulated sessions.
                </span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@firm.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-white"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full h-11 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform active:scale-[0.98] mt-4 border-none text-xs tracking-wider uppercase"
            >
              {submitting 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center border-t border-white/5 py-5 bg-white/[0.02]">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none font-bold"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account yet? Create one"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

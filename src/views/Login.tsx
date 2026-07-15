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
    <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
      {/* Decorative colored glow spheres in background */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />

      <Card className="w-full max-w-md border border-border/80 shadow-xl bg-card/60 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 dark:shadow-none mb-2">
            <Briefcase size={24} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Create Advocate Account' : 'Advocate Workspace Login'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Register for the secure Case Management ERP' 
              : 'Enter your credentials to access the legal dashboard'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                {errorMsg}
              </div>
            )}

            {isMock && !isSignUp && (
              <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400 flex items-start space-x-2">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Demo Mode Active:</strong> Supabase environment variables are not set. You can sign in using <em>any</em> email and password to test locally.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@firm.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background/50 text-sm placeholder:text-muted-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background/50 text-sm placeholder:text-muted-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full mt-2 font-semibold">
              {submitting 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center border-t border-border/50 py-4 bg-muted/20 rounded-b-xl">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors focus:outline-none font-medium"
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

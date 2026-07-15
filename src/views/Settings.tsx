import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sun, Moon, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset mock database data to default? This will clear any new clients/cases.')) {
      localStorage.removeItem('adv_clients');
      localStorage.removeItem('adv_cases');
      localStorage.removeItem('adv_updates');
      localStorage.removeItem('adv_documents');
      toast('Mock database records reset successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure layout options, security wrappers, and database integrations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Display & Styling</CardTitle>
            <CardDescription>Adjust theme modes and styling systems.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Workspace Theme</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle between dark and light displays.</p>
              </div>
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-xs h-9"
              >
                {theme === 'light' ? (
                  <>
                    <Moon size={14} />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun size={14} />
                    <span>Light Mode</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">Accent Palette</h4>
                <p className="text-xs text-muted-foreground mt-0.5">High contrast core colors configured.</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                Ocean Blue (HSL)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Database & Supabase settings card */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Integration</CardTitle>
            <CardDescription>Verify live backend PostgreSQL configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status indicator */}
            <div className="p-4 border rounded-lg flex items-center space-x-3 bg-muted/20">
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle className="text-emerald-500 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Supabase Connected</h4>
                    <p className="text-[11px] text-muted-foreground">Running live backend PostgreSQL services.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="text-amber-500 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">Mock Fallback Database</h4>
                    <p className="text-[11px] text-muted-foreground">
                      No credentials configured. Saving docket state locally.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Reset mock data button */}
            {!isSupabaseConfigured && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Reset Storage</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Clear local records and reload mockup data.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetData}
                  className="flex items-center space-x-2 text-xs h-9 border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:text-rose-600"
                >
                  <RefreshCw size={14} />
                  <span>Reset Database</span>
                </Button>
              </div>
            )}

            {/* Credentials inspection */}
            <div className="border-t border-border pt-4 text-xs font-semibold text-muted-foreground space-y-2">
              <span className="block text-[10px] uppercase tracking-wider mb-1.5">Environment Status</span>
              <div className="flex justify-between">
                <span>VITE_SUPABASE_URL:</span>
                <span className={isSupabaseConfigured ? 'text-foreground' : 'text-muted-foreground/50'}>
                  {isSupabaseConfigured ? 'Configure OK' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VITE_SUPABASE_ANON_KEY:</span>
                <span className={isSupabaseConfigured ? 'text-foreground' : 'text-muted-foreground/50'}>
                  {isSupabaseConfigured ? 'Configure OK' : 'Missing'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useToast } from '../context/ToastContext';
import { db } from '../lib/db';
import { CommandPalette } from './CommandPalette';
import { Search } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const hasChecked = useRef(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    // Run this check once on mount (login session starts)
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkHearings = async () => {
      try {
        const cases = await db.getCases();
        const now = new Date();
        
        // Start of today (00:00:00)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 48 hours from now
        const limitTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const upcoming = cases.filter(c => {
          if (!c.next_hearing_date) return false;
          const hDate = new Date(c.next_hearing_date + 'T00:00:00'); // Parse local date safely
          return hDate >= todayStart && hDate <= limitTime;
        });

        if (upcoming.length > 0) {
          // Trigger the premium toast warning alert
          setTimeout(() => {
            toast(
              `Alert: You have ${upcoming.length} case${
                upcoming.length > 1 ? 's' : ''
              } scheduled for hearing within the next 48 hours. Check your dashboard.`,
              'warning'
            );
          }, 1000); // Small delay to allow the dashboard to load smoothly
        }
      } catch (err) {
        console.error('Failed to query upcoming hearings:', err);
      }
    };

    checkHearings();
  }, [toast]);

  // Global key listener for Ctrl+K command palette
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      {/* Permanent sidebar layout */}
      <Sidebar />

      {/* Primary view content workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Navigation Search Area */}
        <header className="border-b border-border bg-card/65 backdrop-blur-md px-8 py-3 flex items-center justify-between z-10 flex-shrink-0">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center justify-between text-xs font-semibold text-muted-foreground bg-background hover:bg-muted/50 border border-border rounded-lg px-3 py-2 w-64 transition-all text-left shadow-sm focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <Search size={14} className="text-muted-foreground/75" />
              <span>Search or execute Ctrl+K...</span>
            </div>
            <kbd className="h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
              Ctrl+K
            </kbd>
          </button>
          
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
            Advocate Portal v1.0
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-background scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Embedded Global Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
};

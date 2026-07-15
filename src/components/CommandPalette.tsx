import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case, Client } from '../lib/db';
import { useTheme } from '../context/ThemeContext';
import { Search, Briefcase, Users, Moon, Sun, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);

      // Load items
      const loadItems = async () => {
        try {
          const [casesData, clientsData] = await Promise.all([
            db.getCases(),
            db.getClients()
          ]);
          setCases(casesData);
          setClients(clientsData);
        } catch (err) {
          console.error('Command Palette fetch failed:', err);
        }
      };
      loadItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Search calculations
  const filteredCases = query.trim() === ''
    ? []
    : cases.filter(c => c.case_title.toLowerCase().includes(query.toLowerCase()) || (c.case_number && c.case_number.toLowerCase().includes(query.toLowerCase()))).slice(0, 4);

  const filteredClients = query.trim() === ''
    ? []
    : clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || (c.email && c.email.toLowerCase().includes(query.toLowerCase()))).slice(0, 4);

  const handleSelectCase = (caseId: string) => {
    navigate(`/case/${caseId}`);
    onClose();
  };

  const handleSelectClient = () => {
    navigate('/clients');
    onClose();
  };

  const handleSelectCommand = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Palette Card */}
      <div className="relative z-10 w-full max-w-lg scale-[0.99] animate-in fade-in zoom-in-95 duration-100 rounded-xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Search header bar */}
        <div className="flex items-center border-b border-border px-4 py-3 bg-muted/20">
          <Search className="text-muted-foreground mr-3 flex-shrink-0" size={18} />
          <input
            ref={inputRef}
            placeholder="Search cases, clients or execute commands (e.g. theme)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none text-foreground border-none ring-0 focus:ring-0"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            ESC
          </kbd>
        </div>

        {/* Dynamic results scroll container */}
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide text-left">
          {/* Query is empty - show quick link commands */}
          {query.trim() === '' ? (
            <div className="space-y-1">
              <span className="block px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                System Quick Commands
              </span>
              
              <button
                onClick={() => handleSelectCommand(toggleTheme)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-foreground hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  {theme === 'light' ? <Moon size={15} className="text-muted-foreground" /> : <Sun size={15} className="text-muted-foreground" />}
                  <span>Toggle Light/Dark Display Theme</span>
                </div>
                <ArrowRight size={12} className="text-muted-foreground/50" />
              </button>

              <button
                onClick={() => handleSelectCommand(() => navigate('/cases'))}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-foreground hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Briefcase size={15} className="text-muted-foreground" />
                  <span>Go to Litigation Docket Workspace</span>
                </div>
                <ArrowRight size={12} className="text-muted-foreground/50" />
              </button>

              <button
                onClick={() => handleSelectCommand(() => navigate('/clients'))}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-foreground hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Users size={15} className="text-muted-foreground" />
                  <span>Navigate to Client Registry Directory</span>
                </div>
                <ArrowRight size={12} className="text-muted-foreground/50" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cases Matches */}
              {filteredCases.length > 0 && (
                <div>
                  <span className="block px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Matching Cases Docket
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {filteredCases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCase(c.id)}
                        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 truncate max-w-[90%]">
                          <Briefcase size={14} className="text-primary/70 flex-shrink-0" />
                          <span className="truncate">{c.case_title}</span>
                          <span className="text-[10px] font-mono text-muted-foreground truncate uppercase">
                            ({c.case_number || 'No #'})
                          </span>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground/50 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Matches */}
              {filteredClients.length > 0 && (
                <div>
                  <span className="block px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Matching Clients Registry
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        onClick={handleSelectClient}
                        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 truncate max-w-[90%]">
                          <Users size={14} className="text-emerald-500/70 flex-shrink-0" />
                          <span className="truncate">{c.name}</span>
                          {c.email && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              - {c.email}
                            </span>
                          )}
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground/50 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No matches */}
              {filteredCases.length === 0 && filteredClients.length === 0 && (
                <div className="p-4 text-center text-xs font-semibold text-muted-foreground">
                  No matching case records or clients found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

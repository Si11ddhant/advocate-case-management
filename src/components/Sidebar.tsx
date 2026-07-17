import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Shield
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const { user, signOut, isMock } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const activeCollapsed = isCollapsed && !isHovered;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Cases', path: '/cases', icon: Briefcase },
    { name: 'Lawyers', path: '/lawyers', icon: Shield },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Billing', path: '/billing', icon: DollarSign },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${
        activeCollapsed ? 'md:w-20 w-64' : 'w-64'
      } border-r border-border/40 bg-gradient-to-b from-card via-card/98 to-card/95 flex flex-col h-screen fixed md:sticky inset-y-0 left-0 z-50 shadow-2xl shadow-primary/5 transition-all duration-300 ease-in-out md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div 
        className={`p-4 flex ${
          activeCollapsed ? 'md:flex-col items-center md:space-y-4' : 'items-center justify-between'
        } border-b border-border/40 transition-all duration-300`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative bg-gradient-to-tr from-primary to-blue-600 p-2.5 rounded-xl text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0 flex items-center justify-center">
            <Briefcase size={18} />
            {isMock && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-card flex items-center justify-center" title="Mock Mode (LocalStorage)">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
              </span>
            )}
          </div>
          {(!activeCollapsed || isMobileOpen) && (
            <div className="text-left animate-in fade-in duration-200">
              <h1 className="font-extrabold text-sm tracking-tight leading-none text-foreground">Advocate ERP</h1>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-1 block">Case Manager</span>
              {isMock && (
                <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] font-bold text-amber-600 dark:text-amber-400 mt-1.5 w-fit">
                  <span className="h-1 w-1 rounded-full bg-amber-500 block animate-ping" />
                  <span>Mock Database</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Desktop Expand/Collapse Arrow */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="md:block hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all focus:outline-none border border-border/10"
          title={isCollapsed ? "Lock Sidebar Open" : "Unlock Sidebar to Auto-Collapse"}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
 
        {/* Mobile Close Button */}
        <button
          onClick={() => onClose?.()}
          className="md:hidden block p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all focus:outline-none"
          title="Close Navigation"
        >
          <ChevronLeft size={18} />
        </button>
      </div>
 
      {/* Nav List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onClose?.()}
            title={activeCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center ${
                activeCollapsed ? 'justify-center' : 'space-x-3 px-3'
              } py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border border-primary/20 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted/65 hover:text-foreground hover:translate-x-0.5 hover:scale-[1.01]'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {(!activeCollapsed || isMobileOpen) && <span className="animate-in fade-in duration-200">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
 
      {/* Footer Area */}
      <div className="p-4 border-t border-border/40 mt-auto space-y-4">
        {activeCollapsed && !isMobileOpen ? (
          /* Collapsed Footer View */
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar Circle */}
            <div 
              className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-primary/10 flex-shrink-0 cursor-default"
              title={user?.email}
            >
              {(user?.user_metadata?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl bg-muted/80 text-muted-foreground hover:text-foreground border border-border/50 hover:bg-muted transition-all flex items-center justify-center flex-shrink-0"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
 
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="h-9 w-9 rounded-xl border border-border/50 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/5 hover:border-rose-500/20 transition-all flex items-center justify-center flex-shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          /* Expanded Footer View */
          <div className="space-y-4">
            {/* User Info Block */}
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-muted/30 border border-border/30">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-primary/15 flex-shrink-0">
                {(user?.user_metadata?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-foreground truncate" title={user?.email}>
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-none mt-1">
                  {user?.email}
                </p>
              </div>
            </div>
 
            {/* Actions Bar */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="flex-1 h-9 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted transition-all flex items-center justify-center space-x-1.5 text-xs font-semibold"
                title="Toggle Theme"
              >
                {theme === 'light' ? (
                  <>
                    <Moon size={14} />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun size={14} />
                    <span>Light</span>
                  </>
                )}
              </button>
 
              <button
                onClick={handleLogout}
                className="h-9 px-3 rounded-lg border border-border/40 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/5 hover:border-rose-500/20 transition-all flex items-center justify-center space-x-1.5 text-xs font-semibold"
                title="Sign Out"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

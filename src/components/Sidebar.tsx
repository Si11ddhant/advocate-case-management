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
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Button } from './ui/Button';

export const Sidebar: React.FC = () => {
  const { user, signOut, isMock } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Cases', path: '/cases', icon: Briefcase },
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
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } border-r border-border bg-card flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}
    >
      {/* Brand Header */}
      <div 
        className={`p-4 flex ${
          isCollapsed ? 'flex-col items-center space-y-4' : 'items-center justify-between'
        } border-b border-border transition-all duration-300`}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm flex-shrink-0">
            <Briefcase size={20} />
          </div>
          {!isCollapsed && (
            <div className="text-left animate-in fade-in duration-200">
              <h1 className="font-bold text-sm tracking-tight leading-none text-foreground">Advocate ERP</h1>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mt-1 block">Case Manager</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center ${
                isCollapsed ? 'justify-center' : 'space-x-3 px-3'
              } py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-200">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Database Mode Warning Banner (if running mock fallback) */}
      {isMock && (
        <div 
          className={`mx-3 mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center ${
            isCollapsed ? 'w-10 mx-auto' : 'space-x-2'
          }`}
          title={isCollapsed ? "Mock Mode (LocalStorage)" : undefined}
        >
          <ShieldAlert className="text-amber-500 flex-shrink-0" size={16} />
          {!isCollapsed && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 truncate animate-in fade-in duration-200">
              Mock Mode (LocalStorage)
            </span>
          )}
        </div>
      )}

      {/* Footer Area */}
      <div className="p-3 border-t border-border space-y-4">
        {/* Theme Toggle & User Info */}
        <div className={`flex ${isCollapsed ? 'flex-col items-center space-y-3' : 'items-center justify-between'}`}>
          {!isCollapsed && (
            <div className="max-w-[130px] truncate text-left animate-in fade-in duration-200">
              <p className="text-xs font-semibold text-foreground truncate" title={user?.email}>
                {user?.user_metadata?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          
          {/* Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all border border-border flex items-center justify-center flex-shrink-0"
            aria-label="Toggle Theme"
            title="Toggle Display Theme"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className={`${
            isCollapsed ? 'p-2 w-10 mx-auto' : 'w-full space-x-2'
          } flex items-center justify-center border-border text-muted-foreground hover:text-destructive hover:border-destructive/30`}
          title="Sign Out"
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-200">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
};

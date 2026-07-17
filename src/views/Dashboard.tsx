import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case, Client, Invoice } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Users,
  Calendar,
  ChevronRight,
  PieChart,
  BarChart4,
  DollarSign
} from 'lucide-react';

const WhatsAppIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-emerald-500 mr-1.5 flex-shrink-0 inline-block">
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.128-1.343a9.927 9.927 0 004.877 1.28c5.508 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.18-2.92-7.062A9.926 9.926 0 0012.012 2zm5.72 14.16c-.25.703-1.458 1.303-2.014 1.36-.5.05-1.15.19-3.35-.72-2.813-1.16-4.63-4.037-4.77-4.22-.14-.19-1.144-1.522-1.144-2.903 0-1.38.72-2.057 1.025-2.36.25-.25.68-.376 1.08-.376.13 0 .25.007.36.012.324.015.486.037.7.495.25.533.864 2.11.938 2.26.074.15.125.325.025.525-.1.2-.15.325-.3.5-.15.175-.315.39-.45.523-.15.15-.31.315-.13.626.18.312.8 1.312 1.71 2.125.844.75 1.546.98 1.86 1.11.314.13.495.105.68-.1.248-.275.864-.98 1.094-1.32.23-.34.45-.28.76-.17.31.11 1.97.93 2.3 1.1.33.17.55.25.63.39.08.14.08.81-.17 1.513z"/>
  </svg>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesData, clientsData, invoicesData] = await Promise.all([
          db.getCases(),
          db.getClients(),
          db.getInvoices()
        ]);
        setCases(casesData);
        setClients(clientsData);
        setInvoices(invoicesData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Calculate metrics
  const activeCases = cases.filter(c => c.status === 'Active');
  const completedCases = cases.filter(c => c.status === 'Completed');
  const delayedCases = cases.filter(c => c.status === 'Delayed');
  const cancelledCases = cases.filter(c => c.status === 'Cancelled');
  
  // Find Tomorrow's Hearings
  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const tomorrowStr = getTomorrowStr();
  
  const tomorrowsHearings = cases.filter(c => c.next_hearing_date === tomorrowStr);

  const handleSendWhatsAppAlert = (e: React.MouseEvent, c: Case) => {
    e.stopPropagation(); // Avoid navigating to case detail
    const text = `⚖️ *Advocate Case Hearing Alert!*\n\n*Case:* ${c.case_title}\n*Docket No:* ${c.case_number || 'N/A'}\n*Court:* ${c.court_name || 'N/A'}\n*Client:* ${c.client?.name || 'N/A'}\n*Hearing Date:* Tomorrow (${c.next_hearing_date})\n\n_Please prepare the necessary arguments, documents, and briefs._`;

    const encodedText = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsAppDigest = () => {
    let text = `⚖️ *Advocate Case Hearing Alert - Tomorrow's Digest (${tomorrowStr})*\n\n`;
    tomorrowsHearings.forEach((c, index) => {
      text += `${index + 1}. *${c.case_title}*\n`;
      text += `   • Docket: ${c.case_number || 'N/A'}\n`;
      text += `   • Court: ${c.court_name || 'N/A'}\n`;
      text += `   • Client: ${c.client?.name || 'N/A'}\n\n`;
    });
    text += `_Please prepare the necessary arguments, documents, and briefs._`;
    
    const encodedText = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  };

  // SVG Donut Calculations
  const totalCases = cases.length || 1;
  const radCircumference = 2 * Math.PI * 30; // r = 30 -> 188.49

  const activePct = activeCases.length / totalCases;
  const completedPct = completedCases.length / totalCases;
  const delayedPct = delayedCases.length / totalCases;
  const cancelledPct = cancelledCases.length / totalCases;

  const lenActive = radCircumference * activePct;
  const lenCompleted = radCircumference * completedPct;
  const lenDelayed = radCircumference * delayedPct;
  const lenCancelled = radCircumference * cancelledPct;

  const activeOffset = radCircumference;
  const completedOffset = activeOffset - lenActive;
  const delayedOffset = completedOffset - lenCompleted;
  const cancelledOffset = delayedOffset - lenDelayed;

  // SVG Bar Chart Calculations
  // Get counts of cases per client
  const clientCasesMap: Record<string, number> = {};
  cases.forEach(c => {
    const cName = c.client?.name || 'Unknown Client';
    clientCasesMap[cName] = (clientCasesMap[cName] || 0) + 1;
  });

  const clientCasesList = Object.entries(clientCasesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const maxCaseCount = Math.max(...clientCasesList.map(item => item.count), 1);

  // Invoiced collected totals
  const totalCollected = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pb-6 border-b border-border/70 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Welcome back, Counselor!</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Today is {getFormattedDate()}</p>
        </div>
        
        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground border border-border">
            <span className="px-3 text-xs font-bold text-foreground">Monthly</span>
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs flex items-center space-x-1.5 border-border hover:bg-muted/50">
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs flex items-center space-x-1.5 border-border hover:bg-muted/50">
            <span>Export</span>
          </Button>
          <Button onClick={() => navigate('/cases')} className="h-9 text-xs font-bold flex items-center space-x-1.5 shadow-sm">
            <span>New Case File</span>
          </Button>
        </div>
      </div>

      {/* Tomorrow's Hearings Alert Section */}
      {tomorrowsHearings.length > 0 && (
        <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent relative overflow-hidden backdrop-blur-md rounded-2xl shadow-xl shadow-amber-500/5">
          {/* Neon Glow Element */}
          <div className="absolute right-0 top-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="p-6 flex items-start space-x-5 relative z-10">
            <div className="bg-gradient-to-tr from-amber-500 to-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-amber-500/20 flex-shrink-0 animate-pulse">
              <AlertTriangle size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Alert Header layout */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4 gap-4 text-left">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-foreground tracking-tight">
                      Hearings Scheduled for Tomorrow
                    </h3>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You have <span className="font-bold text-amber-600 dark:text-amber-400">{tomorrowsHearings.length} court hearing{tomorrowsHearings.length > 1 ? 's' : ''}</span> listed for <span className="font-mono font-bold text-foreground">{tomorrowStr}</span>.
                  </p>
                </div>
                
                <Button
                  onClick={handleSendWhatsAppDigest}
                  className="h-9 px-4 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center space-x-2 rounded-xl shadow-md shadow-emerald-500/10 border-none transition-all duration-300 self-start md:self-auto flex-shrink-0"
                >
                  <WhatsAppIcon />
                  <span>Send Digest via WhatsApp</span>
                </Button>
              </div>
              
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tomorrowsHearings.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/case/${c.id}`)}
                    className="group p-4 bg-card/40 backdrop-blur-sm border border-border/80 hover:border-amber-500/40 hover:bg-card/90 rounded-xl hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between text-left"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                          {c.case_number || 'NO DOCKET #'}
                        </span>
                        <Badge variant="warning">{c.status}</Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">{c.case_title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-semibold">{c.court_name}</p>
                        {c.assigned_lawyer && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center space-x-1.5 font-bold">
                            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Advocate:
                            </span>
                            <span>{c.assigned_lawyer.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Card Actions: WhatsApp dispatch and details link */}
                    <div className="mt-5 flex items-center justify-between text-[11px] border-t border-border/40 pt-3">
                      <button
                        onClick={(e) => handleSendWhatsAppAlert(e, c)}
                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 font-bold flex items-center space-x-1.5 focus:outline-none bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 transition-all duration-200"
                        title="Send Case Alert to WhatsApp"
                      >
                        <WhatsAppIcon />
                        <span>Send Alert</span>
                      </button>
                      
                      <div className="flex items-center space-x-0.5 font-bold text-primary transition-all duration-200 group-hover:translate-x-1">
                        <span>Prepare Materials</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Cases */}
        <Card className="hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-500/30 transition-all duration-300 border border-border/80">
          <CardContent className="p-6 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-2.5 rounded-xl">
                <Briefcase size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ↑ 12%
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-foreground">{activeCases.length}</div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Active Cases on Docket</p>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 flex items-center space-x-1">
              <span className="text-emerald-600 font-bold">↑ 4 more</span>
              <span>than last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Completed Cases */}
        <Card className="hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/30 transition-all duration-300 border border-border/80">
          <CardContent className="p-6 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl">
                <CheckCircle size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ↑ 8%
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-foreground">{completedCases.length}</div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Disposed Legal Matters</p>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 flex items-center space-x-1">
              <span className="text-emerald-600 font-bold">↑ 3 cases</span>
              <span>than last quarter</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Clients */}
        <Card className="hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-500/30 transition-all duration-300 border border-border/80">
          <CardContent className="p-6 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-2.5 rounded-xl">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ↑ 15%
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-foreground">{clients.length}</div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Total Client Accounts</p>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 flex items-center space-x-1">
              <span className="text-emerald-600 font-bold">↑ 2 clients</span>
              <span>added this month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Tomorrow\'s Hearings */}
        <Card className="hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/30 transition-all duration-300 border border-border/80">
          <CardContent className="p-6 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl">
                <Calendar size={20} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Steady
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-foreground">{tomorrowsHearings.length}</div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Hearings Tomorrow</p>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 flex items-center space-x-1">
              <span>Without changes in timeline</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Status Distribution Donut Chart */}
        <Card className="flex flex-col border border-border/80">
          <CardHeader className="pb-2 text-left">
            <div className="flex items-center space-x-2.5">
              <PieChart size={18} className="text-primary" />
              <CardTitle>Case Status Distribution</CardTitle>
            </div>
            <CardDescription>Visual percentage breakdown of dockets status.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col sm:flex-row items-center justify-around py-4">
            {/* SVG Donut */}
            <div className="relative w-36 h-36">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="30" fill="transparent" stroke="hsl(var(--muted)/0.5)" strokeWidth="12" />
                
                {/* Active Ring segment */}
                {lenActive > 0 && (
                  <circle
                    cx="50" cy="50" r="30" fill="transparent"
                    stroke="hsl(142 72% 29%)" strokeWidth="12"
                    strokeDasharray={`${lenActive} ${radCircumference}`}
                    strokeDashoffset={activeOffset}
                    className="transition-all duration-300"
                  />
                )}
                {/* Completed Ring segment */}
                {lenCompleted > 0 && (
                  <circle
                    cx="50" cy="50" r="30" fill="transparent"
                    stroke="hsl(199 89% 48%)" strokeWidth="12"
                    strokeDasharray={`${lenCompleted} ${radCircumference}`}
                    strokeDashoffset={completedOffset}
                    className="transition-all duration-300"
                  />
                )}
                {/* Delayed Ring segment */}
                {lenDelayed > 0 && (
                  <circle
                    cx="50" cy="50" r="30" fill="transparent"
                    stroke="hsl(38 92% 50%)" strokeWidth="12"
                    strokeDasharray={`${lenDelayed} ${radCircumference}`}
                    strokeDashoffset={delayedOffset}
                    className="transition-all duration-300"
                  />
                )}
                {/* Cancelled Ring segment */}
                {lenCancelled > 0 && (
                  <circle
                    cx="50" cy="50" r="30" fill="transparent"
                    stroke="hsl(346 84% 49%)" strokeWidth="12"
                    strokeDasharray={`${lenCancelled} ${radCircumference}`}
                    strokeDashoffset={cancelledOffset}
                    className="transition-all duration-300"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black">{cases.length}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total</span>
              </div>
            </div>

            {/* Legend Labels */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 mt-4 sm:mt-0 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{activeCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Active</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{completedCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Completed</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{delayedCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Delayed</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-600 dark:bg-rose-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{cancelledCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Cancelled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Matters Bar Chart */}
        <Card className="flex flex-col border border-border/80">
          <CardHeader className="pb-2 text-left">
            <div className="flex items-center space-x-2.5">
              <BarChart4 size={18} className="text-primary" />
              <CardTitle>Case Load by Client</CardTitle>
            </div>
            <CardDescription>Top clients by active dockets volume.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center py-4">
            {clientCasesList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No client statistics available.</p>
            ) : (
              <div className="space-y-4">
                {clientCasesList.map(({ name, count }) => {
                  const percent = (count / maxCaseCount) * 100;
                  return (
                    <div key={name} className="space-y-1 text-left">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="truncate max-w-[150px] text-foreground">{name}</span>
                        <span className="text-muted-foreground">{count} Case{count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Income Area Line Chart */}
        <Card className="flex flex-col border border-border/80">
          <CardHeader className="pb-2 text-left">
            <div className="flex items-center space-x-2.5">
              <DollarSign size={18} className="text-primary" />
              <CardTitle>Total Income</CardTitle>
            </div>
            <CardDescription>Collection overview and payment trends.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between py-4 text-left">
            <div className="space-y-1">
              <div className="text-3xl font-black text-foreground">
                ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center text-xs text-emerald-600 font-bold">
                <span>↑ 21% vs last month</span>
              </div>
            </div>

            {/* SVG Area Chart */}
            <div className="relative w-full mt-4 bg-muted/20 p-2 rounded-xl border border-border/30">
              <svg viewBox="0 0 100 40" className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Grid guidelines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="hsl(var(--muted))" strokeWidth="0.25" strokeDasharray="2" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="hsl(var(--muted))" strokeWidth="0.25" strokeDasharray="2" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="hsl(var(--muted))" strokeWidth="0.25" strokeDasharray="2" />

                {/* Filled Area */}
                <path d="M 0 35 Q 20 20 40 28 T 80 15 T 100 12 L 100 40 L 0 40 Z" fill="url(#chartGrad)" />
                {/* Stroke Line */}
                <path d="M 0 35 Q 20 20 40 28 T 80 15 T 100 12" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" />
                
                {/* Active Tooltip and dotted lines */}
                <line x1="75" y1="16" x2="75" y2="40" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="1.5" />
                <circle cx="75" cy="16" r="3.5" fill="hsl(var(--primary))" className="shadow-lg" />
                <circle cx="75" cy="16" r="1.5" fill="#fff" />
              </svg>

              {/* Dynamic Floating Tooltip */}
              <div className="absolute top-2 right-12 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none">
                ₹{(totalCollected * 0.78).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid (Lists & Schedules) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Calendar Docket Card */}
        <Card className="border border-border/80">
          <CardHeader className="text-left">
            <CardTitle>Hearings Overview</CardTitle>
            <CardDescription>Upcoming dates scheduled in court dockets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cases.filter(c => c.next_hearing_date).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No upcoming hearings scheduled.</p>
            ) : (
              cases
                .filter(c => c.next_hearing_date)
                .sort((a,b) => new Date(a.next_hearing_date).getTime() - new Date(b.next_hearing_date).getTime())
                .slice(0, 4)
                .map((c, index) => {
                  const isOverdue = new Date(c.next_hearing_date) < new Date(new Date().toDateString());
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-card/40 hover:bg-muted/10 transition-all text-left">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground/60 font-bold w-6">
                          0{index + 1}
                        </span>
                        <div className={`p-2.5 rounded-lg flex-shrink-0 ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                          <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate" title={c.case_title}>{c.case_title}</h4>
                          <p className="text-xs text-muted-foreground truncate" title={c.court_name}>{c.court_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-black ${isOverdue ? 'text-rose-500' : 'text-foreground'}`}>
                          {c.next_hearing_date}
                        </span>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mt-0.5">Hearing</p>
                      </div>
                    </div>
                  );
                })
            )}
            <Link to="/calendar" className="block w-full text-center text-xs font-bold text-primary hover:underline pt-2">
              View Complete Calendar Schedule →
            </Link>
          </CardContent>
        </Card>

        {/* Recent Case Directory */}
        <Card className="border border-border/80">
          <CardHeader className="text-left">
            <CardTitle>Recent Case Directory</CardTitle>
            <CardDescription>Quick view of recently added legal matters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cases.slice(0, 4).map((c, index) => (
              <div key={c.id} className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-card/40 hover:border-primary/20 hover:bg-muted/10 transition-all text-left">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground/60 font-bold w-6">
                    0{index + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate" title={c.case_title}>{c.case_title}</h4>
                    <div className="flex items-center space-x-2 mt-1 min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground truncate uppercase">{c.case_number || 'No Case #'}</span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {c.client?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Badge
                    variant={
                      c.status === 'Active'
                        ? 'success'
                        : c.status === 'Completed'
                        ? 'info'
                        : c.status === 'Delayed'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {c.status}
                  </Badge>
                  <Button
                    onClick={() => navigate(`/case/${c.id}`)}
                    variant="ghost"
                    size="sm"
                    className="!p-1 h-auto text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

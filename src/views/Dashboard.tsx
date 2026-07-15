import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case, Client } from '../lib/db';
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
  TrendingUp,
  PieChart,
  BarChart4
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesData, clientsData] = await Promise.all([
          db.getCases(),
          db.getClients()
        ]);
        setCases(casesData);
        setClients(clientsData);
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ERP Workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here is the docket overview for your legal practice.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate('/cases')} variant="outline" className="h-9">
            View Docket
          </Button>
          <Button onClick={() => navigate('/clients')} className="h-9">
            Add Client
          </Button>
        </div>
      </div>

      {/* Tomorrow's Hearings Alert Section */}
      {tomorrowsHearings.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15 overflow-hidden">
          <div className="p-6 flex items-start space-x-4">
            <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0">
              <AlertTriangle size={24} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Alert Header layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-amber-500/10 pb-3 gap-2.5">
                <div>
                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 leading-tight">
                    Hearings Scheduled for Tomorrow ({tomorrowStr})
                  </h3>
                  <p className="text-xs font-semibold text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    You have {tomorrowsHearings.length} court hearing{tomorrowsHearings.length > 1 ? 's' : ''} tomorrow.
                  </p>
                </div>
                <Button
                  onClick={handleSendWhatsAppDigest}
                  className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 self-start sm:self-auto border-none shadow-sm flex-shrink-0"
                >
                  <WhatsAppIcon />
                  <span>Send Digest via WhatsApp</span>
                </Button>
              </div>
              
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tomorrowsHearings.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/case/${c.id}`)}
                    className="p-3.5 bg-card border border-amber-500/20 dark:border-amber-500/10 rounded-lg hover:shadow-md cursor-pointer transition-all hover:border-amber-500/30 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase truncate max-w-[120px]">
                          {c.case_number || 'NO NUMBER'}
                        </span>
                        <Badge variant="warning">{c.status}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground line-clamp-1">{c.case_title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.court_name}</p>
                    </div>
                    
                    {/* Card Actions: WhatsApp dispatch and details link */}
                    <div className="mt-4 flex items-center justify-between text-[11px] border-t border-border/40 pt-2.5">
                      <button
                        onClick={(e) => handleSendWhatsAppAlert(e, c)}
                        className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center focus:outline-none bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 transition-all hover:bg-emerald-500/10"
                        title="Send Case to WhatsApp"
                      >
                        <WhatsAppIcon />
                        <span>Send Alert</span>
                      </button>
                      <div className="flex items-center font-bold text-primary">
                        <span>Prepare Materials</span>
                        <ChevronRight size={13} className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Cases</CardTitle>
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Briefcase size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{activeCases.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp size={14} className="text-emerald-500 mr-1" />
              <span>Current active files on docket</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed Cases</CardTitle>
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
              <CheckCircle size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{completedCases.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-bold mr-1">
                {cases.length > 0 ? Math.round((completedCases.length / cases.length) * 100) : 0}%
              </span>
              <span>Overall completion success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Clients</CardTitle>
            <div className="bg-sky-500/10 text-sky-600 dark:text-sky-400 p-2 rounded-lg">
              <Users size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{clients.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Registered corporate & private clients</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution Donut Chart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
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
            <div className="grid grid-cols-2 sm:grid-col-1 gap-2.5 mt-4 sm:mt-0 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-emerald-600 dark:bg-emerald-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{activeCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Active</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-sky-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{completedCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Completed</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-amber-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{delayedCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Delayed</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-rose-600 dark:bg-rose-500" />
                <div className="text-xs">
                  <span className="font-bold text-foreground">{cancelledCases.length}</span>
                  <span className="text-muted-foreground block text-[10px]">Cancelled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Matters Bar Chart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2.5">
              <BarChart4 size={18} className="text-primary" />
              <CardTitle>Case Load by Client</CardTitle>
            </div>
            <CardDescription>Top 4 clients by registered dockets size.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end py-4">
            {clientCasesList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No client statistics available.</p>
            ) : (
              <div className="space-y-3.5">
                {clientCasesList.map(({ name, count }) => {
                  const percent = (count / maxCaseCount) * 100;
                  return (
                    <div key={name} className="space-y-1 text-left">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="truncate max-w-[200px] text-foreground">{name}</span>
                        <span className="text-muted-foreground">{count} Case{count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full h-3.5 bg-muted rounded-full overflow-hidden border border-border/30">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
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
      </div>

      {/* Docket Status & Recent Action split view */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Calendar Docket Card */}
        <Card className="h-full">
          <CardHeader>
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
                .map(c => {
                  const isOverdue = new Date(c.next_hearing_date) < new Date(new Date().toDateString());
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-secondary text-secondary-foreground'}`}>
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold truncate max-w-[180px] sm:max-w-[240px]">{c.case_title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c.court_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${isOverdue ? 'text-rose-500' : 'text-foreground'}`}>
                          {c.next_hearing_date}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Hearing Date</p>
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

        {/* Quick Docket Checklist */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent Case Directory</CardTitle>
            <CardDescription>Quick view of recently added legal matters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cases.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50 hover:border-primary/20 transition-all">
                <div>
                  <h4 className="text-sm font-bold">{c.case_title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{c.case_number || 'No Case #'}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {c.client?.name || 'Loading client...'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
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

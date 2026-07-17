import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar as CalendarIcon, ChevronRight, AlertTriangle } from 'lucide-react';

interface CourtHoliday {
  date: string;
  name: string;
  type: 'National' | 'Gazetted' | 'Vacation';
}

const COURT_HOLIDAYS: CourtHoliday[] = [
  { date: '2026-01-26', name: 'Republic Day', type: 'National' },
  { date: '2026-03-06', name: 'Holi Festival', type: 'Gazetted' },
  { date: '2026-04-03', name: 'Good Friday', type: 'Gazetted' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'Gazetted' },
  { date: '2026-05-01', name: 'May Day / Labor Day', type: 'Gazetted' },
  { date: '2026-07-21', name: 'Court Summer Vacation Recess', type: 'Vacation' },
  { date: '2026-08-15', name: 'Independence Day', type: 'National' },
  { date: '2026-09-04', name: 'Janmashtami Holiday', type: 'Gazetted' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'National' },
  { date: '2026-11-09', name: 'Diwali Festival Holiday', type: 'Gazetted' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'National' }
];

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await db.getCases();
        setCases(data);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filter cases that have a hearing date
  const hearingCases = cases
    .filter(c => !!c.next_hearing_date)
    .sort((a, b) => parseLocalDate(a.next_hearing_date).getTime() - parseLocalDate(b.next_hearing_date).getTime());

  // Helper to categorize dates
  const getRelativeDateLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const target = parseLocalDate(dateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === 2) return 'Day After Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago (Past Due)`;
  };

  // Group cases by next_hearing_date for date-wise timeline view
  interface GroupedTimelineItem {
    date: string;
    label: string;
    isPast: boolean;
    casesList: Case[];
    holiday?: CourtHoliday;
  }

  const groupedHearingCases: GroupedTimelineItem[] = [];

  // Group actual cases
  hearingCases.forEach(c => {
    const dateStr = c.next_hearing_date;
    const existingGroup = groupedHearingCases.find(g => g.date === dateStr);
    
    if (existingGroup) {
      existingGroup.casesList.push(c);
    } else {
      const label = getRelativeDateLabel(dateStr);
      groupedHearingCases.push({
        date: dateStr,
        label,
        isPast: label.includes('ago'),
        casesList: [c]
      });
    }
  });

  // Inject upcoming holidays (within next 60 days) to timeline
  const todayVal = new Date();
  todayVal.setHours(0,0,0,0);
  const futureLimit = new Date();
  futureLimit.setDate(todayVal.getDate() + 60);

  COURT_HOLIDAYS.forEach(hol => {
    const holDate = parseLocalDate(hol.date);
    if (holDate >= todayVal && holDate <= futureLimit) {
      const existingGroup = groupedHearingCases.find(g => g.date === hol.date);
      if (existingGroup) {
        existingGroup.holiday = hol;
      } else {
        const label = getRelativeDateLabel(hol.date);
        groupedHearingCases.push({
          date: hol.date,
          label,
          isPast: false,
          casesList: [],
          holiday: hol
        });
      }
    }
  });

  // Sort unified timeline groups chronologically
  groupedHearingCases.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Hearings Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor upcoming legal proceedings, hearings, and dates.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar visual overview column */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Schedule Summary</CardTitle>
            <CardDescription>Metrics for docket deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-semibold">
            <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-foreground">
                  {hearingCases.filter(c => {
                    const diff = new Date(c.next_hearing_date).getTime() - new Date().setHours(0,0,0,0);
                    return diff >= 0;
                  }).length}
                </span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Upcoming Hearings</p>
              </div>
              <CalendarIcon size={24} className="text-primary" />
            </div>

            <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-rose-500">
                  {hearingCases.filter(c => {
                    const diff = new Date(c.next_hearing_date).getTime() - new Date().setHours(0,0,0,0);
                    return diff < 0;
                  }).length}
                </span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Past Due Appearances</p>
              </div>
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
          </CardContent>
        </Card>

        {/* Court Holidays card */}
        <Card className="h-fit border border-border/80">
          <CardHeader className="pb-3 text-left">
            <CardTitle>Court Holidays</CardTitle>
            <CardDescription>Official calendar recess and gazetted holidays.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-hide pr-1">
            {COURT_HOLIDAYS.map(hol => {
              const [year, month, day] = hol.date.split('-').map(Number);
              const formatted = new Date(year, month - 1, day).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              });
              const isUpcoming = new Date(hol.date) >= new Date(new Date().toDateString());
              return (
                <div key={hol.date} className={`flex items-center justify-between p-2.5 border rounded-lg transition-colors text-left text-xs font-bold ${
                  isUpcoming 
                    ? 'border-border bg-card/60 hover:bg-muted/10' 
                    : 'border-border/30 bg-muted/20 opacity-60'
                }`}>
                  <div className="space-y-0.5">
                    <h5 className="text-foreground truncate max-w-[140px]">{hol.name}</h5>
                    <span className="text-[9px] text-muted-foreground uppercase font-black">{hol.type} Holiday</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-extrabold ${isUpcoming ? 'text-primary' : 'text-muted-foreground'}`}>{formatted}</span>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{year}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Hearings Timeline column */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Docket Dates</CardTitle>
            <CardDescription>Chronological overview of scheduled court occurrences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedHearingCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="mx-auto text-muted-foreground/50 h-10 w-10 mb-2" />
                <p className="text-sm font-semibold">No scheduled hearings on the docket.</p>
              </div>
            ) : (
              <div className="space-y-8 text-left border-l border-border/70 pl-4 ml-2">
                {groupedHearingCases.map(group => {
                  const [year, month, day] = group.date.split('-').map(Number);
                  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div key={group.date} className="relative space-y-3">
                      {/* Timeline Dot Indicator */}
                      <div className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-background flex items-center justify-center ${
                        group.holiday
                          ? 'border-rose-500 text-rose-500'
                          : group.isPast 
                          ? 'border-rose-500 text-rose-500' 
                          : group.label.includes('Today') 
                          ? 'border-emerald-500 text-emerald-500'
                          : 'border-primary text-primary'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          group.holiday
                            ? 'bg-rose-500'
                            : group.isPast 
                            ? 'bg-rose-500' 
                            : group.label.includes('Today') 
                            ? 'bg-emerald-500 animate-ping'
                            : 'bg-primary'
                        }`} />
                      </div>

                      {/* Group Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-black text-foreground font-mono uppercase tracking-wider">{formattedDate}</h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          group.holiday
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : group.isPast 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : group.label.includes('Today') 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : group.label.includes('Tomorrow') 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {group.holiday ? 'Holiday' : group.label}
                        </span>
                      </div>

                      {/* Group Cases List */}
                      <div className="space-y-3">
                        {group.holiday && (
                          <div className="flex items-center space-x-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold text-left shadow-sm">
                            <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex-shrink-0">
                              Court Holiday
                            </span>
                            <span className="flex-1 truncate">
                              🌴 {group.holiday.name} ({group.holiday.type})
                            </span>
                          </div>
                        )}

                        {group.casesList.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => navigate(`/case/${c.id}`)}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border/70 rounded-xl bg-card/50 hover:border-primary/30 hover:bg-card hover:shadow-md transition-all duration-300 cursor-pointer ${
                              group.isPast ? 'hover:border-rose-500/30' : ''
                            }`}
                          >
                            <div className="space-y-1 text-left">
                              <h4 className="text-sm font-bold text-foreground line-clamp-1">{c.case_title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{c.court_name}</p>
                              {c.assigned_lawyer && (
                                <p className="text-[10px] text-primary font-bold flex items-center space-x-1 mt-1">
                                  <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1 py-0.25 rounded uppercase tracking-wider">Advocate</span>
                                  <span className="text-foreground/80">{c.assigned_lawyer.name}</span>
                                </p>
                              )}
                            </div>

                            <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end space-x-4">
                              <div className="flex flex-col text-right sm:items-end">
                                <Badge
                                  variant={
                                    c.status === 'Active'
                                      ? 'success'
                                      : c.status === 'Completed'
                                      ? 'info'
                                      : c.status === 'Delayed'
                                      ? 'warning'
                                      : c.status === 'Hold'
                                      ? 'outline'
                                      : 'error'
                                  }
                                >
                                  {c.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">{c.case_number || 'NO #'}</span>
                              </div>
                              <ChevronRight size={18} className="text-muted-foreground/60 hidden sm:block" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

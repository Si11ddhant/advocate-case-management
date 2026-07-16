import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar as CalendarIcon, ChevronRight, AlertTriangle } from 'lucide-react';

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
  interface GroupedCases {
    date: string;
    label: string;
    isPast: boolean;
    casesList: Case[];
  }

  const groupedHearingCases: GroupedCases[] = [];

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

  return (
    <div className="space-y-6">
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
                        group.isPast 
                          ? 'border-rose-500 text-rose-500' 
                          : group.label.includes('Today') 
                          ? 'border-emerald-500 text-emerald-500'
                          : 'border-primary text-primary'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          group.isPast 
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
                          group.isPast 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : group.label.includes('Today') 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : group.label.includes('Tomorrow') 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {group.label}
                        </span>
                      </div>

                      {/* Group Cases List */}
                      <div className="space-y-3">
                        {group.casesList.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => navigate(`/case/${c.id}`)}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border/70 rounded-xl bg-card/50 hover:border-primary/30 hover:bg-card hover:shadow-md transition-all duration-300 cursor-pointer ${
                              group.isPast ? 'hover:border-rose-500/30' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-foreground line-clamp-1">{c.case_title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{c.court_name}</p>
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

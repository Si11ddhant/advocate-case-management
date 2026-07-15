import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case, Client } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';
import {
  Briefcase,
  FolderPlus,
  Filter,
  Calendar,
  MoreVertical,
  Eye,
  AlertCircle,
  List,
  Kanban,
  ChevronRight
} from 'lucide-react';

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' | 'board'
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All'); // 'All', 'Has Hearing', 'Upcoming', 'Overdue'

  // New Case Modal Form States
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [description, setDescription] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick Action States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [quickStatusCase, setQuickStatusCase] = useState<Case | null>(null);
  const [quickHearingCase, setQuickHearingCase] = useState<Case | null>(null);
  const [newQuickStatus, setNewQuickStatus] = useState<Case['status']>('Active');
  const [newQuickHearingDate, setNewQuickHearingDate] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [casesData, clientsData] = await Promise.all([
        db.getCases(),
        db.getClients()
      ]);
      setCases(casesData);
      setClients(clientsData);
      if (clientsData.length > 0) {
        setClientId(clientsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching docket data:', err);
      toast('Failed to load docket cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleOpenNewCaseModal = () => {
    setCaseTitle('');
    setCourtName('');
    setCaseNumber('');
    setDescription('');
    setNextHearingDate('');
    if (clients.length > 0) {
      setClientId(clients[0].id);
    } else {
      setClientId('');
    }
    setIsNewCaseOpen(true);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast('You must select or create a client first', 'warning');
      return;
    }
    if (!caseTitle.trim()) {
      toast('Case Title is required', 'warning');
      return;
    }
    
    setSubmitting(true);
    try {
      await db.createCase({
        client_id: clientId,
        case_title: caseTitle,
        court_name: courtName,
        case_number: caseNumber,
        status: 'Active',
        next_hearing_date: nextHearingDate,
        description: description
      });
      toast(`Case "${caseTitle}" added to docket!`, 'success');
      setIsNewCaseOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message || 'Failed to add case', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyQuickStatus = async () => {
    if (!quickStatusCase) return;
    try {
      await db.updateCaseStatus(quickStatusCase.id, newQuickStatus);
      toast(`Status updated for "${quickStatusCase.case_title}"`, 'success');
      setQuickStatusCase(null);
      fetchData();
    } catch (err: any) {
      toast(err.message || 'Update failed', 'error');
    }
  };

  const handleApplyQuickHearing = async () => {
    if (!quickHearingCase) return;
    try {
      await db.updateCaseHearingDate(quickHearingCase.id, newQuickHearingDate);
      toast(`Hearing date updated for "${quickHearingCase.case_title}"`, 'success');
      setQuickHearingCase(null);
      fetchData();
    } catch (err: any) {
      toast(err.message || 'Update failed', 'error');
    }
  };

  const handleQuickStatusShift = async (caseId: string, currentStatus: Case['status'], direction: 'next' | 'prev') => {
    const statuses: Case['status'][] = ['Active', 'Delayed', 'Completed', 'Cancelled'];
    const idx = statuses.indexOf(currentStatus);
    let nextIdx = idx + (direction === 'next' ? 1 : -1);
    if (nextIdx < 0) nextIdx = statuses.length - 1;
    if (nextIdx >= statuses.length) nextIdx = 0;
    
    try {
      await db.updateCaseStatus(caseId, statuses[nextIdx]);
      toast(`Moved case to column: ${statuses[nextIdx]}`, 'success');
      fetchData();
    } catch (err) {
      toast('Failed to move case card', 'error');
    }
  };

  // Filter application
  const filteredCases = cases.filter(c => {
    // 1. Status Filter (Only applied in list view since Kanban naturally splits columns)
    if (viewMode === 'list' && statusFilter !== 'All' && c.status !== statusFilter) return false;
    
    // 2. Date Filter
    if (dateFilter !== 'All') {
      const hasDate = !!c.next_hearing_date;
      if (dateFilter === 'Has Hearing' && !hasDate) return false;
      
      if (hasDate) {
        const hDate = new Date(c.next_hearing_date + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (dateFilter === 'Upcoming' && hDate < today) return false;
        if (dateFilter === 'Overdue' && hDate >= today) return false;
      }
    }
    return true;
  });

  // Kanban Columns
  const kanbanColumns: { status: Case['status']; label: string; accentClass: string }[] = [
    { status: 'Active', label: 'Active Matter', accentClass: 'border-t-emerald-500' },
    { status: 'Delayed', label: 'Delayed', accentClass: 'border-t-amber-500' },
    { status: 'Completed', label: 'Disposed / Closed', accentClass: 'border-t-sky-500' },
    { status: 'Cancelled', label: 'Cancelled / Settled', accentClass: 'border-t-rose-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Active Cases Docket</h1>
          <p className="text-muted-foreground text-sm mt-1">Review litigation files, court structures, and schedule dates.</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Toggle View Mode */}
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground border border-border mr-1">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground'
              }`}
            >
              <List size={14} className="mr-1.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'board' ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground'
              }`}
            >
              <Kanban size={14} className="mr-1.5" />
              <span>Kanban</span>
            </button>
          </div>

          <Button onClick={handleOpenNewCaseModal} className="flex items-center space-x-2 h-9 text-xs">
            <FolderPlus size={16} />
            <span>New Case File</span>
          </Button>
        </div>
      </div>

      {/* Filter and Content Container */}
      <Card className="overflow-visible border-none bg-transparent shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4 px-0 bg-transparent">
          <div>
            <CardTitle className="text-xl font-bold">
              {viewMode === 'list' ? 'Litigation Directory' : 'Litigation Pipeline'}
            </CardTitle>
            <CardDescription className="text-xs">
              {viewMode === 'list' 
                ? 'Comprehensive directory of all court files.' 
                : 'Drag-and-drop workflow styled column representation.'}
            </CardDescription>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center space-x-2 bg-secondary border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground">
              <Filter size={14} />
              <span>Filters</span>
            </div>

            {viewMode === 'list' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Completed">Completed Only</option>
                <option value="Delayed">Delayed Only</option>
                <option value="Cancelled">Cancelled Only</option>
              </select>
            )}

            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Dates</option>
              <option value="Has Hearing">Has Scheduled Hearing</option>
              <option value="Upcoming">Upcoming Hearings</option>
              <option value="Overdue">Past Scheduled Hearings</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="px-0 relative">
          {loading ? (
            <div className="flex h-40 items-center justify-center bg-card border border-border rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
              <Briefcase className="mx-auto text-muted-foreground/60 h-10 w-10 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No case records found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Adjust filters or create a new case profile.</p>
            </div>
          ) : viewMode === 'list' ? (
            /* LIST VIEW MODE */
            <div className="overflow-visible bg-card border border-border rounded-xl p-4">
              <div className="w-full overflow-x-auto">
                <Table className="overflow-visible">
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Title</TableHead>
                    <TableHead>Client Entity</TableHead>
                    <TableHead>Court Info</TableHead>
                    <TableHead>Docket Status</TableHead>
                    <TableHead>Next Hearing</TableHead>
                    <TableHead className="w-16 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-visible">
                  {filteredCases.map(c => {
                    const hasOverdueHearing = c.next_hearing_date && new Date(c.next_hearing_date) < new Date(new Date().toDateString());
                    return (
                      <TableRow 
                        key={c.id} 
                        className="relative overflow-visible group cursor-pointer hover:bg-muted/10 transition-colors"
                        onClick={() => navigate(`/case/${c.id}`)}
                      >
                        <TableCell className="font-bold text-foreground">
                          <span className="text-primary/95 hover:underline transition-colors">
                            {c.case_title}
                          </span>
                          <span className="block text-[10px] font-mono text-muted-foreground tracking-wider uppercase mt-1">
                            {c.case_number || 'NO ASSIGNED NUMBER'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-semibold">
                          {c.client?.name || 'No Client Linked'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs leading-normal">
                          {c.court_name || 'N/A'}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          {c.next_hearing_date ? (
                            <div className="flex items-center space-x-1.5">
                              <Calendar size={14} className="text-muted-foreground/60" />
                              <span className={`text-sm ${hasOverdueHearing ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                                {c.next_hearing_date}
                              </span>
                              {hasOverdueHearing && (
                                <span title="Overdue Hearing Date">
                                  <AlertCircle size={14} className="text-rose-500" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-[11px] text-muted-foreground/45">No dates</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right overflow-visible" onClick={e => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                              onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                            >
                              <MoreVertical size={16} />
                            </Button>

                            {/* Dropdown Menu Portal */}
                            {activeMenuId === c.id && (
                              <div
                                ref={dropdownRef}
                                className="absolute right-0 mt-1 w-44 rounded-lg border border-border bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-100"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      navigate(`/case/${c.id}`);
                                    }}
                                    className="flex w-full items-center px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                                  >
                                    <Eye size={14} className="mr-2" />
                                    View Full Case
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setNewQuickStatus(c.status);
                                      setQuickStatusCase(c);
                                    }}
                                    className="flex w-full items-center px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                                  >
                                    <Filter size={14} className="mr-2" />
                                    Change Status
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setNewQuickHearingDate(c.next_hearing_date || '');
                                      setQuickHearingCase(c);
                                    }}
                                    className="flex w-full items-center px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                                  >
                                    <Calendar size={14} className="mr-2" />
                                    Update Hearing
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          ) : (
            /* KANBAN BOARD VIEW MODE */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {kanbanColumns.map(col => {
                const columnCases = filteredCases.filter(c => c.status === col.status);
                return (
                  <div key={col.status} className="flex flex-col bg-muted/30 border border-border rounded-xl overflow-hidden min-h-[500px]">
                    {/* Column Header */}
                    <div className={`p-4 bg-card border-t-4 border-b border-border ${col.accentClass} flex items-center justify-between`}>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {col.label}
                      </span>
                      <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
                        {columnCases.length}
                      </span>
                    </div>

                    {/* Column Body Cards Scroll container */}
                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                      {columnCases.length === 0 ? (
                        <div className="text-center py-10 text-[11px] font-medium text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                          No matters in this phase
                        </div>
                      ) : (
                        columnCases.map(c => {
                          const hasOverdue = c.next_hearing_date && new Date(c.next_hearing_date) < new Date(new Date().toDateString());
                          return (
                            <div
                              key={c.id}
                              className="p-4 bg-card hover:bg-card/90 border border-border rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left relative"
                            >
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-mono text-muted-foreground uppercase block tracking-wider">
                                  {c.case_number || 'NO ASSIGNED NUMBER'}
                                </span>
                                <h4 
                                  onClick={() => navigate(`/case/${c.id}`)}
                                  className="text-xs font-bold text-foreground cursor-pointer hover:underline hover:text-primary transition-all line-clamp-2"
                                >
                                  {c.case_title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground leading-normal font-semibold truncate">
                                  Client: {c.client?.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground/75 truncate">
                                  Court: {c.court_name || 'Not provided'}
                                </p>
                              </div>

                              {c.next_hearing_date && (
                                <div className={`flex items-center space-x-1 p-2 rounded-lg text-[10px] font-semibold border ${
                                  hasOverdue 
                                    ? 'bg-rose-500/5 text-rose-500 border-rose-500/10' 
                                    : 'bg-muted/50 text-muted-foreground border-border/40'
                                }`}>
                                  <Calendar size={11} className="flex-shrink-0" />
                                  <span className="truncate">Hearing: {c.next_hearing_date}</span>
                                  {hasOverdue && <AlertCircle size={11} className="text-rose-500 flex-shrink-0" />}
                                </div>
                              )}

                              {/* Card Actions Footer: Shifting pipeline columns */}
                              <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-1.5">
                                <button
                                  onClick={() => handleQuickStatusShift(c.id, c.status, 'prev')}
                                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-md transition-all border border-border/30"
                                  title="Move Left"
                                >
                                  ←
                                </button>
                                <Button
                                  onClick={() => navigate(`/case/${c.id}`)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] !px-2 flex items-center space-x-1"
                                >
                                  <span>Open</span>
                                  <ChevronRight size={10} />
                                </Button>
                                <button
                                  onClick={() => handleQuickStatusShift(c.id, c.status, 'next')}
                                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-md transition-all border border-border/30"
                                  title="Move Right"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Case Modal */}
      <Modal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        title="Open New Case File"
        footer={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsNewCaseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCase} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Case File'}
            </Button>
          </div>
        }
      >
        {clients.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm font-semibold text-amber-600">No clients registered.</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">You must add a client profile first before creating a case.</p>
            <Button onClick={() => { setIsNewCaseOpen(false); navigate('/clients'); }}>
              Go to Clients Directory
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateCase} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Select Client <span className="text-rose-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
              >
                {clients.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Case Title / Title of Matter <span className="text-rose-500">*</span>
              </label>
              <input
                placeholder="e.g. State of Illinois vs. John Doe"
                required
                value={caseTitle}
                onChange={e => setCaseTitle(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Court Name / Jurisdiction
                </label>
                <input
                  placeholder="e.g. County Circuit Court"
                  value={courtName}
                  onChange={e => setCourtName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Docket/Case Number
                </label>
                <input
                  placeholder="e.g. 2026-CH-9941"
                  value={caseNumber}
                  onChange={e => setCaseNumber(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Initial Hearing Date
              </label>
              <input
                type="date"
                value={nextHearingDate}
                onChange={e => setNextHearingDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description / Subject Matter
              </label>
              <textarea
                placeholder="Details about litigation matters, legal challenges..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Quick Action: Change Status Modal */}
      <Modal
        isOpen={!!quickStatusCase}
        onClose={() => setQuickStatusCase(null)}
        title={`Change Status: ${quickStatusCase?.case_title}`}
        footer={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setQuickStatusCase(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyQuickStatus}>
              Save Status
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a new status for this case:</p>
          <div className="grid grid-cols-2 gap-2">
            {(['Active', 'Completed', 'Delayed', 'Cancelled'] as Case['status'][]).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setNewQuickStatus(st)}
                className={`p-3 rounded-lg border text-sm font-semibold transition-all text-center ${
                  newQuickStatus === st
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background/50 hover:bg-muted text-muted-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Quick Action: Update Hearing Date Modal */}
      <Modal
        isOpen={!!quickHearingCase}
        onClose={() => setQuickHearingCase(null)}
        title={`Update Hearing Date: ${quickHearingCase?.case_title}`}
        footer={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setQuickHearingCase(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyQuickHearing}>
              Save Date
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-muted-foreground">Set next court appearance date:</p>
          <input
            type="date"
            value={newQuickHearingDate}
            onChange={e => setNewQuickHearingDate(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
          />
        </div>
      </Modal>
    </div>
  );
};

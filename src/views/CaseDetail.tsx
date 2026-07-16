import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import type { Case, CaseUpdate, Document, Invoice, Expense } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  ChevronLeft,
  BookOpen,
  MessageSquare,
  FileText,
  Plus,
  Clock,
  UploadCloud,
  FileIcon,
  Download,
  Eye,
  Printer,
  Scale,
  ChevronDown,
  Check,
  DollarSign,
  Receipt,
  Trash2
} from 'lucide-react';

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [kase, setKase] = useState<Case | null>(null);
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail fields
  const [status, setStatus] = useState<Case['status']>('Active');
  const [hearingDate, setHearingDate] = useState('');

  // Update field
  const [newUpdateText, setNewUpdateText] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Document fields
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<Document['document_category']>('Misc');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Lightbox Preview State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Description Edit States
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [submittingDescription, setSubmittingDescription] = useState(false);

  // Status Dropdown States
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  // Billing and Invoice States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invTitle, setInvTitle] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Expenses / Disbursements States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('Travel');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchCaseDetails = async () => {
    if (!id) return;
    try {
      const caseData = await db.getCaseById(id);
      if (!caseData) {
        toast('Case file not found', 'error');
        navigate('/cases');
        return;
      }
      setKase(caseData);
      setStatus(caseData.status);
      setHearingDate(caseData.next_hearing_date || '');
      setDescriptionInput(caseData.description || '');

      const [updatesData, docsData, invoicesData, expensesData] = await Promise.all([
        db.getUpdatesByCaseId(id),
        db.getDocumentsByCaseId(id),
        db.getInvoicesByCaseId(id),
        db.getExpensesByCaseId(id)
      ]);
      setUpdates(updatesData);
      setDocuments(docsData);
      setInvoices(invoicesData);
      setExpenses(expensesData);
    } catch (err) {
      console.error('Error fetching details:', err);
      toast('Failed to load case specifics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const handleSaveDescription = async () => {
    if (!kase) return;
    setSubmittingDescription(true);
    try {
      await db.updateCaseDescription(kase.id, descriptionInput);
      
      // Add dynamic system update note
      await db.createUpdate({
        case_id: kase.id,
        update_text: 'System: Case description and notes updated.',
        added_by: user?.email || 'System'
      });

      toast('Case description updated successfully!', 'success');
      setIsEditingDescription(false);
      fetchCaseDetails();
    } catch (err: any) {
      toast(err.message || 'Failed to update description', 'error');
    } finally {
      setSubmittingDescription(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !kase) return;
    if (!invTitle.trim() || !invAmount.trim()) {
      toast('Title and Amount are required', 'warning');
      return;
    }
    setSubmittingInvoice(true);
    try {
      const selectedExpensesList = expenses.filter(e => selectedExpenseIds.includes(e.id));
      const expensesTotal = selectedExpensesList.reduce((sum, e) => sum + e.amount, 0);
      const totalInvoiceAmount = parseFloat(invAmount) + expensesTotal;

      const newInvoice = await db.createInvoice({
        case_id: id,
        client_id: kase.client_id,
        title: invTitle.trim(),
        amount: totalInvoiceAmount,
        status: 'Unpaid',
        due_date: invDueDate
      });

      if (selectedExpenseIds.length > 0) {
        await db.markExpensesAsBilled(selectedExpenseIds, newInvoice.id);
      }

      setInvTitle('');
      setInvAmount('');
      setInvDueDate('');
      setSelectedExpenseIds([]);
      toast('Invoice generated successfully!', 'success');
      
      await db.createUpdate({
        case_id: id,
        update_text: `System: New invoice created - "${invTitle}" for $${totalInvoiceAmount.toFixed(2)} (includes $${expensesTotal.toFixed(2)} disbursements).`,
        added_by: user?.email || 'System'
      });
      fetchCaseDetails();
    } catch (err: any) {
      toast(err.message || 'Failed to create invoice', 'error');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: Invoice['status']) => {
    try {
      await db.updateInvoiceStatus(invoiceId, status);
      toast(`Invoice marked as ${status}`, 'success');
      fetchCaseDetails();
      if (activeInvoice && activeInvoice.id === invoiceId) {
        setActiveInvoice(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      toast('Failed to update invoice status', 'error');
    }
  };

  const handleStatusChange = async (newStatus: Case['status']) => {
    if (!kase) return;
    try {
      await db.updateCaseStatus(kase.id, newStatus);
      setStatus(newStatus);
      toast(`Case status changed to ${newStatus}`, 'success');
      // Add system timeline comment automatically!
      await db.createUpdate({
        case_id: kase.id,
        update_text: `System: Status updated to "${newStatus}".`,
        added_by: user?.email || 'System'
      });
      const updatedUpdates = await db.getUpdatesByCaseId(kase.id);
      setUpdates(updatedUpdates);
    } catch (err) {
      toast('Failed to update status', 'error');
    }
  };

  const handleHearingDateChange = async (dateStr: string) => {
    if (!kase) return;
    try {
      await db.updateCaseHearingDate(kase.id, dateStr);
      setHearingDate(dateStr);
      toast(`Next hearing date set to ${dateStr}`, 'success');
      // Add system timeline comment automatically
      await db.createUpdate({
        case_id: kase.id,
        update_text: `System: Next hearing date changed to ${dateStr || 'Not Scheduled'}.`,
        added_by: user?.email || 'System'
      });
      const updatedUpdates = await db.getUpdatesByCaseId(kase.id);
      setUpdates(updatedUpdates);
    } catch (err) {
      toast('Failed to update hearing date', 'error');
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newUpdateText.trim()) return;
    setSubmittingUpdate(true);
    try {
      await db.createUpdate({
        case_id: id,
        update_text: newUpdateText.trim(),
        added_by: user?.email || 'advocate@example.com'
      });
      setNewUpdateText('');
      toast('Note posted to timeline', 'success');
      const updatedUpdates = await db.getUpdatesByCaseId(id);
      setUpdates(updatedUpdates);
    } catch (err) {
      toast('Failed to add note', 'error');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !docFile) {
      toast('Please select a file to upload', 'warning');
      return;
    }
    setSubmittingDoc(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        try {
          await db.uploadDocument({
            case_id: id,
            file_name: docFile.name,
            file_url: base64Url,
            document_category: docCategory
          });
          setDocFile(null);
          toast(`Document "${docFile.name}" registered successfully!`, 'success');
          const updatedDocs = await db.getDocumentsByCaseId(id);
          setDocuments(updatedDocs);
        } catch (err) {
          toast('Failed to upload document', 'error');
        } finally {
          setSubmittingDoc(false);
        }
      };
      reader.onerror = () => {
        toast('Failed to read document file', 'error');
        setSubmittingDoc(false);
      };
      reader.readAsDataURL(docFile);
    } catch (err) {
      toast('Failed to upload document', 'error');
      setSubmittingDoc(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !kase || !expTitle.trim() || !expAmount) return;
    setSubmittingExpense(true);
    try {
      await db.createExpense({
        case_id: id,
        client_id: kase.client_id,
        title: expTitle.trim(),
        amount: parseFloat(expAmount),
        category: expCategory,
        date: expDate
      });
      setExpTitle('');
      setExpAmount('');
      setExpCategory('Travel');
      setExpDate(new Date().toISOString().split('T')[0]);
      toast('Expense logged successfully!', 'success');
      
      // Auto post a note to the timeline
      await db.createUpdate({
        case_id: id,
        update_text: `System: Logged case expense (${expCategory}) - "${expTitle.trim()}" for ₹${parseFloat(expAmount).toFixed(2)}.`,
        added_by: user?.email || 'System'
      });
      
      fetchCaseDetails();
    } catch (err: any) {
      toast(err.message || 'Failed to log expense', 'error');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      try {
        await db.deleteExpense(expenseId);
        toast('Expense deleted', 'success');
        
        // Auto post a note to the timeline
        await db.createUpdate({
          case_id: id || '',
          update_text: `System: Deleted case expense - "${title}".`,
          added_by: user?.email || 'System'
        });
        
        fetchCaseDetails();
      } catch (err) {
        toast('Failed to delete expense', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!kase) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/cases')}
        className="-ml-3 hover:bg-muted text-muted-foreground flex items-center space-x-1"
      >
        <ChevronLeft size={16} />
        <span>Return to Docket</span>
      </Button>

      {/* Case Header workspace */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-6 border border-border bg-card rounded-xl shadow-sm gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground tracking-wider uppercase">
              {kase.case_number || 'NO ASSIGNED NUMBER'}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-xs text-muted-foreground font-semibold">{kase.court_name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{kase.case_title}</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Representing client: <span className="font-semibold text-primary">{kase.client?.name}</span> ({kase.client?.email || 'No email'})
          </p>
        </div>

        {/* Docket Actions: Quick inline updates */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status Changer */}
          <div className="space-y-1 text-left" ref={statusDropdownRef}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Matter Status
            </label>
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted/50 flex items-center justify-between space-x-2 focus:outline-none shadow-sm transition-all w-36 text-foreground"
              >
                <div className="flex items-center space-x-2">
                   <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    status === 'Active'
                      ? 'bg-emerald-500'
                      : status === 'Completed'
                      ? 'bg-sky-500'
                      : status === 'Delayed'
                      ? 'bg-amber-500'
                      : status === 'Hold'
                      ? 'bg-slate-400'
                      : 'bg-rose-500'
                  }`} />
                  <span className="truncate">{status}</span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground/80 flex-shrink-0" />
              </button>
              
              {isStatusDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-36 rounded-lg border border-border bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-in fade-in slide-in-from-top-2 duration-100 p-1">
                  {(['Active', 'Completed', 'Delayed', 'Cancelled', 'Hold'] as Case['status'][]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        handleStatusChange(st);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        status === st
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted/70'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          st === 'Active'
                            ? 'bg-emerald-500'
                            : st === 'Completed'
                            ? 'bg-sky-500'
                            : st === 'Delayed'
                            ? 'bg-amber-500'
                            : st === 'Hold'
                            ? 'bg-slate-400'
                            : 'bg-rose-500'
                        }`} />
                        <span>{st}</span>
                      </div>
                      {status === st && <Check size={12} className="text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Next Hearing picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Next Hearing Date
            </label>
            <input
              type="date"
              value={hearingDate}
              onChange={e => handleHearingDateChange(e.target.value)}
              className="h-9 px-2 text-xs font-semibold rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40"
            />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="details">
        <TabsList className="bg-muted/80 p-1 w-full max-w-2xl grid grid-cols-5">
          <TabsTrigger value="details" className="flex items-center justify-center space-x-2">
            <BookOpen size={16} />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center justify-center space-x-2">
            <MessageSquare size={16} />
            <span>Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center justify-center space-x-2">
            <FileText size={16} />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center justify-center space-x-2">
            <Receipt size={16} />
            <span>Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center justify-center space-x-2">
            <DollarSign size={16} />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Details */}
        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Case Description & Notes</CardTitle>
                  <CardDescription>Primary overview and directives relating to this docket matter.</CardDescription>
                </div>
                {!isEditingDescription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDescriptionInput(kase.description || '');
                      setIsEditingDescription(true);
                    }}
                    className="h-8 text-xs flex items-center space-x-1"
                  >
                    <span>Edit Description</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingDescription ? (
                  <div className="space-y-4 text-left">
                    <textarea
                      value={descriptionInput}
                      onChange={e => setDescriptionInput(e.target.value)}
                      rows={6}
                      className="w-full p-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-sans leading-relaxed text-foreground"
                      placeholder="Enter detailed litigation description, notes..."
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingDescription(false)}
                        disabled={submittingDescription}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveDescription}
                        disabled={submittingDescription}
                      >
                        {submittingDescription ? 'Saving...' : 'Save Description'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed text-left">
                    {kase.description || 'No description notes saved for this case file.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Litigation Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-medium">
                <div>
                  <span className="text-muted-foreground uppercase block text-[10px] tracking-wide mb-1">CLIENT CONTACT</span>
                  <p className="text-sm font-semibold">{kase.client?.name}</p>
                  <p className="text-muted-foreground mt-0.5">{kase.client?.phone || 'No phone'}</p>
                  <p className="text-muted-foreground mt-0.5">{kase.client?.email || 'No email'}</p>
                </div>
                
                <div className="border-t border-border pt-4">
                  <span className="text-muted-foreground uppercase block text-[10px] tracking-wide mb-1">CLIENT OFFICE MAILING</span>
                  <p className="text-muted-foreground leading-normal">{kase.client?.address || 'Not registered'}</p>
                </div>

                <div className="border-t border-border pt-4">
                  <span className="text-muted-foreground uppercase block text-[10px] tracking-wide mb-1">DOCKET RECORDED AT</span>
                  <p className="text-muted-foreground">{new Date(kase.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Updates Timeline */}
        <TabsContent value="timeline" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Note Editor */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Add Timeline Note</CardTitle>
                <CardDescription>Log hearings results, negotiations, and updates here.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePostUpdate} className="space-y-4">
                  <textarea
                    placeholder="Type details about this update..."
                    required
                    value={newUpdateText}
                    onChange={e => setNewUpdateText(e.target.value)}
                    rows={4}
                    className="w-full p-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <Button type="submit" disabled={submittingUpdate} className="w-full flex items-center justify-center space-x-2">
                    <Plus size={16} />
                    <span>Post Update</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Timeline Log */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Updates Timeline</CardTitle>
                <CardDescription>Chronological log of file progress.</CardDescription>
              </CardHeader>
              <CardContent className="relative pl-6 space-y-6 border-l-2 border-border ml-4">
                {updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 pl-2 -ml-6">No docket updates recorded yet.</p>
                ) : (
                  updates.map((up) => {
                    const isSystem = up.update_text.startsWith('System:');
                    return (
                      <div key={up.id} className="relative group">
                        {/* Timeline Node Point */}
                        <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-card ${
                          isSystem ? 'border-amber-500 bg-amber-500/20' : 'border-primary bg-primary'
                        }`} />
                        
                        <div className="space-y-1 pl-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                              {up.added_by}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] text-muted-foreground flex items-center">
                              <Clock size={10} className="mr-1" />
                              {new Date(up.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className={`text-sm leading-relaxed ${isSystem ? 'text-amber-600 dark:text-amber-400 font-semibold text-xs' : 'text-foreground'}`}>
                            {up.update_text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Documents Storage */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* File Upload card */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Record Document</CardTitle>
                <CardDescription>Upload motions, exhibits, pleadings, and files.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  {/* File Selector */}
                  <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors relative">
                    <input
                      type="file"
                      onChange={e => setDocFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="text-muted-foreground/80 h-10 w-10 mb-2" />
                    <p className="text-xs font-bold text-foreground text-center truncate max-w-full">
                      {docFile ? docFile.name : 'Click to select file'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, JPG up to 10MB</p>
                  </div>

                  {/* Category select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value as Document['document_category'])}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-medium"
                    >
                      <option value="Evidence">Evidence</option>
                      <option value="Pleading">Pleading</option>
                      <option value="Order">Order</option>
                      <option value="Misc">Misc</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={submittingDoc} className="w-full flex items-center justify-center space-x-2">
                    <Plus size={16} />
                    <span>Upload Document</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Document directory list */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Case File Storage</CardTitle>
                <CardDescription>All records categorized by classification type.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No documents uploaded to this case file.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-card/50 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center space-x-3.5">
                        <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                          <FileIcon size={20} />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-foreground leading-snug">{doc.file_name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0.5">
                              {doc.document_category}
                            </Badge>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] text-muted-foreground">
                              Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1.5">
                        {/* Preview button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                          title="Preview Document"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                          title="Download Document"
                          onClick={() => toast(`Downloading ${doc.file_name} (Mock)`, 'info')}
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Case Expenses & Disbursements */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Log expense form card */}
            <Card>
              <CardHeader className="text-left">
                <CardTitle>Log Case Expense</CardTitle>
                <CardDescription>Log court fees, photocopy costs, and travel disbursements.</CardDescription>
              </CardHeader>
              <CardContent className="text-left">
                <form onSubmit={handleLogExpense} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Expense Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g. Travel to County Supreme Court"
                      required
                      value={expTitle}
                      onChange={e => setExpTitle(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 45.00"
                        required
                        value={expAmount}
                        onChange={e => setExpAmount(e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        value={expCategory}
                        onChange={e => setExpCategory(e.target.value as Expense['category'])}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-semibold"
                      >
                        <option value="Travel">Travel</option>
                        <option value="Court Fees">Court Fees</option>
                        <option value="Clerk Fees">Clerk Fees</option>
                        <option value="Photocopies">Photocopies</option>
                        <option value="Miscellaneous">Misc</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={e => setExpDate(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono font-medium text-foreground"
                    />
                  </div>

                  <Button type="submit" disabled={submittingExpense} className="w-full flex items-center justify-center space-x-2">
                    <Plus size={16} />
                    <span>Log Expense</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Expenses List & Summary Table */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 text-left">
                <div>
                  <CardTitle>Disbursement Ledger</CardTitle>
                  <CardDescription>Ledger of case expenditures and billing statuses.</CardDescription>
                </div>
                
                {/* Mini Stat Cards */}
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-muted/60 border border-border rounded-lg text-center min-w-[70px]">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase">Unbilled</span>
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      ₹{expenses.filter(e => e.status === 'Unbilled').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-muted/60 border border-border rounded-lg text-center min-w-[70px]">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase">Billed</span>
                    <span className="text-xs font-extrabold text-foreground font-mono">
                      ₹{expenses.filter(e => e.status === 'Billed').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">No disbursements logged for this case file.</p>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-left">
                        {expenses.map(exp => (
                          <TableRow key={exp.id}>
                            <TableCell className="text-xs font-mono font-medium text-muted-foreground">
                              {exp.date}
                            </TableCell>
                            <TableCell className="font-bold text-foreground max-w-[200px] truncate" title={exp.title}>
                              {exp.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                {exp.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={exp.status === 'Billed' ? 'success' : 'warning'}>
                                {exp.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-black text-foreground font-mono text-xs">
                              ₹{exp.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={exp.status === 'Billed'}
                                onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Delete Expense"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 5: Case Billing & Ledger */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Log charge form card */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Log Fee / Charge</CardTitle>
                <CardDescription>Add litigation fees, retainer bills, or hearing appearance costs.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateInvoice} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Fee Title / Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g. Tomorrow Hearing Appearance"
                      required
                      value={invTitle}
                      onChange={e => setInvTitle(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Amount ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 750.00"
                      required
                      value={invAmount}
                      onChange={e => setInvAmount(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={invDueDate}
                      onChange={e => setInvDueDate(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium font-mono text-foreground"
                    />
                  </div>

                  {/* Unbilled Expenses select */}
                  {expenses.filter(e => e.status === 'Unbilled').length > 0 && (
                    <div className="space-y-2 border-t border-border/50 pt-4">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                        Include Unbilled Expenses:
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-border bg-background p-2 rounded-lg scrollbar-hide">
                        {expenses
                          .filter(e => e.status === 'Unbilled')
                          .map(exp => {
                            const isChecked = selectedExpenseIds.includes(exp.id);
                            return (
                              <label key={exp.id} className="flex items-start space-x-2.5 text-xs p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedExpenseIds(prev => prev.filter(id => id !== exp.id));
                                    } else {
                                      setSelectedExpenseIds(prev => [...prev, exp.id]);
                                    }
                                  }}
                                  className="mt-0.5 rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between font-bold text-foreground">
                                    <span className="truncate max-w-[120px]">{exp.title}</span>
                                    <span className="font-mono text-right font-black text-[10px]">₹{exp.amount.toFixed(2)}</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">{exp.category} • {exp.date}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Display Dynamic Invoice Sum Calculation */}
                  {selectedExpenseIds.length > 0 && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Base Fee:</span>
                        <span className="font-mono">₹{(parseFloat(invAmount) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-amber-600 dark:text-amber-400">
                        <span>Disbursements ({selectedExpenseIds.length} items):</span>
                        <span className="font-mono">+₹{expenses.filter(e => selectedExpenseIds.includes(e.id)).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-foreground border-t border-border pt-1.5 mt-1 text-sm">
                        <span>Total Invoiced Sum:</span>
                        <span className="font-mono text-primary font-bold">
                          ₹{((parseFloat(invAmount) || 0) + expenses.filter(e => selectedExpenseIds.includes(e.id)).reduce((sum, e) => sum + e.amount, 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={submittingInvoice} className="w-full flex items-center justify-center space-x-2">
                    <Plus size={16} />
                    <span>Create Invoice</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Case Financial Registry</CardTitle>
                <CardDescription>Track payments and pending invoice sheets for this matter.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No fees or invoices registered for this case.</p>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-card/50 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center space-x-3.5">
                        <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                          <Receipt size={20} />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-foreground leading-snug">{inv.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              {inv.invoice_number}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Unpaid' ? 'warning' : 'error'}>
                              {inv.status}
                            </Badge>
                            {inv.due_date && (
                              <>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="text-[10px] text-muted-foreground">Due: {inv.due_date}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-black text-sm text-foreground">₹{Number(inv.amount).toFixed(2)}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-primary hover:bg-primary/5"
                            title="Generate Invoice Receipt"
                            onClick={() => setActiveInvoice(inv)}
                          >
                            <Eye size={15} />
                          </Button>
                          
                          {inv.status !== 'Paid' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5 px-2"
                              onClick={() => handleUpdateInvoiceStatus(inv.id, 'Paid')}
                            >
                              Pay
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 text-xs text-muted-foreground hover:bg-muted px-2"
                              onClick={() => handleUpdateInvoiceStatus(inv.id, 'Unpaid')}
                            >
                              Unpay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Evidentiary Lightbox Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Evidence Previewer: ${previewDoc.file_name}`}
          footer={
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center space-x-1.5"
              >
                <Printer size={14} />
                <span>Print</span>
              </Button>
              <div className="flex space-x-2">
                {previewDoc.file_url && previewDoc.file_url !== '#' ? (
                  <a
                    href={previewDoc.file_url}
                    download={previewDoc.file_name}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted/50 transition-colors shadow-sm gap-1.5 bg-background text-foreground"
                    onClick={() => setPreviewDoc(null)}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast(`Downloading ${previewDoc.file_name} (Mock)`, 'info');
                      setPreviewDoc(null);
                    }}
                    className="flex items-center space-x-1.5"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          {previewDoc.file_url && previewDoc.file_url !== '#' ? (
            /* Render Live Document Viewers */
            <div className="space-y-4">
              {/* Document Metadata header */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-2 text-left">
                <div>
                  <span className="font-semibold text-foreground">File Classification:</span> {previewDoc.document_category}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Uploaded:</span> {new Date(previewDoc.uploaded_at).toLocaleString()}
                </div>
              </div>

              {/* Conditional render based on mimetype or extension */}
              {previewDoc.file_url.startsWith('data:image/') || previewDoc.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg|webp)$/) ? (
                <div className="flex items-center justify-center p-2 bg-muted/20 border border-border/50 rounded-lg">
                  <img 
                    src={previewDoc.file_url} 
                    alt={previewDoc.file_name} 
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm" 
                  />
                </div>
              ) : previewDoc.file_url.startsWith('data:application/pdf') || previewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-[60vh] rounded-lg overflow-hidden border bg-muted/20">
                  <object 
                    data={previewDoc.file_url} 
                    type="application/pdf" 
                    className="w-full h-full"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                      <FileText size={48} className="text-muted-foreground animate-pulse" />
                      <div>
                        <p className="text-sm font-bold text-foreground">PDF Previewer not supported</p>
                        <p className="text-xs text-muted-foreground mt-1">Please download the file to view its content.</p>
                      </div>
                      <a 
                        href={previewDoc.file_url} 
                        download={previewDoc.file_name}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                      >
                        Download PDF File
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg text-center space-y-4 bg-muted/20">
                  <FileText size={48} className="text-primary" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{previewDoc.file_name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct browser preview is not supported for this file classification.
                    </p>
                  </div>
                  <a 
                    href={previewDoc.file_url} 
                    download={previewDoc.file_name}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Styled Document Simulator (Mock Fallback) */
            <div className="border border-border/80 p-6 rounded-lg bg-white text-slate-800 font-serif leading-relaxed shadow-inner max-h-[50vh] overflow-y-auto scrollbar-hide text-left dark:bg-slate-900 dark:text-slate-200">
              {/* Retro Letterhead Header */}
              <div className="text-center border-b-2 border-slate-900 dark:border-slate-200 pb-4 mb-6">
                <div className="flex items-center justify-center space-x-2 mb-1.5 text-primary">
                  <Scale size={28} />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wider">Advocate Court Filings Portal</h2>
                <p className="text-[10px] font-sans font-semibold tracking-widest text-slate-500 uppercase mt-0.5">
                  Official Case Docket Exhibits Registry
                </p>
              </div>

              {/* Metadata Section */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-6 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-border/50">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">CASE MATTER</span>
                  <span className="font-bold">{kase.case_title}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">CASE DOCKET NUMBER</span>
                  <span className="font-mono font-bold uppercase">{kase.case_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">DOCUMENT CLASSIFICATION</span>
                  <span className="font-semibold">{previewDoc.document_category} File</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">RECORDED AT</span>
                  <span>{new Date(previewDoc.uploaded_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Document Content Simulation */}
              <div className="space-y-4 text-xs tracking-wide">
                <span className="block font-sans font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                  EXHIBIT MEMORANDUM STATEMENTS
                </span>
                
                {previewDoc.document_category === 'Pleading' ? (
                  <>
                    <p className="font-bold text-center underline my-3">MOTION IN THE COURT OF JURISDICTION</p>
                    <p>
                      Now comes the representative counsel of record on behalf of the client entity, and respectably moves this Honorable Court for relief under statutory civil procedure rules.
                    </p>
                    <p>
                      WHEREFORE, counsel requests that this Honorable Court enter order of dismissal, scheduling directives, or appropriate summaries and relief as deemed just.
                    </p>
                  </>
                ) : previewDoc.document_category === 'Evidence' ? (
                  <>
                    <p className="font-bold text-center underline my-3">RECORD OF CERTIFIED EVIDENTIARY DEPOSITIONS</p>
                    <p>
                      Counsel has attached records of certified transcripts, spreadsheet summaries, or visual exhibits tagged under indexing rules.
                    </p>
                    <p className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 italic py-1 bg-slate-50 dark:bg-slate-800">
                      "The undersigned witness deposes and states under penalties of perjury that corporate ledger discrepancies were verified on audit review dates."
                    </p>
                  </>
                ) : previewDoc.document_category === 'Order' ? (
                  <>
                    <p className="font-bold text-center underline my-3">MINUTE ORDER OF COURT APPEARANCE</p>
                    <p>
                      This matter coming before the Court on motion of counsel, due notice having been served, and the Court being fully advised in the premises:
                    </p>
                    <p className="font-semibold text-center my-4 uppercase tracking-wide">
                      IT IS HEREBY ORDERED THAT THE HEARING IS SCHEDULED TO DATE SPECIFIED.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      General legal brief, exhibits records, and memorandum notes. Please download the original file index `({previewDoc.file_name})` to check attachments, stamps, or digital signatures.
                    </p>
                  </>
                )}
              </div>

              {/* Signature Footer */}
              <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-6 mt-8 font-sans text-[10px]">
                <div>
                  <p className="text-slate-400 uppercase">SUBMITTING ADVOCATE</p>
                  <p className="font-bold">{user?.email || 'advocate@example.com'}</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-b border-slate-500 w-24 h-6 mb-1" />
                  <p className="text-slate-400 uppercase">COUNSEL SIGNATURE</p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Invoice Generator Modal */}
      {activeInvoice && (
        <Modal
          isOpen={!!activeInvoice}
          onClose={() => setActiveInvoice(null)}
          title={`Invoice Receipt: ${activeInvoice.invoice_number}`}
          footer={
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast('Printing invoice statement...', 'info')}
                className="flex items-center space-x-1.5"
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast(`Downloading ${activeInvoice.invoice_number}.pdf (Mock)`, 'info');
                    setActiveInvoice(null);
                  }}
                  className="flex items-center space-x-1.5"
                >
                  <Download size={14} />
                  <span>Download</span>
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          {/* Printable Styled Law Firm Invoice layout */}
          <div className="border border-border/80 p-8 rounded-lg bg-white text-slate-800 font-sans leading-relaxed shadow-inner max-h-[50vh] overflow-y-auto scrollbar-hide text-left dark:bg-slate-900 dark:text-slate-200">
            {/* Invoice Header (Letterhead) */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-slate-200 pb-6 mb-6">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-primary">
                  <Scale size={28} />
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Apex Legal Partners</span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Advocates & Counselors at Law</p>
                <p className="text-[10px] text-slate-400">100 Legal Plaza, Suite 400 • Chicago, IL 60601 • contact@apexlegal.com</p>
              </div>
              <div className="text-right space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-400 dark:text-slate-600 uppercase">INVOICE</h2>
                <p className="text-xs font-mono font-bold">{activeInvoice.invoice_number}</p>
                <div className="inline-block mt-2">
                  <Badge
                    variant={
                      activeInvoice.status === 'Paid'
                        ? 'success'
                        : activeInvoice.status === 'Unpaid'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {activeInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Client & Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide mb-1.5">BILL TO:</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{kase.client?.name}</p>
                {kase.client?.phone && <p className="text-slate-500 mt-0.5">{kase.client?.phone}</p>}
                {kase.client?.email && <p className="text-slate-500 mt-0.5">{kase.client?.email}</p>}
                {kase.client?.address && <p className="text-slate-500 mt-1 max-w-xs">{kase.client?.address}</p>}
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">CASE MATTER</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{kase.case_title}</p>
                  <p className="text-slate-500 font-mono text-[10px] uppercase mt-0.5">({kase.case_number || 'No Case #'})</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">INVOICE DATE</span>
                    <p className="font-semibold">{new Date(activeInvoice.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">DUE DATE</span>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">{activeInvoice.due_date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-xs text-left mb-8 border-collapse">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-700 font-bold text-slate-500">
                  <th className="py-2.5">Item Description / Legal Matter Fee</th>
                  <th className="py-2.5 text-right w-24">Unit Qty</th>
                  <th className="py-2.5 text-right w-32">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{activeInvoice.title} (Base Fee)</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Counsel representation for scheduled appearance / litigation support.</p>
                  </td>
                  <td className="py-3.5 text-right text-slate-500">1.0</td>
                  <td className="py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹{(Number(activeInvoice.amount) - expenses.filter(e => e.invoice_id === activeInvoice.id).reduce((sum, e) => sum + e.amount, 0)).toFixed(2)}
                  </td>
                </tr>
                {expenses
                  .filter(e => e.invoice_id === activeInvoice.id)
                  .map(exp => (
                    <tr key={exp.id}>
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{exp.title}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">{exp.category} Disbursement ({exp.date})</p>
                      </td>
                      <td className="py-3.5 text-right text-slate-500">1.0</td>
                      <td className="py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">₹{exp.amount.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Total Section */}
            <div className="flex justify-end border-t border-slate-300 dark:border-slate-700 pt-4 mb-8">
              <div className="w-64 text-xs space-y-2">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal:</span>
                  <span>₹{Number(activeInvoice.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Sales Tax (0%):</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-base font-black border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-900 dark:text-slate-100">
                  <span>Total Amount Due:</span>
                  <span>₹{Number(activeInvoice.amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Legal Notice / Footer */}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6 space-y-1">
              <p className="font-semibold uppercase tracking-wider">Thank You For Your Representation Business</p>
              <p>All invoice payments are due in full within 30 days of the invoice date. Late fees of 1.5% per month apply thereafter.</p>
              <p className="font-mono text-[9px] mt-2">DocID: {activeInvoice.id}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

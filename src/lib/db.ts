import { supabase, isSupabaseConfigured } from './supabase';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface Case {
  id: string;
  client_id: string;
  case_title: string;
  court_name: string;
  case_number: string;
  status: 'Active' | 'Completed' | 'Delayed' | 'Cancelled' | 'Hold';
  next_hearing_date: string;
  description: string;
  created_at: string;
  client?: Client; // Joined client object
}

export interface CaseUpdate {
  id: string;
  case_id: string;
  update_text: string;
  added_by: string;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  document_category: 'Evidence' | 'Pleading' | 'Order' | 'Misc';
  uploaded_at: string;
}

export interface Invoice {
  id: string;
  case_id: string;
  client_id: string;
  invoice_number: string;
  title: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  due_date: string;
  created_at: string;
  case?: Case;
  client?: Client;
}

export interface Expense {
  id: string;
  case_id: string;
  client_id: string;
  invoice_id?: string;
  title: string;
  amount: number;
  category: 'Travel' | 'Court Fees' | 'Clerk Fees' | 'Photocopies' | 'Miscellaneous';
  date: string;
  status: 'Billed' | 'Unbilled';
  created_at: string;
}

// Generate dynamic dates for premium mock data
const getRelativeDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1-uuid',
    name: 'Tata Consultancy Services',
    phone: '+91 22 6778 9999',
    email: 'legal@tcs.com',
    address: 'TCS House, Raveline Street, Fort, Mumbai, Maharashtra 400001',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'c2-uuid',
    name: 'Reliance Industries Ltd',
    phone: '+91 22 2278 5000',
    email: 'compliance@ril.com',
    address: 'Maker Chambers IV, Nariman Point, Mumbai, Maharashtra 400021',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'c3-uuid',
    name: 'State of Kerala Legal Cell',
    phone: '+91 471 232 4433',
    email: 'advocate.general@kerala.gov.in',
    address: 'Advocate General Office, Ernakulam, Kochi, Kerala 682031',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  }
];

const MOCK_CASES: Case[] = [
  {
    id: 'case1-uuid',
    client_id: 'c1-uuid',
    case_title: 'Kesavananda Bharati v. State of Kerala',
    court_name: 'Supreme Court of India',
    case_number: 'WP (Civil) 135/1970',
    status: 'Active',
    next_hearing_date: getRelativeDate(1), // Tomorrow!
    description: 'Landmark constitutional case regarding the power of Parliament to amend the Constitution. Reviewing the Basic Structure Doctrine.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'case2-uuid',
    client_id: 'c2-uuid',
    case_title: 'Maneka Gandhi v. Union of India',
    court_name: 'Supreme Court of India',
    case_number: 'WP (Civil) 112/1977',
    status: 'Delayed',
    next_hearing_date: getRelativeDate(2), // Inside 48 hours alert!
    description: 'Challenge to personal liberty and arbitrary administrative action regarding passport confiscation under Article 21.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'case3-uuid',
    client_id: 'c3-uuid',
    case_title: 'Shayara Bano v. Union of India (Triple Talaq Case)',
    court_name: 'Supreme Court of India',
    case_number: 'WP (Civil) 118/2016',
    status: 'Completed',
    next_hearing_date: getRelativeDate(-5),
    description: 'Constitutional challenge regarding validity of Talaq-e-Biddat (Triple Talaq). Disposed following final judgment declaring it unconstitutional.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'case4-uuid',
    client_id: 'c1-uuid',
    case_title: 'Navtej Singh Johar v. Union of India',
    court_name: 'Supreme Court of India',
    case_number: 'WP (Criminal) 76/2016',
    status: 'Cancelled',
    next_hearing_date: '',
    description: 'Petition challenging Section 377 of the Indian Penal Code. Closed following historical decriminalization of consensual relationships.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

const MOCK_UPDATES: CaseUpdate[] = [
  {
    id: 'up1',
    case_id: 'case1-uuid',
    update_text: 'Filed rejoinder affidavit in response to Kerala State Government counter-affidavit.',
    added_by: 'advocate@example.com',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'up2',
    case_id: 'case1-uuid',
    update_text: 'Compiled written arguments regarding the limitations of amending power under Article 368.',
    added_by: 'advocate@example.com',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'up3',
    case_id: 'case2-uuid',
    update_text: 'Constitutional bench hearing adjourned due to senior counsel schedule overlap.',
    added_by: 'advocate@example.com',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  }
];

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc1',
    case_id: 'case1-uuid',
    file_name: 'Complaint_Filed_Signed.pdf',
    file_url: '#',
    document_category: 'Pleading',
    uploaded_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'doc2',
    case_id: 'case1-uuid',
    file_name: 'Audit_Spreadsheet_Exhibit_A.xlsx',
    file_url: '#',
    document_category: 'Evidence',
    uploaded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'doc3',
    case_id: 'case2-uuid',
    file_name: 'Arrest_Record_Redacted.pdf',
    file_url: '#',
    document_category: 'Evidence',
    uploaded_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    case_id: 'case1-uuid',
    client_id: 'c1-uuid',
    invoice_number: 'INV-2026-001',
    title: 'Retainer Fee - Kesavananda Constitutional Briefs Support',
    amount: 50000.00,
    status: 'Paid',
    due_date: getRelativeDate(-10),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'inv2',
    case_id: 'case1-uuid',
    client_id: 'c1-uuid',
    invoice_number: 'INV-2026-002',
    title: 'Senior Advocate Counsel Consultation Fees',
    amount: 15000.00,
    status: 'Unpaid',
    due_date: getRelativeDate(5),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'inv3',
    case_id: 'case2-uuid',
    client_id: 'c2-uuid',
    invoice_number: 'INV-2026-003',
    title: 'Court Appearance - Pleading Writ Representation',
    amount: 25000.00,
    status: 'Unpaid',
    due_date: getRelativeDate(-2),
    created_at: new Date(Date.now() - 6 * 86400000).toISOString()
  }
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp1',
    case_id: 'case1-uuid',
    client_id: 'c1-uuid',
    title: 'Filing fees for constitutional writ petition',
    amount: 3500.00,
    category: 'Court Fees',
    date: getRelativeDate(-8),
    status: 'Unbilled',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: 'exp2',
    case_id: 'case1-uuid',
    client_id: 'c1-uuid',
    title: 'Travel reimbursement - New Delhi Supreme Court',
    amount: 4500.00,
    category: 'Travel',
    date: getRelativeDate(-4),
    status: 'Unbilled',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'exp3',
    case_id: 'case2-uuid',
    client_id: 'c2-uuid',
    title: 'Certified copy translation charges',
    amount: 1200.00,
    category: 'Photocopies',
    date: getRelativeDate(-5),
    status: 'Unbilled',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

// Helper to seed localStorage mock data
const initLocalStorage = () => {
  const needsSeeding = !localStorage.getItem('adv_seeded_indian_v3');
  if (needsSeeding) {
    localStorage.setItem('adv_clients', JSON.stringify(MOCK_CLIENTS));
    localStorage.setItem('adv_cases', JSON.stringify(MOCK_CASES));
    localStorage.setItem('adv_updates', JSON.stringify(MOCK_UPDATES));
    localStorage.setItem('adv_documents', JSON.stringify(MOCK_DOCUMENTS));
    localStorage.setItem('adv_invoices', JSON.stringify(MOCK_INVOICES));
    localStorage.setItem('adv_expenses', JSON.stringify(MOCK_EXPENSES));
    localStorage.setItem('adv_seeded_indian_v3', 'true');
  }
};

if (!isSupabaseConfigured) {
  initLocalStorage();
}

export const db = {
  // Clients Actions
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorage();
      return JSON.parse(localStorage.getItem('adv_clients') || '[]');
    }
  },

  async createClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...client }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const clients = JSON.parse(localStorage.getItem('adv_clients') || '[]');
      const newClient: Client = {
        ...client,
        id: 'client-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      clients.push(newClient);
      localStorage.setItem('adv_clients', JSON.stringify(clients));
      return newClient;
    }
  },

  async deleteClient(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const clients = JSON.parse(localStorage.getItem('adv_clients') || '[]');
      const filteredClients = clients.filter((c: Client) => c.id !== id);
      localStorage.setItem('adv_clients', JSON.stringify(filteredClients));

      // Cascade delete client's cases
      const cases = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const filteredCases = cases.filter((c: Case) => c.client_id !== id);
      localStorage.setItem('adv_cases', JSON.stringify(filteredCases));

      // Cascade delete invoices associated with this client
      const invoices = JSON.parse(localStorage.getItem('adv_invoices') || '[]');
      const filteredInvoices = invoices.filter((inv: Invoice) => inv.client_id !== id);
      localStorage.setItem('adv_invoices', JSON.stringify(filteredInvoices));

      // Cascade delete expenses associated with this client
      const expenses = JSON.parse(localStorage.getItem('adv_expenses') || '[]');
      const filteredExpenses = expenses.filter((exp: Expense) => exp.client_id !== id);
      localStorage.setItem('adv_expenses', JSON.stringify(filteredExpenses));
    }
  },

  // Cases Actions
  async getCases(): Promise<Case[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cases')
        .select('*, clients (*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        client: item.clients // Rename joined clients object
      }));
    } else {
      initLocalStorage();
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const clients: Client[] = JSON.parse(localStorage.getItem('adv_clients') || '[]');
      return cases.map(c => ({
        ...c,
        client: clients.find(cl => cl.id === c.client_id)
      }));
    }
  },

  async getCaseById(id: string): Promise<Case | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cases')
        .select('*, clients (*)')
        .eq('id', id)
        .single();
      if (error) return null;
      return {
        ...data,
        client: data.clients
      };
    } else {
      initLocalStorage();
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const clients: Client[] = JSON.parse(localStorage.getItem('adv_clients') || '[]');
      const c = cases.find(item => item.id === id);
      if (!c) return null;
      return {
        ...c,
        client: clients.find(cl => cl.id === c.client_id)
      };
    }
  },

  async createCase(kase: Omit<Case, 'id' | 'created_at'>): Promise<Case> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cases')
        .insert([{ ...kase }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const cases = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const newCase: Case = {
        ...kase,
        id: 'case-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      cases.push(newCase);
      localStorage.setItem('adv_cases', JSON.stringify(cases));
      return newCase;
    }
  },

  async updateCaseStatus(id: string, status: Case['status']): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('cases')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } else {
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const updated = cases.map(c => c.id === id ? { ...c, status } : c);
      localStorage.setItem('adv_cases', JSON.stringify(updated));
    }
  },

  async updateCaseHearingDate(id: string, next_hearing_date: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('cases')
        .update({ next_hearing_date })
        .eq('id', id);
      if (error) throw error;
    } else {
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const updated = cases.map(c => c.id === id ? { ...c, next_hearing_date } : c);
      localStorage.setItem('adv_cases', JSON.stringify(updated));
    }
  },

  async updateCaseDescription(id: string, description: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('cases')
        .update({ description })
        .eq('id', id);
      if (error) throw error;
    } else {
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const updated = cases.map(c => c.id === id ? { ...c, description } : c);
      localStorage.setItem('adv_cases', JSON.stringify(updated));
    }
  },

  async deleteCase(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const cases = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const filteredCases = cases.filter((c: Case) => c.id !== id);
      localStorage.setItem('adv_cases', JSON.stringify(filteredCases));

      // Cascade delete related updates
      const updates = JSON.parse(localStorage.getItem('adv_updates') || '[]');
      const filteredUpdates = updates.filter((u: CaseUpdate) => u.case_id !== id);
      localStorage.setItem('adv_updates', JSON.stringify(filteredUpdates));

      // Cascade delete related documents
      const docs = JSON.parse(localStorage.getItem('adv_documents') || '[]');
      const filteredDocs = docs.filter((d: Document) => d.case_id !== id);
      localStorage.setItem('adv_documents', JSON.stringify(filteredDocs));

      // Cascade delete related invoices
      const invoices = JSON.parse(localStorage.getItem('adv_invoices') || '[]');
      const filteredInvoices = invoices.filter((inv: Invoice) => inv.case_id !== id);
      localStorage.setItem('adv_invoices', JSON.stringify(filteredInvoices));

      // Cascade delete related expenses
      const expenses = JSON.parse(localStorage.getItem('adv_expenses') || '[]');
      const filteredExpenses = expenses.filter((exp: Expense) => exp.case_id !== id);
      localStorage.setItem('adv_expenses', JSON.stringify(filteredExpenses));
    }
  },

  // Updates Actions
  async getUpdatesByCaseId(caseId: string): Promise<CaseUpdate[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('case_updates')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorage();
      const updates: CaseUpdate[] = JSON.parse(localStorage.getItem('adv_updates') || '[]');
      return updates
        .filter(u => u.case_id === caseId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createUpdate(update: Omit<CaseUpdate, 'id' | 'created_at'>): Promise<CaseUpdate> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('case_updates')
        .insert([{ ...update }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const updates = JSON.parse(localStorage.getItem('adv_updates') || '[]');
      const newUpdate: CaseUpdate = {
        ...update,
        id: 'update-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      updates.push(newUpdate);
      localStorage.setItem('adv_updates', JSON.stringify(updates));
      return newUpdate;
    }
  },

  // Documents Actions
  async getDocumentsByCaseId(caseId: string): Promise<Document[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorage();
      const docs: Document[] = JSON.parse(localStorage.getItem('adv_documents') || '[]');
      return docs
        .filter(d => d.case_id === caseId)
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    }
  },

  async uploadDocument(doc: Omit<Document, 'id' | 'uploaded_at'>): Promise<Document> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .insert([{ ...doc }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const docs = JSON.parse(localStorage.getItem('adv_documents') || '[]');
      const newDoc: Document = {
        ...doc,
        id: 'doc-' + Math.random().toString(36).substr(2, 9),
        uploaded_at: new Date().toISOString(),
      };
      docs.push(newDoc);
      localStorage.setItem('adv_documents', JSON.stringify(docs));
      return newDoc;
    }
  },

  // Invoices Actions
  async getInvoices(): Promise<Invoice[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, cases (*), clients (*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        case: item.cases,
        client: item.clients
      }));
    } else {
      initLocalStorage();
      const invoices: Invoice[] = JSON.parse(localStorage.getItem('adv_invoices') || '[]');
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const clients: Client[] = JSON.parse(localStorage.getItem('adv_clients') || '[]');
      return invoices.map(inv => ({
        ...inv,
        case: cases.find(c => c.id === inv.case_id),
        client: clients.find(cl => cl.id === inv.client_id)
      }));
    }
  },

  async getInvoicesByCaseId(caseId: string): Promise<Invoice[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, cases (*), clients (*)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        case: item.cases,
        client: item.clients
      }));
    } else {
      initLocalStorage();
      const invoices: Invoice[] = JSON.parse(localStorage.getItem('adv_invoices') || '[]');
      const cases: Case[] = JSON.parse(localStorage.getItem('adv_cases') || '[]');
      const clients: Client[] = JSON.parse(localStorage.getItem('adv_clients') || '[]');
      return invoices
        .filter(inv => inv.case_id === caseId)
        .map(inv => ({
          ...inv,
          case: cases.find(c => c.id === inv.case_id),
          client: clients.find(cl => cl.id === inv.client_id)
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>): Promise<Invoice> {
    const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...invoice, invoice_number: invNumber }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const invoices = JSON.parse(localStorage.getItem('adv_invoices') || '[]');
      const newInvoice: Invoice = {
        ...invoice,
        id: 'invoice-' + Math.random().toString(36).substr(2, 9),
        invoice_number: invNumber,
        created_at: new Date().toISOString(),
      };
      invoices.push(newInvoice);
      localStorage.setItem('adv_invoices', JSON.stringify(invoices));
      return newInvoice;
    }
  },

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } else {
      const invoices: Invoice[] = JSON.parse(localStorage.getItem('adv_invoices') || '[]');
      const updated = invoices.map(inv => inv.id === id ? { ...inv, status } : inv);
      localStorage.setItem('adv_invoices', JSON.stringify(updated));
    }
  },

  // Expenses / Disbursements Actions
  async getExpensesByCaseId(caseId: string): Promise<Expense[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('case_id', caseId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorage();
      const expenses: Expense[] = JSON.parse(localStorage.getItem('adv_expenses') || '[]');
      return expenses
        .filter(exp => exp.case_id === caseId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  },

  async createExpense(expense: Omit<Expense, 'id' | 'status' | 'created_at'>): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, status: 'Unbilled' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const expenses = JSON.parse(localStorage.getItem('adv_expenses') || '[]');
      const newExpense: Expense = {
        ...expense,
        id: 'expense-' + Math.random().toString(36).substr(2, 9),
        status: 'Unbilled',
        created_at: new Date().toISOString()
      };
      expenses.push(newExpense);
      localStorage.setItem('adv_expenses', JSON.stringify(expenses));
      return newExpense;
    }
  },

  async deleteExpense(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('adv_expenses') || '[]');
      const filtered = expenses.filter(exp => exp.id !== id);
      localStorage.setItem('adv_expenses', JSON.stringify(filtered));
    }
  },

  async markExpensesAsBilled(expenseIds: string[], invoiceId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'Billed', invoice_id: invoiceId })
        .in('id', expenseIds);
      if (error) throw error;
    } else {
      const expenses: Expense[] = JSON.parse(localStorage.getItem('adv_expenses') || '[]');
      const updated = expenses.map(exp => 
        expenseIds.includes(exp.id) ? { ...exp, status: 'Billed' as const, invoice_id: invoiceId } : exp
      );
      localStorage.setItem('adv_expenses', JSON.stringify(updated));
    }
  }
};

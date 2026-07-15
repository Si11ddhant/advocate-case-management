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
  status: 'Active' | 'Completed' | 'Delayed' | 'Cancelled';
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

// Generate dynamic dates for premium mock data
const getRelativeDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1-uuid',
    name: 'Harvey Specter',
    phone: '+1 (555) 019-2831',
    email: 'harvey@specterlaw.com',
    address: '601 Lexington Ave, New York, NY 10022',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'c2-uuid',
    name: 'Louis Litt',
    phone: '+1 (555) 014-9844',
    email: 'louis@littcorp.com',
    address: '885 Third Avenue, New York, NY 10022',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'c3-uuid',
    name: 'Jessica Pearson',
    phone: '+1 (555) 012-4433',
    email: 'jessica@pearson-co.com',
    address: 'Chamberlain Square, Chicago, IL 60601',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  }
];

const MOCK_CASES: Case[] = [
  {
    id: 'case1-uuid',
    client_id: 'c1-uuid',
    case_title: 'Pearson Specter vs. Hardman Corp',
    court_name: 'Southern District Court of New York',
    case_number: 'SDNY-2026-CV-8891',
    status: 'Active',
    next_hearing_date: getRelativeDate(1), // Tomorrow!
    description: 'Corporate embezzlement and contract breach case. The defense is seeking dismissal based on standing claims.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'case2-uuid',
    client_id: 'c2-uuid',
    case_title: 'State of New York vs. James Cooper',
    court_name: 'New York Supreme Court',
    case_number: 'NYS-2026-CR-0412',
    status: 'Delayed',
    next_hearing_date: getRelativeDate(2), // Inside 48 hours alert!
    description: 'Defense representation for financial misdemeanor charges. Hearing delayed due to prosecutorial document request delays.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'case3-uuid',
    client_id: 'c3-uuid',
    case_title: 'Acme Corp Merger Antitrust Dispute',
    court_name: 'Federal Trade Commission Appeals Court',
    case_number: 'FTC-2025-ANT-1090',
    status: 'Completed',
    next_hearing_date: getRelativeDate(-5),
    description: 'Represented Acme Corp against antitrust violation complaints. Achieved final approval with structural remedies.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'case4-uuid',
    client_id: 'c1-uuid',
    case_title: 'Hedge Fund Class Action Settlement',
    court_name: 'Delaware Court of Chancery',
    case_number: 'DCC-2026-CA-7734',
    status: 'Cancelled',
    next_hearing_date: '',
    description: 'Shareholder class action relating to portfolio management fees. Settled out of court, leading to case dismissal.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

const MOCK_UPDATES: CaseUpdate[] = [
  {
    id: 'up1',
    case_id: 'case1-uuid',
    update_text: 'Filed response to defendant motion for summary dismissal.',
    added_by: 'advocate@example.com',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'up2',
    case_id: 'case1-uuid',
    update_text: 'Obtained deposition affidavits from primary audit executives.',
    added_by: 'advocate@example.com',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'up3',
    case_id: 'case2-uuid',
    update_text: 'Hearing rescheduled to 48 hours from now due to witness unavailability.',
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
    title: 'Retainer Fee - Hardman Litigation Support',
    amount: 5000.00,
    status: 'Paid',
    due_date: getRelativeDate(-10),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'inv2',
    case_id: 'case1-uuid',
    client_id: 'c1-uuid',
    invoice_number: 'INV-2026-002',
    title: 'Evidentiary Exhibit Deposition Fees',
    amount: 1250.00,
    status: 'Unpaid',
    due_date: getRelativeDate(5),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'inv3',
    case_id: 'case2-uuid',
    client_id: 'c2-uuid',
    invoice_number: 'INV-2026-003',
    title: 'Court Appearance - Pleading Motion Representation',
    amount: 850.00,
    status: 'Unpaid',
    due_date: getRelativeDate(-2),
    created_at: new Date(Date.now() - 6 * 86400000).toISOString()
  }
];

// Helper to seed localStorage mock data
const initLocalStorage = () => {
  if (!localStorage.getItem('adv_clients')) {
    localStorage.setItem('adv_clients', JSON.stringify(MOCK_CLIENTS));
  }
  if (!localStorage.getItem('adv_cases')) {
    localStorage.setItem('adv_cases', JSON.stringify(MOCK_CASES));
  }
  if (!localStorage.getItem('adv_updates')) {
    localStorage.setItem('adv_updates', JSON.stringify(MOCK_UPDATES));
  }
  if (!localStorage.getItem('adv_documents')) {
    localStorage.setItem('adv_documents', JSON.stringify(MOCK_DOCUMENTS));
  }
  if (!localStorage.getItem('adv_invoices')) {
    localStorage.setItem('adv_invoices', JSON.stringify(MOCK_INVOICES));
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
  }
};

-- Database Schema for Advocate Case Management ERP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Cases Table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    case_title TEXT NOT NULL,
    court_name TEXT,
    case_number TEXT,
    status TEXT CHECK (status IN ('Active', 'Completed', 'Delayed', 'Cancelled')) DEFAULT 'Active' NOT NULL,
    next_hearing_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for quick lookups on hearings
CREATE INDEX IF NOT EXISTS idx_cases_next_hearing ON cases(next_hearing_date);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);

-- 3. Case Updates (Timeline) Table
CREATE TABLE IF NOT EXISTS case_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    update_text TEXT NOT NULL,
    added_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_updates_case ON case_updates(case_id);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    document_category TEXT CHECK (document_category IN ('Evidence', 'Pleading', 'Order', 'Misc')) DEFAULT 'Misc' NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT CHECK (status IN ('Paid', 'Unpaid', 'Overdue')) DEFAULT 'Unpaid' NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_case ON invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- Row Level Security (RLS) Enablement (Optional but recommended for Production)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

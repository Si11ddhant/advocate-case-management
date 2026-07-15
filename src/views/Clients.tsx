import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import type { Client } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';
import { Users, UserPlus, Phone, Mail, MapPin, Search, FolderPlus } from 'lucide-react';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Search filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Client Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toggle for initial case
  const [addCaseNow, setAddCaseNow] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [caseDescription, setCaseDescription] = useState('');

  // Inline "Create Case" Form State
  const [selectedClientForCase, setSelectedClientForCase] = useState<Client | null>(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cCourt, setCCourt] = useState('');
  const [cNumber, setCNumber] = useState('');
  const [cHearingDate, setCHearingDate] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [submittingCase, setSubmittingCase] = useState(false);

  const fetchClients = async () => {
    try {
      const data = await db.getClients();
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
      toast('Failed to load clients list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setAddCaseNow(false);
    setCaseTitle('');
    setCourtName('');
    setCaseNumber('');
    setNextHearingDate('');
    setCaseDescription('');
    setIsModalOpen(true);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Client Name is required', 'warning');
      return;
    }
    if (addCaseNow && !caseTitle.trim()) {
      toast('Case Title is required when adding case details', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const newClient = await db.createClient({ name, phone, email, address });
      
      if (addCaseNow) {
        await db.createCase({
          client_id: newClient.id,
          case_title: caseTitle,
          court_name: courtName,
          case_number: caseNumber,
          status: 'Active',
          next_hearing_date: nextHearingDate,
          description: caseDescription
        });
        toast(`Client "${name}" and Case "${caseTitle}" registered successfully!`, 'success');
      } else {
        toast(`Client "${name}" registered successfully!`, 'success');
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      toast(err.message || 'Failed to register client', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCaseModal = (client: Client) => {
    setSelectedClientForCase(client);
    setCTitle('');
    setCCourt('');
    setCNumber('');
    setCHearingDate('');
    setCDescription('');
    setIsCaseModalOpen(true);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForCase) return;
    if (!cTitle.trim()) {
      toast('Case Title is required', 'warning');
      return;
    }
    setSubmittingCase(true);
    try {
      await db.createCase({
        client_id: selectedClientForCase.id,
        case_title: cTitle,
        court_name: cCourt,
        case_number: cNumber,
        status: 'Active',
        next_hearing_date: cHearingDate,
        description: cDescription
      });
      toast(`Case "${cTitle}" created for client "${selectedClientForCase.name}"!`, 'success');
      setIsCaseModalOpen(false);
      setSelectedClientForCase(null);
    } catch (err: any) {
      toast(err.message || 'Failed to create case', 'error');
    } finally {
      setSubmittingCase(false);
    }
  };

  // Filter logic
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Clients Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage corporate entities and individual client representations.</p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center space-x-2">
          <UserPlus size={16} />
          <span>New Client</span>
        </Button>
      </div>

      {/* Database Actions Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <div>
            <CardTitle>Client Registry</CardTitle>
            <CardDescription>A list of all clients registered in the case docket.</CardDescription>
          </div>
          
          {/* Search Inputs */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Users className="mx-auto text-muted-foreground/60 h-10 w-10 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No clients found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Add a new client to begin establishing dockets.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Office/Residence Address</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-foreground">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground flex items-center space-x-1.5">
                      {c.email ? (
                        <>
                          <Mail size={14} className="text-muted-foreground/60" />
                          <span>{c.email}</span>
                        </>
                      ) : (
                        <span className="italic text-muted-foreground/40 text-xs">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.phone ? (
                        <div className="flex items-center space-x-1.5">
                          <Phone size={14} className="text-muted-foreground/60" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/40 text-xs">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {c.address ? (
                        <div className="flex items-center space-x-1.5 truncate">
                          <MapPin size={14} className="text-muted-foreground/60 flex-shrink-0" />
                          <span className="truncate" title={c.address}>{c.address}</span>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/40 text-xs">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCaseModal(c)}
                        className="h-8 text-xs flex items-center space-x-1.5 ml-auto border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30"
                      >
                        <FolderPlus size={13} />
                        <span>Add Case</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Client Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Client"
        footer={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Client'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Full Name / Corporate Entity <span className="text-rose-500">*</span>
            </label>
            <input
              placeholder="e.g. Acme Legal Corp or Jane Doe"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Mailing Address
            </label>
            <textarea
              placeholder="Street, City, State, ZIP"
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
              className="w-full p-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* ADD CASE DETAILS TOGGLE */}
          <div className="flex items-center space-x-2 border-t border-border pt-4 mt-2">
            <input
              type="checkbox"
              id="addCaseNow"
              checked={addCaseNow}
              onChange={e => setAddCaseNow(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary bg-background"
            />
            <label htmlFor="addCaseNow" className="text-sm font-semibold text-foreground cursor-pointer select-none">
              Add initial case details now?
            </label>
          </div>

          {addCaseNow && (
            <div className="space-y-4 border border-border p-4 rounded-lg bg-muted/20 animate-in fade-in duration-200 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Case Title / Title of Matter <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="e.g. State of Illinois vs. John Doe"
                  required
                  value={caseTitle}
                  onChange={e => setCaseTitle(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
                    className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
                    className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Description / Subject Matter
                </label>
                <textarea
                  placeholder="Details about litigation matters, legal challenges..."
                  value={caseDescription}
                  onChange={e => setCaseDescription(e.target.value)}
                  rows={2}
                  className="w-full p-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Inline Create Case Modal */}
      <Modal
        isOpen={isCaseModalOpen}
        onClose={() => {
          setIsCaseModalOpen(false);
          setSelectedClientForCase(null);
        }}
        title={`Add Case for client: ${selectedClientForCase?.name}`}
        footer={
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCaseModalOpen(false);
                setSelectedClientForCase(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCase} disabled={submittingCase}>
              {submittingCase ? 'Creating...' : 'Create Case File'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCase} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Case Title / Title of Matter <span className="text-rose-500">*</span>
            </label>
            <input
              placeholder="e.g. State of Illinois vs. John Doe"
              required
              value={cTitle}
              onChange={e => setCTitle(e.target.value)}
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
                value={cCourt}
                onChange={e => setCCourt(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Docket/Case Number
              </label>
              <input
                placeholder="e.g. 2026-CH-9941"
                value={cNumber}
                onChange={e => setCNumber(e.target.value)}
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
              value={cHearingDate}
              onChange={e => setCHearingDate(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description / Subject Matter
            </label>
            <textarea
              placeholder="Details about litigation matters, legal challenges..."
              value={cDescription}
              onChange={e => setCDescription(e.target.value)}
              rows={3}
              className="w-full p-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

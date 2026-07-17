import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import type { Lawyer } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { Shield, UserPlus, Phone, Mail, Search, Trash2 } from 'lucide-react';

export const Lawyers: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Lawyer Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Associate Advocate');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const data = await db.getLawyers();
      setLawyers(data);
    } catch (err) {
      console.error('Error loading lawyers:', err);
      toast('Failed to load lawyers directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  const handleOpenModal = () => {
    setName('');
    setRole('Associate Advocate');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const handleAddLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Lawyer Name is required', 'warning');
      return;
    }
    if (!email.trim()) {
      toast('Email Address is required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await db.createLawyer({
        name,
        role,
        phone,
        email,
      });
      toast(`Advocate profile for "${name}" registered successfully!`, 'success');
      setIsModalOpen(false);
      fetchLawyers();
    } catch (err: any) {
      toast(err.message || 'Failed to register advocate', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLawyer = async (id: string, lawyerName: string) => {
    if (window.confirm(`Are you sure you want to remove ${lawyerName} from the firm? All active case assignments for them will be cleared.`)) {
      try {
        await db.deleteLawyer(id);
        toast(`Advocate "${lawyerName}" removed successfully.`, 'success');
        fetchLawyers();
      } catch (err: any) {
        toast(err.message || 'Failed to remove advocate', 'error');
      }
    }
  };

  // Filter logic
  const filteredLawyers = lawyers.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.phone && l.phone.includes(searchTerm))
  );

  const getRoleBadgeVariant = (roleName: string) => {
    if (roleName.includes('Partner')) return 'error'; // Senior/Managing Partners - high priority
    if (roleName.includes('Senior')) return 'warning';
    if (roleName.includes('Associate')) return 'success';
    return 'outline';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Lawyers Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage firm partners, senior advocates, associates, and legal consultants.</p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center space-x-2">
          <UserPlus size={16} />
          <span>New Advocate Profile</span>
        </Button>
      </div>

      {/* Lawyers Directory Grid/Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <div className="text-left">
            <CardTitle>Firm Team Directory</CardTitle>
            <CardDescription>Roster of all attorneys authorized to represent clients and manage litigation files.</CardDescription>
          </div>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search by name, role, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredLawyers.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Shield className="mx-auto text-muted-foreground/60 h-10 w-10 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No advocate profiles found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Register a new advocate to start assigning legal matters.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Advocate Name</TableHead>
                    <TableHead>Firm Role / Designation</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLawyers.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-bold text-foreground">{l.name}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(l.role)} className="uppercase font-bold text-[10px] tracking-wide">
                          {l.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center space-x-1.5">
                          <Mail size={13} className="text-muted-foreground/60" />
                          <span>{l.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.phone ? (
                          <div className="flex items-center space-x-1.5">
                            <Phone size={13} className="text-muted-foreground/60" />
                            <span>{l.phone}</span>
                          </div>
                        ) : (
                          <span className="italic text-muted-foreground/40 text-xs">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-semibold">
                        {new Date(l.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLawyer(l.id, l.name)}
                          className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg hover:text-rose-600 transition-colors"
                          title="Remove advocate"
                        >
                          <Trash2 size={15} />
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

      {/* Modal - New Advocate Registration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Firm Advocate"
        footer={
          <div className="flex justify-end space-x-2 w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLawyer} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Profile'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddLawyer} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              placeholder="e.g. Advocate Abhishek Singh"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Firm Role / Designation <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-semibold"
            >
              <option value="Managing Partner">Managing Partner</option>
              <option value="Senior Partner">Senior Partner</option>
              <option value="Partner">Partner</option>
              <option value="Senior Advocate">Senior Advocate</option>
              <option value="Associate Advocate">Associate Advocate</option>
              <option value="Junior Associate">Junior Associate</option>
              <option value="Legal Consultant">Legal Consultant</option>
              <option value="Of Counsel">Of Counsel</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@firm.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 99999 99999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

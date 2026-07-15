import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import type { Invoice } from '../lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Printer,
  Download,
  Scale
} from 'lucide-react';

export const Billing: React.FC = () => {
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice generator modal state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    try {
      const data = await db.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast('Failed to load financial records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleUpdateStatus = async (id: string, status: Invoice['status']) => {
    try {
      await db.updateInvoiceStatus(id, status);
      toast(`Invoice marked as ${status}`, 'success');
      fetchInvoices();
      if (previewInvoice && previewInvoice.id === id) {
        setPreviewInvoice(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      toast('Failed to update status', 'error');
    }
  };

  // Metrics
  const totalCollected = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Practice Finances</h1>
          <p className="text-muted-foreground text-sm mt-1">Track case retainer fees, hearing appearance charges, and invoices.</p>
        </div>
      </div>

      {/* Finance Metrics Summary Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Fees Collected</CardTitle>
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-3xl font-black text-foreground">
              ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Cleared and recorded payments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Outstanding Receivables</CardTitle>
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-lg">
              <AlertTriangle size={18} />
            </div>
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-3xl font-black text-foreground">
              ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Unpaid and overdue legal balances</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Value Invoiced</CardTitle>
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <DollarSign size={18} />
            </div>
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-3xl font-black text-foreground">
              ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>All logged charges on record</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Invoices Table Registry Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoicing Ledger</CardTitle>
          <CardDescription>A master registry of all legal bills, retainer charges, and litigation disbursements.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <FileSpreadsheet className="mx-auto text-muted-foreground/60 h-10 w-10 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No invoices found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Log fees inside client case sheets to populate this ledger.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Case Matter</TableHead>
                  <TableHead>Item / Fee Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-bold text-xs uppercase">{inv.invoice_number}</TableCell>
                    <TableCell className="font-semibold text-foreground">{inv.client?.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate" title={inv.case?.case_title}>
                      {inv.case?.case_title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]" title={inv.title}>
                      {inv.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.due_date || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === 'Paid'
                            ? 'success'
                            : inv.status === 'Unpaid'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      ${Number(inv.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewInvoice(inv)}
                        className="h-8 text-xs flex items-center space-x-1 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30"
                      >
                        <Receipt size={13} />
                        <span>Invoice</span>
                      </Button>
                      
                      {inv.status !== 'Paid' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(inv.id, 'Paid')}
                          className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5"
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(inv.id, 'Unpaid')}
                          className="h-8 text-xs text-muted-foreground hover:bg-muted"
                        >
                          Mark Unpaid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Generator Modal */}
      {previewInvoice && (
        <Modal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          title={`Invoice: ${previewInvoice.invoice_number}`}
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
                    toast(`Downloading ${previewInvoice.invoice_number}.pdf (Mock)`, 'info');
                    setPreviewInvoice(null);
                  }}
                  className="flex items-center space-x-1.5"
                >
                  <Download size={14} />
                  <span>Download</span>
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPreviewInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          {/* Printable Styled Law Firm Invoice layout */}
          <div className="border border-border/80 p-8 rounded-lg bg-white text-slate-800 font-sans leading-relaxed shadow-inner max-h-[55vh] overflow-y-auto scrollbar-hide text-left dark:bg-slate-900 dark:text-slate-200">
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
                <p className="text-xs font-mono font-bold">{previewInvoice.invoice_number}</p>
                <div className="inline-block mt-2">
                  <Badge
                    variant={
                      previewInvoice.status === 'Paid'
                        ? 'success'
                        : previewInvoice.status === 'Unpaid'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {previewInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Client & Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide mb-1.5">BILL TO:</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{previewInvoice.client?.name}</p>
                {previewInvoice.client?.phone && <p className="text-slate-500 mt-0.5">{previewInvoice.client?.phone}</p>}
                {previewInvoice.client?.email && <p className="text-slate-500 mt-0.5">{previewInvoice.client?.email}</p>}
                {previewInvoice.client?.address && <p className="text-slate-500 mt-1 max-w-xs">{previewInvoice.client?.address}</p>}
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">CASE MATTER</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{previewInvoice.case?.case_title}</p>
                  <p className="text-slate-500 font-mono text-[10px] uppercase mt-0.5">({previewInvoice.case?.case_number || 'No Case #'})</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">INVOICE DATE</span>
                    <p className="font-semibold">{new Date(previewInvoice.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">DUE DATE</span>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">{previewInvoice.due_date || 'N/A'}</p>
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
                    <p className="font-bold text-slate-900 dark:text-slate-100">{previewInvoice.title}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Counsel representation for scheduled appearance / litigation support.</p>
                  </td>
                  <td className="py-3.5 text-right text-slate-500">1.0</td>
                  <td className="py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">${Number(previewInvoice.amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Total Section */}
            <div className="flex justify-end border-t border-slate-300 dark:border-slate-700 pt-4 mb-8">
              <div className="w-64 text-xs space-y-2">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal:</span>
                  <span>${Number(previewInvoice.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Sales Tax (0%):</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-base font-black border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-900 dark:text-slate-100">
                  <span>Total Amount Due:</span>
                  <span>${Number(previewInvoice.amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Legal Notice / Footer */}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6 space-y-1">
              <p className="font-semibold uppercase tracking-wider">Thank You For Your Representation Business</p>
              <p>All invoice payments are due in full within 30 days of the invoice date. Late fees of 1.5% per month apply thereafter.</p>
              <p className="font-mono text-[9px] mt-2">DocID: {previewInvoice.id}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

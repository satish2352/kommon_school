import { PageHeader, Card, Table, Th, Td, Tr, EmptyState, Badge } from '../../components/admin';
import { useAccount } from './useAccount';

const formatRupees = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDateTime = (iso) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function PanelTransactions() {
  const { transactions, loading, error } = useAccount();

  const total = transactions.reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction History"
        subtitle="Every payment recorded on your account"
        action={
          !loading && transactions.length > 0 ? (
            <Badge variant="info">
              {transactions.length} payment{transactions.length === 1 ? '' : 's'} · {formatRupees(total)}
            </Badge>
          ) : null
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card variant="flush">
        <Table>
          <thead>
            <tr>
              <Th>Date &amp; Time</Th>
              <Th>Plan</Th>
              <Th>Transaction ID</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Loading your transactions…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <EmptyState
                colSpan={4}
                title="No transactions yet"
                description="When a payment is recorded against your account, it will show up here."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8" />
                  </svg>
                }
              />
            ) : (
              transactions.map((t, i) => (
                <Tr key={t.transactionId ?? i} striped={i % 2 === 1}>
                  <Td>{formatDateTime(t.paymentDate)}</Td>
                  <Td>{t.plan ?? '—'}</Td>
                  <Td className="font-mono text-xs text-slate-500">{t.transactionId ?? '—'}</Td>
                  <Td align="right" className="font-medium text-slate-800">{formatRupees(t.amount)}</Td>
                </Tr>
              ))
            )}
          </tbody>
          {!loading && transactions.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--admin-border)' }}>
                <Td colSpan={3} className="font-semibold text-slate-600">Total</Td>
                <Td align="right" className="font-bold text-slate-900">{formatRupees(total)}</Td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>
    </div>
  );
}

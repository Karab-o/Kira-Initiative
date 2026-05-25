import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { api, apiError } from '../../lib/api.js';
import { useDoctorStore } from '../../stores/doctorStore.js';

const SUSPECT = new Set(['login_failed', '2fa_failed', 'violation']);

export default function SecurityLogs() {
  const { doctor } = useDoctorStore();
  const [logs, setLogs] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (doctor?.role !== 'admin') { setLoading(false); return; }
    (async () => {
      try {
        const [lRes, dRes] = await Promise.all([
          api.get('/admin/logs', { params: { limit: 100 } }),
          api.get('/admin/doctors', { params: { status: 'pending' } }),
        ]);
        setLogs(lRes.data.logs);
        setPendingDoctors(dRes.data.doctors);
      } catch (err) { setError(apiError(err)); }
      finally { setLoading(false); }
    })();
  }, [doctor]);

  const verify = async (id, status) => {
    try {
      await api.patch(`/admin/doctors/${id}/verify`, { status });
      setPendingDoctors((arr) => arr.filter((d) => d.id !== id));
    } catch (err) { setError(apiError(err)); }
  };

  if (doctor?.role !== 'admin') {
    return <EmptyState icon={ShieldAlert} title="Admin only" description="This area is restricted to administrators." />;
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Security & verifications</h1>
        <p className="text-sm text-muted-fg">Review pending doctor applications and inspect security events.</p>
      </div>

      {error && <p className="text-sm text-care-red">{error}</p>}

      <section>
        <h2 className="font-display text-lg mb-3 text-white">Pending verifications ({pendingDoctors.length})</h2>
        {pendingDoctors.length === 0 ? (
          <p className="text-sm text-muted-fg">No pending applications.</p>
        ) : (
          <div className="space-y-2">
            {pendingDoctors.map((d) => (
              <div key={d.id} className="card-ink !p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{d.fullName}</p>
                  <p className="text-xs text-muted-fg truncate">{d.email} · {d.specialty} · {d.hospital?.name}</p>
                  <p className="text-xs text-muted-fg font-mono mt-1">License: {d.medicalLicenseId}</p>
                </div>
                {d.licenseFilePath && (
                  <a href={d.licenseFilePath} target="_blank" rel="noreferrer" className="text-xs text-mint-200 hover:underline">View license</a>
                )}
                <button onClick={() => verify(d.id, 'approved')} className="px-3 py-1.5 rounded-lg text-xs bg-care-green/20 text-care-green border border-care-green/30 hover:bg-care-green/30">
                  Approve
                </button>
                <button onClick={() => verify(d.id, 'rejected')} className="px-3 py-1.5 rounded-lg text-xs bg-care-red/20 text-care-red border border-care-red/30 hover:bg-care-red/30">
                  Reject
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg mb-3 text-white">Recent security events</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-fg">No events to show.</p>
        ) : (
          <div className="card-ink !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-fg font-mono uppercase">
                <tr className="border-b border-mint-300/10">
                  <th className="text-left px-4 py-3">When</th>
                  <th className="text-left px-4 py-3">Event</th>
                  <th className="text-left px-4 py-3">IP</th>
                  <th className="text-left px-4 py-3">Meta</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-mint-300/5 last:border-0">
                    <td className="px-4 py-3 text-xs text-muted-fg font-mono">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge tone={SUSPECT.has(l.event) ? 'amber' : 'mint'} dot={SUSPECT.has(l.event)}>
                        {SUSPECT.has(l.event) && <AlertTriangle size={10} />}
                        {l.event}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-fg font-mono">{l.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-fg max-w-xs truncate font-mono">{l.metadata ? JSON.stringify(l.metadata) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ severity: '', resolved: '' });

    const fetchAlerts = async () => {
        try {
            const params = {};
            if (filters.severity) params.severity = filters.severity;
            if (filters.resolved) params.resolved = filters.resolved;
            const { data } = await api.get('/alerts', { params });
            if (data.success) setAlerts(data.data);
        } catch (e) {
            console.error('Fetch alerts error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [filters]);

    useEffect(() => {
        const socket = io(window.location.origin);
        socket.on('new_alert', (alert) => {
            setAlerts(prev => [alert, ...prev]);
        });
        return () => socket.disconnect();
    }, []);

    const resolveAlert = async (id) => {
        try {
            await api.patch(`/alerts/${id}/resolve`);
            fetchAlerts();
        } catch (e) {
            console.error('Resolve alert error:', e);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    return (
        <div className="page-container space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">Alerts</h1>
                    <p className="text-surface-500 text-sm mt-1">{alerts.length} alerts</p>
                </div>
                <div className="flex gap-3">
                    <select
                        className="input text-sm"
                        value={filters.severity}
                        onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
                    >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select
                        className="input text-sm"
                        value={filters.resolved}
                        onChange={e => setFilters(f => ({ ...f, resolved: e.target.value }))}
                    >
                        <option value="">All Status</option>
                        <option value="false">Unresolved</option>
                        <option value="true">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                ) : alerts.length === 0 ? (
                    <p className="text-surface-500 text-center py-16">No alerts found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>Description</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert, i) => (
                                    <tr key={alert._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                                        <td className="font-mono text-xs text-surface-200">{alert.type}</td>
                                        <td>
                                            <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                                        </td>
                                        <td className="max-w-xs truncate">{alert.description}</td>
                                        <td className="text-xs whitespace-nowrap">{formatDate(alert.createdAt)}</td>
                                        <td>
                                            {alert.resolved ? (
                                                <span className="badge badge-trusted">Resolved</span>
                                            ) : (
                                                <span className="badge badge-critical">Active</span>
                                            )}
                                        </td>
                                        <td>
                                            {!alert.resolved && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => resolveAlert(alert._id)}
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

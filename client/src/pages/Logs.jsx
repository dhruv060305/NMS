import { useState, useEffect } from 'react';
import api from '../api';

export default function Logs() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 30 };
            if (search) {
                // Detect if search looks like a port number
                if (/^\d+$/.test(search.trim())) {
                    params.port = search.trim();
                } else {
                    params.ip = search.trim();
                }
            }
            const { data } = await api.get('/logs', { params });
            if (data.success) {
                setLogs(data.data.logs);
                setPagination(data.data.pagination);
            }
        } catch (e) {
            console.error('Fetch logs error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    return (
        <div className="page-container space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">Traffic Logs</h1>
                    <p className="text-surface-500 text-sm mt-1">{pagination.total} total records</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        className="input text-sm w-56"
                        placeholder="Search by IP or port..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                </form>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-surface-500 text-center py-16">No logs found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Src IP</th>
                                    <th>Src Port</th>
                                    <th>Dest IP</th>
                                    <th>Dest Port</th>
                                    <th>Protocol</th>
                                    <th>Bytes</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
                                        <td className="font-mono text-surface-200">{log.srcIp}</td>
                                        <td className="font-mono">{log.srcPort}</td>
                                        <td className="font-mono text-surface-200">{log.destIp}</td>
                                        <td className="font-mono">{log.destPort}</td>
                                        <td>
                                            <span className={`badge ${log.protocol === 'TCP' ? 'badge-trusted' : 'badge-medium'}`}>
                                                {log.protocol}
                                            </span>
                                        </td>
                                        <td className="font-mono text-xs">{log.byteCount.toLocaleString()}</td>
                                        <td className="text-xs whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800/30">
                        <span className="text-xs text-surface-500">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ← Prev
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={page >= pagination.pages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

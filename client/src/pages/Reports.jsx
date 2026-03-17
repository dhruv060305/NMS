import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../api';

const TYPE_COLORS = {
    PORT_SCAN: '#ef4444',
    DDOS_FLOOD: '#f59e0b',
    ARP_SPOOF: '#8b5cf6',
    UNKNOWN_DEVICE: '#3b82f6'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card p-3 !rounded-lg text-xs">
            <p className="text-surface-300 font-medium mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.fill }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

export default function Reports() {
    const [alertsByType, setAlertsByType] = useState([]);
    const [trafficVolume, setTrafficVolume] = useState([]);
    const [topIps, setTopIps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            const [alertsRes, logsRes] = await Promise.all([
                api.get('/alerts'),
                api.get('/logs?limit=1000')
            ]);

            // Alert count by type
            if (alertsRes.data.success) {
                const counts = {};
                alertsRes.data.data.forEach(a => {
                    counts[a.type] = (counts[a.type] || 0) + 1;
                });
                setAlertsByType(
                    Object.entries(counts).map(([type, count]) => ({ type, count }))
                );

                // Top 5 suspicious IPs (from alert descriptions)
                const ipCounts = {};
                alertsRes.data.data.forEach(a => {
                    const match = a.description?.match(/(\d+\.\d+\.\d+\.\d+)/);
                    if (match) {
                        ipCounts[match[1]] = (ipCounts[match[1]] || 0) + 1;
                    }
                });
                const sorted = Object.entries(ipCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([ip, count]) => ({ ip, count }));
                setTopIps(sorted);
            }

            // Traffic volume over last 24 hours (group by hour)
            if (logsRes.data.success) {
                const hourBuckets = {};
                const now = Date.now();
                for (let i = 23; i >= 0; i--) {
                    const hour = new Date(now - i * 3600000);
                    const key = hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
                    hourBuckets[key] = 0;
                }
                logsRes.data.data.logs.forEach(log => {
                    const hour = new Date(log.timestamp);
                    const key = hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
                    if (key in hourBuckets) {
                        hourBuckets[key]++;
                    }
                });
                setTrafficVolume(
                    Object.entries(hourBuckets).map(([hour, volume]) => ({ hour, volume }))
                );
            }
        } catch (e) {
            console.error('Report data error:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center py-32">
                <span className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="page-container space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-surface-100">Reports</h1>
                <p className="text-surface-500 text-sm mt-1">Analytics and threat intelligence</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alert Count by Type */}
                <div className="glass-card p-5">
                    <h2 className="text-lg font-semibold text-surface-200 mb-4">Alerts by Type</h2>
                    {alertsByType.length === 0 ? (
                        <p className="text-surface-500 text-sm text-center py-12">No alert data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={alertsByType} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                                <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {alertsByType.map((entry, i) => (
                                        <Cell key={i} fill={TYPE_COLORS[entry.type] || '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Traffic Volume */}
                <div className="glass-card p-5">
                    <h2 className="text-lg font-semibold text-surface-200 mb-4">Traffic Volume (24h)</h2>
                    {trafficVolume.length === 0 ? (
                        <p className="text-surface-500 text-sm text-center py-12">No traffic data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trafficVolume} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#6366f1', stroke: '#c7d2fe', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Top Suspicious IPs */}
            <div className="glass-card p-5">
                <h2 className="text-lg font-semibold text-surface-200 mb-4">Top 5 Suspicious IPs</h2>
                {topIps.length === 0 ? (
                    <p className="text-surface-500 text-sm text-center py-8">No suspicious activity detected yet</p>
                ) : (
                    <div className="space-y-3">
                        {topIps.map((item, i) => {
                            const max = topIps[0].count;
                            const pct = (item.count / max) * 100;
                            return (
                                <div key={item.ip} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-sm text-surface-200">{item.ip}</span>
                                        <span className="text-xs text-surface-400">{item.count} alerts</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                background: `linear-gradient(90deg, ${i === 0 ? '#ef4444' : i < 3 ? '#f59e0b' : '#6366f1'}, ${i === 0 ? '#dc2626' : i < 3 ? '#d97706' : '#4f46e5'})`
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

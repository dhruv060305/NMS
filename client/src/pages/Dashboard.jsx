import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../api';

const SEVERITY_COLORS = { critical: '#ef4444', medium: '#f59e0b', low: '#14b8a6' };
const STATUS_COLORS = { trusted: '#10b981', suspicious: '#f59e0b', blocked: '#ef4444' };

export default function Dashboard() {
    const [stats, setStats] = useState({ totalDevices: 0, activeAlerts: 0, packetsPerSecond: 0, criticalCount: 0 });
    const [alerts, setAlerts] = useState([]);
    const [devices, setDevices] = useState([]);
    const graphRef = useRef();

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, alertsRes, devicesRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/alerts?resolved=false'),
                api.get('/devices')
            ]);
            if (statsRes.data.success) setStats(statsRes.data.data);
            if (alertsRes.data.success) setAlerts(alertsRes.data.data.slice(0, 10));
            if (devicesRes.data.success) setDevices(devicesRes.data.data);
        } catch (e) {
            console.error('Dashboard fetch error:', e);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);

        const socket = io(window.location.origin);
        socket.on('new_alert', (alert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 10));
            setStats(prev => ({
                ...prev,
                activeAlerts: prev.activeAlerts + 1,
                criticalCount: alert.severity === 'critical' ? prev.criticalCount + 1 : prev.criticalCount
            }));
        });
        socket.on('device_update', () => {
            api.get('/devices').then(res => {
                if (res.data.success) setDevices(res.data.data);
            });
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [fetchData]);

    // Build graph data from devices
    const graphData = {
        nodes: [
            { id: 'router', name: 'Gateway', val: 20, color: '#6366f1' },
            ...devices.map(d => ({
                id: d._id,
                name: d.hostname || d.ip,
                val: 10,
                color: STATUS_COLORS[d.status] || '#94a3b8'
            }))
        ],
        links: devices.map(d => ({ source: 'router', target: d._id }))
    };

    const statCards = [
        { label: 'Total Devices', value: stats.totalDevices, gradient: 'from-blue-600 to-blue-800', icon: '⬡' },
        { label: 'Active Alerts', value: stats.activeAlerts, gradient: 'from-amber-600 to-amber-800', icon: '⚠' },
        { label: 'Packets/sec', value: stats.packetsPerSecond, gradient: 'from-emerald-600 to-emerald-800', icon: '↕' },
        { label: 'Critical Alerts', value: stats.criticalCount, gradient: 'from-red-600 to-red-800', icon: '✦' },
    ];

    const formatTime = (ts) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="page-container space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
                    <p className="text-surface-500 text-sm mt-1">Real-time network monitoring overview</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-500">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={card.label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-surface-500 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                                <p className="text-3xl font-bold text-surface-100 mt-1">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white text-xl opacity-80`}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Alert Feed */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-surface-200">Live Alert Feed</h2>
                        <span className="text-xs text-surface-500">Last 10</span>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {alerts.length === 0 ? (
                            <p className="text-surface-500 text-sm text-center py-8">No active alerts</p>
                        ) : (
                            alerts.map((alert, i) => (
                                <div
                                    key={alert._id || i}
                                    className={`alert-feed-item ${alert.severity}`}
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                                            <span className="text-xs font-mono text-surface-400">{alert.type}</span>
                                        </div>
                                        <span className="text-xs text-surface-500">{formatTime(alert.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-surface-300 truncate">{alert.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Network Map */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-surface-200">Network Map</h2>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Trusted</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Suspicious</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Blocked</span>
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.6)', height: 340 }}>
                        <ForceGraph2D
                            ref={graphRef}
                            graphData={graphData}
                            width={500}
                            height={340}
                            backgroundColor="rgba(0,0,0,0)"
                            nodeRelSize={5}
                            nodeLabel="name"
                            nodeCanvasObject={(node, ctx, globalScale) => {
                                const label = node.name;
                                const fontSize = 10 / globalScale;
                                const r = node.val / 2;

                                // Glow
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
                                ctx.fillStyle = node.color + '33';
                                ctx.fill();

                                // Node
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                                ctx.fillStyle = node.color;
                                ctx.fill();

                                // Label
                                ctx.font = `${fontSize}px Inter, sans-serif`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'top';
                                ctx.fillStyle = '#cbd5e1';
                                ctx.fillText(label, node.x, node.y + r + 3);
                            }}
                            linkColor={() => 'rgba(99,102,241,0.2)'}
                            linkWidth={1.5}
                            cooldownTicks={50}
                            onEngineStop={() => graphRef.current?.zoomToFit(300, 40)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

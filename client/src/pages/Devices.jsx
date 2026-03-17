import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

export default function Devices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDevices = async () => {
        try {
            const { data } = await api.get('/devices');
            if (data.success) setDevices(data.data);
        } catch (e) {
            console.error('Fetch devices error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        const socket = io(window.location.origin);
        socket.on('device_update', () => fetchDevices());
        return () => socket.disconnect();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/devices/${id}/status`, { status });
            fetchDevices();
        } catch (e) {
            console.error('Update status error:', e);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="page-container space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-surface-100">Devices</h1>
                <p className="text-surface-500 text-sm mt-1">{devices.length} devices on network</p>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                ) : devices.length === 0 ? (
                    <p className="text-surface-500 text-center py-16">No devices found. Start the mock agent to generate traffic.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>MAC Address</th>
                                    <th>Hostname</th>
                                    <th>Status</th>
                                    <th>Last Seen</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map((device, i) => (
                                    <tr key={device._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                                        <td className="font-mono text-surface-200">{device.ip}</td>
                                        <td className="font-mono text-xs">{device.mac}</td>
                                        <td>{device.hostname}</td>
                                        <td>
                                            <span className={`badge badge-${device.status}`}>{device.status}</span>
                                        </td>
                                        <td className="text-xs">{formatDate(device.lastSeen)}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                {device.status !== 'trusted' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => updateStatus(device._id, 'trusted')}
                                                    >
                                                        Trust
                                                    </button>
                                                )}
                                                {device.status !== 'blocked' && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => updateStatus(device._id, 'blocked')}
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                            </div>
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

import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="devices" element={<Devices />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="logs" element={<Logs />} />
                <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

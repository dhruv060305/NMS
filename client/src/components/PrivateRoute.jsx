import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
    const token = localStorage.getItem('nms_token');
    return token ? children : <Navigate to="/login" replace />;
}

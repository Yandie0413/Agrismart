import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import LandingPage from './pages/Auth/LandingPage';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Exploitations from './pages/Exploitations/Exploitations';
import Conseils from './pages/Conseils/Conseils';
import Meteo from './pages/Meteo/Meteo';
import Messages from './pages/Messages/Messages';
import Marches from './pages/Marches/Marches';
import Profil from './pages/Profil/Profil';
import Utilisateurs from './pages/Profil/Utilisateurs';
import Statistiques from './pages/Statistiques/Statistiques';
import Localisation from './pages/Localisation/Localisation';
import Forum from './pages/Forum/Forum';
import SujetDetail from './pages/Forum/SujetDetail';

const PrivateRoute = ({ children, rolesAutorises }) => {
    const { estConnecte, utilisateur, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );
    if (!estConnecte) return <Navigate to="/login" />;
    if (rolesAutorises && !rolesAutorises.includes(utilisateur?.role)) {
        return <Navigate to="/dashboard" />;
    }
    return children;
};

const PublicRoute = ({ children }) => {
    const { estConnecte, loading } = useAuth();
    if (loading) return null;
    return !estConnecte ? children : <Navigate to="/dashboard" />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                    <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
                    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                    <Route path="/exploitations" element={<PrivateRoute rolesAutorises={['agriculteur']}><Layout><Exploitations /></Layout></PrivateRoute>} />
                    <Route path="/conseils" element={<PrivateRoute><Layout><Conseils /></Layout></PrivateRoute>} />
                    <Route path="/meteo" element={<PrivateRoute><Layout><Meteo /></Layout></PrivateRoute>} />
                    <Route path="/messages" element={<PrivateRoute><Layout><Messages /></Layout></PrivateRoute>} />
                    <Route path="/marches" element={<PrivateRoute><Layout><Marches /></Layout></PrivateRoute>} />
                    <Route path="/profil" element={<PrivateRoute><Layout><Profil /></Layout></PrivateRoute>} />
                    <Route path="/utilisateurs" element={<PrivateRoute rolesAutorises={['administrateur']}><Layout><Utilisateurs /></Layout></PrivateRoute>} />
                    <Route path="/statistiques" element={<PrivateRoute rolesAutorises={['administrateur']}><Layout><Statistiques /></Layout></PrivateRoute>} />
                    <Route path="/localisation" element={<PrivateRoute><Layout><Localisation /></Layout></PrivateRoute>} />
                    <Route path="/forum" element={<PrivateRoute><Layout><Forum /></Layout></PrivateRoute>} />
                    <Route path="/forum/:id" element={<PrivateRoute><Layout><SujetDetail /></Layout></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
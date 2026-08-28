import bgLogin from '../../assets/images/image2.jfif';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { login, verifierOTP } from '../../services/api';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';
import { motion } from 'framer-motion';

const Login = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ email: '', mot_de_passe: '' });
    const [otpForm, setOtpForm] = useState({ email: '', code: '' });
    const [etape, setEtape] = useState('login');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { connexion } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            const res = await login(form);
            if (res.data.data.deux_facteurs) {
                setOtpForm({ ...otpForm, email: res.data.data.email });
                setEtape('otp');
            } else {
                connexion(res.data.data.token, res.data.data.utilisateur);
                navigate('/dashboard');
            }
        } catch (err) {
            setErreur(err.response?.data?.message || t('loginPage.genericError'));
        } finally {
            setLoading(false);
        }
    };

    const handleOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            const res = await verifierOTP(otpForm);
            connexion(res.data.data.token, res.data.data.utilisateur);
            navigate('/dashboard');
        } catch (err) {
            setErreur(err.response?.data?.message || t('loginPage.otpError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${bgLogin})` }}
        >
            {/* Overlay pour lisibilite */}
            <div className="absolute inset-0 bg-forest-950/50"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-mint-400 rounded-2xl mb-4">
                        <GiFarmer className="text-3xl text-forest-950" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white">AgriSmart</h1>
                    <p className="text-white/70 mt-2">{t('loginPage.brandSubtitle')}</p>
                </div>

                {/* Card glassmorphism */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

                    {etape === 'login' ? (
                        <>
                            <h2 className="font-display text-2xl font-bold text-white mb-1">{t('loginPage.title')}</h2>
                            <p className="text-white/60 text-sm mb-6">{t('loginPage.welcomeBack')}</p>

                            {erreur && (
                                <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-4 text-sm">
                                    {erreur}
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">{t('loginPage.emailLabel')}</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                            placeholder={t('loginPage.emailPlaceholder')}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">{t('loginPage.passwordLabel')}</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.mot_de_passe}
                                            onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                                            className="w-full pl-10 pr-12 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                        >
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Link to="/forgot-password" className="text-sm text-mint-300 hover:text-mint-200 hover:underline">
                                        {t('loginPage.forgotPassword')}
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {loading ? t('loginPage.loggingIn') : t('loginPage.loginButton')}
                                </button>
                            </form>

                            <p className="text-center text-sm text-white/60 mt-6">
                                {t('loginPage.noAccount')}{' '}
                                <Link to="/register" className="text-mint-300 font-medium hover:underline">
                                    {t('loginPage.signUp')}
                                </Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="font-display text-2xl font-bold text-white mb-2">{t('loginPage.otpTitle')}</h2>
                            <p className="text-white/60 text-sm mb-6">
                                {t('loginPage.otpSubtitle', { email: otpForm.email })}
                            </p>

                            {erreur && (
                                <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-4 text-sm">
                                    {erreur}
                                </div>
                            )}

                            <form onSubmit={handleOTP} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">{t('loginPage.otpLabel')}</label>
                                    <input
                                        type="text"
                                        value={otpForm.code}
                                        onChange={(e) => setOtpForm({ ...otpForm, code: e.target.value })}
                                        className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-mint-400 text-center text-2xl tracking-widest"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {loading ? t('loginPage.verifying') : t('loginPage.verifyButton')}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setEtape('login')}
                                    className="w-full py-3 border border-white/20 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    {t('loginPage.backButton')}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

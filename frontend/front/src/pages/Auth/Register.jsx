import bgRegister from '../../assets/images/image2.jfif';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register } from '../../services/api';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiPhone } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';
import { motion } from 'framer-motion';

const Register = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        nom: '',
        email: '',
        telephone: '',
        mot_de_passe: '',
        role: 'agriculteur'
    });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur('');
        if (form.telephone && !/^(\+261|0)3[2348]\d{7}$/.test(form.telephone.replace(/\s/g, ''))) {
            setErreur(t('registerPage.phoneInvalid'));
            return;
        }
        setLoading(true);
        try {
            await register(form);
            navigate('/login');
        } catch (err) {
            setErreur(err.response?.data?.message || t('registerPage.genericError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${bgRegister})` }}
        >
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
                    <p className="text-white/70 mt-2">{t('registerPage.brandSubtitle')}</p>
                </div>

                {/* Card glassmorphism */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
                    <h2 className="font-display text-2xl font-bold text-white mb-1">{t('registerPage.title')}</h2>
                    <p className="text-white/60 text-sm mb-6">{t('registerPage.joinCommunity')}</p>

                    {erreur && (
                        <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-4 text-sm">
                            {erreur}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">{t('registerPage.fullNameLabel')}</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                <input
                                    type="text"
                                    value={form.nom}
                                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                    placeholder={t('registerPage.fullNamePlaceholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">{t('registerPage.emailLabel')}</label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                    placeholder={t('registerPage.emailPlaceholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">{t('registerPage.phoneLabel')}</label>
                            <div className="relative">
                                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                <input
                                    type="tel"
                                    value={form.telephone}
                                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                    placeholder={t('registerPage.phonePlaceholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">{t('registerPage.passwordLabel')}</label>
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

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">{t('registerPage.roleLabel')}</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-mint-400 [&>option]:text-forest-950"
                            >
                                <option value="agriculteur">{t('registerPage.roleFarmer')}</option>
                                <option value="expert">{t('registerPage.roleExpert')}</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {loading ? t('registerPage.signingUp') : t('registerPage.signUpButton')}
                        </button>
                    </form>

                    <p className="text-center text-sm text-white/60 mt-6">
                        {t('registerPage.alreadyAccount')}{' '}
                        <Link to="/login" className="text-mint-300 font-medium hover:underline">
                            {t('registerPage.login')}
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

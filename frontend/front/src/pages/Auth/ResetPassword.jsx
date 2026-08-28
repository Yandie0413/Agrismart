import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reinitialiserMotDePasse } from '../../services/api';
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';

const ResetPassword = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [motDePasse, setMotDePasse] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    const [succes, setSucces] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur('');

        if (motDePasse !== confirmation) {
            setErreur(t('resetPasswordPage.passwordMismatch'));
            return;
        }

        if (motDePasse.length < 6) {
            setErreur(t('resetPasswordPage.passwordTooShort'));
            return;
        }

        setLoading(true);
        try {
            await reinitialiserMotDePasse({ token, nouveau_mot_de_passe: motDePasse });
            setSucces(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setErreur(err.response?.data?.message || t('resetPasswordPage.genericError'));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md text-center">
                    <p className="text-red-300 mb-4">{t('resetPasswordPage.invalidLink')}</p>
                    <Link to="/forgot-password" className="text-mint-300 hover:underline">
                        {t('resetPasswordPage.requestNewLink')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-mint-400 rounded-2xl mb-4">
                        <GiFarmer className="text-3xl text-forest-950" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white">AgriSmart</h1>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

                    {succes ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-mint-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCheck className="text-3xl text-mint-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">{t('resetPasswordPage.successTitle')}</h2>
                            <p className="text-white/60 text-sm">
                                {t('resetPasswordPage.successMessage')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-display text-2xl font-bold text-white mb-6">{t('resetPasswordPage.title')}</h2>

                            {erreur && (
                                <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-4 text-sm">
                                    {erreur}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">{t('resetPasswordPage.newPasswordLabel')}</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={motDePasse}
                                            onChange={(e) => setMotDePasse(e.target.value)}
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
                                    <label className="block text-sm font-medium text-white/80 mb-1">{t('resetPasswordPage.confirmPasswordLabel')}</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmation}
                                            onChange={(e) => setConfirmation(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {loading ? t('resetPasswordPage.submitting') : t('resetPasswordPage.submitButton')}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

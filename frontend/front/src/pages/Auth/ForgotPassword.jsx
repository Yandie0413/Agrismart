import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { demanderReset } from '../../services/api';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    const [succes, setSucces] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            await demanderReset({ email });
            setSucces(true);
        } catch (err) {
            setErreur(err.response?.data?.message || t('forgotPasswordPage.genericError'));
        } finally {
            setLoading(false);
        }
    };

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
                            <h2 className="text-xl font-bold text-white mb-2">{t('forgotPasswordPage.successTitle')}</h2>
                            <p className="text-white/60 text-sm mb-6">
                                {t('forgotPasswordPage.successMessage', { email })}
                            </p>
                            <Link to="/login" className="text-mint-300 font-medium hover:underline">
                                {t('forgotPasswordPage.backToLogin')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-display text-2xl font-bold text-white mb-2">{t('forgotPasswordPage.title')}</h2>
                            <p className="text-white/60 text-sm mb-6">
                                {t('forgotPasswordPage.subtitle')}
                            </p>

                            {erreur && (
                                <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-4 text-sm">
                                    {erreur}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">{t('forgotPasswordPage.emailLabel')}</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mint-400"
                                            placeholder="votre@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {loading ? t('forgotPasswordPage.sending') : t('forgotPasswordPage.sendButton')}
                                </button>
                            </form>

                            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-white/60 hover:text-mint-300 mt-6">
                                <FiArrowLeft /> {t('forgotPasswordPage.backToLogin')}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

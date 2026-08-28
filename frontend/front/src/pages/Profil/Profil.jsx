import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
    modifierProfil, toggleDeuxFacteurs, getProfil, uploaderPhotoProfil,
    modifierProfilRole, getMonProfilRole, uploaderDiplome,
} from '../../services/api';
import Avatar from '../../components/UI/Avatar';
import { FiUser, FiMail, FiShield, FiSave, FiCheck, FiLock, FiChevronRight, FiCamera, FiMapPin, FiAward, FiFileText } from 'react-icons/fi';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const Profil = () => {
    const { t } = useTranslation();
    const { utilisateur, mettreAJourUtilisateur } = useAuth();
    const [form, setForm] = useState({ nom: utilisateur?.nom || '', email: utilisateur?.email || '' });
    const [deuxFA, setDeuxFA] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [formRole, setFormRole] = useState({ region: '', district: '', commune: '', zone_couverture: '', specialite: '' });
    const [loadingRole, setLoadingRole] = useState(false);
    const [uploadingDiplome, setUploadingDiplome] = useState(false);
    const [statutExpert, setStatutExpert] = useState(null);

    useEffect(() => {
        if (utilisateur?.role === 'agriculteur' || utilisateur?.role === 'expert') {
            getMonProfilRole()
                .then((res) => {
                    const p = res.data.data;
                    if (!p) return;
                    setFormRole({
                        region: p.agriculteur_region || '',
                        district: p.agriculteur_district || '',
                        commune: p.agriculteur_commune || '',
                        zone_couverture: p.expert_zone_couverture || '',
                        specialite: p.expert_specialite || '',
                    });
                    setStatutExpert(p.expert_statut || null);
                })
                .catch((err) => console.error(err));
        }
    }, [utilisateur?.role]);

    const handleSubmitRole = async (e) => {
        e.preventDefault();
        setLoadingRole(true);
        setMessage('');
        try {
            await modifierProfilRole(formRole);
            setMessage(t('profilePage.updateSuccess'));
        } catch (err) {
            setMessage(t('profilePage.updateError'));
        } finally {
            setLoadingRole(false);
        }
    };

    const handleDiplomeChange = async (e) => {
        const fichier = e.target.files?.[0];
        if (!fichier) return;
        setUploadingDiplome(true);
        try {
            const formData = new FormData();
            formData.append('diplome', fichier);
            await uploaderDiplome(formData);
            setMessage(t('profilePage.diplomaUploadSuccess'));
        } catch (err) {
            setMessage(t('profilePage.diplomaUploadError'));
        } finally {
            setUploadingDiplome(false);
        }
    };

    const handlePhotoChange = async (e) => {
        const fichier = e.target.files?.[0];
        if (!fichier) return;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', fichier);
            const res = await uploaderPhotoProfil(formData);
            mettreAJourUtilisateur({ photo: res.data.data.utilisateur_photo });
            setMessage(t('profilePage.photoUpdateSuccess'));
        } catch (err) {
            setMessage(t('profilePage.photoUpdateError'));
        } finally {
            setUploadingPhoto(false);
        }
    };

    useEffect(() => {
        getProfil()
            .then((res) => setDeuxFA(!!res.data.data.deux_facteurs_active))
            .catch((err) => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await modifierProfil(form);
            setMessage(t('profilePage.updateSuccess'));
        } catch (err) {
            setMessage(t('profilePage.updateError'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        try {
            await toggleDeuxFacteurs({ activer: !deuxFA });
            setDeuxFA(!deuxFA);
            setMessage(!deuxFA ? t('profilePage.twoFAEnabled') : t('profilePage.twoFADisabled'));
        } catch (err) {
            console.error(err);
        }
    };

    const eyebrow = 'text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3';
    const underline = 'w-full bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:border-mint-400 focus:outline-none pb-2 text-gray-800 dark:text-white placeholder-gray-400 transition-colors';
    const saveBtn = 'flex items-center gap-2 px-5 py-2.5 bg-forest-900 hover:bg-forest-800 dark:bg-mint-400 dark:hover:bg-mint-300 text-white dark:text-forest-950 rounded-xl transition-colors disabled:opacity-50 font-medium text-sm';

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl mx-auto space-y-6">

            <motion.div variants={fadeUp}>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('profilePage.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('profilePage.subtitle')}</p>
            </motion.div>

            {/* Badge d'identite, façon carte professionnelle */}
            <motion.div variants={fadeUp} className="relative bg-gradient-to-br from-primary-700 to-primary-900 rounded-3xl p-8 overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-56 h-56 bg-primary-400/10 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
                <div className="relative flex flex-col items-center gap-3">
                    <label className="relative cursor-pointer group flex-shrink-0">
                        <Avatar utilisateur={utilisateur} className="w-20 h-20 text-2xl ring-4 ring-white/10 shadow-lg" />
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {uploadingPhoto ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <FiCamera className="text-white text-lg" />
                            )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploadingPhoto} />
                    </label>
                    <div>
                        <h2 className="font-serif text-xl font-semibold text-white">{utilisateur?.nom}</h2>
                        <p className="text-xs text-primary-200 mt-0.5">{utilisateur?.email}</p>
                        <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-200 bg-white/10 px-2.5 py-1 rounded-full capitalize">
                            <span className="w-1.5 h-1.5 bg-primary-300 rounded-full"></span>
                            {utilisateur?.role}
                        </span>
                    </div>
                    {utilisateur?.id && (
                        <p className="font-mono text-[10px] text-primary-300/70 tracking-widest mt-1">
                            N° MG-AS-{String(utilisateur.id).padStart(5, '0')}
                        </p>
                    )}
                </div>
            </motion.div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-mint-50 dark:bg-mint-900/20 border border-mint-200 dark:border-mint-800 text-mint-700 dark:text-mint-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                >
                    <FiCheck /> {message}
                </motion.div>
            )}

            {/* Panneau continu, façon carnet : sections separees par des filets, pas de boites empilees */}
            <motion.div variants={fadeUp} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 sm:p-8">

                <div className={eyebrow}>{t('profilePage.personalInfo')}</div>
                <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                        <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><FiUser className="text-sm" /> {t('profilePage.fullName')}</label>
                        <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={underline} />
                    </div>
                    <div>
                        <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><FiMail className="text-sm" /> {t('profilePage.email')}</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={underline} />
                    </div>
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={loading} className={saveBtn}>
                            <FiSave /> {loading ? t('profilePage.saving') : t('profilePage.save')}
                        </button>
                    </div>
                </form>

                {utilisateur?.role === 'agriculteur' && (
                    <>
                        <hr className="my-7 border-gray-100 dark:border-gray-700" />
                        <div className={eyebrow}>{t('profilePage.farmerInfoTitle')}</div>
                        <form onSubmit={handleSubmitRole} className="grid sm:grid-cols-3 gap-x-6 gap-y-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><FiMapPin className="text-sm" /> {t('profilePage.region')}</label>
                                <input type="text" value={formRole.region} onChange={(e) => setFormRole({ ...formRole, region: e.target.value })} className={underline} placeholder={t('profilePage.regionPlaceholder')} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t('profilePage.district')}</label>
                                <input type="text" value={formRole.district} onChange={(e) => setFormRole({ ...formRole, district: e.target.value })} className={underline} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t('profilePage.commune')}</label>
                                <input type="text" value={formRole.commune} onChange={(e) => setFormRole({ ...formRole, commune: e.target.value })} className={underline} />
                            </div>
                            <div className="sm:col-span-3">
                                <button type="submit" disabled={loadingRole} className={saveBtn}>
                                    <FiSave /> {loadingRole ? t('profilePage.saving') : t('profilePage.save')}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {utilisateur?.role === 'expert' && (
                    <>
                        <hr className="my-7 border-gray-100 dark:border-gray-700" />
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${eyebrow} mb-0`}>{t('profilePage.expertInfoTitle')}</div>
                            {statutExpert && (
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    statutExpert === 'valide' ? 'bg-mint-50 text-mint-700 dark:bg-mint-900/20 dark:text-mint-400'
                                    : statutExpert === 'rejete' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                }`}>
                                    {t(`profilePage.statut_${statutExpert}`)}
                                </span>
                            )}
                        </div>
                        <form onSubmit={handleSubmitRole} className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><FiAward className="text-sm" /> {t('profilePage.specialty')}</label>
                                <input type="text" value={formRole.specialite} onChange={(e) => setFormRole({ ...formRole, specialite: e.target.value })} className={underline} placeholder={t('profilePage.specialtyPlaceholder')} />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><FiMapPin className="text-sm" /> {t('profilePage.coverageZone')}</label>
                                <input type="text" value={formRole.zone_couverture} onChange={(e) => setFormRole({ ...formRole, zone_couverture: e.target.value })} className={underline} placeholder={t('profilePage.coverageZonePlaceholder')} />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-4 flex-wrap pt-1">
                                <button type="submit" disabled={loadingRole} className={saveBtn}>
                                    <FiSave /> {loadingRole ? t('profilePage.saving') : t('profilePage.save')}
                                </button>
                                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
                                    {uploadingDiplome ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mint-500" />
                                    ) : (
                                        <FiFileText />
                                    )}
                                    {t('profilePage.uploadDiploma')}
                                    <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={handleDiplomeChange} disabled={uploadingDiplome} />
                                </label>
                            </div>
                        </form>
                    </>
                )}

                <hr className="my-7 border-gray-100 dark:border-gray-700" />
                <div className={eyebrow}>{t('profilePage.security')}</div>
                <Link to="/forgot-password" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-mint-600 dark:hover:text-mint-400 transition-colors group w-fit">
                    <FiLock className="text-sm" /> {t('profilePage.changePassword') || 'Changer le mot de passe'}
                    <FiChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-xs text-gray-400 mt-1 ml-6">{t('profilePage.changePasswordDesc') || 'Vous recevrez un lien par email'}</p>

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <FiShield className="text-primary-600 dark:text-mint-400 text-lg flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{t('profilePage.twoFATitle')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('profilePage.twoFADescription')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggle2FA}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${deuxFA ? 'bg-mint-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm ${deuxFA ? 'translate-x-6' : ''}`}
                        ></motion.span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Profil;
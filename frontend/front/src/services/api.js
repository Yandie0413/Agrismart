import axios from 'axios';
import { sauvegarderCache, lireCache } from '../utils/cacheHorsLigne';

const API = axios.create({
    baseURL: 'http://localhost:3000/api',
});

// Ajouter le token automatiquement a chaque requete
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Mode hors-ligne (module transversal 0) : on met en cache la derniere reponse reussie de
// chaque GET, et on la relit si la meme requete echoue faute de reseau (météo/calendrier/prix
// restent consultables hors-ligne). Les erreurs HTTP normales (401, 404, validation...) ne sont
// jamais masquees par le cache : seule l'absence de reponse (`error.response` undefined, donc
// coupure reseau) declenche le repli.
API.interceptors.response.use(
    (response) => {
        if (response.config.method === 'get') {
            sauvegarderCache(response.config.url, response.data);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('utilisateur');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (!error.response && error.config?.method === 'get') {
            const cache = lireCache(error.config.url);
            if (cache) {
                return Promise.resolve({ data: cache.data, depuisCache: true, dateCache: cache.date });
            }
        }

        return Promise.reject(error);
    }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const verifierOTP = (data) => API.post('/auth/verifier-otp', data);
export const demanderReset = (data) => API.post('/auth/demander-reset', data);
export const reinitialiserMotDePasse = (data) => API.post('/auth/reinitialiser-mot-de-passe', data);
export const getProfil = () => API.get('/auth/profil');
export const toggleDeuxFacteurs = (data) => API.put('/auth/2fa', data);

// Statistiques publiques (page d'accueil, sans authentification)
export const getStatistiquesPubliques = () => API.get('/profil/stats-publiques');

// Profil & Dashboard
export const getDashboard = () => API.get('/profil/dashboard');
export const modifierProfil = (data) => API.put('/profil/modifier', data);
export const uploaderPhotoProfil = (formData) => API.post('/auth/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getStatistiques = () => API.get('/profil/statistiques');
export const getUtilisateurs = () => API.get('/profil/utilisateurs');
export const getDetailUtilisateur = (id) => API.get(`/profil/utilisateurs/${id}/detail`);
export const supprimerUtilisateur = (id) => API.delete(`/profil/utilisateurs/${id}`);
export const modifierRoleUtilisateur = (id, role) => API.put(`/profil/utilisateurs/${id}/role`, { role });
export const modifierProfilRole = (data) => API.put('/profil/modifier-role', data);
export const getMonProfilRole = () => API.get('/profil/mon-profil-role');
export const uploaderDiplome = (formData) => API.post('/auth/diplome', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getExpertsEnAttente = () => API.get('/profil/experts-en-attente');
export const validerExpert = (id, statut) => API.put(`/profil/utilisateurs/${id}/valider-expert`, { statut });

// Exploitations
export const getExploitations = () => API.get('/exploitations');
export const createExploitation = (data) => API.post('/exploitations', data);
export const updateExploitation = (id, data) => API.put(`/exploitations/${id}`, data);
export const deleteExploitation = (id) => API.delete(`/exploitations/${id}`);
export const uploadImageExploitation = (id, formData) => API.post(`/exploitations/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Cultures
export const getCultures = (exploitationId) => API.get(`/exploitations/${exploitationId}/cultures`);
export const createCulture = (exploitationId, data) => API.post(`/exploitations/${exploitationId}/cultures`, data);
export const updateCulture = (id, data) => API.put(`/cultures/${id}`, data);
export const deleteCulture = (id) => API.delete(`/cultures/${id}`);
export const getCalendrier = (exploitationId) => API.get(`/cultures/exploitation/${exploitationId}/calendrier`);
export const getRendement = (id) => API.get(`/cultures/${id}/rendement`);
export const getTachesCulture = (cultureId) => API.get(`/cultures/${cultureId}/taches`);
export const terminerTache = (id) => API.put(`/cultures/taches/${id}/terminer`);

// Parcelles
export const getParcelles = (exploitationId) => API.get(`/exploitations/${exploitationId}/parcelles`);
export const createParcelle = (exploitationId, data) => API.post(`/exploitations/${exploitationId}/parcelles`, data);
export const updateParcelle = (id, data) => API.put(`/parcelles/${id}`, data);
export const deleteParcelle = (id) => API.delete(`/parcelles/${id}`);

// Conseils
export const getConseils = () => API.get('/conseils');
export const createConseil = (data) => API.post('/conseils', data);
export const updateConseil = (id, data) => API.put(`/conseils/${id}`, data);
export const deleteConseil = (id) => API.delete(`/conseils/${id}`);
export const archiverConseil = (id) => API.put(`/conseils/${id}/archiver`);
export const genererConseilsAutomatiques = () => API.post('/conseils/generer', {});
export const getBaseSymptomes = () => API.get('/conseils/base-symptomes');
export const diagnostiquer = (data) => API.post('/conseils/diagnostic', data);
export const validerDiagnostic = (id, valide) => API.put(`/conseils/${id}/valider-diagnostic`, { valide });

// Meteo
export const getMeteoTempsReel = (ville) => API.get(`/meteo/temps-reel/${ville}`);
export const getPrevisions = (ville) => API.get(`/meteo/previsions/${ville}`);
export const getPrevisionsAvancees = (ville) => API.get(`/meteo/previsions-avancees/${ville}`);
export const getAlertes = () => API.get('/meteo/alertes/toutes');
export const getMesAlertesRegion = () => API.get('/meteo/alertes/ma-region');
export const declencherAlerteRegionale = (data) => API.post('/meteo/alertes/regionale', data);
export const genererAlertesTempsReel = (ville) => API.post(`/meteo/alertes/temps-reel/${ville}`);

// Messages
export const getMessages = () => API.get('/messages/non-lus');
export const getConversation = (userId) => API.get(`/messages/conversation/${userId}`);
export const envoyerMessage = (data) => API.post('/messages', data);
export const marquerLu = (id) => API.put(`/messages/${id}/lu`);
export const getTousUtilisateurs = () => API.get('/profil/contacts');
export const partagerDocument = (formData) => API.post('/messages/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
// Notifications
export const getNotifications = () => API.get('/notifications');
export const getNonLuesCount = () => API.get('/notifications/non-lues');
export const marquerNotificationLue = (id) => API.put(`/notifications/${id}/lue`);
export const marquerToutesNotificationsLues = () => API.put('/notifications/toutes-lues');
export const supprimerNotification = (id) => API.delete(`/notifications/${id}`);

// Marches
export const getMarches = () => API.get('/marches');
export const signalerPrix = (marcheId, raison) => API.post(`/marches/marches/${marcheId}/signaler`, { raison });
export const getSignalementsPrix = () => API.get('/marches/signalements/toutes');
export const traiterSignalementPrix = (id, statut) => API.put(`/marches/signalements/${id}/traiter`, { statut });
export const createProduit = (data) => API.post('/marches', data);
export const getHistoriquePrix = (id, periode) => API.get(`/marches/${id}/historique-prix${periode ? `?periode=${periode}` : ''}`);
export const ajouterMarche = (produitId, data) => API.post(`/marches/${produitId}/marches`, data);
export const creerOffreVente = (data) => API.post('/marches/offres', data);
export const getOffresVente = () => API.get('/marches/offres');
export const modifierStatutOffre = (id, statut) => API.put(`/marches/offres/${id}/statut`, { statut });

// Forum
export const getSujetsForum = () => API.get('/forum');
export const getSujetForum = (id) => API.get(`/forum/${id}`);
export const creerSujetForum = (data) => API.post('/forum', data);
export const supprimerSujetForum = (id) => API.delete(`/forum/${id}`);
export const repondreSujetForum = (id, data) => API.post(`/forum/${id}/reponses`, data);
export const supprimerReponseForum = (id) => API.delete(`/forum/reponses/${id}`);
export const likerSujetForum = (id) => API.post(`/forum/${id}/like`);
export const likerReponseForum = (id) => API.post(`/forum/reponses/${id}/like`);

// Localisations
export const getLocalisations = () => API.get('/localisations');
export const getToutesLocalisations = () => API.get('/localisations/toutes');
export const getLocalisation = (id) => API.get(`/localisations/${id}`);
export const creerLocalisation = (data) => API.post('/localisations', data);
export const modifierLocalisation = (id, data) => API.put(`/localisations/${id}`, data);
export default API;
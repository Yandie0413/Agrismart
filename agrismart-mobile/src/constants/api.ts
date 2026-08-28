export const API_BASE_URL = 'http://localhost:3000/api';

// Les fichiers uploades (photos, documents) sont servis a la racine, pas sous /api
export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
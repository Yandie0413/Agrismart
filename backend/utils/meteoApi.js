const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

function versRadians(degres) {
    return (degres * Math.PI) / 180;
}

function jourDeLAnnee(dateStr) {
    const date = new Date(dateStr);
    const debutAnnee = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - debutAnnee) / (1000 * 60 * 60 * 24));
}

// Rayonnement extraterrestre Ra, converti en mm/jour equivalent (formule FAO-56, Allen et al. 1998).
// Necessaire pour l'equation de Hargreaves faute de capteur de rayonnement reel.
function calculerRa(latitudeDeg, jour) {
    const lat = versRadians(latitudeDeg);
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI * jour) / 365);
    const delta = 0.409 * Math.sin((2 * Math.PI * jour) / 365 - 1.39);
    const argument = -Math.tan(lat) * Math.tan(delta);
    const ws = Math.acos(Math.min(1, Math.max(-1, argument)));
    const Gsc = 0.0820; // constante solaire, MJ m-2 min-1
    const raMJ = ((24 * 60) / Math.PI) * Gsc * dr *
        (ws * Math.sin(lat) * Math.sin(delta) + Math.cos(lat) * Math.cos(delta) * Math.sin(ws));
    return raMJ * 0.408; // MJ m-2 jour-1 -> mm/jour equivalent d'evaporation
}

// Evapotranspiration de reference (ET0) par la methode Hargreaves-Samani : estimation a partir
// des seules temperatures min/max, sans donnees de rayonnement ou de vent reelles (non fournies
// par l'offre gratuite OpenWeatherMap). Tmoy suit la convention standard (Tmax+Tmin)/2.
function calculerET0(tempMin, tempMax, ra) {
    const tempMoy = (tempMin + tempMax) / 2;
    const ecart = Math.max(0, tempMax - tempMin);
    const et0 = 0.0023 * ra * (tempMoy + 17.8) * Math.sqrt(ecart);
    return Math.round(Math.max(0, et0) * 100) / 100;
}

function normaliser(valeur, min, max) {
    if (max === min) return 0;
    return Math.min(100, Math.max(0, Math.round(((valeur - min) / (max - min)) * 100)));
}

// Score gradue de risque de gel (0-100), calibre pour valoir 50% au seuil d'alerte historique (5C) :
// 0% a partir de 10C, 100% a 0C et en dessous.
function risqueGel(temperature) {
    return normaliser(10 - temperature, 0, 10);
}

// Score gradue de risque de secheresse (0-100), combine chaleur et faible humidite via un minimum
// (logique ET, fidele au couple de seuils historique temp>32C ET humidite<30%, chacun a 50% a son seuil).
function risqueSecheresse(temperature, humidite) {
    const scoreTemp = normaliser(temperature - 25, 0, 14);
    const scoreHumidite = normaliser(40 - humidite, 0, 20);
    return Math.min(scoreTemp, scoreHumidite);
}

// Temperature du sol : aucune donnee reelle de capteur sur l'offre gratuite OpenWeatherMap,
// approximee par temperature de l'air - 3C (toujours signalee comme estimation au frontend).
function estimerTemperatureSol(temperature) {
    return Math.round((temperature - 3) * 10) / 10;
}

function agregerPrevisionsJournalieres(data) {
    const latitude = data.city?.coord?.lat ?? 0;
    const parJour = {};
    data.list.forEach((item) => {
        const dateStr = item.dt_txt.split(' ')[0];
        if (!parJour[dateStr]) parJour[dateStr] = [];
        parJour[dateStr].push(item);
    });

    // Limite honnete a l'offre gratuite OpenWeatherMap ("/forecast") : 5 jours, pas 7.
    return Object.entries(parJour).map(([dateStr, items]) => {
        const tempMin = Math.min(...items.map((i) => i.main.temp_min));
        const tempMax = Math.max(...items.map((i) => i.main.temp_max));
        const humiditeMoy = Math.round(
            items.reduce((acc, i) => acc + i.main.humidity, 0) / items.length
        );
        const pluieTotale = items.reduce((acc, i) => acc + (i.rain?.['3h'] ?? 0), 0);

        const ra = calculerRa(latitude, jourDeLAnnee(dateStr));
        const tempMoy = (tempMin + tempMax) / 2;

        return {
            date: dateStr,
            temperature_min: Math.round(tempMin * 10) / 10,
            temperature_max: Math.round(tempMax * 10) / 10,
            humidite_moyenne: humiditeMoy,
            pluie_totale_mm: Math.round(pluieTotale * 10) / 10,
            et0_estime_mm: calculerET0(tempMin, tempMax, ra),
            et0_note: "Estimation Hargreaves a partir des temperatures min/max prevues, pas une mesure directe",
            temperature_sol_estimee: estimerTemperatureSol(tempMoy),
            temperature_sol_estimation: true,
            risque_gel: risqueGel(tempMin),
            risque_secheresse: risqueSecheresse(tempMax, humiditeMoy),
        };
    });
}

const meteoApi = {

    async parVille(ville) {
        const response = await axios.get(`${BASE_URL}/weather`, {
            params: { q: ville, appid: API_KEY, units: 'metric', lang: 'fr' }
        });
        const temperature = response.data.main.temp;
        return {
            ville: response.data.name,
            pays: response.data.sys.country,
            temperature,
            temperature_ressentie: response.data.main.feels_like,
            humidite: response.data.main.humidity,
            pression: response.data.main.pressure,
            visibilite: response.data.visibility,
            description: response.data.weather[0].description,
            vitesse_vent: response.data.wind.speed,
            // Pluviometrie reelle (mm sur la derniere heure), 0 s'il ne pleut pas
            pluviometrie: response.data.rain?.['1h'] ?? response.data.rain?.['3h'] ?? 0,
            temperature_sol_estimee: estimerTemperatureSol(temperature),
            temperature_sol_estimation: true,
            risque_gel: risqueGel(temperature),
            risque_secheresse: risqueSecheresse(temperature, response.data.main.humidity),
            date: new Date().toISOString()
        };
    },

    async parCoordonnees(latitude, longitude) {
        const response = await axios.get(`${BASE_URL}/weather`, {
            params: { lat: latitude, lon: longitude, appid: API_KEY, units: 'metric', lang: 'fr' }
        });
        const temperature = response.data.main.temp;
        return {
            ville: response.data.name,
            pays: response.data.sys.country,
            temperature,
            temperature_ressentie: response.data.main.feels_like,
            humidite: response.data.main.humidity,
            pression: response.data.main.pressure,
            visibilite: response.data.visibility,
            description: response.data.weather[0].description,
            vitesse_vent: response.data.wind.speed,
            pluviometrie: response.data.rain?.['1h'] ?? response.data.rain?.['3h'] ?? 0,
            temperature_sol_estimee: estimerTemperatureSol(temperature),
            temperature_sol_estimation: true,
            risque_gel: risqueGel(temperature),
            risque_secheresse: risqueSecheresse(temperature, response.data.main.humidity),
            date: new Date().toISOString()
        };
    },

    async previsions(ville) {
        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: { q: ville, appid: API_KEY, units: 'metric', lang: 'fr' }
        });
        return response.data.list.map(item => ({
            date: item.dt_txt,
            temperature: item.main.temp,
            temp_min: item.main.temp_min,
            temp_max: item.main.temp_max,
            humidite: item.main.humidity,
            description: item.weather[0].description,
            vitesse_vent: item.wind.speed
        }));
    },

    // Previsions journalieres avancees (ET0, temperature du sol estimee, risques gradues) :
    // agregation par jour de la meme reponse "/forecast" (5 jours, 3h par pas), pas un nouvel appel.
    async previsionsAvancees(ville) {
        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: { q: ville, appid: API_KEY, units: 'metric', lang: 'fr' }
        });
        return agregerPrevisionsJournalieres(response.data);
    },

    async previsionsAvanceesParCoordonnees(latitude, longitude) {
        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: { lat: latitude, lon: longitude, appid: API_KEY, units: 'metric', lang: 'fr' }
        });
        return agregerPrevisionsJournalieres(response.data);
    }
};

module.exports = meteoApi;

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/profil',         require('./routes/profilRoutes'));
app.use('/api/exploitations',  require('./routes/exploitationRoutes'));
app.use('/api/cultures',       require('./routes/cultureRoutes'));
app.use('/api/parcelles',      require('./routes/parcelleRoutes'));
app.use('/api/localisations',  require('./routes/localisationRoutes'));
app.use('/api/conseils',       require('./routes/conseilRoutes'));
app.use('/api/meteo',          require('./routes/meteoRoutes'));
app.use('/api/messages',       require('./routes/messageRoutes'));
app.use('/api/marches',        require('./routes/produitRoutes'));
app.use('/api/notifications',  require('./routes/notificationRoutes'));
app.use('/api/forum',          require('./routes/forumRoutes'));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({ message: 'API Agri-Backend operationnelle' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
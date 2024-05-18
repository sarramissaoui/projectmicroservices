const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/reservation'); // Connexion à MongoDB
    console.log('Connecté à MongoDB');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1); // Quitte le processus en cas d'erreur de connexion
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  adresse: {
    type: String,
    required: true,
  },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation; // Assurez-vous que le modèle est bien exporté

//produit.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chambreSchema = new Schema({
  nom: {
    type: String,
    required: true, // Champs obligatoires
  },
  description: {
    type: String,
    required: true,
  },
  qualite: {
    type: String,
    required: true,
  },
});

const Chambre= mongoose.model('chambre', chambreSchema);

module.exports = Chambre;


const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Chambre = require('./chambre'); // Modèle Mongoose pour les chambres
const { sendChambreMessage } = require('./ChambreProducer');

// Chemin vers le fichier Protobuf
const chambreProtoPath = './chambre.proto';

// Charger le Protobuf
const chambreProtoDefinition = protoLoader.loadSync(chambreProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Chambre du package gRPC
const chambreProto = grpc.loadPackageDefinition(chambreProtoDefinition).chambre;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vente') // Utilisez IPv4 pour éviter les problèmes
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitte le processus en cas d'erreur
  });

// Implémentation du service gRPC pour les chambres
const chambreService = {
  getChambre: async (call, callback) => {
    try {
      const chambreId = call.request.chambre_id;
      const chambre = await Chambre.findById(chambreId);

      if (!chambre) {
        return callback(new Error("Chambre non trouvée"));
      }

      callback(null, { chambre });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche de la chambre"));
    }
  },

  searchChambres: async (call, callback) => {
    try {
      const chambres = await Chambre.find();
      callback(null, { chambres });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des chambres"));
    }
  },

  createChambre: async (call, callback) => {
    try {
      const { nom, description, qualite } = call.request;
      const nouvelleChambre = new Chambre({ nom, description, qualite });
      const chambre = await nouvelleChambre.save();
      
      await sendChambreMessage('creation', { id: chambre._id, nom, qualite });
  
      callback(null, { chambre });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  updateChambre: async (call, callback) => {
    try {
      const { chambre_id, nom, description, qualite } = call.request; // Changement de 'produit_id' à 'id'
      const chambre = await Chambre.findByIdAndUpdate(
        chambre_id,
        { nom, description, qualite },
        { new: true }
      );

      if (!chambre) {
        // Si la chambre n'est pas trouvée, renvoie un statut NOT_FOUND gRPC
        return callback({ code: grpc.status.NOT_FOUND, message: "Chambre non trouvée" });
      }

      // Si la chambre est trouvée, envoyer les données de la chambre mise à jour
      await sendChambreMessage('modification', chambre);
      callback(null, { chambre });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la chambre:", err);
      // Si une autre erreur se produit, renvoie un statut gRPC INTERNAL
      callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la mise à jour de la chambre: " + err.message });
    }
  },

  deleteChambre: async (call, callback) => {
    try {
      const chambreId = call.request.chambre_id;
      const chambre = await Chambre.findByIdAndDelete(chambreId);

      if (!chambre) {
        return callback(new Error("Chambre non trouvée"));
      }

      // Envoyer un événement Kafka pour la suppression d'une chambre
      await sendChambreMessage('suppression', chambre);

      callback(null, { message: "Chambre supprimée avec succès" });
    } catch (err) {
      callback(new Error("Erreur lors de la suppression de la chambre: " + err.message));
    }
  },
};

// Créer le serveur gRPC
const server = new grpc.Server();
server.addService(chambreProto.ChambreService.service, chambreService);

server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Chambre opérationnel sur le port ${boundPort}`);
});

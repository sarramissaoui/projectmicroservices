const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Reservation = require('./reservation'); // Modèle Mongoose pour les réservations
const { sendReservationMessage } = require('./ReservationProducer'); // Producteur Kafka pour les réservations

// Chemin vers le fichier Protobuf
const reservationProtoPath = './reservation.proto';

// Charger le Protobuf
const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Reservation du package gRPC
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vente') // Utilisez IPv4 pour éviter les problèmes
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitte le processus en cas d'erreur
  });

// Implémentation du service gRPC pour les réservations
const reservationService = {
  getReservation: async (call, callback) => {
    try {
      const reservationId = call.request.reservation_id;
      const reservation = await Reservation.findById(reservationId);

      if (!reservation) {
        return callback(new Error("Réservation non trouvée"));
      }

      callback(null, { reservation });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche de la réservation"));
    }
  },

  searchReservations: async (call, callback) => {
    try {
      const reservations = await Reservation.find();
      callback(null, { reservations });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des réservations"));
    }
  },
  
  createReservation: async (call, callback) => {
    try {
      const { nom, contact,adresse } = call.request;
      const nouvelleReservation = new Reservation({ nom, contact,adresse}); // Corrected from 'reservation' to 'Reservation'
      const reservation = await nouvelleReservation.save();
      
      await sendReservationMessage('creation', { id: reservation._id, nom, contact,adresse});
  
      callback(null, { reservation });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  
  updateReservation: async (call, callback) => {
    try {
        const { id, nom, contact, adresse } = call.request; // Change from 'reservation_id' to 'id'
        const reservation = await Reservation.findByIdAndUpdate(
            id, // Change from 'reservation_id' to 'id'
            { nom, contact, adresse },
            { new: true }
        );
  
        if (!reservation) {
            // Si la réservation n'est pas trouvée, renvoie un statut NOT_FOUND gRPC
            return callback({ code: grpc.status.NOT_FOUND, message: "Réservation non trouvée" });
        }
  
        // Si la réservation est trouvée, envoyer les données de la réservation mise à jour
        await sendReservationMessage('modification', reservation);
        callback(null, { reservation });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la réservation:", err);
        // Si une autre erreur se produit, renvoie un statut gRPC INTERNAL
        callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la mise à jour de la réservation: " + err.message });
    }
  },
  
  deleteReservation: async (call, callback) => {
    try {
      const reservationId = call.request.id; // Update to match the request parameter name
      console.log("Deleting reservation with ID:", reservationId);

      const reservation = await Reservation.findByIdAndDelete(reservationId);

      if (!reservation) {
        console.log("Réservation not found for deletion");
        return callback(new Error("Réservation non trouvée"));
      }

      // Envoyer un événement Kafka pour la suppression d'une réservation
      await sendReservationMessage('suppression', reservation);

      console.log("Réservation deleted successfully");
      callback(null, { message: "Réservation supprimée avec succès" });
    } catch (err) {
      console.error("Error deleting reservation:", err);
      callback(new Error("Erreur lors de la suppression de la réservation: " + err.message));
    }
  },
};

// Créer le serveur gRPC
const server = new grpc.Server();
server.addService(reservationProto.ReservationService.service, reservationService);

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Réservation opérationnel sur le port ${boundPort}`);
});

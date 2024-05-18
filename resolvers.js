const { ApolloError } = require('apollo-server');
const Chambre = require('./chambre');
const Reservation = require('./reservation');
const Client = require('./client');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendChambreMessage } = require('./ChambreProducer');
const { sendClientMessage } = require('./clientProducer');
const { sendReservationMessage } = require('./ReservationProducer');

const chambreProtoPath = './chambre.proto';
const reservationProtoPath = './reservation.proto';
const clientProtoPath = './client.proto';

const chambreProtoDefinition = protoLoader.loadSync(chambreProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const chambreProto = grpc.loadPackageDefinition(chambreProtoDefinition).chambre;
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

const clientChambre = new chambreProto.ChambreService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const clientReservation = new reservationProto.ReservationService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

const clientClient = new clientProto.ClientService(
  'localhost:50054',
  grpc.credentials.createInsecure()
);

const resolvers = {
  Query: {
    chambre: async (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientChambre.getChambre({ chambre_id: id }, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche de la chambre: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.chambre);
          }
        });
      });
    },
    
    chambres: async () => {
      return new Promise((resolve, reject) => {
        clientChambre.getChambres({}, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche des chambres: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.chambres);
          }
        });
      });
    },

    reservation: async (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientReservation.getReservation({ reservation_id: id }, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche de la réservation: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.reservation);
          }
        });
      });
    },

    client: async (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientClient.getClient({ client_id: id }, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche du client: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.client);
          }
        });
      });
    },

    clients: async () => {
      return new Promise((resolve, reject) => {
        clientClient.getClients({}, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche des clients: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.clients);
          }
        });
      });
    },
  },

  Mutation: {
    createChambre: async (_, { nom, description, qualite }) => {
      return new Promise((resolve, reject) => {
      clientChambre.createChambre({ nom, description, qualite }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la création de la chambre: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const chambre = response.chambre;
      await sendChambreMessage('creation', { id: chambre.id, nom, description, qualite });
      resolve(chambre);
      }
      });
      });
      },
      deleteChambre: async (_, { id }) => {
      return new Promise((resolve, reject) => {
      clientChambre.deleteChambre({ chambre_id: id }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la suppression de la chambre: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      if (response.message !== "Chambre supprimée avec succès") {
      reject(new ApolloError("Chambre non trouvée", "NOT_FOUND"));
      } else {
      await sendChambreMessage('suppression', { id });
      resolve(response.message);
      }
      }
      });
      });
      },
      updateChambre: async (_, { id, nom, description, qualite }) => {
      return new Promise((resolve, reject) => {
      clientChambre.updateChambre({ chambre_id: id, nom, description, qualite }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la mise à jour de la chambre: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const chambre = response.chambre;
      await sendChambreMessage('modification', { id: chambre.id, nom, description, qualite });
      resolve(chambre);
      }
      });
      });
      },
      createReservation: async (_, { nom, contact, adresse }) => {
      return new Promise((resolve, reject) => {
      clientReservation.createReservation({ nom, contact, adresse }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la création de la réservation: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const reservation = response.reservation;
      await sendReservationMessage('creation', { id: reservation.id, nom, contact, adresse });
      resolve(reservation);
      }
      });
      });
      },
      deleteReservation: async (_, { id }) => {
      return new Promise((resolve, reject) => {
      clientReservation.deleteReservation({ reservation_id: id }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la suppression de la réservation: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      if (response.message !== "Réservation supprimée avec succès") {
      reject(new ApolloError("Réservation non trouvée", "NOT_FOUND"));
      } else {
      await sendReservationMessage('suppression', { id });
      resolve(response.message);
      }
      }
      });
      });
      },
      updateReservation: async (_, { id, nom, contact, adresse }) => {
      return new Promise((resolve, reject) => {
      clientReservation.updateReservation({ reservation_id: id, nom, contact, adresse }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la mise à jour de la réservation: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const reservation = response.reservation;
      await sendReservationMessage('modification', { id: reservation.id, nom, contact, adresse });
      resolve(reservation);
      }
      });
      });
      },
      createClient: async (_, { nom, email, password }) => {
      return new Promise((resolve, reject) => {
      clientClient.createClient({ nom, email, password }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la création du client: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const client = response.client;
      await sendClientMessage('creation', { id: client.id, nom, email, password });
      resolve(client);
      }
      });
      });
      },
      deleteClient: async (_, { id }) => {
      return new Promise((resolve, reject) => {
      clientClient.deleteClient({ client_id: id }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la suppression du client: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      if (response.message !== "Client supprimé avec succès") {
      reject(new ApolloError("Client non trouvé", "NOT_FOUND"));
      } else {
      await sendClientMessage('suppression', { id });
      resolve(response.message);
      }
      }
      });
      });
      },
      updateClient: async (_, { id, nom, email, password }) => {
      return new Promise((resolve, reject) => {
      clientClient.updateClient({ client_id: id, nom, email, password }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const client = response.client;
      await sendClientMessage('modification', { id: client.id, nom, email, password });
      resolve(client);
      }
      });
      });
      },
      },
      };
      
module.exports = resolvers;

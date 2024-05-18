const { Kafka } = require('kafkajs'); // Importer le module Kafka

// Configuration du client Kafka
const kafka = new Kafka({
  clientId: 'reservation-consumer', // Identifiant du client Kafka
  brokers: ['localhost:9092'], // Liste des brokers Kafka
});

// Création du consommateur Kafka
const consumer = kafka.consumer({ groupId: 'reservation-group' }); // Groupe de consommateurs

// Fonction pour exécuter le consommateur Kafka
const run = async () => {
  try {
    await consumer.connect(); // Connexion au broker Kafka
    await consumer.subscribe({ topic: 'reservation-events', fromBeginning: true }); // S'abonner au topic des événements de réservation
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString()); // Convertir le message en JSON
        console.log('Received reservation event:', event); // Afficher le message reçu

        // Traiter l'événement de réservation en fonction du type d'événement
        switch (event.eventType) {
          case 'creation':
            handleReservationCreation(event.reservationData); // Gérer la création de réservation
            break;
          case 'modification':
            handleReservationModification(event.reservationData); // Gérer la modification de réservation
            break;
          case 'suppression':
            handleReservationSuppression(event.reservationData); // Gérer la suppression de réservation
            break;
          default:
            console.warn('Event type not recognized:', event.eventType); // Avertir en cas de type inconnu
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error); // Gérer les erreurs
  }
};

// Logique pour gérer la création de réservation
const handleReservationCreation = (reservationData) => {
  console.log('Handling reservation creation event:', reservationData);
  // Ajoutez votre logique pour gérer la création de réservation ici
};

// Logique pour gérer la modification de réservation
const handleReservationModification = (reservationData) => {
  console.log('Handling reservation modification event:', reservationData);
  // Ajoutez votre logique pour gérer la modification de réservation ici
};

// Logique pour gérer la suppression de réservation
const handleReservationSuppression = (reservationData) => {
  console.log('Handling reservation suppression event:', reservationData);
  // Ajoutez votre logique pour gérer la suppression de réservation ici
};

// Exécuter le consommateur Kafka
run().catch(console.error); // Gérer les erreurs globales

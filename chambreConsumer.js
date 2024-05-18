const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'chambre-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'chambre-group' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'chambre-events', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log('Received chambre event:', event);
        // Traitez l'événement de chambre ici en fonction de l'événement reçu (création, modification, suppression, etc.)
        // Exemple : Appelez les fonctions appropriées pour gérer les événements de chambre
        switch (event.eventType) {
          case 'creation':
            handleChambreCreation(event.chambreData);
            break;
          case 'modification':
            handleChambreModification(event.chambreData);
            break;
          case 'suppression':
            handleChambreSuppression(event.chambreData);
            break;
          default:
            console.warn('Event type not recognized:', event.eventType);
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error);
  }
};

const handleChambreCreation = (chambreData) => {
  console.log('Handling chambre creation event:', chambreData);
  // Logique pour gérer la création de chambre ici
};

const handleChambreModification = (chambreData) => {
  console.log('Handling chambre modification event:', chambreData);
  // Logique pour gérer la modification de chambre ici
};

const handleChambreSuppression = (chambreData) => {
  console.log('Handling chambre suppression event:', chambreData);
  // Logique pour gérer la suppression de chambre ici
};

run().catch(console.error);

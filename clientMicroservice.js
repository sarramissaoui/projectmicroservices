//clientMicroservice
const grpc = require('@grpc/grpc-js'); // For gRPC
const protoLoader = require('@grpc/proto-loader'); // For loading Protobuf
const mongoose = require('mongoose'); // For MongoDB
const Client = require('./client'); // Mongoose model for clients
const { sendClientMessage } = require('./clientProducer'); // Kafka producer for clients

// Path to the Protobuf file
const clientProtoPath = './client.proto';

// Load the Protobuf
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the gRPC client service package
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vente') // Use IPv4 to avoid issues
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process in case of error
  });

// gRPC service implementation for clients
const clientService = {
  getClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findById(clientId);

      if (!client) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Client not found" });
      }

      callback(null, { client });
    } catch (err) {
      console.error("Error fetching client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error fetching client" });
    }
  },

  searchClients: async (call, callback) => {
    try {
      const clients = await Client.find();
      callback(null, { clients });
    } catch (err) {
      console.error("Error searching clients:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error searching clients" });
    }
  },

  createClient: async (call, callback) => {
    try {
      const { nom,  email ,password} = call.request;
      const nouveauClient = new Client({ nom,  email ,password });
      const client = await nouveauClient.save();

      await sendClientMessage('creation', client);

      callback(null, { client });
    } catch (err) {
      console.error("Error creating client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error creating client" });
    }
  },

  updateClient: async (_, { id, nom, email, password }) => {
    try {
      // Recherche du client par son ID
      const client = await Client.findById(id);
      
      // Vérifier si le client existe
      if (!client) {
        throw new ApolloError("Client non trouvé", "NOT_FOUND");
      }
  
      // Mettre à jour les propriétés du client
      client.nom = nom;
      client.email = email;
      client.password = password;
  
      // Sauvegarder les modifications
      await client.save();
  
      // Retourner le client mis à jour
      return client;
    } catch (error) {
      // Attraper et renvoyer une erreur Apollo avec un message approprié
      throw new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, "INTERNAL_ERROR");
    }
  },
  

  deleteClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findByIdAndDelete(clientId);

      if (!client) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Client not found" });
      }

      await sendClientMessage('suppression', client);

      callback(null, { message: "Client deleted successfully" });
    } catch (err) {
      console.error("Error deleting client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error deleting client: " + err.message });
    }
  },
};


// Create the gRPC server
// Créer le serveur gRPC
const server = new grpc.Server();

// Ajouter le service client au serveur
server.addService(clientProto.ClientService.service, clientService);

// Lier le serveur au port spécifié
const PORT = 50060; // Nouveau port
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Failed to bind server:", err);
    return;
  }
  server.start();
  console.log(`Client Service operational on port ${boundPort}`);
});


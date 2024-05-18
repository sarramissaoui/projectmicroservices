const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const connectDB = require('./database');

// Connecter à la base de données MongoDB
connectDB();

// Créer un serveur Apollo GraphQL
const server = new ApolloServer({ typeDefs, resolvers });

// Démarrer le serveur
server.listen().then(({ url }) => {
  console.log(`🚀 Serveur GraphQL prêt à l'adresse ${url}`);
});
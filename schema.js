//schema
const { gql } = require('@apollo/server');

const typeDefs = `#graphql
    type Chambre {
        id: String!
        nom: String!
        description: String!
        qualite: String!
    }

    type Reservation {
        id: String!
        nom: String!
        contact: String!
        adresse: String!
    }
  
    type Client {
        id: String!
        nom: String!
        email: String!
        password: String! # Inclure le champ password
    }

    type Query {
        chambre(id: String!): Chambre
        chambres: [Chambre]
        reservation(id: String!): Reservation
        reservations: [Reservation]
        client(id: String!): Client
        clients: [Client]
    }

    type Mutation {
        createChambre(nom: String!, description: String!, qualite: String!): Chambre
        deleteChambre(id: String!): String
        updateChambre(id: String!, nom: String!, description: String!, qualite: String!): Chambre

        createReservation(nom: String!, contact: String!, adresse: String!): Reservation
        deleteReservation(id: String!): String
        updateReservation(id: String!, nom: String!, contact: String!, adresse: String!): Reservation

        createClient(nom: String!, email: String!, password: String!): Client
        deleteClient(id: String!): String
        updateClient(id: String!, nom: String!, email: String!, password: String!): Client
    }
`;

module.exports = typeDefs;

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const connectDB = require('./database');
const Chambre = require('./chambre');
const Reservation = require('./reservation');
const Client = require('./client');
const { sendChambreMessage } = require('./ChambreProducer');
const { sendClientMessage } = require('./clientProducer');
const { sendReservationMessage } = require('./ReservationProducer');

const app = express();

connectDB();

app.use(cors());
app.use(bodyParser.json());

const chambreProtoDefinition = protoLoader.loadSync('chambre.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const reservationProtoDefinition = protoLoader.loadSync('reservation.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const clientProtoDefinition = protoLoader.loadSync('client.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const chambreProto = grpc.loadPackageDefinition(chambreProtoDefinition).chambre;
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

const clientChambre = new chambreProto.ChambreService('localhost:50052', grpc.credentials.createInsecure());
const reservationClient = new reservationProto.ReservationService('localhost:50053', grpc.credentials.createInsecure());
const clientClient = new clientProto.ClientService('localhost:50054', grpc.credentials.createInsecure());

app.get('/chambre/:id', async (req, res) => {
  const chambre_id = req.params.id;
  clientChambre.GetChambre({ chambre_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.chambre);
    }
  });
});

app.post('/chambre', async (req, res) => {
  try {
    const { nom, description, qualite } = req.body;
    const nouvelleChambre = new Chambre({ nom, description, qualite });
    const chambre = await nouvelleChambre.save();
    await sendChambreMessage('creation', { id: chambre._id, nom, description, qualite });
    res.json(chambre);
    clientChambre.CreateChambre({ nom, description, qualite }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  } catch (err) {
    res.status(500).send("Erreur lors de la création de la chambre: " + err.message);
  }
});

app.delete('/chambre/:id', async (req, res) => {
  const chambre_id = req.params.id;
  clientChambre.DeleteChambre({ chambre_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: response.message });
    }
  });
});

app.get('/reservation/:id', async (req, res) => {
  const reservation_id = req.params.id;
  reservationClient.GetReservation({ reservation_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.reservation);
    }
  });
});

app.post('/reservation', async (req, res) => {
  try {
    const { nom, contact, adresse } = req.body;
    const nouvelleReservation = new Reservation({ nom, contact, adresse });
    const reservation = await nouvelleReservation.save();
    await sendReservationMessage('creation', { id: reservation._id, nom, contact, adresse });
    res.json(reservation);
    reservationClient.CreateReservation({ nom, contact, adresse }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  } catch (err) {
    res.status(500).send("Erreur lors de la création de la reservation: " + err.message);
  }
});

app.delete('/reservation/:id', async (req, res) => {
  const reservation_id = req.params.id;
  reservationClient.DeleteReservation({ reservation_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: response.message });
    }
  });
});

app.get('/client/:id', async (req, res) => {
  const client_id = req.params.id;
  clientClient.GetClient({ client_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.client);
    }
  });
});

app.post('/client', async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const nouveauClient = new Client({ nom, email, password });
    const client = await nouveauClient.save();
    await sendClientMessage('creation', { id: client._id, nom, email, password });
    res.json(client);
    clientClient.CreateClient({ nom, email, password }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  } catch (err) {
    res.status(500).send("Erreur lors de la création du client: " + err.message);
  }
});

app.delete('/client/:id', async (req, res) => {
  const client_id = req.params.id;
  clientClient.DeleteClient({ client_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: response.message });
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway opérationnel sur le port ${port}`);
});

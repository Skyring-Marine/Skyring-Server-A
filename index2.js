const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch'); // Asegúrate de tener node-fetch v2 instalado

const hostname = '192.168.0.19';
const port = 3000;
const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';

let db;

// Conexión a MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Conectado a MongoDB');
        db = client.db(dbName);

        server.listen(port, hostname, () => {
            console.log(`Servidor corriendo en http://${hostname}:${port}/`);
        });

        // Iniciar lectura periódica de la API
        setInterval(obtenerDatosSpotter, 5000);
    })
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err);
    });

// Función para obtener y guardar datos desde la API
async function obtenerDatosSpotter() {
    try {
        const response = await fetch("https://api.sofarocean.com/api/latest-data?spotterId=SPOT-32394C", {
            method: "GET",
            headers: {
                "token": "456debbae1201b1142d2004657e83f"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (db) {
            db.collection('lecturas').insertOne(data)
                .then(resultado => {
                    console.log(`Lectura insertada desde la API. ID: ${resultado.insertedId}`);
                })
                .catch(err => {
                    console.error('Error al insertar lectura desde API:', err);
                });
        } else {
            console.warn('Base de datos no está lista aún.');
        }

    } catch (error) {
        console.error("Error al obtener datos del Spotter:", error.message);
    }
}

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/Cover Template for Bootstrap.html') {
        const filePath = path.join(__dirname, 'Cover Template for Bootstrap.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error interno del servidor');
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
            }
        });
    } else if (req.url === '/crear') {
        const lectura = {
            data: {
                spotterId: "SPOT-32394C",
                spotterName: "YPFB",
                payloadType: "waves",
                batteryVoltage: 4.01,
                batteryPower: -0.24,
                solarVoltage: 0.11,
                humidity: 4,
                track: [
                    {
                        latitude: -18.4589833,
                        longitude: -70.3206667,
                        timestamp: "2025-05-29T23:40:00.000Z"
                    }
                ],
                waves: [
                    {
                        significantWaveHeight: 1.06,
                        peakPeriod: 11.38,
                        meanPeriod: 9.3,
                        peakDirection: 235.037,
                        peakDirectionalSpread: 15.421,
                        meanDirection: 237.928,
                        meanDirectionalSpread: 26.522,
                        timestamp: "2025-05-29T23:40:00.000Z",
                        latitude: -18.45898,
                        longitude: -70.32067
                    }
                ],
                frequencyData: []
            }
        };

        db.collection('lecturas').insertOne(lectura)
            .then(resultado => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ mensaje: 'Lectura insertada', id: resultado.insertedId }));
            })
            .catch(err => {
                console.error('Error al insertar en MongoDB:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error al insertar lectura');
            });

    } else if (req.url === '/usuarios') {
        db.collection('usuarios').find().toArray()
            .then(usuarios => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(usuarios));
            })
            .catch(err => {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error al obtener usuarios');
            });
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Página no encontrada');
    }
});

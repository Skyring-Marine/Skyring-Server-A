const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const multer = require('multer');
const fetch = require('node-fetch');
const crypto = require('crypto');

const hostname = '172.31.39.213';
const port = 3000;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';
let db;

const carpeta = '/home/ubuntu/Skyring-Server/transferencia2';
const carpeta2 = '/home/ubuntu/Skyring-Server/uploads';

const app = express();

// =======================
// Configuración de Multer
// =======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// =======================
// Conectar a MongoDB y levantar servidor
// =======================
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('✅ Conectado a MongoDB');
        db = client.db(dbName);

        app.listen(port, hostname, () => {
            console.log(`🚀 Servidor corriendo en http://${hostname}:${port}/`);
        });
    })
    .catch(err => {
        console.error('❌ Error de conexión a MongoDB:', err);
    });

// =======================
// Rutas Express
// =======================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cover Template for Bootstrap.html'));
});

app.get('/crear', async (req, res) => {
    const lectura = {
        data: {
            spotterId: "SPOT-32394C",
            spotterName: "YPFB",
            payloadType: "waves",
            batteryVoltage: 4.01,
            batteryPower: -0.24,
            solarVoltage: 0.11,
            humidity: 4,
            track: [{ latitude: -18.4589833, longitude: -70.3206667, timestamp: "2025-05-29T23:40:00.000Z" }],
            waves: [{
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
            }],
            frequencyData: []
        }
    };

    try {
        const resultado = await db.collection('lecturas').insertOne(lectura);
        res.json({ mensaje: 'Lectura insertada', id: resultado.insertedId });
    } catch (err) {
        console.error('❌ Error al insertar en MongoDB:', err);
        res.status(500).send('Error al insertar lectura');
    }
});

app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await db.collection('usuarios').find().toArray();
        res.json(usuarios);
    } catch (err) {
        res.status(500).send('Error al obtener usuarios');
    }
});

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('📁 Archivo recibido:', req.file.originalname);
    res.send('Archivo recibido correctamente');
});

// =======================
// Watchdog Carpetas
// =======================
console.log(`🕵️ Observando la carpeta: ${carpeta} ...`);
fs.watch(carpeta, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        console.log(`📄 Archivo en transferencia2 ${eventType}: ${filename}`);
    }
});

console.log(`🕵️ Observando la carpeta: ${carpeta2} ...`);
const archivosProcesados = new Set();

fs.watch(carpeta2, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        const fullPath = path.join(carpeta2, filename);

        if (archivosProcesados.has(fullPath)) return;
        archivosProcesados.add(fullPath);
        setTimeout(() => archivosProcesados.delete(fullPath), 3000);

        console.log(`📄 Detectado archivo en uploads ${eventType}: ${filename}`);

        calcularHashArchivo(fullPath)
            .then(async (hashActual) => {
                const registroArchivo = await db.collection('archivosProcesados').findOne({ nombreArchivo: filename });

                if (registroArchivo && registroArchivo.hash === hashActual) {
                    console.log(`⚠️ Archivo ${filename} NO cambió. Saltando procesamiento.`);
                    return;
                }

                console.log(`✅ Archivo ${filename} cambió o es nuevo. Iniciando procesamiento...`);

                const command = `python3 formato8.py "${fullPath}"`;

                exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Error ejecutando Python: ${error.message}`);
                        return;
                    }
                    if (stderr) console.error(`⚠️ STDERR: ${stderr}`);

                    if (!stdout.trim()) {
                        console.warn("⚠️ El script Python no devolvió salida JSON válida.");
                        return;
                    }

                    try {
                        const jsonObjects = stdout.split(/(?<=\})\s*(?=\{)/g).map(obj => JSON.parse(obj.trim()));
                        console.log(`📊 Procesando ${jsonObjects.length} registros del archivo ${filename}...`);

                        const nRegistros = [];
                        for (const obj of jsonObjects) {
                            if (obj["Burst#"]) nRegistros.push(obj["Burst#"]);
                        }

                        const existentes = await db.collection('registros').find({ n_registro: { $in: nRegistros } }).toArray();
                        const existentesSet = new Set(existentes.map(e => e.n_registro));

                        const registrosNuevos = jsonObjects.filter(obj => obj["Burst#"] && !existentesSet.has(obj["Burst#"]));
                        console.log(`🟢 Se encontraron ${registrosNuevos.length} registros nuevos que serán insertados.`);

                        if (registrosNuevos.length === 0) {
                            console.log(`⚠️ No hay registros nuevos que insertar en ${filename}.`);
                            await db.collection('archivosProcesados').updateOne(
                                { nombreArchivo: filename },
                                { $set: { hash: hashActual, fecha: new Date() } },
                                { upsert: true }
                            );
                            console.log(`✅ Hash del archivo ${filename} actualizado en la base de datos.`);
                            return;
                        }

                        let insertados = 0;
                        const total = registrosNuevos.length;
                        const progresoCada = Math.max(1, Math.floor(total / 10));

                        for (let i = 0; i < registrosNuevos.length; i++) {
                            const obj = registrosNuevos[i];

                            obj["n_registro"] = obj["Burst#"];
                            delete obj["Burst#"];

                            try {
                                await db.collection('registros').insertOne(obj);
                                insertados++;
                            } catch (insertErr) {
                                console.error(`❌ Error al insertar Registro:`, insertErr.message);
                            }

                            if ((i + 1) % progresoCada === 0 || i === total - 1) {
                                const porcentaje = Math.round(((i + 1) / total) * 100);
                                console.log(`⏳ Progreso: ${i + 1}/${total} registros insertados (${porcentaje}%)`);
                            }
                        }

                        console.log(`✔️ Insertados ${insertados} nuevos registros.`);
                        console.log(`✅ Hash del archivo ${filename} actualizado en la base de datos.`);

                        await db.collection('archivosProcesados').updateOne(
                            { nombreArchivo: filename },
                            { $set: { hash: hashActual, fecha: new Date() } },
                            { upsert: true }
                        );

                    } catch (parseError) {
                        console.error("❌ Error parseando JSON:", parseError.message);
                    }
                });

            })
            .catch(err => {
                console.error(`❌ Error al calcular hash de ${filename}:`, err.message);
            });
    }
});

// =======================
// Función para calcular hash SHA256 de un archivo
// =======================
function calcularHashArchivo(ruta) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(ruta);

        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
}

// =======================
// Función obtener datos externos
// =======================
async function obtenerDatosSpotter() {
    try {
        const response = await fetch("https://api.sofarocean.com/api/latest-data?spotterId=SPOT-32394C", {
            method: "GET",
            headers: { "token": "456debbae1201b1142d2004657e83f" }
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        console.log("=== Datos completos ===");
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error obteniendo datos Spotter:", error.message);
    }
}

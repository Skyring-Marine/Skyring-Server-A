const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const express = require('express');
//test test
const hostname = '172.31.39.213';
const port = 3000;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';
let db;
//DIRECTORIOS
const carpeta = '/home/ubuntu/Skyring-Server/transferencia2';
const carpeta2 = '/home/ubuntu/Skyring-Server/uploads';
// Conectar a MongoDB     

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(client => {
      console.log('Conectado a MongoDB');
     db = client.db(dbName);

        app.listen(port, hostname, () => {
           console.log(`Servidor corriendo en http://${hostname}:${port}/`);
      });
  })
  .catch(err => {
     console.error('Error de conexión a MongoDB:', err);
 });



/*// seccion para insertar objeto
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
*/

// archivo: server.js
//seccion de solicitud a la API//
// archivo: server.js (usando CommonJS y node-fetch v2)
const fetch = require('node-fetch');

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

    console.log("=== Datos completos ===");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n=== Contenido de 'track' ===");
    console.log(JSON.stringify(data.data.track, null, 2));

    console.log("\n=== Contenido de 'waves' ===");
    console.log(JSON.stringify(data.data.waves, null, 2));
  } catch (error) {
    console.error("Error al obtener datos del Spotter:", error.message);
  }
}


fs.readdir(carpeta, (err, archivos) => {
  if (err) {
    return console.error('Error al leer la carpeta:', err.message);
  }

  console.log('Contenido completo de la carpeta:', archivos);

  const archivosTxt = archivos.filter(nombre => path.extname(nombre).toLowerCase() === '.txt');

  if (archivosTxt.length === 0) {
    console.log('❌ No se encontraron archivos .txt.');
  } else {
    console.log('✅ Archivos .txt encontrados:');
    archivosTxt.forEach(archivo => {
      console.log(' -', archivo);
    });
  }
});

// watchdog de la carpeta transferencias2

console.log(`🕵️ Observando la carpeta: ${carpeta} ...`);

fs.watch(carpeta, (eventType, filename) => {
  if (filename) {
    const extension = path.extname(filename).toLowerCase();
    if (extension === '.txt') {
      const tipo = eventType === 'rename' ? 'creado o eliminado' : 'modificado';
      console.log(`📄 Archivo .txt ${tipo}: ${filename}`); 
      enviarArchivo();
    }
  }
});


//watchdog 2
const { exec } = require('child_process');


console.log(`🕵️ Observando la carpeta: ${carpeta2} ...`);

fs.watch(carpeta2, (eventType, filename) => {
  if (filename) {
    const extension = path.extname(filename).toLowerCase();

    if (extension === '.txt') {
      const fullPath = path.join(carpeta2, filename);
      const tipo = eventType === 'rename' ? 'creado o eliminado' : 'modificado';
      console.log(`📄 Archivo .txt ${tipo}: ${filename}`);

      // Ejecutar el script Python
      const command = `python3 formato8.py "${fullPath}"`;
      
      exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error al ejecutar Python: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️ STDERR: ${stderr}`);
  }

  console.log(`✅ Salida del script Python:\n${stdout}`);

  try {
    const jsonObjects = stdout
      .split(/(?<=\})\s*(?=\{)/g)
      .map(objStr => objStr.trim());

    const parsedObjects = jsonObjects.map(objStr => JSON.parse(objStr));

    console.log("📊 Objetos JSON parseados:");
    parsedObjects.forEach((obj, index) => {
      console.log(`--- Burst #${obj["Burst#"]} ---`);
      console.dir(obj, { depth: null });
    });
  } catch (parseError) {
    console.error("❌ Error al parsear la salida JSON:", parseError.message);
  }
});

      
    }
  }
});



// windows-client.js

//const axios = require('axios');
// const FormData = require('form-data');

// async function enviarArchivo() {
 //   const form = new FormData();
 //   form.append('file', fs.createReadStream('ruta/a/tu/archivo.csv'));

//    try {
 //       const respuesta = await axios.post('http://IP_DEL_SERVIDOR_LINUX:3000/upload', form, {
  //          headers: form.getHeaders()
   //     });
   //     console.log(respuesta.data);
  //  } catch (error) {
  //      console.error('Error al enviar el archivo:', error.message);
  //  }
//}

//enviarArchivo();


// linux-server.js

const multer = require('multer');

const app = express();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

 // Guardará en ./uploads

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Archivo recibido:', req.file.originalname);
    res.send('Archivo recibido correctamente');
});

app.listen(3000, () => console.log('Servidor escuchando en puerto 3000'));


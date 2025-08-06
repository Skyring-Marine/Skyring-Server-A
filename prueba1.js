import fetch from 'node-fetch';
// archivo: prueba1.js

const response = await fetch("https://api.sofarocean.com/api/latest-data?spotterId=SPOT-32394C", {
  method: "GET",
  headers: {
    "token": "2a4ffcd8ce8f106989adcb9e7331e4"
  }
});

if (!response.ok) {
  throw new Error(`Error HTTP: ${response.status}`);
}

const data = await response.json();

// Mostrar contenido completo, incluyendo track y waves
console.log("=== Datos completos ===");
console.log(JSON.stringify(data, null, 2));

// Mostrar contenido específico de track y waves
console.log("\n=== Contenido de 'track' ===");
console.log(JSON.stringify(data.data.track, null, 2));

console.log("\n=== Contenido de 'waves' ===");
console.log(JSON.stringify(data.data.waves, null, 2));

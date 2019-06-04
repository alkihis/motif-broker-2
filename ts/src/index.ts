import * as program from 'commander';
import { Routes, EndpointAccepters } from 'couchdb-dispatcher';
import { readFileSync } from 'fs';

// Fonction de lecture du JSON
function readJSON(filename: string) {
    /*
     * json ressemble à
     * {
     *  "AAA[A-G]{1,4}.+": "test",
     *  ...
     * }
     */
    const json: { [regexp: string]: string } = JSON.parse(readFileSync(filename, { encoding: 'utf-8' }));

    // On construit des fonctions vérificatrices "Est-ce que la regex est valide pour la clé donnée ?"
    const fns: EndpointAccepters = {};

    // Pour chaque couple [regex => endpoint] du JSON 
    for (const [regex, endpoint] of Object.entries(json)) {
        // Au cas où un endpoint a plusieurs regex supportées (j'en doute)

        const obj_regex = new RegExp(regex);

        if (endpoint in fns) {
            // On sauvegarde la référence de l'ancienne fonction vérificatrice
            const _old = fns[endpoint];

            // La nouvelle fonction = Si la regex actuelle valide OU si l'ancienne fonction valide
            fns[endpoint] = (key: string) => obj_regex.test(key) || _old(key); 
        }
        else {
            // On crée la fonction sinon
            fns[endpoint] = (key: string) => obj_regex.test(key);
        }
    }

    return fns;
}

program
  .version('0.1.0')
  .option('-d, --database <databaseUrl>', 'Database URL (without the port)', "http://localhost")
  .option('-p, --port <portNum>', 'Database port Number', parseInt, 5984)
  .option('-l, --listen <portNum>', 'Port Listening Number', parseInt, 3282)
  .option('-f, --filename <fileName>', 'JSON describing RegExp to endpoints', '3letter_prefixe_rules.json')
.parse(process.argv);

const DB = `${program.database}:${program.port}`;

// Initialisation des routes possibles
const route = new Routes(readJSON(program.filename), DB);

route.set('GET', '/handshake', () => undefined, (_, res) => res.json({ handshake: true }));

// Route bulk_request standard
route.set(
    // Route /bulk_request, en méthode POST
    'POST', '/bulk_request', 
    // Récupération des clés: Attendues dans req.body.keys; Sinon, renvoie un bad request
    (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }), 
    // Réponses renvoyées par CouchDB renvoyées dans request
    (_, res, data) => res.json({ request: data }), 
    // Si erreur
    (_, res, error) => { 
        console.log(error); 
        res.status(500).json({ error: "Database error" }); 
    }
);

route.listen(program.listen, () => {
    console.log(`Listening on port ${program.listen}.`);
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const couchdb_dispatcher_1 = require("couchdb-dispatcher");
const md5 = require("md5");
const program = require("commander");
// let fn_read_json = () => {
//     /*
//      * json ressemble à
//      * {
//      *  "AAA[A-G]{1,4}.+": "test",
//      *  ...
//      * }
//      */
//     const json: { [regexp: string]: string } = JSON.parse(readFileSync('3letter_prefixe_rules.json', { encoding: 'utf-8' }));
//     // On construit des fonctions vérificatrices "Est-ce que la regex est valide pour la clé donnée ?"
//     const fns: EndpointAccepters = {};
//     // Pour chaque couple [regex => endpoint] du JSON 
//     for (const [regex, endpoint] of Object.entries(json)) {
//         // Au cas où un endpoint a plusieurs regex supportées (j'en doute)
//         if (endpoint in fns) {
//             // On sauvegarde la référence de l'ancienne fonction vérificatrice
//             const _old = fns[endpoint];
//             // La nouvelle fonction = Si la regex actuelle valide OU si l'ancienne fonction valide
//             fns[endpoint] = (key: string) => (new RegExp(regex)).test(key) || _old(key); 
//         }
//         else {
//             // On crée la fonction sinon
//             fns[endpoint] = (key: string) => (new RegExp(regex)).test(key);
//         }
//     }
//     return fns;
// }
// const d = new Dispatcher("localhost:4444", fn_read_json());
program
    .version('0.1.0')
    .option('-d, --database <databaseUrl>', 'Database URL', "http://localhost")
    .option('-p, --port <portNum>', 'Port Listening Number', parseInt, 5984)
    .parse(process.argv);
const ENDPOINTS = {
    'id_map': (key) => true,
    'interactors': (key) => true
};
const DB = `${program.database}:${program.port}`;
const route = new couchdb_dispatcher_1.Routes(ENDPOINTS, DB);
route.set('GET', '/handshake', () => undefined, (_, res) => res.json({ handshake: true }));
route.set('POST', '/bulk', (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }), (_, res, data) => res.json({ request: data }), (_, res, error) => {
    console.log(error);
    res.status(500).json({ error: "Database error" });
});
route.set("POST", "/bulk_couple", (req, _, container) => {
    if (req.body.keys) {
        const keys_tuples = req.body.keys;
        let keys_to_fetch = [];
        let keys_to_find = {};
        for (const [key1, key2] of keys_tuples) {
            if (md5(key1) >= md5(key2)) {
                keys_to_fetch.push(key1);
                keys_to_find[key1] = key2;
            }
            else {
                keys_to_fetch.push(key2);
                keys_to_find[key2] = key1;
            }
        }
        container.to_find = keys_to_find;
        return keys_to_fetch;
    }
}, (_, res, data, container) => {
    const keys_to_find = container.to_find;
    const resp = {};
    // Recherche si chaque clé de data comprend la clé correpondante
    for (const d of data) {
        const id = d.id;
        const dta = d.data;
        const id_to_find = keys_to_find[id];
        resp[`${id}~${id_to_find}`] = (id_to_find in dta ? dta[id_to_find] : []);
    }
    res.json({ request: resp });
}, (_, res, error) => {
    console.log(error);
    res.status(500).json({ error: "Database error" });
});
route.listen(3280, () => {
    console.log("App listening on port 3280.");
});

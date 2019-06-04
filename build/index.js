"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const couchdb_dispatcher_1 = require("couchdb-dispatcher");
const fs_1 = require("fs");
const readline = require("readline");
// Fonction de lecture du JSON
function readJSON(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        function readFromStdin() {
            return __awaiter(this, void 0, void 0, function* () {
                const rl = readline.createInterface({
                    input: process.stdin,
                    terminal: false
                });
                let lines = "";
                rl.on('line', line => {
                    lines += line;
                });
                return new Promise(resolve => {
                    rl.on('close', () => {
                        resolve(lines);
                    });
                });
            });
        }
        /*
         * json ressemble à
         * {
         *  "AAA[A-G]{1,4}.+": "test",
         *  ...
         * }
         */
        let str_base = !filename
            ? yield readFromStdin()
            : fs_1.readFileSync(filename, { encoding: 'utf-8' });
        const json = JSON.parse(str_base);
        // On construit des fonctions vérificatrices "Est-ce que la regex est valide pour la clé donnée ?"
        const fns = {};
        // Pour chaque couple [regex => endpoint] du JSON 
        for (const [regex, endpoint] of Object.entries(json)) {
            // Au cas où un endpoint a plusieurs regex supportées (j'en doute)
            const obj_regex = new RegExp(regex);
            if (endpoint in fns) {
                // On sauvegarde la référence de l'ancienne fonction vérificatrice
                const _old = fns[endpoint];
                // La nouvelle fonction = Si la regex actuelle valide OU si l'ancienne fonction valide
                fns[endpoint] = (key) => obj_regex.test(key) || _old(key);
            }
            else {
                // On crée la fonction sinon
                fns[endpoint] = (key) => obj_regex.test(key);
            }
        }
        return fns;
    });
}
program
    .version('0.1.0')
    .option('-d, --database <databaseUrl>', 'Database URL (without the port)', "http://localhost")
    .option('-p, --port <portNum>', 'Database port Number', parseInt, 5984)
    .option('-l, --listen <portNum>', 'Port Listening Number', parseInt, 3282)
    .option('-f, --filename <fileName>', 'JSON describing RegExp to endpoints')
    .parse(process.argv);
const DB = `${program.database}:${program.port}`;
(() => __awaiter(this, void 0, void 0, function* () {
    // Initialisation des routes possibles
    let route;
    try {
        route = new couchdb_dispatcher_1.Routes(yield readJSON(program.filename), DB);
    }
    catch (e) {
        console.error("Error while parsing file.");
        throw e;
    }
    route.set('GET', '/handshake', (_, res) => void res.json({ handshake: true }), () => undefined);
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
    });
    route.listen(program.listen, () => {
        console.log(`Listening on port ${program.listen}.`);
    });
}))();

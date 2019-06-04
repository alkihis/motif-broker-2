# motif-broker-2
Front-end service to dispatch and aggregate motif requests on the list of couchDB databases, using [couchdb-dispatcher](https://www.npmjs.com/package/couchdb-dispatcher).

### Running the service

#### Options
- `-f, --filename <endpointsJsonFile>`
- `-d, --database <couchDBdatabaseURL>`
- `-p, --port <couchDBdatabasePort>`
- `-l, --listen <listenPortOfMotifBroker>`

```bash
# For example
node build/index.json -f endpoints.json -d http://localhost -p 5984 -l 3282
```

### Querying the service
```sh
curl --header "Content-Type: application/json" --request POST --data '{"keys": [ "AAAAAAAAAATTTCAATTATAGG", "AAAAAAAATTATGTTCTTGACGG","AAAAAAACGGACATCCTTTATGG", "AAAACTTCATGCAAGTTTTGCGG","AAAACGGGTTGAATAGTCTCTGG","AAAACGACAATTGCCGTTTTCGG", "AAAAAAAAAAAAAAAATCAATGG", "ATTAAAAAAAAAAGCAGGATGGG"] }' MOTIF-BROKER-2_ENDPOINT/bulk_request
```

will return data only for query keys found in databases


```json
{
    "request": {
        "AAAAAAAAAAAAAAAATCAATGG": {
            "Buchnera aphidicola BCc GCF_000090965.1": {
                "NC_008513.1": [
                    "-(203304,203326)"
                ]
            }
        },
        "ATTAAAAAAAAAAGCAGGATGGG": {
            "Wigglesworthia glossinidia endosymbiont of Glossina morsitans morsitans (Yale colony) GCF_000247565.1": {
                "NC_016893.1": [
                    "-(252902,252924)"
                ]
            }
        }
    }
}
````
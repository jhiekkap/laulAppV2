 
const makeId = function () {
    const chars = 'ABCDE23456789';
    let result = '';
    for (let i = 6; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

const allRoutes = (app, fs) => {
    const dataPath = './data/db.json';
    const readFile = (callback, returnJson = false, filePath = dataPath, encoding = 'utf8') => {
        fs.readFile(filePath, encoding, (err, db) => {
            if (err) {
                throw err;
            }
            callback(returnJson ? JSON.parse(db) : db);
        });
    };

    const writeFile = (fileData, callback, filePath = dataPath, encoding = 'utf8') => {
        fs.writeFile(filePath, fileData, encoding, (err) => {
            if (err) {
                throw err;
            }
            callback();
        });
    };



    app.get('/api/all', (req, res) => {
        fs.readFile(dataPath, 'utf8', (err, db) => {
            if (err) {
                throw err;
            }
            res.send(db);
        });
    });


    const endpoints = Object.keys(require('../data/db.json'))

    endpoints.forEach(endpoint => {

        const singularEndpoint = endpoint.substr(0, endpoint.length - 1);

        app.get(`/api/${endpoint}`, (req, res) => {
            fs.readFile(dataPath, 'utf8', (err, db) => {
                if (err) {
                    throw err;
                }
                const parsedDb = JSON.parse(db)
                res.send(Object.values(parsedDb[endpoint]));
                console.log(`GET /${endpoint}`)
            });
        });

        app.get(`/api/${endpoint}/:id`, (req, res) => {
            fs.readFile(dataPath, 'utf8', (err, db) => {
                if (err) {
                    throw err;
                }
                const parsedDb = JSON.parse(db)
                const id = req.params["id"]
                if (!parsedDb[endpoint][id]) {
                    res.status(200).send(`No ${singularEndpoint} with id: ${id}`);
                } else {
                    res.send(parsedDb[endpoint][id]);
                    console.log(`GET /${endpoint}/${id}`)
                }
            });
        });

        app.post(`/api/${endpoint}`, (req, res) => {
            readFile(db => {
                const newData = req.body
                const newId = makeId()
                newData.id = newId
                console.log('NEW DATA', newData)
                db[endpoint][newId] = newData
                writeFile(JSON.stringify(db, null, 2), () => {
                    res.status(200).send(newData);
                    console.log(`POST /${endpoint} - new ${singularEndpoint} added with ID ${newData.id}`);
                });
            },
                true);
        });

        app.put(`/api/${endpoint}/:id`, (req, res) => {
            readFile(db => {
                const id = req.params["id"]
                console.log('HELLOUTA', id)
                if (!db[endpoint][id]) {
                    res.status(200).send(`No ${singularEndpoint} with id: ${id}`);
                } else { 
                    db[endpoint][id] = req.body
                    writeFile(JSON.stringify(db, null, 2), () => {
                        res.status(200).send(req.body);
                        console.log(`PUT /${endpoint}/${id} - ${singularEndpoint} id:${id} updated`);
                    });
                }
            },
                true);
        });

        app.delete(`/api/${endpoint}/:id`, (req, res) => {
            readFile(db => {
                const id = req.params["id"];
                if (!db[endpoint][id]) {
                    res.status(200).send(`No ${singularEndpoint} with id: ${id}`);
                } else {
                    delete db[endpoint][id]
                    writeFile(JSON.stringify(db, null, 2), () => {
                        res.status(200).send(`${singularEndpoint} id:${id} removed`);
                        console.log(`DELETE /${endpoint}/${id} - ${singularEndpoint} id:${id} removed`);
                    });
                }
            },
                true);
        });
    })
};

module.exports = allRoutes;
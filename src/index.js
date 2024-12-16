
module.exports = function setup(options, imports, register) {

    const mongodb = require('mongodb');
    const MongoClient = mongodb.MongoClient;
    const Logger = mongodb.Logger;
    const dbconfig = Object.assign({}, options.config);
    const log = imports.log.getLogger('mongo');
    
    if (dbconfig.logger) {
        Logger.setLevel(dbconfig.logger);
        
        Logger.setCurrentLogger(function (msg, context) {
            log[context.type](context.message);
        });
    }
    
    if (options.url) {
        const client = new MongoClient(options.url, dbconfig);
        return client.connect().then(() => {
            register(null, {
                mongo: {
                    db: client.db(),
                    dataTypes: mongodb
                },
                onDestroy: function destroy() {
                    if (client) {
                        client.close(true);
                    }
                }
            });
        }).catch(err => {
            log.error(err.message, err.stack);
            return register(err);
        });
    }

    const reg = {
        mongo: {
            db: {},
            clients: {},
            dataTypes: mongodb
        },
        onDestroy: function destroy() {
            Object.keys(reg.mongo.clients).forEach((name) => {
                if (reg.mongo.clients[name]) {
                    reg.mongo.clients[name].close(true);
                }
            });
        }
    };

    const connections = Object.keys(options)
        .filter(function (o) {
            return options[o] && options[o].url;
        })
        .map((dbName) => {
            const db = options[dbName];
            const config = Object.assign({}, dbconfig, db.config);
            const client = new MongoClient(db.url, config);
            return client.connect().then(client => {
                let urlNoCreds = db.url.split('@');
                urlNoCreds = urlNoCreds.length > 1 ? urlNoCreds[1] : urlNoCreds[0];
                log.debug(dbName, 'connected @', urlNoCreds);
                reg.mongo.clients[dbName] = client;
                reg.mongo.db[dbName] = client.db();
            });
        });

    Promise.all(connections)
        .then(function () {
            register(null, reg);
        })
        .catch(function (err) {
            log.error(err.message, err.stack);
            register(err);
        });
};

module.exports.consumes = ['log'];
module.exports.provides = ['mongo'];

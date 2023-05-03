
module.exports = function setup(options, imports, register) {

    const mongodb = require('mongodb');
    const MongoClient = mongodb.MongoClient;
    const Logger = mongodb.Logger;
    const dbconfig = Object.assign({}, {useUnifiedTopology: true}, options.config);
    const log = imports.log.getLogger('mongo');
    
    if (dbconfig.logger) {
        Logger.setLevel(dbconfig.logger);
        
        Logger.setCurrentLogger(function (msg, context) {
            log[context.type](context.message);
        });
    }
    
    if (options.url) {
        return MongoClient.connect(options.url, dbconfig).then((client) => {
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

    var reg = {
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

    var connections = Object.keys(options)
        .filter(function (o) {
            return options[o] && options[o].url;
        })
        .map((dbName) => {
            var db = options[dbName];
            var config = Object.assign({}, dbconfig, db.config);
            return MongoClient.connect(db.url, config)
                .then(function (client) {
                    log.debug(dbName, 'connected @', db.url);
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

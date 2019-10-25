/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

module.exports = function setup(options, imports, register) {
    var mongodb = require('mongodb');
    var MongoClient = mongodb.MongoClient;
    var Logger = mongodb.Logger;
    var dburl = options.url;
    var dbconfig = options.config || {};
    var log;

    dbconfig.useUnifiedTopology = true;

    if (dbconfig.logger) {
        log = imports.log.getLogger('mongo');
        Logger.setLevel(dbconfig.logger);

        Logger.setCurrentLogger(function (msg, context) {
            log[context.type](context.message);
        });
    }

    if (dburl) {
        return MongoClient.connect(dburl, dbconfig, function (err, client) {
            register(err, {
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
            var config = db.config || dbconfig;
            return MongoClient.connect(db.url, config)
                .then(function (client) {
                    log && log.debug(dbName, 'connected @', db.url);
                    reg.mongo.clients[dbName] = client;
                    reg.mongo.db[dbName] = client.db();
                });
        });

    Promise.all(connections)
        .then(function () {
            register(null, reg);
        })
        .catch(function (err) {
            log && log.error(err.stack);
            register(err);
        });
};

module.exports.consumes = ['log'];
module.exports.provides = ['mongo'];

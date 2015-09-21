/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

module.exports = function setup(options, imports, register) {
    var mongodb = require('mongodb');
    var MongoClient = mongodb.MongoClient;
    var Logger = mongodb.Logger;
    var dburl = options.url;
    var dbconfig = options.config || {};

    if (dbconfig.logger) {
        var log = imports.log.getLogger('mongo');
        Logger.setLevel(dbconfig.logger);

        Logger.setCurrentLogger(function (msg, context) {
            log[context.type](context.message);
        });
    }

    MongoClient.connect(dburl, dbconfig, function (err, db) {
        register(err, {
            mongo: {
                db: db,
                dataTypes: mongodb,
                onDestroy: function destroy() {
                    if (db) {
                        db.close();
                    }
                }
            }
        });
    });
};

module.exports.consumes = ['log'];
module.exports.provides = ['mongo'];

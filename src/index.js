/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

module.exports = function setup(options, imports, register) {
    var mongodb = require('mongodb');
    var MongoClient = mongodb.MongoClient;
    var dburl = options.url;
    var dbconfig = options.config;

    MongoClient.connect(dburl, dbconfig, function (err, db) {
        register(null, {
            mongo: {
                db: db,
                dataTypes: mongodb
            }
        });
    });
};

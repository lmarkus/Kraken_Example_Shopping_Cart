'use strict';


var kraken = require('kraken-js'),
    db = require('./lib/database'),
    language = require('./lib/language'),
    express = require('express'),
    paypal = require('paypal-rest-sdk'),
    app = {};


app.configure = function configure(nconf, next) {
    // Fired when an app configures itself
    //Configure the database
    db.config(nconf.get('databaseConfig'));

    //Configure the PayPal SDK
    paypal.configure(nconf.get('paypalConfig'));
    next(null);
};


app.requestStart = function requestStart(server) {
    // Fired at the beginning of an incoming request
};


app.requestBeforeRoute = function requestBeforeRoute(server) {
    // Fired before routing occurs
    server.use(express.methodOverride());
    server.use(language());
};


app.requestAfterRoute = function requestAfterRoute(server) {
    // Fired after routing occurs
};


kraken.create(app).listen(function (err) {
    if (err) {
        console.error(err);
    }
});

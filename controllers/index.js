'use strict';


module.exports = function (server) {

    server.get('/', function (req, res) {
        var model = { name: 'kraken-example-shopping-cart' };
        
        res.render('index', model);
        
    });

};

'use strict';


module.exports = function (server) {

    server.get('/setlanguage', function (req, res) {
        var model = { name: 'kraken-example-shopping-cart' };

        res.render('setlanguage', model);

    });

};

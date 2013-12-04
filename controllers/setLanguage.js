'use strict';


module.exports = function (server) {

    server.get('/setlanguage/:lang', function (req, res) {

        res.cookie('language', req.param('lang'));
        res.redirect('/');

    });

};

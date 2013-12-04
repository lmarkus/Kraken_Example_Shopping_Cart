/**
 * Middleware for determining the language to show the user
 */

'use strict';

module.exports = function () {

    return function (req, res, next) {
        //Pick up the language cookie.
        var language = req.cookies.language;

        //Set the locality for this response. The template will pick the appropriate bundle
        if (language) {
            res.locals.context = res.locals.context || {};
            res.locals.context.locality = language;
        }

        next();
    };
};

const path = require('path'),
    express = require('express'),
    exphbs = require('express-handlebars'),
    iframeReplacement = require('./iframe-replacement');

function iframeRoute() {
    // create an instance of express
    const app = express();

    // add iframe replacement to express as middleware (adds res.merge method)
    app.use(iframeReplacement);

    // add handlebars view engine (you can use any)
    app.engine('hbs', exphbs());

    // let express know how to locate the views/templates
    app.set('views', path.resolve(__dirname, 'views'));
    app.set('view engine', 'hbs');

    app.get('/', (req, res) => {
        const _sourceUrl = req.query.url;
        // respond to this request with our fake-new content embedded within the BBC News home page
        res.merge('fake-news', {
            sourceUrl: `${_sourceUrl}?nordt=true&rt=nc&orig_cvip=true`, // external url to fetch
            sourcePlaceholder: 'div[data-entityid="container-top-stories#1"]', // css selector to inject our content into
            transform: function($) {
                $('body').prepend(`<div>Loading...</div><div>${_sourceUrl}</div>`);
            },
            itemId: req.params.itemId,
            onError: (req, model) => `<div>I cannot read '${_sourceUrl}'</div><`
        });
    });

    return app;
}

module.exports = iframeRoute;

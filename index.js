const startTime = Date.now();

const iframeRoute = require('./src/middleware/iframe-app');

// build a core express web app
const https = require('https');
const express = require('express');

if (process.env.USE_PROXY) {
    const ciphers = https.globalAgent.options.ciphers;
    require('proxy-agent-patch')({
        httpProxy: 'http://localhost:8888',
        httpsProxy: 'http://localhost:8888',
        noProxy: 'localhost, 127.0.0.0'
    });
    https.globalAgent.options = { ciphers };
}

const app = express();

app.use('/iframe', iframeRoute());

// Status to check if the server is fine
app.get('/status', (req, res) => {res.send('OK');});

app.use((req, res, next) => {
    res.on('error', (err) => console.error('RES.ON("error")', err.stack || err));
    next();
});

const port = process.env.PORT || 8080;
app.listen(port, (error) => {
    if (error) {
        console.error(`ERROR: Listening on port ${port}`);
        return;
    }

    // eslint-disable-next-line
    console.log(`HTTP listening on port ${port}`);
    if (process.send) {
        process.send('online');
    }

    // eslint-disable-next-line
    console.log(`Startup time: ${Date.now() - startTime}ms`);
});

if (process.env.TEST_GSS_WRITER) {
    const getConfig = require('./src/utils/configGSSWriter');
    const GSSWriter = require('./src/utils/GSSWriter');

    function main() {
        const writer = new GSSWriter(getConfig());
        setInterval(() => {
            if (Math.random() > 0.5) writer.append([Math.random() * 100, Math.random() * 70]);
            else if (Math.random() > 0.5) writer.append([1, 2, 3]);
            console.log(writer.rows.length);
        }, 100);

        setInterval(() => {
            writer.read({ range: 'Setup' }).then(r => console.log('READ -->', r.data));
        }, 5000);
    }

    main();
}

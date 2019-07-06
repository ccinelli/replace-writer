const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/spreadsheets'];

// Current date that can be parsed by Google Spreadsheet
function now() {
    const d = new Date().toISOString();
    const c = d.split('T');
    c[0] = c[0].replace(/-/g, '/');
    c[1] = c[1].split('Z')[0];
    const date = c.join(' ');
    return date;
}

// Append logs

class GSSWriter {
    constructor({
        spreadsheetId, // Spreadsheet Id (Ex: 1QhiXOurIib4ujLaHthHqj9ZlMX9QsXpcQYj2N9g2mBM) NOTE: Make sure it is shared with the email address of the service account
        email = process.env.GOOGLE_CLIENT_EMAIL, // email address of the service account Ex: google-drive@xxx.iam.gserviceaccount.com
        privateKey = process.env.GOOGLE_PRIVATE_KEY, // This is the private key for the service account ("-----BEGIN PRIVATE KEY-----\n ... \n-----END PRIVATE KEY-----\n")
        scopes = SCOPES,
        range = 'Sheet1', // Range to append to. It can just be the sheet name.
        maxEntriesBeforeFlush = 100, // Buffer up to this value of entries to prevent to hit the Quota limits. Note... data may be lost.
        timeout = 10000, // Flash the buffer max after this time in ms
        hasTs = true
    } = {}) {
        this.spreadsheetId = spreadsheetId;
        this.email = email;
        this.privateKey = privateKey;
        this.scopes = scopes;
        this.range = range;
        this.maxEntriesBeforeFlush = maxEntriesBeforeFlush;
        this.timeout = timeout;
        this.hasTs = hasTs;

        this.rows = [];
        this.timerId = null;

        this.shutdown = () => this.flush();
        process.on('SIGTERM', this.shutdown);
    }

    getAuth() {
        const auth = new JWT(
            this.email,
            null,
            this.privateKey,
            this.scopes,
        );
        return auth;
    }

    setTimer() {
        if (this.timerId) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
            this.flush();
            this.timerId = null;
        }, this.timeout);
    }

    resetTimer() {
        if (this.timerId) clearTimeout(this.timerId);
        this.timerId = null;
    }

    flush() {
        if (!this.rows.length) return Promise.resolve(true);

        return new Promise(resolve => {
            const auth = this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth });
            const rows = this.rows;
            this.rows = [];
            sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: this.range,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: rows
                },
                auth
            }, (err, response) => {
                if (err) {
                    // Restore keys if there was an error
                    this.rows = rows.concat(this.rows);
                    console.error('GSSWriter ERROR while appending:', err);
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }

    append(row, { flushNow, hasTs } = {}) {
        const _hasTs = hasTs !== undefined ? hasTs : this.hasTs;
        this.rows.push((_hasTs ? [now()] : []).concat(row));
        if (this.rows.length > this.maxEntriesBeforeFlush || flushNow) {
            return this.flush();
        } else if (!this.timerId) {
            this.setTimer();
        }
        return Promise.resolve('buffered');
    }

    read(opts) {
        const s = new Date();
        return new Promise(resolve => {
            const auth = this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth });
            sheets.spreadsheets.values.get(Object.assign({
                spreadsheetId: this.spreadsheetId,
                range: this.range,
                auth
            }, opts), (err, response) => {
                console.log('READ in ', new Date() - s, 'ms');
                if (err) {
                    console.error('GSSWriter ERROR while reading:', err);
                    return resolve(false);
                }
                resolve(response);
            });
        });
    }

    // If you create disposable GSSWriters make sure you call this when you are done to avoid memory leaks
    destroy() {
        this.flush();
        this.resetTimer();
        process.off('SIGTERM', this.shutdown);
    }
}

GSSWriter.now = now;

module.exports = GSSWriter;

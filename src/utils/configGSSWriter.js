module.exports = function getGSSWriterConfig(req) {
    return {
        'email': 'gsswriter@spreedsheet-245906.iam.gserviceaccount.com',
        'privateKey': process.env.GSS_PRIVATE_KEY,
        'spreadsheetId': '1tFxmvpP2Fsw8q4bi4dV9LMHvINCsxMDsaiY4X1nDa2o',
        'gid': '0',
        'range': 'Data',
        'timeout': 3000
    };
};

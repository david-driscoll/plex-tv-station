//var EventEmitter = require('events').EventEmitter;
var headers = require('plex-api-headers');
var rxAuthToken = /authenticationToken="([^"]+)"/;
var util = require('util');

class CredentialsAuthenticator {
    private username: string;
    private password: string;

    constructor(username, password) {
        //EventEmitter.call(this);

        this.username = username;
        this.password = password;
    }

    public authenticate(plexApi, callback) {
        if (typeof plexApi !== 'object') {
            throw new TypeError('First argument should be the plex-api object to perform authentication for');
        }
        if (typeof callback !== 'function') {
            throw new TypeError('Second argument should be a callback function to be called when authentication has finished');
        }

        window.fetch('https://plex.tv/users/sign_in.xml', {
            method: 'POST',
            headers: headers(plexApi, {
                Authorization: authHeaderVal(this.username, this.password)
            })
        }).then(response => {
            if (response.status !== 201) {
                return callback(new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + response.status));
            }

            var token = extractAuthToken(response.text());
            if (!token) {
                return callback(new Error('Couldnt not find authentication token in response from Plex.tv :('));
            }

            //(<any>this).emit('token', token);
            callback(null, token);
        });
    }
}

//util.inherits(CredentialsAuthenticator, EventEmitter);

function extractAuthToken(xmlBody) {
    return xmlBody.match(rxAuthToken)[1];
}

function authHeaderVal(username, password) {
    var authString = username + ':' + password;
    var buffer = new Buffer(authString.toString(), 'binary');
    return 'Basic ' + buffer.toString('base64');
}

export default function(options) {
    if (typeof (options) !== 'object') {
        throw new TypeError('An options object containing .username and .password is required');
    }
    if (typeof (options.username) !== 'string') {
        throw new TypeError('Options object requires a .username property as a string');
    }
    if (typeof (options.password) !== 'string') {
        throw new TypeError('Options object requires a .password property as a string');
    }
    return new CredentialsAuthenticator(options.username, options.password);
};

var uuid = require('uuid');
var url = require('url');
import Promise = require('bluebird');
var xml2js = require('xml2js');
var plexApiHeaders = require('plex-api-headers');
var uri = require('./uri');
import {each} from "lodash";
import credentials from './credentials';

var PLEX_SERVER_PORT = 32400;

interface Response {

}

interface Criteria {
    type?: string;
}

interface APISettings {
    hostname: string;
    port: string | number;
    username?: string;
    password?: string;
    options: APIOptions;
    authenticator?: any;
}

interface APIOptions {
    identifier: string;
    product?: string;
    version?: string | number;
    deviceName?: string;
    platform?: string;
    platformVersion?: string;
    device?: string;
}

export class PlexAPI {
    private hostname: string;
    private port: string | number;
    private username: string;
    private password: string;
    private authenticator: any;
    private serverUrl: string;
    private options: APIOptions;

    constructor(settings: APISettings) {
        this.hostname = settings.hostname;
        this.port = settings.port || PLEX_SERVER_PORT;
        this.username = settings.username;
        this.password = settings.password;
        this.authenticator = settings.authenticator || this._credentialsAuthenticator();
        this.options = settings.options;
        this.options.identifier = this.options.identifier || uuid.v4();
        this.options.product = this.options.product || 'Node.js App';
        this.options.version = this.options.version || '1.0';
        this.options.device = this.options.device || "Awesome";
        this.options.deviceName = this.options.deviceName || 'Node.js App';
        this.options.platform = this.options.platform || 'Node.js';
        this.options.platformVersion = this.options.platformVersion || '1.0';

        this.serverUrl = 'http://' + this.hostname + ':' + this.port;
        this._initializeAuthenticator();
    }

    public getHostname = () => this.hostname;
    public getPort = () => this.port;
    public getIdentifier = () => this.options.identifier;

    public query(url) {
        if (url === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this._request(url, 'GET', true).then(uri.attach(url));
    }

    public postQuery(url) {
        if (url === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this._request(url, 'POST', true).then(uri.attach(url));
    }

    public perform(url) {
        if (url === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this._request(url, 'GET', false);
    }

    public find(relativeUrl, criterias) {
        if (relativeUrl === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this.query(relativeUrl).then(function(result) {
            return filterChildrenByCriterias(result._children, criterias);
        });
    }

    private _request(relativeUrl, method, parseResponse) {
        var reqUrl = generateRelativeUrl.call(this, relativeUrl);

        var headers = new Headers(<any>plexApiHeaders(this, {
            'Accept': 'application/json',
            'X-Plex-Token': this.authToken,
            'X-Plex-Username': this.username
        }));

        return new Promise((resolve, reject) => {
            window.fetch(reqUrl, {
                method: method || 'GET',
                headers
            }).then(response => {
                if (response.status === 401) {
                    if (this.authenticator === undefined) {
                        return reject(new Error('Plex Server denied request, you must provide a way to authenticate! ' +
                            'Read more about plex-api authenticators on https://www.npmjs.com/package/plex-api#authenticators'));
                    }

                    return resolve(this._authenticate()
                        .then(function() {
                            return this._request(relativeUrl, method, parseResponse);
                        })
                    );
                }

                if (response.status !== 200) {
                    return reject(new Error('Plex Server didnt respond with status code 200, response code: ' + response.status));
                }

                if (parseResponse) {
                    if (response.headers.get('content-type') === 'application/json') {
                        return response.json().then(resolve, reject);
                    }
                    if (response.headers.get('content-type').indexOf('xml') > -1) {
                        return response.text().then(text => {
                            return xml2js.parseString(text, {
                                object: true,
                                mergeAttrs: true,
                                explicitArray: false,
                                explicitRoot: false,
                                tagNameProcessors: [xml2js.processors.firstCharLowerCase],
                                attrNameProcessors: [xml2js.processors.firstCharLowerCase],
                                valueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans]
                            }, function(err, result) {
                                if (err) reject(err);
                                resolve(result);
                            });
                        }, reject);
                    }
                    return response.text().then(resolve, reject);
                } else {
                    return resolve();
                }
            });
        });
    }

    private _authenticate() {
        return new Promise((resolve, reject) => {
            if (this.authToken) {
                return reject(new Error('Permission denied even after attempted authentication :( Wrong username and/or password maybe?'));
            }

            this.authenticator.authenticate(this.options, (err, token) => {
                if (err) {
                    return reject(new Error('Authentication failed, reason: ' + err.message));
                }
                this.authToken = token;
                resolve();
            });
        })
    }

    private _credentialsAuthenticator() {
        if (this.username && this.password) {
            return credentials({
                username: this.username,
                password: this.password
            });
        }
        return undefined;
    }

    private _initializeAuthenticator() {
        if (this.authenticator && typeof this.authenticator.initialize === 'function') {
            this.authenticator.initialize(this);
        }
    }
}

function filterChildrenByCriterias(children, criterias) {
    var context = {
        criterias: criterias || {}
    };

    return children.filter(criteriasMatchChild, context);
}

function criteriasMatchChild(child) {
    var criterias = this.criterias;

    return Object.keys(criterias).reduce(function matchCriteria(hasFoundMatch, currentRule) {
        var regexToMatch = new RegExp(criterias[currentRule]);
        return regexToMatch.test(child[currentRule]);
    }, true);
}

function generateRelativeUrl(relativeUrl) {
    return this.serverUrl + relativeUrl;
}

export default PlexAPI;

var uuid = require('uuid');
var url = require('url');
import Promise = require('bluebird');
var xml2js = require('xml2js');
var plexApiHeaders = require('plex-api-headers');
import uri = require('./uri');
import {each} from "lodash";
import credentials from './credentials';
require('whatwg-fetch');

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

export module Responses {
    export interface LibrarySections {
        size: string;
        allowSync: string;
        identifier: string;
        mediaTagPrefix: string;
        mediaTagVersion: string;
        title1: string;
        directory: LibrarySectionsDirectory[];
    }

    interface LibrarySectionsDirectory {
        allowSync: string;
        art: string;
        composite: string;
        filters: string;
        refreshing: string;
        thumb: string;
        key: string;
        type: string;
        title: string;
        agent: string;
        scanner: string;
        language: string;
        uuid: string;
        updatedAt: string;
        createdAt: string;
        location: any;
    }

    export interface LibrarySectionDirectory {
        key: string;
        title: string;
        secondary: string;
        prompt: string;
        search: string;
    }

    export interface LibrarySection {
        size: string;
        allowSync: string;
        art: string;
        content: string;
        identifier: string;
        mediaTagPrefix: string;
        mediaTagVersion: string;
        thumb: string;
        title1: string;
        viewGroup: string;
        viewMode: string;
        directory: LibrarySectionDirectory[];
    }

    export interface Root {
        size: string;
        allowCameraUpload: string;
        allowChannelAccess: string;
        allowSync: string;
        certificate: string;
        friendlyName: string;
        machineIdentifier: string;
        multiuser: string;
        myPlex: string;
        myPlexMappingState: string;
        myPlexSigninState: string;
        myPlexSubscription: string;
        myPlexUsername: string;
        platform: string;
        platformVersion: string;
        requestParametersInCookie: string;
        sync: string;
        transcoderActiveVideoSessions: string;
        transcoderAudio: string;
        transcoderVideo: string;
        transcoderVideoBitrates: string;
        transcoderVideoQualities: string;
        transcoderVideoResolutions: string;
        updatedAt: string;
        version: string;
        directory: RootResponseDirectory[];
    }

    interface RootResponseDirectory {
        count: string;
        key: string;
        title: string;
    }

    export interface Channels {
        size: string;
        directory: ChannelsDirectory[];
    }

    interface ChannelsDirectory {
        key: string;
        title: string;
    }

    export interface Library {
        size: string;
        allowSync: string;
        art: string;
        content: string;
        identifier: string;
        mediaTagPrefix: string;
        mediaTagVersion: string;
        title1: string;
        title2: string;
        directory: LibraryDirectory[];
    }

    interface LibraryDirectory {
        key: string;
        title: string;
    }

    export interface Playlist {
        size: string;
        playlist: PlaylistItem;
    }

    interface PlaylistItem {
        ratingKey: string;
        key: string;
        guid: string;
        type: string;
        title: string;
        titleSort: string;
        summary: string;
        smart: string;
        playlistType: string;
        composite: string;
        duration: string;
        leafCount: string;
        addedAt: string;
        updatedAt: string;
        durationInSeconds: string;
    }

    export interface Server {
        size: string;
        server: ServerItem;
    }

    interface ServerItem {
        name: string;
        host: string;
        address: string;
        port: string;
        machineIdentifier: string;
        version: string;
    }

    export interface System {
        noHistory: string;
        replaceParent: string;
        size: string;
        identifier: string;
        directory: SystemDirectory[];
    }

    interface SystemDirectory {
        key: string;
        title: string;
        name: string;
    }

    interface HubGenre {
        id: string;
        tag: string;
    }

    interface HubRole {
        id: string;
        tag: string;
        role: string;
    }

    interface HubLocation {
        path: string;
    }

    interface HubDirectory {
        ratingKey: string;
        key: string;
        parentRatingKey: string;
        guid: string;
        type: string;
        title: string;
        parentKey: string;
        parentTitle: string;
        summary: string;
        index: string;
        parentIndex: string;
        viewCount: string;
        lastViewedAt: string;
        thumb: string;
        art: string;
        parentThumb: string;
        parentTheme: string;
        leafCount: string;
        viewedLeafCount: string;
        addedAt: string;
        updatedAt: string;
        studio: string;
        contentRating: string;
        rating: string;
        year: string;
        banner: string;
        theme: string;
        duration: string;
        originallyAvailableAt: string;
        childCount: string;
        genre: HubGenre[];
        role: HubRole[];
        location: HubLocation;
    }

    interface HubItem {
        hubKey: string;
        type: string;
        hubIdentifier: string;
        size: string;
        title: string;
        more: string;
        video: Video | Video[];
        key: string;
        directory: HubDirectory[];
    }

    export interface Hub {
        size: string;
        allowSync: string;
        hub: HubItem[];
    }

    export interface Video {
        ratingKey: string;
        key: string;
        type: string;
        title: string;
        summary: string;
        thumb: string;
        art: string;
        duration: string;
        addedAt: string;
        updatedAt: string;
        chapterSource: string;
        media: Media | Media[];
        studio: string;
        contentRating: string;
        rating: string;
        viewCount: string;
        lastViewedAt: string;
        year: string;
        tagline: string;
        originallyAvailableAt: string;
        genre: VideoTag[];
        writer: VideoTag[];
        director: VideoTag[];
        country: VideoTag[];
        role: VideoTag[];
        viewOffset: string;
        titleSort: string;
    }

    interface VideoTag {
        tag: string;
    }

    interface MediaPart {
        id: string;
        key: string;
        duration: string;
        file: string;
        size: string;
        container: string;
    }

    export interface Media {
        videoResolution: string;
        id: string;
        duration: string;
        bitrate: string;
        width: string;
        height: string;
        aspectRatio: string;
        audioChannels: string;
        audioCodec: string;
        videoCodec: string;
        container: string;
        videoFrameRate: string;
        part: MediaPart;
    }

    export interface LibrarySectionCategory {
        size: string;
        allowSync: string;
        art: string;
        identifier: string;
        librarySectionID: string;
        librarySectionTitle: string;
        librarySectionUUID: string;
        mediaTagPrefix: string;
        mediaTagVersion: string;
        thumb: string;
        title1: string;
        title2: string;
        viewGroup: string;
        viewMode: string;
        video: Video[];
    }
}

export class PlexAPI {
    public hostname: string;
    public port: string | number;
    private username: string;
    private password: string;
    private authenticator: any;
    public serverUrl: string;
    private authToken: any;
    public options: APIOptions;

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

    public query<T>(url: string) {
        if (url === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this._request<T>(url, 'GET', true).then(uri.attach(url));
    }

    public postQuery<T>(url: string) {
        if (url === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this._request<T>(url, 'POST', true).then(uri.attach(url));
    }

    public perform<T>(url: string) {
        if (url === undefined) {
            throw new TypeError('Requires url argument');
        }

        return this._request<T>(url, 'GET', false);
    }

    private _request<T>(relativeUrl, method, parseResponse) {
        var reqUrl = generateRelativeUrl.call(this, relativeUrl);

        var headers = <any>plexApiHeaders(this, {
            'Accept': 'application/json',
            'X-Plex-Token': this.authToken,
            'X-Plex-Username': this.username
        });

        return new Promise<T>((resolve, reject) => {
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
                    return response.text().then(x => resolve(<any>x), reject);
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

function generateRelativeUrl(relativeUrl) {
    return this.serverUrl + relativeUrl;
}

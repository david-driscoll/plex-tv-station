import {Observable} from "rx";
import {PlexAPI, Responses} from "./api";
import {each, filter, startsWith, contains, map, trimLeft, has, random, defer, extend, delay} from "lodash";
//var videojs = require('video.js');
var videojs = require('npm:video.js@4.12.13/dist/video-js/video.dev');
var plexApiHeaders = require('plex-api-headers');

function log(e) {
    var d = document.createElement('div');
    d.innerText = JSON.stringify(e);
    //document.body.appendChild(d);
    console.log(e);
}

window.onerror = function(e) {
    log(e);
}

var api = new PlexAPI({
    hostname: '192.168.1.100',//"rainbowdash",
    port: 32400,
    options: {
        identifier: "kids-player-123"
    }
});

var serverId;
var server = api.query<Responses.Server>("/servers");
var sections = api.query<Responses.LibrarySections>("/library/sections");
var fetchPromises: [Promise<Responses.Server>, Promise<Responses.LibrarySections>] = [server, sections];
Promise.all(<any>fetchPromises)
.then(([server, sections]: [Responses.Server, Responses.LibrarySections]) => {
    serverId = server.server.machineIdentifier;

    Observable.from(filter(sections.directory, x => startsWith(x.title, "Kids ")))
        .flatMap(x => {
            var path = `/library/sections/${x.key}`;
            return api.query<Responses.LibrarySection>(path).then(response => ({ path, response }));
        })
        .flatMap((x) =>
            Observable.from(
                filter(x.response.directory, x => contains([/*'all',*/ 'recentlyAdded'/*, 'neweset'*/], x.key))
            ).flatMap((section) => {
                var p: string = `${x.path}/${section.key}`;
                return api.query<Responses.LibrarySectionCategory>(p)
                    .then(response => ({ path: p, response }));
            }))
        .tapOnNext((x) => log(x.response))
        .concatMap(x => x.response.video || [])
        .where(x => {
            var media = <Responses.Media>x.media;
            if (media && media.part && !has(media.part, 'optimizedForStreaming')) {
                return true;
            }
            return false;
        })
        .toArray()
        .subscribe(items => {
            playNext(serverId, items);
        });
});


function playNext(serverId: string, items) {
    var [next] = items.splice(random(0, items.length - 1), 1);
    openVideo(serverId, api, next, () => playNext(serverId, items));
}

var currentIFrame: HTMLIFrameElement;

function openVideo(serverId: string, api: PlexAPI, video: Responses.Video, cb: Function) {

    //volume-btn btn-link btn-link-lg high (look for mute)
    // movie-poster (click)

    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `http://rainbowdash:32400/web/index.html#!/server/${serverId}/details/${encodeURIComponent(video.key)}`;
    iframe.onload = () => {
        var $ = (<any>iframe.contentWindow).$;
        Observable.timer(5000)
            .tapOnNext(() => $('.movie-poster').trigger('click'))
            .delay(1000)
            .tapOnNext(() => {
                if ($('.modal-dialog').length) {
                    $('.modal-dialog .select-list').children().last().children('a').trigger('click');
                }
            })
            .subscribe(() => {
                if (currentIFrame) {
                    currentIFrame.remove();
                }
                currentIFrame = iframe;

                iframe.style.display = '';
            });
    };

    document.body.appendChild(iframe);

    var media = <Responses.Media>video.media;

    var params = extend({}, {
        path: `${api.serverUrl}${video.key}`,
        mediaIndex: 0,
        partIndex: 0,
        protocol: 'http',
        offset: 0, // Time in seconds
        fastSeek: 1,
        directPlay: 0,
        directStream: 0,
        subtitleSize: 100,
        audioBoost: 100,
        session: 'f97hzhbjhujif6r',
        //subtitles=burn,
        'Accept-Language': 'en',
        copyts: 1,
        'X-Plex-Chunked': 1,
    }, plexApiHeaders(api));


    var paramsUrl = map(params, (param, key) => `${key}=${encodeURIComponent(param) }`).join('&');

    var playerOptions = {
        controls: true,
        height: '100%',
        width: '100%'
    };

    var videoElement = document.createElement('video');
    videoElement.src = `${api.serverUrl}/video/:/transcode/universal/start?${paramsUrl}`;
    //videoElement.src = `${api.serverUrl}${media.part.key}`;
    //videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.dataset['name'] = video.title;
    videoElement.classList.add('video-js');
    videoElement.classList.add('vjs-default-skin');
    videoElement.classList.add('vjs-full-window');
    document.body.appendChild(videoElement);

    var player: Rx.IDisposable = videojs(videoElement, playerOptions, function() {
        this.on('ended', () => {
            defer(() => {
                this.dispose();
                cb();
            });
        });

        /*this.on('error', () => {
            defer(() => {
                this.dispose();
                cb();
            });
        });*/
    });

}

var b = api.query<Responses.Root>("/");

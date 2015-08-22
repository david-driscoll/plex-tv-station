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



var iframe = document.createElement('iframe');
//iframe.style.display = 'none';
iframe.width = '100%';
iframe.height = '100%';
iframe.src = `http://192.168.1.100:32400/web/index.html`;
iframe.style.borderWidth = '0';
document.body.appendChild(iframe);
var iframePromise = new Promise(resolve => {
    iframe.onload = () => resolve();
});

var serverId;
var server = api.query<Responses.Server>("/servers");
var sections = api.query<Responses.LibrarySections>("/library/sections");
var fetchPromises = [server, sections, iframePromise];
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
                next.onclick = () => playNext(serverId, items);
                playNext(serverId, items);
            });
    });


function playNext(serverId: string, items, dispose?: Function) {
    var [next] = items.splice(random(0, items.length - 1), 1);
    openVideo(serverId, api, next, dispose, (callback) => playNext(serverId, items, callback));
}

var next = document.createElement('button');
next.style.position = 'fixed';
next.style.top = '0';
next.style.right = '4em';
next.style.fontSize = '1.5em';
next.innerText = 'NEXT';
document.body.appendChild(next);

function openVideo(serverId: string, api: PlexAPI, video: Responses.Video, dispose: Function, cb: (callback: Function) => void) {
    //volume-btn btn-link btn-link-lg high (look for mute)
    // movie-poster (click)

    var playerOptions = {
        controls: true,
        height: '100%',
        width: '100%'
    };

    var videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.dataset['name'] = video.title;
    videoElement.classList.add('video-js');
    videoElement.classList.add('vjs-default-skin');
    videoElement.classList.add('vjs-full-window');

    iframe.contentWindow.location.hash = `#!/server/${serverId}/details/${encodeURIComponent(video.key) }`;
    (() => {
        var $ = (<any>iframe.contentWindow).$;

        Observable.fromPromise(new Promise(resolve => {
            var cb = () => {
                if ($('.item-poster').length)
                    resolve(null);
                else defer(cb);
            };
            defer(cb);
        }).then(() => {
            $('.item-poster').trigger('click');
        }))
            .flatMap(() => {
                var a = Observable.fromPromise(new Promise(resolve => {
                    var cb = () => {
                        if ($('.modal-dialog').length)
                            resolve(null);
                        else defer(cb);
                    };
                    defer(cb);
                }).then(() => $('.modal-dialog .select-list').children().last().children('a').trigger('click')));

                return Observable.amb(a, Observable.timer(5000));
            })
            .subscribe(() => {
                if (dispose) dispose();

                var plexVideoElement: HTMLVideoElement = $('video')[0];

                var c = () => {
                    if ($('video').length === 0)
                        cb(() => { });
                    else
                        delay(c, 1000);
                };
                delay(c, 1000);
                //videoElement.src = plexVideoElement.src;
                //document.body.appendChild(videoElement);

                //iframe.remove();
                //iframe.src = `http://192.168.1.100:32400/web/index.html`;
                /*var player: Rx.IDisposable = videojs(videoElement, playerOptions, function() {
                    var c = () => {
                        defer(() => {
                            this.pause();
                            cb(() => this.dispose());
                        });
                    };

                    var next = document.createElement('div');
                    next.onclick = c;
                    next.innerText = 'Next';

                    this.on('ended', c);
                    this.on('error', c);

                    document.querySelector('.vjs-live-controls')
                        .appendChild(next);

                });*/
            });
    })();
}

var b = api.query<Responses.Root>("/");

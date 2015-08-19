import {abc} from "./player";
import {Observable} from "rx";
import Plex from "./api";

var p = new Plex({
    hostname: "rainbowdash",
    port: 32400,
    options: {
        identifier: "kids-player-123"
    }
});

var a = p.query("/library/sections");
Observable.fromPromise(a)
.subscribe(response => {
    console.log(response);
});

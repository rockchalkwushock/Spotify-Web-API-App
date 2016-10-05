import unirest from 'unirest';
import express from 'express';
import events from 'events';
let app = express();
app.use(express.static('public'));

let getFromApi = (endpoint, args) => {
    let emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint).qs(args).end((response) => {
        response.ok
            ? emitter.emit('end', response.body)
            : emitter.emit('error', response.code);
    });
    return emitter;
};

let getRelatedFromAPI = (id) => {
    let emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + '/related-artists').end((response) => {
        response.ok
            ? emitter.emit('end', response.body)
            : emitter.emit('error', response.code);
    });
    return emitter;
};

let getTopTracks = (relatedArtists_id) => {
  let emitter = new events.EventEmitter();
  unirest.get('https://api.spotify.com/v1/artists/' + relatedArtists_id + '/top-tracks?country=us').end((response) => {
      response.ok
          ? emitter.emit('end', response.body)
          : emitter.emit('error', response.code);
  });
  return emitter;
};

app.get('/search/:name', (req, res) => {
    let searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', (item) => {
        let artist = item.artists.items[0];
        let search_id = item.artists.items[0].id;
        let relatedArtists = getRelatedFromAPI(search_id);

        relatedArtists.on('end', (item) => {
            artist.related = item.artists;
            let count = 0;
            let length = artist.related.length;

            artist.related.forEach((currentArtist) => {
                let topTracks = getTopTracks(currentArtist.id);

                topTracks.on('end', (item) => {
                    currentArtist.tracks = item.tracks;
                    count++;
                    if (count === length) {
                      res.json(artist);
                    }
                });
                // Error Handling for topTracks
                topTracks.on('error', (code) => {
                    res.sendStatus(code);
                });
            });
        });
        // Error Handling for relatedArtists
        relatedArtists.on('error', (code) => {
            res.sendStatus(code);
        });
    });
    searchReq.on('error', (code) => {
        res.sendStatus(code);
    });
});

app.listen(process.env.PORT || 8080);

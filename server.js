var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();
app.use(express.static('public'));


// Call for artist ID by name search through Spotify API
var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

// Call for related artists using artist ID from getFromApi
// NOTE: Use Promise!
var getRelatedFromAPI = function(id) {

};
// Call top tracks for each related artist using that related artist ID
// NOTE: Use a new Promise???
var getTopTracks = function(relID) {

};



app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    // Beginning of .on event callers
    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        res.json(artist);
    });


    // Error Handling
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

app.listen(process.env.PORT || 8080);

const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    const urlParts = req.url.split("/");

    // 1. Get all the artists
    if (req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(artists));
    }

    // 2. Get an artist by id
    if (req.method === "GET" && req.url.startsWith("/artists/")) {
      if (urlParts.length === 3) {
        const artistId = urlParts[2];
        const artist = artists[artistId];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(artist));
      }
    }

    // 3. Create a new artist
    if (req.method === "POST" && req.url === "/artists") {
      const newArtist = {
        name: req.body.name,
        artistId: getNewArtistId()
      };
      artists[newArtist.artistId] = newArtist;

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(newArtist));
    }

    // 4. Update an artist
    if ((req.method === "PUT" || req.method === "PATCH") && req.url.startsWith("/artists/")) {
      if (urlParts.length === 3) {
        const artistId = urlParts[2];
        const artist = artists[artistId];
        artist.name = req.body.name;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(artist));
      }
    }

    // 5. Delete an artist
    if (req.method === "DELETE" && req.url.startsWith("/artists/")) {
      if (urlParts.length === 3) {
        const artistId = urlParts[2];
        // const artist = artists[artistId];
        delete artists[artistId];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ message: "Successfully deleted" }));
      }
    }

    // 6. Get all the albums for an artist
    if (req.method === 'GET' && req.url.startsWith('/artists/') && req.url.endsWith('/albums')) {
      if (urlParts.length === 4) {
        const artistId = urlParts[2];
        const artistAlbums = [];
        for (const albumKey in albums) {
          const album = albums[albumKey];
          if (album.artistId === parseInt(artistId)) {
            artistAlbums.push(album);
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(artistAlbums));
      }
    }

    // 7. Get a specific album's details based on albumId
    if (req.method === 'GET' && req.url.startsWith('/albums/')) {
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        const album = albums[albumId];
        const artistId = album.artistId;
        const albumDetails = {
          "albumId": album.albumId,
          "name": album.name,
          "artistId": artistId,
          "artist": artists[artistId],
          "songs": []
        };

        for (const songKey in songs) {
          const song = songs[songKey];
          if (song.albumId === parseInt(albumId)) {
            albumDetails["songs"].push(song);
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(albumDetails));
      }
    }

    // 8. Add an album to a specific artist based on artistId
    if (req.method === 'POST' && req.url.startsWith('/artists/') && req.url.endsWith('/albums')) {
      if (urlParts.length === 4) {
        const artistId = urlParts[2];
        const newAlbum = {
          "albumId": getNewAlbumId(),
          "name": req.body.name,
          "artistId": artistId
        };
        albums[newAlbum.albumId] = newAlbum;

        res.statusCode = 201;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(newAlbum));
      }
    }

    // 9. Edit an album's details based on albumId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith('/albums/')) {
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        const album = albums[albumId];
        album.name = req.body.name;

        res.statusCode = 201;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(album));
      }
    }

    // 10. Delete an album based on albumId
    if (req.method === 'DELETE' && req.url.startsWith('/albums/')) {
      if (urlParts.length === 3) {
        const albumId = urlParts[2];
        delete albums[albumId];

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify({ message: "Successfully deleted" }));
      }
    }

    // 11. Get all the songs of an artist based on artistId
    if (req.method === 'GET' && req.url.startsWith('/artists/') && req.url.endsWith('/songs')) {
      const artistId = urlParts[2];
      const artistSongs = [];
      for (const songKey in songs) {
        const song = songs[songKey];
        const albumId = song.albumId;
        if (albums[albumId].artistId === parseInt(artistId)) {
          artistSongs.push(song);
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type','application/json');
      return res.end(JSON.stringify(artistSongs));
    }

    // 12. Get all songs of an album based on albumId
    if (req.method === 'GET' && req.url.startsWith('/albums/') && req.url.endsWith('/songs')) {
      const albumId = urlParts[2];
      const albumSongs = [];
      for (const songKey in songs) {
        const song = songs[songKey];
        if (song.albumId === parseInt(albumId)) {
          albumSongs.push(song);
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type','application/json');
      return res.end(JSON.stringify(albumSongs));
    }

    // 13. Get all songs of a specified trackNumber
    if (req.method === 'GET' && req.url.startsWith('/trackNumbers/')) {
      if (urlParts.length === 4) {
        const trackNumber = urlParts[2];
        const trackNumberSongs = [];
        for (const songKey in songs) {
          const song = songs[songKey];
          if (song.trackNumber === parseInt(trackNumber)) {
            trackNumberSongs.push(song);
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(trackNumberSongs));
      }
    }

    // 14. Get a specific song's details based on songId
    if (req.method === 'GET' && req.url.startsWith('/songs/')) {
      if (urlParts.length === 3) {
        const songId = urlParts[2];

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(songs[songId]));
      }
    }

    // 15. Add a song to a specific album based on albumId
    if (req.method === 'POST' && req.url.startsWith('/albums/') && req.url.endsWith('/songs')) {
      if (urlParts.length === 4) {
        const albumId = urlParts[2];
        const newSong = {
          "songId": getNewSongId(),
          "name": req.body.name,
          "albumId": albumId,
          "trackNumber": req.body.trackNumber,
          "lyrics": req.body.lyrics
        };
        songs[newSong.songId] = newSong;

        res.statusCode = 201;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(newSong));
      }
    }

    // 16. Edit a song's details based on songId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith('/songs/')) {
      if (urlParts.length === 3) {
        const songId = urlParts[2];
        const song = songs[songId];
        song.name = req.body.name;
        song.trackNumber = req.body.trackNumber;
        song.lyrics = req.body.lyrics;

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(song));
      }
    }

    // 17. Delete a song based on songId
    if (req.method === 'DELETE' && req.url.startsWith('/songs/')) {
      if (urlParts.length === 3) {
        const songId = urlParts[2];
        delete songs[songId];

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify({ message: "Successfully deleted" }));
      }
    }


    // 404 handler
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = process.env.PORT || 5000;

server.listen(port, () => console.log('Server is listening on port', port));

const http = require("http");
const fetch = require("node-fetch");

const ytSearch = require("youtube-search-without-api-key");
const ytdl = require("ytdl-core");

const archiver = require("archiver");
const fs = require("fs");

// opens http server
let server = http.createServer(function(req, res) {
	const defaultHeaders = {
		"Access-Control-Allow-Origin": "null.jsbin.com",
		"Content-Type": "tex/plain"
	};

	try {
		// checks if trying to download playlist
		if (req.url.substring(0, 18) == "/downloadPlaylist?") {
			// starts to download playlist
			getPlaylistSongs(decodeURIComponent(req.url.split("/downloadPlaylist?")[1]));

		} else {
			throw (new Error());
		}

		// gets song data from spotify playlist
		function getPlaylistSongs(id) {
			// stores songs
			let tracks;

			// fetches playlist to get access token
			fetch(`https://open.spotify.com/playlist/${id}`)
				.then((response) => response.text())
				.then((tokenData) => {
					// loads token from result
					let token = tokenData.split(`"accessToken":"`)[1].split(`",`)[0];

					// fetches first 100 songs
					fetch(`https://api.spotify.com/v1/playlists/${id}`, {
							"headers": {
								"authorization": "Bearer " + token
							},
						})
						.then((response) => response.json())
						.then((data) => {
							console.log("\n\nStarted downloading playlist " + data.name + " at " + new Date().toLocaleString())
							
							// loads first 100 songs into tracks object
							tracks = data.tracks.items;

							// checks if there are more songs to download
							if (!!data.tracks.next) {

								// recursive function to fetch the next songs
								fetchNext(data.tracks.next);

								function fetchNext(next) {
									// loads next 100 songs
									fetch(next, {
											"headers": {
												"authorization": "Bearer " + token
											},
										})
										.then((response) => response.json())
										.then((newData) => {											
											// adds next 100 songs to array
											tracks = tracks.concat(newData.items);

											// checks if there are more songs to download
											if (!!newData.next) {
												fetchNext(newData.next);
											} else {
												// if there are no more songs, it starts to load them from youtube
												getYoutubeLinks(tracks, data.name);
											}
										});
								}
							} else {
								// if there are no more songs, it starts to load them from youtube
								getYoutubeLinks(tracks, data.name);
							}
						});
				});
		}

		// gets youtube links to spotify songs
		async function getYoutubeLinks(tracks, name) {
			console.log("Loaded playlist data");

			let links = [];

			let finishedSongs = 0;

			// loops through tracks
			loop();

			async function loop(i = 0) {
				// query = artist name + song name
				let query = tracks[i].track.artists[0].name + " " + tracks[i].track.name;

				// starts loading next song
				if (i < tracks.length - 1) {
					loop(i + 1);
				}

				// searches query on youtube
				let videos = await ytSearch.search(query);

				// sets link to video url
				links[i] = videos[0].url;

				// counts another finished song
				finishedSongs++;

				console.log("Loaded url for " + tracks[i].track.name);

				// checks if all songs loaded
				if (finishedSongs == tracks.length) {
					downloadSongs(links, tracks, name);
				}
			}
		}

		async function downloadSongs(links, tracks, name) {
			// creates stream for zip file
			let archive = archiver("zip");

			// pipes zip file to output on http server
			res.writeHead(200, {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${name}.zip"`,
				"Keep-Alive": "timeout=5, max=9999999"
			});

			archive.pipe(res);

			// loops through links
			loop();

			function loop(i = 0) {
				// starts loading video
				let video = ytdl(links[i], {
					quality: "highestaudio",
					filter: "audioonly",

					requestOptions: {
						headers: {
							cookie: process.env["YT_COOKIE"]
						},
					},
				});

				// adds video to zip file
				archive.append(video, {
					name: tracks[i].track.name.split("/").join(" ") + ".mp3"
				});

				video.on("end", () => {
					if (i < links.length - 1) {
						loop(i + 1);
					} else {
						archive.finalize(function(err, bytes) {
							if (err) {
								throw err;
							}
						});
					}
				});
			}

			/*// saves zip file
			let id = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
			let fileStream = fs.createWriteStream("output/" + id);

			archive.pipe(fileStream)
				.on("end", () => {
					console.log("file saved");
					
					// sends zip file to client after reading
					let readStream = fs.createReadStreamStream("output/" + id + ".zip")
						.on("end", () => {
							// deletes file when finished
							fs.unlink("output/" + id + ".zip", function(err) {});
							console.log("file deleted");
						});

					readStream.pipe(res);
				});*/
		}

	} catch (e) {
		res.writeHead(200, defaultHeaders);
		res.end("Placeholder, lmao");
	}
});

server.setTimeout(0);
server.listen(8443);
console.log("Server running on port 8443");

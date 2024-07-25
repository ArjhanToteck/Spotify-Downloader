# Spotify-Downloader
I started making this Spotify playlist downloader for a reason you might not expect. I have premium, so I don't need it to listen offline. However, GTA has this feature where you can import custom music for their radio, so obviously, I had no choice but to write a 200-line program that could download my entire 300 song playlist just so I could listen to it while doing drive-bys in GTA.

We can just ignore that and pretend I just made it for all my homies without premium though. Enjoy.

# How It Works
This literally just sends the playlist link to a server. The server then gets a list of every song in the playlist and looks them up on YouTube. It downloads the audio from there and then compresses them into a ZIP file before sending it to the client.

TODO: make an app version of this too bc my server can't convert all these to mp4s, also incorporate Invidious as an option

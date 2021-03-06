node-free-lastfm-mp3-downloader
============

A command-line utility for downloading last.fm free recommmended mp3's

*Requires* libxml-to-js. You can install it by: `npm install libxml-to-js`

Usage
-------

To start the script, type `node app.js`.

### Configurations

Edit `$.config` in `app.js`:

*rssURL*: the url to your last.fm free mp3 download RSS. You can find it at http://last.fm/home .

*cacheFile*: where the downloaded RSS will be cached. It's default to lastfm-rss.json .

*downloadedFile*: where a record of downloaded mp3 will be stored. Default to lastfm-downloaded.json .

*mp3Folder*: where downloaded mp3 will be saved. Default to /Downloads.

### Other Configurations:

*userAgent*: User agent used for downloading. Default to Linux FF 7.0.

*cacheRefresh*: How long, in days, the current cache can last before refreshing. Default to 1 day.

*maxRetry*: How many times the program will retry before skipping to the next one.

*speedNotify*: Frequency in seconds the program will notify about the current speed. Default to every 10 seconds.

*haltTolerance*: Along with speedNotify defines how long the program allows the current download to be halting before taking actions. Currently it will simply pause and then resume the download.

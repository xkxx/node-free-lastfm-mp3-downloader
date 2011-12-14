node-free-lastfm-mp3-downloader
============

A node.js script that will download your free mp3 recommadations from Last.fm

*Requires* libxml-to-js. You can install it by: npm install libxml-to-js

libxml-to-js has a weird bug that causes segmentation fault or errors like 'Object 0 has no method \'prefix\''. I can do nothing about it but to sugguest you try repeatly till it works.

Usage
-------

Download the app.js script, edit $.config:

*rssURL*: the url to your last.fm free mp3 download RSS. You can find it on http://last.fm/home .

*cacheFile*: where the downloaded RSS will be cached. It's default to lastfm-rss.json .

*downloadedFile*: where a record of downloaded mp3 will be stored. Default to lastfm-downloaded.json .

*mp3Folder*: where downloaded mp3 will be saved. Default to /Downloads.

And then you can run the script by node app.js. Enjoy!

### Other Configurations:

*userAgent*: User agent used for downloading. Default to Linux FF 7.0.

*cacheRefresh*: How long, in days, the current cache can last before refreshing. Default to 1 day.

*maxRetry*: How many times the program will retry before skipping to the next one.

*speedNotify*: Frequency in seconds the program will notify about the current speed. Default to every 10 seconds.

*haltTolerance*: Along with speedNotify defines how long the program allows the current download to be halting before taking actions. Currently it will simply pause and then resume the download.
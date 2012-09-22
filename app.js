/* Last.fm Free MP3 Downloader
	@author xkx
	@copyright 2011
	@lisence GPL 3.0
*/

var fs = require('fs'),
	http = require('http'),
	url = require('url'),
	util = require('util'),
	path = require('path'),
	xml2js = require('libxml-to-js');

var $ = {};
$.config = {
	rssURL: "http://ws.audioscrobbler.com/2.0/user/username/podcast.rss",
	cacheFile: 'lastfm-rss.json',
	downloadedFile: 'lastfm-downloaded.json',
	mp3Folder: 'Downloads',
	userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
	cacheRefresh: 1,
	maxRetry: 3,
	speedNotify: 10,
	haltTolerance: 3
};
var print = console.info;
var clear = "\033[1A\033[K"; //move one line higher and clear the line
var debug = console.log;

function url_to_object(input) {
	var parsed = url.parse(input);
	return {
		host: parsed.hostname,
		port: (parsed.port ? parsed.port : 80),
		path: parsed.pathname
	};
}

function fetch_for_url(options, callback, encoding) {
	var data = [], dataLength = 0, contentLength, timer, lastRecordSpeed = 0, haltCount = 0, cbcalled = false;
	http.get(options, function(res) {
		if (res.statusCode != 200) {
			print("Unexpected Response from Website: " + res.statusCode);
			clearInterval(timer);
			cbcalled = true;
			callback();
			return;
		}
		contentLength = res.headers['content-length'];
		res.on('data', function(chunk) {
			//print("Data Received " + chunk.length + " Bytes.");
			data.push(chunk);
			dataLength += chunk.length;
		});
		res.on('end', function() {
			print(clear + "Response Ended, Data Received " + dataLength + " of " + contentLength);
			if(contentLength && contentLength > dataLength) {
				print('Connection Closed Before Data Transfer Is Done. Fetch Failed.');
				clearInterval(timer);
				cbcalled = true;
				callback();
				return;
			}
			var buffer = Buffer.concat(data, dataLength);
			if(encoding) buffer = buffer.toString(encoding);
			clearInterval(timer);
			cbcalled = true;
			callback(buffer);
		});
		res.on('close', function(err) {
			//err would not work: undefined
			if(!cbcalled) {
				print(clear + "Connection Closed Abnormally. Fetch Failed.");
				clearInterval(timer);
				cbcalled = true;
				callback();
			}
		});

		timer = setInterval(function() {
			var currentSpeed = (dataLength - lastRecordSpeed) / $.config.speedNotify;
			if (currentSpeed === 0) {
				if (haltCount == $.config.haltTolerance) {
					print(clear + "Download Halting Reached Tolerance. Will Retry.");
					res.pause();
					setTimeout(res.resume, 100);
					haltCount = 0;
				}
				else {
					haltCount++;
				}
			}
			else {
				haltCount = 0;
			}
			print(clear + "Current Download Speed: " + currentSpeed + "Bps");
			lastRecordSpeed = dataLength;
		}, $.config.speedNotify*1000);
		
		print("Got Response Successfully from Website, Content Length: " + contentLength);

	}).on('error', function(e) {
		print("Got Error from Website: " + util.inspect(e));
		//TODO: investigate error type
	});
}

function fetch(url, callback, encoding) {
	var options = url_to_object(url), retry = 0;
	options.headers = {
		'user-agent': $.config.userAgent,
		'accept': "*/*",
		'date': Date()
	};
	function verifyReturn(msg) {
		if (msg != null) {
			print("Fetch Completed.");
			callback(msg);
		}
		else {
			if(retry < $.config.maxRetry) {
				retry++;
				fetch_for_url(options, verifyReturn, encoding);
			}
			else {
				print("Max Retry Reached. End Further Fetches.");
				callback();
			}
		}
	}
	fetch_for_url(options, verifyReturn, encoding);
}

function readRSS(url) {
	fetch(url, function(content) {
		if(content == null) {
			print("Unable to Fetch RSS. Try Again Later?");
			process.exit(1);
		}
		print("Fetch RSS Successful.");
		xml2js(content, function (error, result) {
			if (error) {
				debug(error);
				print("Parsing RSS Failed. Try Again Later?");
				process.exit(1);
			}
			$.rss = result;
			$.rss.date = Date();
			fs.writeFileSync($.config.cacheFile, JSON.stringify($.rss), 'utf8');
			processRSS();
		});
	} ,'utf8');
}
function readFile(filename) {
	var content;
	try {content = fs.readFileSync(filename, 'utf8');}
	catch(err) {
		return null;
	}
	return content;
}
function processRSS() {
	print("Now Start Downloading " + $.rss.channel.title);
	var mp3list = $.rss.channel.item, index = 0;
	function downloadMp3() {
		var cmp3 = mp3list[index];
		var cmp3Url = cmp3.enclosure['@'].url;
		if ($.downloaded.indexOf(cmp3Url) == -1) {
			var title = unescape(cmp3.title);
			print("Now Downloading " + title + " from " + cmp3['itunes:author']);
			fetch(cmp3Url, function(content) {
				if (content != null) {
					//fix the '/' in title bug
					var filename = $.config.mp3Folder+'/'+ cmp3['itunes:author'] + ' - ' + title.replace(/\//,'_')+".mp3";
					fs.writeFile(filename, content, function(err) {
						if(err) {
							print("Writing File to Drive Failed:" + err.message);
						}
						else {
							$.downloaded.push(cmp3Url);
							fs.writeFile($.config.downloadedFile, JSON.stringify($.downloaded), 'utf8');
						}
					});
				}
				index++;
				if(index < mp3list.length) downloadMp3();
				else print("All Downloads Finished. ENJOY!");
			});
		}
		else {
			index++;
			if(index < mp3list.length) downloadMp3();
			else print("No New Mp3 to Download. Stay Tuned.");
		}
	}
	downloadMp3();
}

function main() {
	//Init...
	print("Last.FM Free MP3 Manager\nCopyright xkx @ 2011");
	try {fs.mkdirSync($.config.mp3Folder, 0744);}
	catch(err) {}
	print("Reading Cache...");
	$.rss = readFile($.config.cacheFile);
	if ($.rss == null) print("Reading Cache Failed, Assuming Fresh Start.");
	else {
		try {$.rss = JSON.parse($.rss);}
		catch(err) {
			print("Parsing Cache Failed. Will Read From Website Instead.");
			$.rss = null;
		}
		if((new Date(new Date() - new Date($.rss.date))).getUTCDate() > $.config.cacheRefresh) {
			print("Cache Timeout. Will Read From Website Instead.");
			$.rss = null;
		}
	}
	//Loading local info file
	$.downloaded = readFile($.config.downloadedFile);
	if ($.downloaded == null) {
		print("Reading Downloaded Info Failed, Will Download Every Single MP3.");
		$.downloaded = [];
	}
	else {
		try {$.downloaded = JSON.parse($.downloaded);}
		catch(err) {
			print("Reading Downloaded Info Failed, Will Download Every Single MP3.");
			$.downloaded = [];
		}
	}
	//Loading RSS from website
	if ($.rss == null) {
		print("Reading User RSS From Website...");
		readRSS($.config.rssURL);
	}
	else {
		processRSS();
	}
}

main();

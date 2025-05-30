const fs = require('fs');

const colourMap = {
	"Reset" : "\x1b[0m",
	"Bright" : "\x1b[1m",
	"Dim" : "\x1b[2m",
	"Underscore" : "\x1b[4m",
	"Blink" : "\x1b[5m",
	"Reverse" : "\x1b[7m",
	"Hidden" : "\x1b[8m",
	"FgBlack" : "\x1b[30m",
	"FgRed" : "\x1b[31m",
	"FgGreen" : "\x1b[32m",
	"FgYellow" : "\x1b[33m",
	"FgBlue" : "\x1b[34m",
	"FgMagenta" : "\x1b[35m",
	"FgCyan" : "\x1b[36m",
	"FgWhite" : "\x1b[37m",
	"FgGray" : "\x1b[90m",
	"BgBlack" : "\x1b[40m",
	"BgRed" : "\x1b[41m",
	"BgGreen" : "\x1b[42m",
	"BgYellow" : "\x1b[43m",
	"BgBlue" : "\x1b[44m",
	"BgMagenta" : "\x1b[45m",
	"BgCyan" : "\x1b[46m",
	"BgWhite" : "\x1b[47m",
	"BgGray" : "\x1b[100m"
}

let logFilePath;

function error(message){
	log(message, "FgRed");
}

function log(message, colour){
	if (!message){
		message = "";
	}
	if (colour && colourMap[colour]){
		console.log(colourMap[colour] + "%s\x1b[0m", message);
	}
	else {
		console.log(message);
	}

	if (!logFilePath && appType){
		logFilePath = appType + '.log';
	}

	if (logFilePath){
		fs.appendFile(logFilePath, new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + "  " + message + '\n', function (err) {
			if (err) throw err;
		});
	}
}

module.exports = {
	log: log,
	error : error
}
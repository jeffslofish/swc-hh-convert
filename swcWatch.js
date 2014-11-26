/**
* This script watches the directory specified by the first argument to the script
* and will take Seals With Clubs hand histories and convert them to Full Tilt 
* hand histories.
*/
var sys = require("sys");  
var fs = require('fs');
var request = require('request');
var Tail = require('tail').Tail;
var convert = require('./swcConvert.js');
var hhDir = process.argv[2]; 

if (/^win/.test(process.platform)) {
	var separator = "\\"
} else {
	var separator = "/"
}

if (!hhDir) {
	sys.puts("You must provide the swc hand history directory as the first argument.");
	process.exit(1);
}

var tail;

/**
* Tail all existing files in hh directory
*/
var existingFiles = fs.readdirSync(hhDir);
for (var i = 0; i < existingFiles.length; i++) {
	tail = new Tail(hhDir + separator + existingFiles[i]);
	tail.on("line", function(data) {
		bufferTillRake(data);
	});
}


/**
* Tail files that are added to hh directory
*/
fs.watch(hhDir, function(event, filename) {	
	if (filename && event == 'rename') {
		tail = new Tail(hhDir + separator + filename);
		tail.on("line", function(data) {
			bufferTillRake(data);
		});
	}
});


/**
* Buffers all lines of data sent to this function until it sees 'Rake (',
* which signifies the end of the hand. Once the whole hand has been buffers
* it is sent along to another function for processing.
*/
var hand = "";
function bufferTillRake(data) {
	hand += "\n" + data;
	if (data.substr(0,6) == "Rake (") {
		hand += "\n\n";
		var convertedHand = convert.convert(hand, 1);
		console.log(convertedHand);
	} 
}


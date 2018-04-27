'use strict';

var COLS,ROWS,RS,E,D4,D5,D6,D7;
var SCROLL_SPEED = 500;

var Lcd = require('lcd');

module.exports = lcdDisplay;

function lcdDisplay(context,config) {
  
	var self = this;
	
	self.displayTimer = undefined;
	self.currentState = undefined;
	self.elapsed = 0;

	self.context = context;
	self.logger = self.context.logger;
	
	COLS = config.get('COLS');	ROWS = config.get('ROWS');
	RS = config.get('RS');		E = config.get('E');
	D4 = config.get('D4');		D5 = config.get('D5');
	D6 = config.get('D6');		D7 = config.get('D7');

	self.lcd = new Lcd({rs: RS, e: E, data: [D4, D5, D6, D7], cols: COLS, rows: ROWS});
	self.logger.info('[lcdHD47780] COLS=' + COLS + ' ROWS=' + ROWS + ' RS=' + RS + ' E=' + E + ' D4=' + D4 + ' D5=' + D5 + ' D6=' + D6 + ' D7=' + D7);
  
}

lcdDisplay.prototype.close = function() {
  
	var self = this;
	if (self.displayTimer !== undefined) {
		clearTimeout(self.displayTimer);
	}
	self.lcd.close();
  
};

lcdDisplay.prototype.endOfSong = function() {
  
	var self = this;

	if (self.displayTimer !== undefined) {
		clearTimeout(self.displayTimer);
		self.displayTimer = undefined;
	}	
	self.lcd.clear();
  
};

lcdDisplay.prototype.pushState = function(state)  {
	
  var self = this;
	self.elapsed = state.seek;
	if (state.status === 'play') {		
		if (self._needStartDisplayInfo(state)) { // Clear the timeout and start displayInfo again
			clearTimeout(self.displayTimer);
			self.lcd.clear();
			self.displayTrackInfo(state, 0);
		}
	}
	else if (state.status === 'stop') { // Now stopped, clear the timeout and display
		self.elapsed = 0;
		clearTimeout(self.displayTimer);
		self.lcd.clear();
	}
	else if (state.status === 'pause') {
		self.elapsed = state.seek; // Update elapsed
	}
	self.currentState = state; // Update state
  
};

lcdDisplay.prototype.displayTrackInfo = function(data,pos) {
	
  	var self = this; 
	var duration = data.duration;
	
	if (self.elapsed >= duration * 1000) {
		self.endOfSong();
	} else {
	
		var trackInfo = data.artist + ' - ' + data.title;

  	if (trackInfo.length > COLS) {
			// Piece the string together in such a way so it constantly scrolling
			trackInfo = trackInfo + '          ' + trackInfo.substr(0, COLS);
		} else { // If the length is les then the display width, we just need to display it and forget about scrolling
			// Add spaces to fill up the rest of the display
			trackInfo = trackInfo + (' ').repeat(COLS-trackInfo.length);
		}
	
		// Reset position
		if (pos >= trackInfo.length - COLS) {
	    		pos = 0;
		}
	
		self.lcd.setCursor(0,0);
		// Print track info
		self.lcd.print(trackInfo.substr(pos,COLS),function (err) {
			
      // Track info printed ok, set lets print elapsed / duration
			self.lcd.setCursor(0,1);
			self.lcd.print(self._formatSeekDuration(self.elapsed,duration),function (err) {
				self.displayTimer = setTimeout(function () {
				if (self.currentState.status != 'pause')
	  	    self.elapsed += SCROLL_SPEED;
				self.displayTrackInfo(data, pos + 1);
				},SCROLL_SPEED);
			});
		});
	}

};

// If we have started playing or the artist/track has changed we need
// to restart displayInfo		 
		       
lcdDisplay.prototype._needStartDisplayInfo = function(state) {

	var self = this;
  	return  ((state.status === 'play' && self.currentState.status === 'stop') ||
    	self.currentState.artist !== state.artist || 
  		self.currentState.title !== state.title);
  
};

// Formats the seek and duration into a text format suitable for display
// seek (seek time in milliseconds)
// duration (duration time in seconds)

lcdDisplay.prototype._formatSeekDuration = function(seek, duration) { 

	var seekSec = Math.floor(seek / 1000); // convert seek to seconds
	var seekMin = Math.floor(seekSec / 60); // calculate whole seek minutes
	seekSec = seekSec - (seekMin * 60); // remaining seconds 
   
	var durMin = Math.floor(duration / 60); // calculate whole duration minutes
	var durSec = duration - (durMin * 60); // remaining seconds

	// only two digits for minutes, so wrap back to 0 once we hit 100 
	seekMin = seekMin % 100; 
	durMin = durMin % 100;

	// pad all minutes and seconds
	if (seekMin < 10) (seekMin = "0" + seekMin);
	if (seekSec < 10) (seekSec = "0" + seekSec);
	if (durMin < 10)  (durMin = "0" + durMin);
  	if (durSec < 10)  (durSec = "0" + durSec);  
	
 	var txt = seekMin + ":" + seekSec + " / " + durMin + ":" + durSec;
 
	return txt; 

};

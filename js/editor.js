
let zip = new JSZip(),
	input = document.querySelector('#input'),
	names = document.querySelector('#names'),
	degrees = document.querySelector('#degrees'),
	flairs = document.querySelector('#flairs'),
	reverse = document.querySelector('#reverse'),
	fixCam = document.querySelector('#fixCam'),
	fixCamPosX = document.querySelector('#fixCamPosX'),
	fixCamPosY = document.querySelector('#fixCamPosY'),
	clone = document.querySelector('#clone'),
	cloneFrame = document.querySelector('#cloneFrame'),
	submitButton = document.querySelector('#submitButton'),
	doSwitch = document.querySelector('#switch'),
	doHorizontal = document.querySelector('#doHorizontal'),
	doVertical = document.querySelector('#doVertical'),
	doLyrics = document.querySelector('#lyrics'),
	lyricsInput = document.querySelector('#lyricsFile');


// Globals
let lyrics;
let offset = 0;


///////////////////////
// Editing functions //
///////////////////////

// Remove single player's name
// player: object from positions
// returns: edited player object
function removeName(player) {
	player.name.fill('');
	return player;
}

// Remove single player's degrees
function removeDegree(player) {
	player.degree.fill(0);
	return player;
}

// Remove single player's flair
function removeFlair(player) {
	player.flair.fill(null);
	return player;
}

//// Reversing Time

// Reverse single player's attributes
function reversePlayer(player) {
	for (let key in player) {
		let val = player[key];
		if (Array.isArray(val)) val.reverse();
	}
	return player;
}

// Reverse floortiles
function reverseFloorTiles(positions) {
	let ft = positions.floorTiles;
	ft.forEach(tile => tile.value.reverse());
	return positions;
}

// Reverse spawns and bombs
function getNewTime(time, first, last, w = 0) {
	let firstT = new Date(first).getTime(),
		lastT = new Date(last).getTime(),
		diff = lastT - new Date(time).getTime(),
		newT = new Date(firstT + diff - w).toJSON();
	return newT;
}
function reverseSpawnsAndBombs(positions) {
	let first = positions.clock[0],
		last = positions.clock[positions.clock.length - 1];
	positions.spawns.forEach(spawn => spawn.time = getNewTime(spawn.time, first, last, spawn.w));
	positions.bombs.forEach(bomb => bomb.time = getNewTime(bomb.time, first, last));
	return positions;
}


//// Stationary camera

// fix camera location
function fixCamera(positions, location) {
	let me = getMe(positions);
	if (!me) return alert('No primary player found.');
	let camPlayer = JSON.parse(JSON.stringify(positions[me]));
	positions[me].me = 'other';
	camPlayer.draw.fill(false);
	camPlayer.x.fill(location.x);
	camPlayer.y.fill(location.y);
	positions['player9999'] = camPlayer;
	return positions;
}


//// Clone a reversed ball

// clone a reversed ball of the me ball at the provided frame number
function cloneBall(positions, frame) {
	if (frame <= 0 || frame >= positions.clock.length) 
		return alert('Invalid value for clone frame.');
	let me = getMe(positions);
	if (!me) return alert('No primary player found.');
	let clone = JSON.parse(JSON.stringify(positions[me]));

	let x = clone.x, y = clone.y;
	let newx = x.slice(), newy = y.slice();
	let lenTemp = x.length - frame,
		len = lenTemp > frame ? frame : lenTemp,
		start = frame - len + 1,
		end = frame + 1;
	let piecex = x.slice(start, end).reverse(),
		piecey = y.slice(start, end).reverse();
	newx.splice(frame, len, ...piecex);
	newy.splice(frame, len, ...piecey);
	
	clone.draw.fill(false);
	clone.draw.splice(frame, len, ...Array(len).fill(true));

	clone.x = newx;
	clone.y = newy;
	clone.me = 'other';

	let cloneName = `player6666`;
	positions[cloneName] = clone;
	return positions;
}


//// Switch teams

// switch single ball
// includes team, positions, and properties
function switchPlayer(player, w, h, doHorizontal, doVertical) {
	player.flag = player.flag.map(val => {
		if (val === 1) return 2;
		if (val === 2) return 1;
		return val;
	});
	player.team = player.team.map(val => {
		if (val === 1) return 2;
		if (val === 2) return 1;
		return val;
	});
	let width = w * 40, height = h * 40;
	if (doHorizontal) player.x = player.x.map(x => { return width - (x+40) });
	if (doVertical) player.y = player.y.map(y => { return height - (y+40) });
	return player;
}

// switch floor tiles
function switchFloorTileValue(val) {
	if (val == 3) return 4;
	if (val == 3.1) return '4.1';
	if (val == 4) return 3;
	if (val == 4.1) return '3.1';
	if (val == 14) return 15;
	if (val == 14.1) return '15.1';
	if (val == 14.11) return '15.11';
	if (val == 15) return 14;
	if (val == 15.1) return '14.1';
	if (val == 15.11) return '14.11';
	if (val == 9.2) return '9.3';
	if (val == 9.3) return '9.2';
	return val;
}
function switchFloorTiles(floorTiles, map, w, h, doHorizontal, doVertical) {
	let mapRef = JSON.parse(JSON.stringify(map));
	let newFloorTiles = [];
	floorTiles.forEach(floorTile => {
		let origX = floorTile.x;
		let origY = floorTile.y;
		if (mapRef[origX][origY] === 'DONE') return;
		let newX = doHorizontal ? w - (origX+1) : origX;
		let newY = doVertical ? h - (origY+1) : origY;
		let matchTile = floorTiles.filter(tile => {
			return (tile.x === newX && tile.y === newY);
		});
		if (!matchTile[0]) return alert('Problem finding matching floorTile when switching map.');
		matchTile = matchTile[0];
		let alteredOrig = JSON.parse(JSON.stringify(floorTile)), 
			alteredMatch = JSON.parse(JSON.stringify(matchTile));
		alteredOrig.value = matchTile.value.map(val => { return switchFloorTileValue(val) });
		alteredMatch.value = floorTile.value.map(val => { return switchFloorTileValue(val) });
		newFloorTiles.push(alteredOrig, alteredMatch);
		mapRef[origX][origY] = 'DONE';
		mapRef[newX][newY] = 'DONE';
	});
	if (!newFloorTiles.length === floorTiles.length) return alert('Something went wrong with switching floorTiles.');
	return newFloorTiles;
}

function switchBombsAndSpawns(positions, w, h, doHorizontal, doVertical) {
	let width = w * 40,
		height = h * 40;
	positions.bombs = positions.bombs.map(bomb => {
		if (doHorizontal) bomb.x = width - (bomb.x + 40);
		if (doVertical) bomb.y = height - (bomb.y + 40);
		return bomb;
	});
	positions.spawns = positions.spawns.map(spawn => {
		if (doHorizontal) spawn.x = width - (spawn.x + 40);
		if (doVertical) spawn.y = height - (spawn.y + 40);
		spawn.t = spawn.t === 1 ? 2 : 1;
		return spawn;
	});
	return positions;
}

// Actually apply the switch functions
function switchReplay(positions, doHorizontal, doVertical) {
	let map = positions.map,
		w = map.length,
		h = map[0].length;
	positions.floorTiles = switchFloorTiles(positions.floorTiles, map, w, h, doHorizontal, doVertical);
	positions = switchBombsAndSpawns(positions, w, h, doHorizontal, doVertical);
	Object.keys(positions).filter(key => key.startsWith('player')).forEach(playerName => {
		let player = positions[playerName];
		positions[playerName] = switchPlayer(player, w, h, doHorizontal, doVertical);
	});
	return positions;
}


//// Apply functions

// apply functions to all players in positions
function editPositions(positions, options) {
	for (let key in positions) {
		if (!key.startsWith('player')) continue;
		let player = positions[key];
		if (!player.name || !player.degree || !player.flair) continue;
		player = options.reverse ? reversePlayer(player) : player;
		player = options.doNames ? removeName(player) : player;
		player = options.doDegrees ? removeDegree(player) : player;
		player = options.doFlairs ? removeFlair(player) : player;
	}
	if (options.reverse) {
		positions = reverseFloorTiles(positions);
		positions = reverseSpawnsAndBombs(positions);
	}
	if (options.doSwitch) {
		positions = switchReplay(positions, options.doHorizontal, options.doVertical);
	}
	if (options.clone) {
		let frame = Number(options.cloneFrame);
		positions = cloneBall(positions, frame);
	}
	if (options.fixCam) {
		let x = Number(options.fixCamPosX),
			y = Number(options.fixCamPosY),
			location = {x: x, y: y};
		positions = fixCamera(positions, location);
	}
	if (options.doLyrics) {
		let result = runLyricsChanger(positions, offset, lyrics);
		positions = result.positions;
		offset = result.offset;
	}
	return positions;
}


/////////////////////
// Deal with files //
/////////////////////

function readCSV() {
	let files = lyricsInput.files;
	if (files.length === 0) return;
	let file = files[0];
	let reader = new FileReader();
	reader.onload = function(e) {
		let text = e.target.result;
		lyrics = $.csv.toObjects(text);
	}
	reader.readAsText(file);
}
lyricsInput.addEventListener('change', readCSV);

function setupReader(files, i, results, options) {
	let file = files[i];
	let name = file.name;
	let reader = new FileReader();
	reader.onload = function(e){
		readerLoaded(e, files, i, name, results, options);
	};
	reader.readAsText(file);
}

function readerLoaded(e, files, i, name, results, options) {
	let text = e.target.result;
	let positions = JSON.parse(text);
	positions = editPositions(positions, options);
	results.push({name: name, positions: positions});

	if (i < files.length - 1) {
		setupReader(files, i+1, results, options);
	} else {
		finish(results);
	}
}

// Run the thing on button click
function editFiles() {
	let files = input.files,
		numFiles = files.length,
		results = [],
		options = {
					doNames: names.checked,
					doDegrees: degrees.checked,
					doFlairs: flairs.checked,
					reverse: reverse.checked,
					fixCam: fixCam.checked,
					fixCamPosX: fixCamPosX.value,
					fixCamPosY: fixCamPosY.value,
					clone: clone.checked,
					cloneFrame: cloneFrame.value,
					doSwitch: doSwitch.checked,
					doHorizontal: doHorizontal.checked,
					doVertical: doVertical.checked,
					doLyrics: doLyrics.checked,
				}

	if (numFiles === 0) return alert('No files selected');

	setupReader(files, 0, results, options);
}

// package the results and download
function finish(results) {
	if (results.length === 1) {
		let blob = new Blob([JSON.stringify(results[0].positions)], {type: "text/plain;charset=utf-8"});
		saveAs(blob, results[0].name);
	} else {
		for (let file of results) {
			zip.file(file.name, JSON.stringify(file.positions));
		}
		zip.generateAsync({type:'blob'})
		.then(content => {
			saveAs(content, 'edited_raw_files.zip');
		});
	}
}


//////////////////////
// Helper Functions //
//////////////////////

// get the key for the "me" ball
function getMe(positions) {
	return Object.keys(positions).filter(key => positions[key].me === 'me')[0]
}

submitButton.addEventListener('click', editFiles);






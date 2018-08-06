
let zip = new JSZip(),
	input = document.querySelector('#input'),
	names = document.querySelector('#names'),
	degrees = document.querySelector('#degrees'),
	flairs = document.querySelector('#flairs'),
	submitButton = document.querySelector('#submitButton');




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

// apply removal functions to all players in positions
function editPositions(positions, options) {
	for (let key in positions) {
		if (!key.startsWith('player')) continue;
		let player = positions[key];
		if (!player.name || !player.degree || !player.flair) continue;
		player = options.doNames ? removeName(player) : player;
		player = options.doDegrees ? removeDegree(player) : player;
		player = options.doFlairs ? removeFlair(player) : player;
	}
	return positions;
}


/////////////////////
// Deal with files //
/////////////////////

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
					doFlairs: flairs.checked
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

submitButton.addEventListener('click', editFiles);






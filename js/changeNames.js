
// get the key for the "me" ball
function getMe(positions) {
	return Object.keys(positions).filter(key => positions[key].me === 'me')[0]
}

function changeFlair(positions) {
	Object.keys(positions).filter(key => { return key.startsWith('player') }).forEach(player => {
		positions[player].flair = new Array(positions.clock.length);
		positions[player].flair.fill({description: 'Love', degree: 143, x: 2, y: 6});
	});
	return positions;
}

function getFrameTimes(positions) {
	let first = new Date(positions.clock[0]).getTime()
	return positions.clock.map(t => {
		return new Date(t).getTime() - first;
	});
}

function findRelevantLyrics(positions, offset, lyrics) {
	let times = getFrameTimes(positions);
	const startTime = offset;
	const endTime = offset + times[times.length - 1];
	return lyrics.filter(lyric => {
		return Number(lyric.end) > startTime && Number(lyric.start) < endTime;
	});
}

function applyLyrics(me, positions, offset, lyrics) {
	if (lyrics.length === 0) return positions;
	let times = getFrameTimes(positions).map(t => {return t + offset});
	lyrics.forEach(lyric => {
		let start = times.findIndex(t => {return t > Number(lyric.start)}) || 1;
		start = Math.min(Math.max(start - 1, 0), times.length - 1);
		let end = times.map(t => t < Number(lyric.end)).lastIndexOf(false);
		end = end < 0 ? times.length - 1 : end;
		end = Math.min(Math.max(end, 0), times.length - 1);
		let numFrames = end - start + 1;
		let nameReplacement = new Array(numFrames).fill(lyric.lyric);
		positions[me].name.splice(start, numFrames, ...nameReplacement);
	});
	return positions;
}

function changeName(me, positions, offset, lyrics) {
	positions = applyLyrics(me, positions, offset, lyrics);
	positions = changeFlair(positions);
	let p = JSON.parse(JSON.stringify(positions[me]));
	p.auth.fill(true);
	positions.player99999 = p;
	if (positions.player6666) {
		positions.player6666.name = p.name;
		positions.player6666.auth.fill(true);
	}
	delete positions[me];
	return positions;
}

function runLyricsChanger(positions, offset, lyrics) {
	let me = getMe(positions);
	let goodLyrics = findRelevantLyrics(positions, offset, lyrics);
	positions = changeName(me, positions, offset, goodLyrics);
	let dur = getDuration(positions);
	offset = offset + dur + 1000/60;
	return {positions: positions, offset: offset};
}

function getDuration(positions) {
	let times = getFrameTimes(positions);
	let dur = times[times.length - 1];
	return Math.ceil(dur / (1000/60)) * 1000/60;
}


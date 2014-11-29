(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

// TODO: move this elsewhere
obelisk.Point3D.prototype.clone = function() {
	return new obelisk.Point3D(this.x, this.y, this.z);
};

/**
 * Module dependencies.
 */

var ui = require('./ui'),
	tool = require('./tool'),
	pointer = require('./pointer'),
	history = require('./history'),
	storage = require('./storage');

/**
 * Private variables
 */

var canvasEl = document.getElementById('scene');
var persistLock = false;
var autoSaveTimeout;
var resizeTimeout;
var fullCanvased = false;

/**
 * Module declaration.
 */

var app = {};

/**
 *  Shift Detect
 */
app.shiftHandler = false;

/**
 *
 */
app.init = function() {
	ui.auth.init();
	ui.scene.init();

	ui.welcome.init(function() {
		ui.palette.init();

		tool.init(ui.scene)
			.use('brush');

		pointer.init(ui.scene)
			.click(tool.click)
			.drag(tool.drag);

		bindShortcuts();
		bindScroll();
		bindResize();

		touchDisclaimer();

		// fetches initial art
		storage.fetch(function(err, data, info) {
			if (err) return ui.notification.error(err);

			if (data) ui.scene.load(data);
			if (info) ui.notification.info(info);

			// auto save from now on
			ui.scene.changed(onAutoSave);
		});
	});

	logCurious();
};

/**
 * @private
 */
function logCurious() {
	console.log('Hey! Curious or having bugs?');
	console.log('Please post ideas or issues here: https://github.com/ngryman/obelisk-buildr/issues.');
	console.log('You can play with the window.scene object.');
	if (console.table) {
		var methods = {
			snapshot: { description: 'Returns a base64 image of the current scene.' },
			load: { description: 'Loads a scene. Same format as the art.json file in gists.' },
			save: { description: 'Returns data associated with the current scene. Same format as the art.json file in gists.' }
		};
		console.table(methods);
	}
}

/**
 * @private
 */
function bindShortcuts() {
	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);
}

/**
 * @private
 */
function bindScroll() {
	var isFirefox = /Firefox/i.test(navigator.userAgent);
	document.addEventListener(isFirefox ? 'DOMMouseScroll' : 'mousewheel', onScroll);
}

/**
 * @private
 */
function bindResize() {
	window.addEventListener('resize', onResize);
}

/**
 * @private
 */
function touchDisclaimer() {
	var isChrome = /chrome/i.exec(navigator.userAgent),
		isAndroid = /android/i.exec(navigator.userAgent),
		hasTouch = 'ontouchstart' in window && !(isChrome && !isAndroid);

	if (hasTouch)
		ui.notification.error('Hey! For now, there is no real support for touch devices. Yeah i know...');
}

/**
 * @param {boolean} silent
 * @returns {object}
 * @private
 */
function save(silent) {
	var data = ui.scene.save(silent);
	storage.local(data);
	return data;
}

/**
 * @private
 */
function persist( local ) {
	if (persistLock) return;
	persistLock = true;

	// nothing to persist
	if (!ui.scene.changed() && !storage.orphan()) {
		persistLock = false;
		return ui.notification.error('nothing to save');
	}

	// saves locally
	var data = save();

	if ( local ) {
		console.log(JSON.stringify(data));
		return;		
	}

	// persist to a gist
	storage.persist(data, function(err, info) {
		persistLock = false;
		if (err) return ui.notification.error(err);

		var anchor = '<a target="_blank" href="' + info.url + '">' + info.id + '</a>';
		ui.notification.info(info.action + ' gist ' + anchor);
	});
}

/**
 * @private
 */
function create() {
	storage.flush();
	ui.scene.clear();
	ui.notification.info('new craft!');
}

/**
 * @private
 */
function fullCanvas() {
	var display = fullCanvased ? 'block' : 'none';
	document.querySelector('header').style.display = display;
	document.querySelector('footer').style.display = display;

	var padding = fullCanvased ? '70px' : '0px';
	document.querySelector('main').style.paddingTop = padding;
	document.querySelector('main').style.paddingBottom = padding;

	ui.scene.resize();

	fullCanvased = !fullCanvased;
}

/**
 * @param {event} e
 * @private
 */
function onKeyDown(e) {
	switch (e.keyCode) {
		// +
		case 107:
			ui.scene.adjustFloor(+1);
			break;

		// -
		case 109:
			ui.scene.adjustFloor(-1);
			break;

		// left
		case 37:
			ui.scene.rotate(+1);
			break;

		// right
		case 39:
			ui.scene.rotate(-1);
			break;

		// b
		case 66:
			tool.use('brush');
			break;

		// e
		case 69:
			tool.use('erase');
			break;

		// space bar
		case 32:
			ui.palette.toggle();
			break;

		// ctrl + z
		case 90:
			if (e.ctrlKey) history.back();
			break;

		// ctrl + s
		case 83:
			e.preventDefault();
			if (e.ctrlKey) {

				if (e.shiftKey){

					persist( true );

				} else {
	
					persist();

				}

			}
			break;

		// n
		case 78:
			create();
			break;

		// f
		case 70:
			fullCanvas();
			break;

		// h
		case 72:
			e.preventDefault();
			ui.help.toggle();
			break;
	}

	// 123456789
	if (e.keyCode >= 49 && e.keyCode <= 57)
		tool.use('brush').set(ui.palette.color(e.keyCode - 49));

	// Shift Button Pressed
	if ( e.keyIdentifier === "Shift" )
		app.shiftHandler = true;

}

/**
 * @param {event} e
 * @private
 */
function onKeyUp(e) {

	if ( e.keyIdentifier === "Shift" )
		// Shift Button Unpressed
		app.shiftHandler = false;

}

/**
 * @param {event} e
 * @private
 */
function onScroll(e) {
	var delta = e.detail ? -e.detail : e.wheelDelta;
	ui.scene.adjustFloor(delta > 0 ? -1 : +1);
}

/**
 * @param {event} e
 * @private
 */
function onResize(e) {
	// hide on first event
	if (null == resizeTimeout)
		canvasEl.style.visibility = 'hidden';

	// debounce scene resize
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(function() {
		ui.scene.resize();
		canvasEl.style.visibility = 'visible';
		resizeTimeout = null;
	}, 100);
}

/**
 * @private
 */
function onAutoSave() {
	// debounce auto save
	clearTimeout(autoSaveTimeout);
	autoSaveTimeout = setTimeout(save.bind(null, true), 1000);
}

/**
 * Global export.
 */
window.app = app;

/**
 * Exports for hackers
 */

window.scene = ui.scene;
},{"./history":3,"./pointer":4,"./storage":5,"./tool":6,"./ui":11}],2:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var anonymousMessage = 'View and edit it on http://ngryman.sh/obelisk-buildr.\n\n' +
	'As this is an anonymous gist, you have to manually copy and paste its id, and append it' +
	'to the url (i.e. http://ngryman.sh/obelisk-buildr#1337).';
var authenticatedMessage = 'View and edit it on http://ngryman.sh/obelisk-buildr/#{0}.';
var token;

/**
 * Module declaration.
 */

var github = {};

/**
 *
 * @returns {boolean}
 */
github.authenticated = function() {
	return (null != token);
};

/**
 *
 */
github.connect = function() {
	location.href = 'https://github.com/login/oauth/authorize?client_id=717772a46c3c521155d3&scope=gist';
};

/**
 *
 */
github.disconnect = function() {
	localStorage.removeItem('token');
	token = null;
};

/**
 *
 * @param content
 * @param callback
 */
github.newGist = function(content, callback) {
	var data = {
		description: 'An awesome pixel art chef d\'oeuvre',
		public: true,
		files: {
			'data.json': {
				content: content
			}
		}
	};

	// anonymous art.json
	if (!token)
		data.files['art.md'] = {
		content: anonymousMessage
	};

	request('post', '/gists', data, token ? editMessage.bind(null, callback) : callback);
};

/**
 *
 * @param id
 * @param content
 * @param callback
 */
github.editGist = function(id, content, callback) {
	var data = {
		files: {
			'data.json': {
				content: content
			}
		}
	};

	request('patch', '/gists/' + id, data, callback);
};

/**
 *
 * @param id
 * @param callback
 */
github.forkGist = function(id, callback) {
	request('post', '/gists/' + id + '/forks', null, token ? editMessage.bind(null, callback) : callback);
};

/**
 *
 * @param id
 * @param callback
 */
github.getGist = function(id, callback) {
	request('get', '/gists/' + id, null, callback);
};

/**
 *
 * @param {function} callback
 * @param {object} err
 * @param {object} res
 * @private
 */
function editMessage(callback, err, res) {
	if (err) return callback(err);

	// art.json with the correct link.
	var data = {
		files: {
			'art.md': {
				content: authenticatedMessage.replace('{0}', res.id)
			}
		}
	};

	request('patch', '/gists/' + res.id, data, callback);
}

/**
 * @param {string} method
 * @param {string} uri
 * @param {object} data
 * @param {function} callback
 * @private
 */
function request(method, uri, data, callback) {
	var qs = '';

	if (token)
		qs = '?access_token=' + token;

	reqwest({
		url: 'https://api.github.com' + uri + qs,
		method: method,
		type: 'json',
		data: data ? JSON.stringify(data) : null,
		error: callback,
		success: callback.bind(null, null)
	});
}

// TODO: github init
/**
 * @private
 */
function fetchToken() {
	// priority from url
	if (~location.search.indexOf('?token=')) {
		token = location.search.match(/\?token=(.{40})/)[1];
		localStorage.setItem('token', token);

		// remove token from query string
		location.replace(location.protocol + '//' + location.host + location.pathname);
	}
	// from local storage
	else
		token = localStorage.getItem('token');
}

fetchToken();

/**
 * Exports.
 */

module.exports = github;
},{}],3:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var stack = [];
var sequence = null;

/**
 * Module declaration.
 */

var history = {};

/**
 *
 * @param {function} fn
 */
history.push = function(fn) {
	if (!sequence)
		return stack.push(fn);
	sequence.push(fn);
};

/**
 *
 */
history.startSequence = function() {
	sequence = [];
};

/**
 *
 */
history.stopSequence = function() {
	var seq = sequence;

	stack.push(function() {
		seq.forEach(function(action) {
			action();
		});
	});

	sequence = null;
};

/**
 *
 * @returns {boolean}
 */
history.isSequenced = function() {
	return (null != sequence);
};

/**
 *
 */
history.back = function() {
	if (0 === stack.length) return;

	stack.pop()();
};

/**
 * Exports.
 */

module.exports = history;
},{}],4:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var history = require('./history');

/**
 * Private variables
 */

var canvasEl = document.getElementById('scene');
var canvasOffset = new obelisk.Point();
var scene;
var x, y;// TODO: screenPos
var viewPoint = new obelisk.Point3D(); // TODO: viewPos
var loopStarted = false;
var loopStopIn = 0;
var down = false;
var dragging = false;
var clickHandler;
var dragHandler;
var moveHandler;

/**
 * Module declaration.
 */

var pointer = {};

/**
 *
 * @param {scene} _scene
 * @returns {pointer}
 */
pointer.init = function(_scene) {
	var main = document.querySelector('#buildr');
	main.addEventListener('mousedown', onDown);
	main.addEventListener('mousemove', onMove);
	main.addEventListener('mouseup', onUp);
	main.addEventListener('mouseleave', onUp);

	window.addEventListener('resize', onResize);

	Loop.on('tick', apply);

	onResize();

	scene = _scene;

	return pointer;
};

/**
 *
 * @param {function} handler
 * @returns {pointer}
 */
pointer.click = function(handler) {
	clickHandler = handler;
	return pointer;
};

/**
 *
 * @param {function} handler
 * @returns {pointer}
 */
pointer.drag = function(handler) {
	dragHandler = handler;
	return pointer;
};

/**
 *
 * @param {function} handler
 * @returns {pointer}
 */
pointer.move = function(handler) {
	moveHandler = handler;
	return pointer;
};

/**
 * @private
 */
function onDown() {
	down = true;
}

/**
 * @private
 */
function onUp() {
	// may happen when called by mouseleave
	if (!down) return;
	down = false;

	if (!dragging) {
		if (clickHandler) clickHandler();
		return;
	}
	dragging = false;

	if (history.isSequenced())
		history.stopSequence();
}

/**
 * @param {event} e
 * @private
 */
function onMove(e) {
	x = e.pageX - canvasOffset.x;
	y = e.pageY - canvasOffset.y;

	if (down && !dragging)
		dragging = true;

	if (!loopStarted) {
		Loop.start();
		loopStarted = true;
	}
	loopStopIn = 1;
}

/**
 * @private
 */
function onResize() {
	canvasOffset.x = canvasEl.offsetLeft;
	canvasOffset.y = canvasEl.offsetTop;
}

/**
 * @private
 */
function apply() {
	scene.screenToView(x, y, viewPoint);
	scene.select(viewPoint);

	if (dragging) {
		if (dragHandler) dragHandler();
		return;
	}

	if (moveHandler) moveHandler();

	if (0 === loopStopIn) {
		Loop.stop();
		loopStarted = false;
	}
	loopStopIn--;
}

/**
 * Exports.
 */

module.exports = pointer;
},{"./history":3}],5:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var github = require('./github');

/**
 * Private variables
 */

var errors = {
	sadSave: "could not save your awesome art on the cloud :(",
	unknownGist: "it seems this gist does not exist anymore :(",
	invalidGist: "this gist does not behaves well, loading failed :(",
	forkFailed: "fork failed :(<br>does this gist still exists?"
};
var gist;

/**
 * Module declaration.
 */

var storage = {};

/**
 *
 * @param data
 */
storage.local = function(data) {
	localStorage.setItem(gist ? gist : 'orphan', JSON.stringify(data));
};

/**
 *
 * @returns {boolean}
 */
storage.orphan = function() {
	return (null == gist);
};

/**
 *
 * @param {object} data
 * @param {function} callback
 */
storage.persist = function(data, callback) {
	var content = JSON.stringify(data, null, 2),
		action = 'created';

	// working on an existing gist?
	if (gist) {
		// edit it
		github.editGist(gist, content, function(err, res) {
			// tried to edit a gist that is not ours
			if (err) {
				if (401 == err.status || 404 == err.status) {
					// fork it if we are authenticated
					// anonymous gist can't be edited after being forked
					if (github.authenticated()) {
						github.forkGist(gist, function(err, res) {
							if (err) return callback(errors.forkFailed);

							// then add changes
							action = 'forked gist ' + gist + ' to';
							github.editGist(res.id, content, onData);
						});
					}
					// if not, well, simply create it :p
					else
						github.newGist(content, onData);
				}
				else
					callback(errors.sadSave);

				return;
			}

			action = 'saved to';
			onData(err, res);
		});

		return;
	}

	// create a new one
	github.newGist(content, onData);

	function onData(err, res) {
		if (err) return callback(errors.sadSave);

		// remove orphan data
		if (storage.orphan())
			localStorage.removeItem('orphan');

		// set this gist as the current one
		gist = res.id;
		// and the last one we worked on
		localStorage.setItem('last', gist);
		// make sure the hash is up to date
		if (gist != location.hash.slice(1))
			location.hash = gist;

		// save it locally too
		storage.local(data);

		var info = {
			id: res.id,
			url: res.html_url,
			action: action
		};

		callback(null, info);
	}
};

/**
 *
 * @param {function} callback
 */
storage.fetch = function(callback) {
	var data;

	// priority to url
	if (location.hash) {
		gist = location.hash.slice(1);

		// if it was a gist we were working on, load local data as it is more fresh
		data = localStorage.getItem(gist);
		if (data)
			return callback(null, JSON.parse(data), 'loaded your last local changes for ' + gist);

		// if not loads the gist
		github.getGist(gist, function(err, res) {
			if (err) return callback(errors.unknownGist);

			var data;
			try {
				data = JSON.parse(res.files['data.json'].content);
			}
			catch (e) {
				return callback(errors.invalidGist);
			}

			callback(null, data);
		});
		return;
	}

	// well, load the last working gist?
	gist = localStorage.getItem('last');
	data = localStorage.getItem(gist);
	if (data) {
		location.hash = gist;
		return callback(null, JSON.parse(data), 'loaded your last saved stuff');
	}

	// ok ok, load the last orphan art?
	data = localStorage.getItem('orphan');
	if (data) return callback(null, JSON.parse(data), 'loaded your last local stuff');

	// i can't do nothing more dude, new one!
	callback(null, null, 'new');
};

/**
 *
 */
storage.flush = function() {
	localStorage.removeItem('last');
	location.hash = '';
};

module.exports = storage;
},{"./github":2}],6:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var tools = {
	brush: require('./tools/brush'),
	erase: require('./tools/erase')
};

/**
 * Private variables
 */

var scene;
var current;

/**
 * Module declaration.
 */

var tool = {};

/**
 *
 * @param _scene
 * @returns {tool}
 */
tool.init = function(_scene) {
	scene = _scene;
	return tool;
};

/**
 *
 * @param type
 * @returns {tool}
 */
tool.use = function(type) {
	current = tools[type];
	return tool;
};

/**
 *
 * @param value
 * @returns {tool}
 */
tool.set = function(value) {
	if (current.set) current.set(value);
	return tool;
};

/**
 *
 * @returns {tool}
 */
tool.click = function() {
	current.click(scene);
	return tool;
};

/**
 *
 * @returns {tool}
 */
tool.drag = function() {
	current.drag(scene);
	return tool;
};

/**
 * Exports.
 */

module.exports = tool;
},{"./tools/brush":7,"./tools/erase":8}],7:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var history = require('../history');

/**
 * Private variables
 */

var color = obelisk.ColorPattern.GRAY;

/**
 * Module declaration.
 */

var brush = {};

/**
 *
 * @param {string} value
 */
brush.set = function(value) {
	// strip #
	value = value.slice(1);
	// convert to number
	value = parseInt(value, 16);

	color = value;
};

/**
 *
 * @param {scene} scene
 */
brush.click = function(scene) {

 	if ( !app.shiftHandler ){	// DRAW

		if (scene.add(color))
			history.push(scene.remove.bind(scene, scene.selected().clone()));

	} else {					// ERASE

		if (scene.remove())
			history.push(scene.add.bind(scene, color, scene.selected().clone() ));

	}

};

/**
 *
 * @param {scene} scene
 */
brush.drag = function(scene) {

	if ( !app.shiftHandler ) {	// DRAW

		if (scene.add(color)) {
			if (!history.isSequenced())
				history.startSequence();

			history.push(scene.remove.bind(scene, scene.selected().clone()));
		}

	} else {	// ERASE

		if (scene.remove()) {
			if (!history.isSequenced())
				history.startSequence();

			history.push(scene.add.bind(scene, color, scene.selected().clone() ));
		}

	}

};

/**
 * Exports.
 */

module.exports = brush;
},{"../history":3}],8:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var history = require('../history');

/**
 * Module declaration.
 */

var erase = {};

/**
 *
 * @param {scene} scene
 */
erase.click = function(scene) {
	var color = scene.color();
	if (scene.remove())
		history.push(scene.add.bind(scene,
			color,
			scene.selected().clone()
		));
};

/**
 *
 * @param {scene} scene
 */
erase.drag = function(scene) {
	var color = scene.color();
	if (scene.remove()) {
		if (!history.isSequenced())
			history.startSequence();

		history.push(scene.add.bind(scene,
			color,
			scene.selected().clone()
		));
	}
};

/**
 * Exports.
 */

module.exports = erase;
},{"../history":3}],9:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var github = require('./../github');

/**
 * Private variables
 */

var loginEl = document.querySelector('#auth .login');
var loggedEl = document.querySelector('#auth .logged');

/**
 * Module declaration.
 */

var auth = {};

/**
 *
 */
auth.init = function() {
	// login button
	loginEl.addEventListener('click', onLoginBtnClick);

	// logged button
	loggedEl.addEventListener('click', onLoggedBtnClick);

	// initial ui state
	if (github.authenticated())
		loggedEl.classList.remove('is-hidden');
	else
		loginEl.classList.remove('is-hidden');
};

/**
 * @private
 */
function toggle() {
	loginEl.classList.toggle('is-hidden');
	loggedEl.classList.toggle('is-hidden');
}

/**
 * @param {event} e
 * @private
 */
function onLoginBtnClick(e) {
	if (this.classList.contains('is-disabled')) return;

	this.querySelector('span:first-child').innerText = 'wait for it...';
	this.classList.add('is-disabled');

	github.connect();
}

/**
 * @param {event} e
 * @private
 */
function onLoggedBtnClick(e) {
	var res = confirm('Disconnect from Github?');
	if (!res) return;

	github.disconnect();
	toggle();

	// avoids spacebar to trigger it again
	this.blur();
}

/**
 * Exports.
 */

module.exports = auth;
},{"./../github":2}],10:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var el = document.querySelector('#help');
var overlayEl = document.getElementById('overlay');

/**
 * Module declaration.
 */

var help = {};

help.toggle = function() {
	el.classList.toggle('is-hidden');
	overlayEl.classList.toggle('is-hidden');
};

/**
 * Exports.
 */

module.exports = help;
},{}],11:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Exports.
 */

module.exports = {
	auth: require('./auth'),
	notification: require('./notification'),
	palette: require('./palette'),
	scene: require('./scene'),
	welcome: require('./welcome'),
	help: require('./help')
};
},{"./auth":9,"./help":10,"./notification":12,"./palette":13,"./scene":14,"./welcome":15}],12:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var el = document.getElementById('notification');
var timeout = null;
var queue = [];
var currentMessage;
var count = 0;

/**
 * Module declaration.
 */

var notification = {};

/**
 *
 * @param {string} type
 * @param {string} message
 */
notification.push = function(type, message) {
	// a message is being displayed, enqueue
	if (timeout) {
		// is it the same message?
		// if so don't enqueue, add multiplier
		if (message == currentMessage) {
			el.innerHTML = message + ' (' + (++count) + ')';
			return;
		}

		// else enqueue
		return queue.push({
			type: type,
			message: message
		});
	}

	display(type, message);
};

/** Shortcuts */

notification.info = notification.push.bind(null, 'info');
notification.error = notification.push.bind(null, 'error');

/**
 * @param {string} type
 * @param {string} message
 * @private
 */
function display(type, message) {
	el.innerHTML = message;
	el.dataset.type = type;
	el.classList.remove('is-hidden');

	timeout = setTimeout(onHide, 5000);

	currentMessage = message;
}

/**
 * @private
 */
function onHide() {
	el.classList.add('is-hidden');

	// messages in the queue, pop
	if (queue.length > 0) {
		var notif = queue.pop();
		setTimeout(display.bind(null,
			notif.type,
			notif.message
		), 300);
		return;
	}

	timeout = null;
	currentMessage = null;
	count = 0;
}

/**
 * Exports.
 */

module.exports = notification;
},{}],13:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var tool = require('./../tool');

/**
 * Private variables
 */

var el = document.getElementById('palette');
var overlayEl = document.getElementById('overlay');
var active = document.querySelector('#palette .is-active');
var visible = false;
var x, y;
var width, height;

/**
 * Module declaration.
 */

var palette = {};

/**
 *
 */
palette.init = function() {
	var style = getComputedStyle(el);
	width = parseInt(style.width);
	height = parseInt(style.height);

	window.addEventListener('mousemove', function(e) {
		x = e.clientX;
		y = e.clientY;
	});

	el.addEventListener('click', function(e) {
		var btn = e.target;

		if ('BUTTON' != btn.tagName) return;

		if (active)
			active.classList.remove('is-active');
		btn.classList.add('is-active');

		// tool selection and value
		tool.use(btn.dataset.tool).set(btn.dataset.value);

		active = e.target;
	});
};

/**
 *
 */
palette.toggle = function() {
	if (!visible) {
		el.style.left = (x - width / 2) + 'px';
		el.style.top = (y - height / 2) + 'px';
	}

	el.classList.toggle('is-hidden');
	overlayEl.classList.toggle('is-hidden');

	visible = !visible;
};

/**
 *
 * @param {number} index
 * @returns {string}
 */
palette.color = function(index) {
	var btn = el.querySelector('button:nth-child(' + (index + 1) + ')');
	return btn.dataset.value;
};

/**
 * Exports.
 */

module.exports = palette;
},{"./../tool":6}],14:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var canvasEl = document.getElementById('scene');
var SIZE = 20;
var BLOCK_SIZE = 20;
var view;
var floor;
var cubes;
var blocks;
var origin;
var changed = false;
var changedHandler;

/**
 * Module declaration.
 */

var scene = {};

/**
 *
 * @returns {scene}
 */
scene.init = function() {
	cubes = {};
	cubes[obelisk.ColorPattern.GRAY] = createCube(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, obelisk.ColorPattern.GRAY);

	floor = {
		normal: createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF222222'),
		elevated: createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF222222'),
		highlighted: createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF444444'),
		elevatedHighlighted: createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF555555'),
		selected: new obelisk.Point3D(-1, -1, 0),
		offset: 0
	};

	blocks = matrix(SIZE);

	scene.resize();

	return scene;
};

/**
 *
 */
scene.resize = function() {
	// 1:1 ratio
	var style = getComputedStyle(canvasEl);
	canvasEl.width = parseInt(style.width);
	canvasEl.height = parseInt(style.height);

	origin = new obelisk.Point(canvasEl.width / 2, canvasEl.height / 2);

	view = new obelisk.PixelView(canvasEl, new obelisk.Point(
		origin.x, origin.y
	));

	var oldBlockSize = BLOCK_SIZE;

	// small screens
	if (canvasEl.width < 800 || canvasEl.height < 800) {
		var size = Math.min(canvasEl.width, canvasEl.height);

		// compute new block size
		BLOCK_SIZE = Math.floor(size / 40);
		// ensure it's even (obelisk needs it)
		BLOCK_SIZE = BLOCK_SIZE - (BLOCK_SIZE % 2);
	}
	// ensure block size comes back to its original size
	else
		BLOCK_SIZE = 20;

	// adapt existing geom to the correct size
	if (oldBlockSize != BLOCK_SIZE) {
		for (var color in cubes) {
			if (!cubes.hasOwnProperty(color)) continue;
			cubes[color] = createCube(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, parseInt(color));
		}

		floor.normal = createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF222222');
		floor.elevated = createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF222222');
		floor.highlighted = createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF444444');
		floor.elevatedHighlighted = createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF555555');
	}

	scene.draw();
};

/**
 *
 */
scene.draw = function() {
	view.clear();

	drawBlocks(view, blocks, cubes, 0, floor.offset);
	drawFloor(view, floor);
	drawBlocks(view, blocks, cubes, floor.offset, SIZE);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {obelisk.Point3D} point
 */
scene.screenToView = function(x, y, point) {
	x -= origin.x;
	y -= origin.y;

	point.x = Math.floor(((x + 2 * y) / 2) / BLOCK_SIZE) + floor.offset;
	point.y = Math.floor(((-x + 2 * y) / 2) / BLOCK_SIZE) + floor.offset;
	point.z = floor.offset;
};

/**
 *
 * @param {obelisk.Point3D} point
 */
scene.select = function(point) {
	clampBounds(point);

	floor.selected.x = point.x;
	floor.selected.y = point.y;
	floor.selected.z = point.z;

	scene.draw();
};

/**
 *
 * @returns {obelisk.Point}
 */
scene.selected = function() {
	return floor.selected;
};

/**
 *
 * @param {obelisk.Point3D} point
 * @returns {number|null}
 */
scene.color = function(point) {
	point = point || scene.selected();

	var block = blocks[point.x][point.y][point.z];
	if (!block) return null;

	return block.color;
};

/**
 *
 * @param {number} color
 * @param {obelisk.Point3D} point
 * @returns {boolean}
 */
scene.add = function(color, point) {
	point = point || floor.selected;

	// already exists
	if (null != blocks[point.x][point.y][point.z]) return false;

	// if a cube with the given color does not exist, create it
	if (null == cubes[color])
		cubes[color] = createCube(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, color);

	var block = point.clone();
	block.color = color;

	blocks[block.x][block.y][block.z] = block;
	scene.draw();

	changed = true;
	if (changedHandler) changedHandler();

	return true;
};

/**
 *
 * @param {obelisk.Point3D} point
 * @returns {boolean}
 */
scene.remove = function(point) {
	point = point || floor.selected;

	if (null == blocks[point.x][point.y][point.z]) return false;

	blocks[point.x][point.y][point.z] = null;
	scene.draw();

	changed = true;
	if (changedHandler) changedHandler();

	return true;
};

/**
 *
 * @param {number} delta
 */
scene.adjustFloor = function(delta) {
	floor.offset += delta;

	if (floor.offset < 0) floor.offset = 0;
	else if (floor.offset >= SIZE) floor.offset = SIZE - 1;

	scene.draw();
};

/**
 *
 * @param {number} direction
 */
scene.rotate = function(direction) {
	var b = blocks,
		n = SIZE,
		x, y, z, start, end;

	// transpose
	for (z = 0; z < n; z++)
		for (x = 0; x < n; x++)
			for (y = 0; y < n; y++)
				if (x < y) swap(b, x, y, y, x, z);

	if (1 === direction) {
		// reverse rows
		for (z = 0; z < n; z++)
			for (x = 0; x < n; x++)
				for (start = 0, end = n - 1; start < end; start++, end--)
					swap(b, x, start, x, end, z);
	}
	else if (-1 == direction) {
		// reverse cols
		for (z = 0; z < n; z++)
			for (y = 0; y < n; y++)
				for (start = 0, end = n - 1; start < end; start++, end--)
					swap(b, start, y, end, y, z);
	}

	scene.draw();
};

/**
 *
 * @param {boolean} silent
 * @returns {object}
 */
scene.save = function(silent) {
	var data = [];

	// creates a color table
	var colors = [], colorsHash = {};
	for (var p in cubes) {
		if (!cubes.hasOwnProperty(p)) continue;

		colorsHash[p] = colors.length;
		colors.push(p);
	}

	// basically "compact" the memory structure by only saving existing blocks,
	// referencing colors in color table, with short properties name
	for (var x = 0; x < SIZE; x++) {
		for (var y = 0; y < SIZE; y++) {
			for (var z = 0; z < SIZE; z++) {
				if (null != blocks[x][y][z]) {
					var b = blocks[x][y][z];
					data.push({
						x: b.x,
						y: b.y,
						z: b.z,
						c: colorsHash[b.color]
					});
				}
			}
		}
	}

	if (!silent) changed = false;

	return {
		colors: colors,
		data: data
	};
};

/**
 *
 * @param {object} data
 */
scene.load = function(data) {
	var i;

	// ensure colors are numbers
	var colors = data.colors;
	for (i = 0; i < colors.length; i++)
		colors[i] = parseInt(colors[i]);

	data = data.data;

	blocks = matrix(SIZE);

	for (i = 0; i < data.length; i++)
		scene.add(colors[data[i].c], new obelisk.Point3D(data[i].x, data[i].y, data[i].z));

	scene.draw();

	changed = false;
};

/**
 *
 * @returns {string}
 */
scene.snapshot = function() {
	// isolate art
	view.clear();
	view.context.fillStyle = '#222222';
	view.context.fillRect(0, 0, canvasEl.width, canvasEl.height);
	drawBlocks(view, blocks, cubes, 0, SIZE);

	var image = canvasEl.toDataURL("image/png");

	scene.draw();

	return image;
};

/**
 *
 */
scene.clear = function() {
	blocks = matrix(SIZE);
	scene.draw();
};

/**
 *
 * @param {function} callback
 * @returns {boolean|undefined}
 */
scene.changed = function(callback) {
	if (!callback) return changed;
	changedHandler = callback;
	return this;
};

/**
 *
 * @param {number} width
 * @param {number} height
 * @param {string} hexColor
 * @returns {obelisk.Brick}
 * @private
 */
function createBrick(width, height, hexColor) {
	var dimension = new obelisk.BrickDimension(width, height);
	var color = new obelisk.SideColor().getByInnerColor(hexColor);

	return new obelisk.Brick(dimension, color, false);
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {string} hexColor
 * @returns {obelisk.Cube}
 * @private
 */
function createCube(width, height, depth, hexColor) {
	var dimension = new obelisk.CubeDimension(width, height, depth);
	var color = new obelisk.CubeColor(
		obelisk.ColorGeom.applyBrightness(hexColor, -20 * 4),
		obelisk.ColorGeom.applyBrightness(hexColor, 60),
		obelisk.ColorGeom.applyBrightness(hexColor, -20 * 2),
		obelisk.ColorGeom.applyBrightness(hexColor, -20),
		hexColor
	);

	return new obelisk.Cube(dimension, color);
}

/**
 *
 * @param {obelisk.Point3D} point
 * @private
 */
function clampBounds(point) {
	if (point.x < 0) point.x = 0;
	else if (point.x >= SIZE) point.x = SIZE - 1;
	if (point.y < 0) point.y = 0;
	else if (point.y >= SIZE) point.y = SIZE - 1;
	if (point.z < 0) point.z = 0;
	else if (point.z >= SIZE) point.z = SIZE - 1;
}

/**
 *
 * @param {number} size
 * @returns {array}
 * @private
 */
function matrix(size) {
	var m = new Array(size);
	for (var x = 0; x < size; x++) {
		m[x] = new Array(size);
		for (var y = 0; y < size; y++) {
			m[x][y] = new Array(size);
		}
	}

	return m;
}

/**
 *
 * @param {number} m
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} z
 * @private
 */
function swap(m, x1, y1, x2, y2, z) {
	var tmp = m[x2][y2][z], c;

	c = m[x2][y2][z] = m[x1][y1][z];
	if (c) {
		c.x = x2;
		c.y = y2;
	}

	c = m[x1][y1][z] = tmp;
	if (c) {
		c.x = x1;
		c.y = y1;
	}
}

/**
 *
 * @param {obelisk.PixelView} view
 * @param {object} floor
 * @private
 */
function drawFloor(view, floor) {
	var normal = floor.normal,
		highlighted = floor.highlighted,
		point = new obelisk.Point3D();

	if (floor.offset > 0) {
		normal = floor.elevated;
		highlighted = floor.elevatedHighlighted;
		view.context.globalAlpha = 0.7;
	}

	for (var x = 0; x < 20; x++) {
		for (var y = 0; y < 20; y++) {
			if (x == floor.selected.x && y == floor.selected.y) continue;

			point.x = x * BLOCK_SIZE;
			point.y = y * BLOCK_SIZE;
			point.z = floor.offset * BLOCK_SIZE;

			view.renderObject(normal, point);
		}
	}

	if (-1 != floor.selected.x) {
		point.x = floor.selected.x * BLOCK_SIZE;
		point.y = floor.selected.y * BLOCK_SIZE;
		point.z = floor.offset * BLOCK_SIZE;

		view.renderObject(highlighted, point);
	}

	view.context.globalAlpha = 1;
}

/**
 *
 * @param {obelisk.PixelView} view
 * @param {array} blocks
 * @param {object} cubes
 * @param {number} startZ
 * @param {number} endZ
 * @private
 */
function drawBlocks(view, blocks, cubes, startZ, endZ) {
	var point = new obelisk.Point3D();

	for (var x = 0; x < SIZE; x++) {
		for (var y = 0; y < SIZE; y++) {
			for (var z = startZ; z < endZ; z++) {
				var block = blocks[x][y][z];

				if (!block) continue;

				point.x = block.x * BLOCK_SIZE;
				point.y = block.y * BLOCK_SIZE;
				point.z = block.z * BLOCK_SIZE;

				view.renderObject(cubes[block.color], point);
			}
		}
	}
}

/**
 * Exports.
 */

module.exports = scene;
},{}],15:[function(require,module,exports){
/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var el = document.querySelector('#welcome');
var overlayEl = document.getElementById('overlay');
var onHideCallback;

/**
 * Module declaration.
 */

var welcome = {};

/**
 *
 */
welcome.init = function(callback) {
	if (localStorage.getItem('visited')) return callback();

	window.addEventListener('load', function() {
		setTimeout(show, 500);
	});

	onHideCallback = callback;
};

/**
 * @private
 */
function show() {
	toggle();
	document.addEventListener('keypress', hide);
	localStorage.setItem('visited', true);
}

/**
 * @private
 */
function hide() {
	document.removeEventListener('keypress', hide);
	toggle();
	onHideCallback();
}

/**
 * @private
 */
function toggle() {
	el.classList.toggle('is-hidden');
	overlayEl.classList.toggle('is-hidden');
}

/**
 * Exports.
 */

module.exports = welcome;
},{}]},{},[1])
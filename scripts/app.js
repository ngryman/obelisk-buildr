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
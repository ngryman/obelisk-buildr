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
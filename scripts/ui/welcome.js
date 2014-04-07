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
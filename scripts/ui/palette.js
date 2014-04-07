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
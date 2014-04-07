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
	if (scene.add(color))
		history.push(scene.remove.bind(scene, scene.selected().clone()));
};

/**
 *
 * @param {scene} scene
 */
brush.drag = function(scene) {
	if (scene.add(color)) {
		if (!history.isSequenced())
			history.startSequence();

		history.push(scene.remove.bind(scene, scene.selected().clone()));
	}
};

/**
 * Exports.
 */

module.exports = brush;
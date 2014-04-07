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
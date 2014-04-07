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
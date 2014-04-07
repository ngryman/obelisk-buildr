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
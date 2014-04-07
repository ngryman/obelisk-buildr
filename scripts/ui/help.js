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
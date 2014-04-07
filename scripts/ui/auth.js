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
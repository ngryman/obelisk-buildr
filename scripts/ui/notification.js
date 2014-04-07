/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var el = document.getElementById('notification');
var timeout = null;
var queue = [];
var currentMessage;
var count = 0;

/**
 * Module declaration.
 */

var notification = {};

/**
 *
 * @param {string} type
 * @param {string} message
 */
notification.push = function(type, message) {
	// a message is being displayed, enqueue
	if (timeout) {
		// is it the same message?
		// if so don't enqueue, add multiplier
		if (message == currentMessage) {
			el.innerHTML = message + ' (' + (++count) + ')';
			return;
		}

		// else enqueue
		return queue.push({
			type: type,
			message: message
		});
	}

	display(type, message);
};

/** Shortcuts */

notification.info = notification.push.bind(null, 'info');
notification.error = notification.push.bind(null, 'error');

/**
 * @param {string} type
 * @param {string} message
 * @private
 */
function display(type, message) {
	el.innerHTML = message;
	el.dataset.type = type;
	el.classList.remove('is-hidden');

	timeout = setTimeout(onHide, 5000);

	currentMessage = message;
}

/**
 * @private
 */
function onHide() {
	el.classList.add('is-hidden');

	// messages in the queue, pop
	if (queue.length > 0) {
		var notif = queue.pop();
		setTimeout(display.bind(null,
			notif.type,
			notif.message
		), 300);
		return;
	}

	timeout = null;
	currentMessage = null;
	count = 0;
}

/**
 * Exports.
 */

module.exports = notification;
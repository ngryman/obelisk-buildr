/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var anonymousMessage = 'View and edit it on http://ngryman.sh/obelisk-buildr.\n\n' +
	'As this is an anonymous gist, you have to manually copy and paste its id, and append it' +
	'to the url (i.e. http://ngryman.sh/obelisk-buildr#1337).';
var authenticatedMessage = 'View and edit it on http://ngryman.sh/obelisk-buildr/#{0}.';
var token;

/**
 * Module declaration.
 */

var github = {};

/**
 *
 * @returns {boolean}
 */
github.authenticated = function() {
	return (null != token);
};

/**
 *
 */
github.connect = function() {
	location.href = 'https://github.com/login/oauth/authorize?client_id=717772a46c3c521155d3&scope=gist';
};

/**
 *
 */
github.disconnect = function() {
	localStorage.removeItem('token');
	token = null;
};

/**
 *
 * @param content
 * @param callback
 */
github.newGist = function(content, callback) {
	var data = {
		description: 'An awesome pixel art chef d\'oeuvre',
		public: true,
		files: {
			'data.json': {
				content: content
			}
		}
	};

	// anonymous art.json
	if (!token)
		data.files['art.md'] = {
		content: anonymousMessage
	};

	request('post', '/gists', data, token ? editMessage.bind(null, callback) : callback);
};

/**
 *
 * @param id
 * @param content
 * @param callback
 */
github.editGist = function(id, content, callback) {
	var data = {
		files: {
			'data.json': {
				content: content
			}
		}
	};

	request('patch', '/gists/' + id, data, callback);
};

/**
 *
 * @param id
 * @param callback
 */
github.forkGist = function(id, callback) {
	request('post', '/gists/' + id + '/forks', null, token ? editMessage.bind(null, callback) : callback);
};

/**
 *
 * @param id
 * @param callback
 */
github.getGist = function(id, callback) {
	request('get', '/gists/' + id, null, callback);
};

/**
 *
 * @param {function} callback
 * @param {object} err
 * @param {object} res
 * @private
 */
function editMessage(callback, err, res) {
	if (err) return callback(err);

	// art.json with the correct link.
	var data = {
		files: {
			'art.md': {
				content: authenticatedMessage.replace('{0}', res.id)
			}
		}
	};

	request('patch', '/gists/' + res.id, data, callback);
}

/**
 * @param {string} method
 * @param {string} uri
 * @param {object} data
 * @param {function} callback
 * @private
 */
function request(method, uri, data, callback) {
	var qs = '';

	if (token)
		qs = '?access_token=' + token;

	reqwest({
		url: 'https://api.github.com' + uri + qs,
		method: method,
		type: 'json',
		data: data ? JSON.stringify(data) : null,
		error: callback,
		success: callback.bind(null, null)
	});
}

// TODO: github init
/**
 * @private
 */
function fetchToken() {
	// priority from url
	if (~location.search.indexOf('?token=')) {
		token = location.search.match(/\?token=(.{40})/)[1];
		localStorage.setItem('token', token);

		// remove token from query string
		location.replace(location.protocol + '//' + location.host + location.pathname);
	}
	// from local storage
	else
		token = localStorage.getItem('token');
}

fetchToken();

/**
 * Exports.
 */

module.exports = github;
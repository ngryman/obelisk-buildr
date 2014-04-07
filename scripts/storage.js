/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var github = require('./github');

/**
 * Private variables
 */

var errors = {
	sadSave: "could not save your awesome art on the cloud :(",
	unknownGist: "it seems this gist does not exist anymore :(",
	invalidGist: "this gist does not behaves well, loading failed :(",
	forkFailed: "fork failed :(<br>does this gist still exists?"
};
var gist;

/**
 * Module declaration.
 */

var storage = {};

/**
 *
 * @param data
 */
storage.local = function(data) {
	localStorage.setItem(gist ? gist : 'orphan', JSON.stringify(data));
};

/**
 *
 * @returns {boolean}
 */
storage.orphan = function() {
	return (null == gist);
};

/**
 *
 * @param {object} data
 * @param {function} callback
 */
storage.persist = function(data, callback) {
	var content = JSON.stringify(data, null, 2),
		action = 'created';

	// working on an existing gist?
	if (gist) {
		// edit it
		github.editGist(gist, content, function(err, res) {
			// tried to edit a gist that is not ours
			if (err) {
				if (401 == err.status || 404 == err.status) {
					// fork it if we are authenticated
					// anonymous gist can't be edited after being forked
					if (github.authenticated()) {
						github.forkGist(gist, function(err, res) {
							if (err) return callback(errors.forkFailed);

							// then add changes
							action = 'forked gist ' + gist + ' to';
							github.editGist(res.id, content, onData);
						});
					}
					// if not, well, simply create it :p
					else
						github.newGist(content, onData);
				}
				else
					callback(errors.sadSave);

				return;
			}

			action = 'saved to';
			onData(err, res);
		});

		return;
	}

	// create a new one
	github.newGist(content, onData);

	function onData(err, res) {
		if (err) return callback(errors.sadSave);

		// remove orphan data
		if (storage.orphan())
			localStorage.removeItem('orphan');

		// set this gist as the current one
		gist = res.id;
		// and the last one we worked on
		localStorage.setItem('last', gist);
		// make sure the hash is up to date
		if (gist != location.hash.slice(1))
			location.hash = gist;

		// save it locally too
		storage.local(data);

		var info = {
			id: res.id,
			url: res.html_url,
			action: action
		};

		callback(null, info);
	}
};

/**
 *
 * @param {function} callback
 */
storage.fetch = function(callback) {
	var data;

	// priority to url
	if (location.hash) {
		gist = location.hash.slice(1);

		// if it was a gist we were working on, load local data as it is more fresh
		data = localStorage.getItem(gist);
		if (data)
			return callback(null, JSON.parse(data), 'loaded your last local changes for ' + gist);

		// if not loads the gist
		github.getGist(gist, function(err, res) {
			if (err) return callback(errors.unknownGist);

			var data;
			try {
				data = JSON.parse(res.files['data.json'].content);
			}
			catch (e) {
				return callback(errors.invalidGist);
			}

			callback(null, data);
		});
		return;
	}

	// well, load the last working gist?
	gist = localStorage.getItem('last');
	data = localStorage.getItem(gist);
	if (data) {
		location.hash = gist;
		return callback(null, JSON.parse(data), 'loaded your last saved stuff');
	}

	// ok ok, load the last orphan art?
	data = localStorage.getItem('orphan');
	if (data) return callback(null, JSON.parse(data), 'loaded your last local stuff');

	// i can't do nothing more dude, new one!
	callback(null, null, 'new');
};

/**
 *
 */
storage.flush = function() {
	localStorage.removeItem('last');
	location.hash = '';
};

module.exports = storage;
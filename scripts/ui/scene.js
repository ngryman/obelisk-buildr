/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Private variables
 */

var canvasEl = document.getElementById('scene');
var SIZE = 20;
var BLOCK_SIZE = 20;
var view;
var floor;
var cubes;
var blocks;
var origin;
var changed = false;
var changedHandler;

/**
 * Module declaration.
 */

var scene = {};

/**
 *
 * @returns {scene}
 */
scene.init = function() {
	cubes = {};
	cubes[obelisk.ColorPattern.GRAY] = createCube(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, obelisk.ColorPattern.GRAY);

	floor = {
		normal: createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF222222'),
		elevated: createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF222222'),
		highlighted: createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF444444'),
		elevatedHighlighted: createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF555555'),
		selected: new obelisk.Point3D(-1, -1, 0),
		offset: 0
	};

	blocks = matrix(SIZE);

	scene.resize();

	return scene;
};

/**
 *
 */
scene.resize = function() {
	// 1:1 ratio
	var style = getComputedStyle(canvasEl);
	canvasEl.width = parseInt(style.width);
	canvasEl.height = parseInt(style.height);

	origin = new obelisk.Point(canvasEl.width / 2, canvasEl.height / 2);

	view = new obelisk.PixelView(canvasEl, new obelisk.Point(
		origin.x, origin.y
	));

	var oldBlockSize = BLOCK_SIZE;

	// small screens
	if (canvasEl.width < 800 || canvasEl.height < 800) {
		var size = Math.min(canvasEl.width, canvasEl.height);

		// compute new block size
		BLOCK_SIZE = Math.floor(size / 40);
		// ensure it's even (obelisk needs it)
		BLOCK_SIZE = BLOCK_SIZE - (BLOCK_SIZE % 2);
	}
	// ensure block size comes back to its original size
	else
		BLOCK_SIZE = 20;

	// adapt existing geom to the correct size
	if (oldBlockSize != BLOCK_SIZE) {
		for (var color in cubes) {
			if (!cubes.hasOwnProperty(color)) continue;
			cubes[color] = createCube(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, parseInt(color));
		}

		floor.normal = createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF222222');
		floor.elevated = createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF222222');
		floor.highlighted = createBrick(BLOCK_SIZE, BLOCK_SIZE, '0xFF444444');
		floor.elevatedHighlighted = createBrick(BLOCK_SIZE + 2, BLOCK_SIZE + 2, '0xFF555555');
	}

	scene.draw();
};

/**
 *
 */
scene.draw = function() {
	view.clear();

	drawBlocks(view, blocks, cubes, 0, floor.offset);
	drawFloor(view, floor);
	drawBlocks(view, blocks, cubes, floor.offset, SIZE);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {obelisk.Point3D} point
 */
scene.screenToView = function(x, y, point) {
	x -= origin.x;
	y -= origin.y;

	point.x = Math.floor(((x + 2 * y) / 2) / BLOCK_SIZE) + floor.offset;
	point.y = Math.floor(((-x + 2 * y) / 2) / BLOCK_SIZE) + floor.offset;
	point.z = floor.offset;
};

/**
 *
 * @param {obelisk.Point3D} point
 */
scene.select = function(point) {
	clampBounds(point);

	floor.selected.x = point.x;
	floor.selected.y = point.y;
	floor.selected.z = point.z;

	scene.draw();
};

/**
 *
 * @returns {obelisk.Point}
 */
scene.selected = function() {
	return floor.selected;
};

/**
 *
 * @param {obelisk.Point3D} point
 * @returns {number|null}
 */
scene.color = function(point) {
	point = point || scene.selected();

	var block = blocks[point.x][point.y][point.z];
	if (!block) return null;

	return block.color;
};

/**
 *
 * @param {number} color
 * @param {obelisk.Point3D} point
 * @returns {boolean}
 */
scene.add = function(color, point) {
	point = point || floor.selected;

	// already exists
	if (null != blocks[point.x][point.y][point.z]) return false;

	// if a cube with the given color does not exist, create it
	if (null == cubes[color])
		cubes[color] = createCube(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, color);

	var block = point.clone();
	block.color = color;

	blocks[block.x][block.y][block.z] = block;
	scene.draw();

	changed = true;
	if (changedHandler) changedHandler();

	return true;
};

/**
 *
 * @param {obelisk.Point3D} point
 * @returns {boolean}
 */
scene.remove = function(point) {
	point = point || floor.selected;

	if (null == blocks[point.x][point.y][point.z]) return false;

	blocks[point.x][point.y][point.z] = null;
	scene.draw();

	changed = true;
	if (changedHandler) changedHandler();

	return true;
};

/**
 *
 * @param {number} delta
 */
scene.adjustFloor = function(delta) {
	floor.offset += delta;

	if (floor.offset < 0) floor.offset = 0;
	else if (floor.offset >= SIZE) floor.offset = SIZE - 1;

	scene.draw();
};

/**
 *
 * @param {number} direction
 */
scene.rotate = function(direction) {
	var b = blocks,
		n = SIZE,
		x, y, z, start, end;

	// transpose
	for (z = 0; z < n; z++)
		for (x = 0; x < n; x++)
			for (y = 0; y < n; y++)
				if (x < y) swap(b, x, y, y, x, z);

	if (1 === direction) {
		// reverse rows
		for (z = 0; z < n; z++)
			for (x = 0; x < n; x++)
				for (start = 0, end = n - 1; start < end; start++, end--)
					swap(b, x, start, x, end, z);
	}
	else if (-1 == direction) {
		// reverse cols
		for (z = 0; z < n; z++)
			for (y = 0; y < n; y++)
				for (start = 0, end = n - 1; start < end; start++, end--)
					swap(b, start, y, end, y, z);
	}

	scene.draw();
};

/**
 *
 * @param {boolean} silent
 * @returns {object}
 */
scene.save = function(silent) {
	var data = [];

	// creates a color table
	var colors = [], colorsHash = {};
	for (var p in cubes) {
		if (!cubes.hasOwnProperty(p)) continue;

		colorsHash[p] = colors.length;
		colors.push(p);
	}

	// basically "compact" the memory structure by only saving existing blocks,
	// referencing colors in color table, with short properties name
	for (var x = 0; x < SIZE; x++) {
		for (var y = 0; y < SIZE; y++) {
			for (var z = 0; z < SIZE; z++) {
				if (null != blocks[x][y][z]) {
					var b = blocks[x][y][z];
					data.push({
						x: b.x,
						y: b.y,
						z: b.z,
						c: colorsHash[b.color]
					});
				}
			}
		}
	}

	if (!silent) changed = false;

	return {
		colors: colors,
		data: data
	};
};

/**
 *
 * @param {object} data
 */
scene.load = function(data) {
	var i;

	// ensure colors are numbers
	var colors = data.colors;
	for (i = 0; i < colors.length; i++)
		colors[i] = parseInt(colors[i]);

	data = data.data;

	blocks = matrix(SIZE);

	for (i = 0; i < data.length; i++)
		scene.add(colors[data[i].c], new obelisk.Point3D(data[i].x, data[i].y, data[i].z));

	scene.draw();

	changed = false;
};

/**
 *
 * @returns {string}
 */
scene.snapshot = function() {
	// isolate art
	view.clear();
	view.context.fillStyle = '#222222';
	view.context.fillRect(0, 0, canvasEl.width, canvasEl.height);
	drawBlocks(view, blocks, cubes, 0, SIZE);

	var image = canvasEl.toDataURL("image/png");

	scene.draw();

	return image;
};

/**
 *
 */
scene.clear = function() {
	blocks = matrix(SIZE);
	scene.draw();
};

/**
 *
 * @param {function} callback
 * @returns {boolean|undefined}
 */
scene.changed = function(callback) {
	if (!callback) return changed;
	changedHandler = callback;
	return this;
};

/**
 *
 * @param {number} width
 * @param {number} height
 * @param {string} hexColor
 * @returns {obelisk.Brick}
 * @private
 */
function createBrick(width, height, hexColor) {
	var dimension = new obelisk.BrickDimension(width, height);
	var color = new obelisk.SideColor().getByInnerColor(hexColor);

	return new obelisk.Brick(dimension, color, false);
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {string} hexColor
 * @returns {obelisk.Cube}
 * @private
 */
function createCube(width, height, depth, hexColor) {
	var dimension = new obelisk.CubeDimension(width, height, depth);
	var color = new obelisk.CubeColor(
		obelisk.ColorGeom.applyBrightness(hexColor, -20 * 4),
		obelisk.ColorGeom.applyBrightness(hexColor, 60),
		obelisk.ColorGeom.applyBrightness(hexColor, -20 * 2),
		obelisk.ColorGeom.applyBrightness(hexColor, -20),
		hexColor
	);

	return new obelisk.Cube(dimension, color);
}

/**
 *
 * @param {obelisk.Point3D} point
 * @private
 */
function clampBounds(point) {
	if (point.x < 0) point.x = 0;
	else if (point.x >= SIZE) point.x = SIZE - 1;
	if (point.y < 0) point.y = 0;
	else if (point.y >= SIZE) point.y = SIZE - 1;
	if (point.z < 0) point.z = 0;
	else if (point.z >= SIZE) point.z = SIZE - 1;
}

/**
 *
 * @param {number} size
 * @returns {array}
 * @private
 */
function matrix(size) {
	var m = new Array(size);
	for (var x = 0; x < size; x++) {
		m[x] = new Array(size);
		for (var y = 0; y < size; y++) {
			m[x][y] = new Array(size);
		}
	}

	return m;
}

/**
 *
 * @param {number} m
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} z
 * @private
 */
function swap(m, x1, y1, x2, y2, z) {
	var tmp = m[x2][y2][z], c;

	c = m[x2][y2][z] = m[x1][y1][z];
	if (c) {
		c.x = x2;
		c.y = y2;
	}

	c = m[x1][y1][z] = tmp;
	if (c) {
		c.x = x1;
		c.y = y1;
	}
}

/**
 *
 * @param {obelisk.PixelView} view
 * @param {object} floor
 * @private
 */
function drawFloor(view, floor) {
	var normal = floor.normal,
		highlighted = floor.highlighted,
		point = new obelisk.Point3D();

	if (floor.offset > 0) {
		normal = floor.elevated;
		highlighted = floor.elevatedHighlighted;
		view.context.globalAlpha = 0.7;
	}

	for (var x = 0; x < 20; x++) {
		for (var y = 0; y < 20; y++) {
			if (x == floor.selected.x && y == floor.selected.y) continue;

			point.x = x * BLOCK_SIZE;
			point.y = y * BLOCK_SIZE;
			point.z = floor.offset * BLOCK_SIZE;

			view.renderObject(normal, point);
		}
	}

	if (-1 != floor.selected.x) {
		point.x = floor.selected.x * BLOCK_SIZE;
		point.y = floor.selected.y * BLOCK_SIZE;
		point.z = floor.offset * BLOCK_SIZE;

		view.renderObject(highlighted, point);
	}

	view.context.globalAlpha = 1;
}

/**
 *
 * @param {obelisk.PixelView} view
 * @param {array} blocks
 * @param {object} cubes
 * @param {number} startZ
 * @param {number} endZ
 * @private
 */
function drawBlocks(view, blocks, cubes, startZ, endZ) {
	var point = new obelisk.Point3D();

	for (var x = 0; x < SIZE; x++) {
		for (var y = 0; y < SIZE; y++) {
			for (var z = startZ; z < endZ; z++) {
				var block = blocks[x][y][z];

				if (!block) continue;

				point.x = block.x * BLOCK_SIZE;
				point.y = block.y * BLOCK_SIZE;
				point.z = block.z * BLOCK_SIZE;

				view.renderObject(cubes[block.color], point);
			}
		}
	}
}

/**
 * Exports.
 */

module.exports = scene;
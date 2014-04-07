/*!
 * obelisk-builder
 * Copyright (c) 2013 Nicolas Gryman <ngryman@gmail.com>
 * MIT Licensed
 */

'use strict';

var gulp = require('gulp'),
	browserify = require('gulp-browserify'),
	concat = require('gulp-concat'),
	connect = require('gulp-connect'),
	prefix = require('gulp-autoprefixer'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish');

var paths = {
	scripts: ['scripts/{,*/}*.js'],
	libs: ['libs/{,*/}*.js'],
	styles: ['styles/{,*/}*.css'],
	fonts: ['fonts/*'],
	html: ['*.html'],
	misc: ['favicon.ico', 'logo.png', 'robots.txt', 'humans.txt']
};

gulp.task('connect', connect.server({
	root: ['dist'],
	livereload: true
}));

gulp.task('lint', function() {
	gulp.src(paths.scripts)
		.pipe(jshint())
		.pipe(jshint.reporter(stylish))
});

gulp.task('scripts', function() {
	gulp.src('scripts/app.js')
		.pipe(browserify())
		.pipe(gulp.dest('./dist'))
		.pipe(connect.reload());
});

gulp.task('libs', function() {
	gulp.src([
		'libs/obelisk.js/build/obelisk.js',
		'libs/raf.js/raf.min.js',
		'libs/loop/lib/loop.js',
		'libs/reqwest/reqwest.min.js'
	])
		.pipe(concat('libs.js'))
		.pipe(gulp.dest('./dist'))
		.pipe(connect.reload());
});

gulp.task('styles', function() {
	gulp.src(paths.styles)
		.pipe(concat('app.css'))
		.pipe(prefix('last 1 version'))
		.pipe(gulp.dest('./dist'))
		.pipe(connect.reload());
});

gulp.task('fonts', function() {
	gulp.src(paths.fonts)
		.pipe(gulp.dest('./dist/fonts'))
		.pipe(connect.reload());
});

gulp.task('html', function() {
	gulp.src(paths.html)
		.pipe(gulp.dest('./dist'))
		.pipe(connect.reload());
});

gulp.task('misc', function() {
	gulp.src(paths.misc)
		.pipe(gulp.dest('./dist'))
		.pipe(connect.reload());
});

gulp.task('watch', function() {
	gulp.watch(paths.scripts, ['lint', 'scripts']);
	gulp.watch(paths.styles, ['styles']);
	gulp.watch(paths.fonts, ['fonts']);
	gulp.watch(paths.html, ['html']);
	gulp.watch(paths.misc, ['misc']);
});

gulp.task('default', ['lint', 'scripts', 'libs', 'styles', 'fonts', 'html', 'misc', 'connect', 'watch']);
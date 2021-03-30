var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
//var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
//var sourcemaps = require('gulp-sourcemaps');

//script paths
var jsFiles = ['src/main.js'],
    jsDest = 'build';

function defaultTask(cb) {
    return gulp.src(jsFiles)
        //.pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        .pipe(minify())
        //.pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(jsDest));
}

exports.default = defaultTask

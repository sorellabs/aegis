/// folders.js --- Provides folders for common data types
//
// Copyright (c) 2012 Quildreen Motta
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/// Module aegis.folders

//// == Dependencies ===========================================================
var utils = require('./utils')


//// == Core implementation ====================================================

///// Function sequence_folder /////////////////////////////////////////////////
//
// Creates a ``Foldable`` from a sequence.
//
// sequence :: [a] -> Foldable
var sequence = utils.make_foldable(
  function(xs, initial, step, done) {
    var i = -1
    var len = xs.length

    return function next(result) {
             return ++i < len?       step(result, xs[i], next)
             :      /* otherwise */  done(result) }
           (initial) })


///// Function map_folder //////////////////////////////////////////////////////
//
// Creates a ``Foldable`` from a regular object.
//
// map-folder :: { k -> e } -> Foldable
var map = utils.make_foldable(
  function(xs, initial, step, done) {
    var keys = Object.keys(xs)
    var i = -1
    var len = keys.length

    return function next(result) {
             var key = keys[++i]
             return i < len?         step(result, [key, xs[key]], next)
             :      /* otherwise */  done(result) }
           (initial) })


//// == Exports ================================================================
module.exports = { sequence : sequence
                 , map      : map }
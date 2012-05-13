/// core.js --- Core helpers for asynchronous streams
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

// Interface Foldable
//   fold :: a, step:(b, a, (b -> ()) -> ()), done:(b -> ()) -> ()
//   -- (we could use promises :<) fold :: a -> Promise

var boo = require('boo')
var Base = boo.Base
var clone = Object.create
var proto_of = {}.isPrototypeOf
var keys = Object.keys

var STOP = {}

function identity(x){ return x }

function make_folder(folder) {
  return function(xs) {
    return { fold: default_folder }

    function default_folder(initial, step, done) {
      done = done || identity
      return folder(xs, initial, step, done) }}}

function make_foldable(process) {
  return function(f) {
    var xs = this
    return xs.derive({ fold: function(initial, step, done) {
                         var self = this
                         xs.fold( initial
                                , function(result, item, next) {
                                    return process.call(self, f, result, item, step, next) }
                                , done )}})}}

var sequence_folder = make_folder(function(xs, initial, step, done) {
  var i = -1
  var len = xs.length
  return function next(result) {
           return ++i < len?       step(result, xs[i], next)
           :      /* otherwise */  done(result) }
         (initial) })

var map_folder = make_folder(function(xs, initial, step, done) {
  var keys = Object.keys(xs)
  var i = -1
  var len = keys.length
  return function next(result) {
           var key = keys[++i]
           return i < len?         step(result, [key, xs[key]], next)
           :      /* otherwise */  done(result) }
         (initial) })

var Stream = Base.derive({
  init:
  function _init(xs) {
    this.items = xs
    return this }

, end:
  function _end(value) {
    return boo.derive(STOP, { value: value }) }

, fold:
  function _fold(initial, step, done) {
    this.items.fold( initial
                   , function(result, item, next) {
                       return finished_p(result)?  done(result.value)
                       :      /* otherwise */      step(result, item, next) }
                   , done )}

, as_array:
  function _as_array(done) {
    this.fold( []
             , function(result, item, next) {
                 result.push(item)
                 next(result) }
             , done )}

, value:
  function _value(initial, done) {
    this.fold( initial
             , function(result, item, next){ next(result) }
             , done )}

, map:
  make_foldable(function _map(f, result, item, step, next) {
    f(item, function(item) { step(result, item, next) })})

, filter:
  make_foldable(function _filter(f, result, item, step, next) {
    f(item, function(ok) {   ok?              step(result, item, next)
                           : /* otherwise */  next(result) })})

, every:
  make_foldable(function _every(f, result, item, step, next) {
    var self = this
    f(item, function(ok) {   ok?              step(true, item, next)
                           : /* otherwise */  step(self.end(false), item, next) })})

, some:
  make_foldable(function _some(f, result, item, step, next) {
    var self = this
    f(item, function(ok) {   ok?              step(self.end(true), item, next)
                           : /* otherwise */  step(false, item, next) })})
})

function finished_p(result) {
  return proto_of.call(STOP, result) }


module.exports = { make_folder     : make_folder
                 , make_foldable   : make_foldable
                 , sequence_folder : sequence_folder
                 , map_folder      : map_folder
                 , Stream          : Stream }
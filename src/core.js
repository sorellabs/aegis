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

/// Module aegis.core

//// == Dependencies ===========================================================
var boo      = require('boo')
var utils    = require('./utils')


//// == Aliases ================================================================
var Base        = boo.Base
var clone       = Object.create
var proto_of    = {}.isPrototypeOf
var keys        = Object.keys
var make_folder = utils.make_folder


//// == Helpers ================================================================

///// Function finished_p //////////////////////////////////////////////////////
//
// Checks if a given result is the final result of a fold.
//
// finished? :: a -> Bool
function finished_p(result) {
  return proto_of.call(STOP, result) }



//// == Core implementation ====================================================

///// Object STOP //////////////////////////////////////////////////////////////
//
// Base trait for any object containing the final result value of a Fold.
//
// Interface STOP a
//   value :: a
//
var STOP = {}


///// Object Stream <| Base ////////////////////////////////////////////////////
//
// The base stream implementation, that implements a Foldable interface.
//
//
// Interface Stream a ⋃ Foldable
//   items :: [a]
//
var Stream = Base.derive({
  ////// Function init /////////////////////////////////////////////////////////
  //
  // Initialises a Stream.
  //
  // init! :: Stream a => @this:Stream*, a -> this
  init:
  function _init(xs) {
    this.items = xs
    return this }


  ////// Function end //////////////////////////////////////////////////////////
  //
  // Finishes the folding process with a result.
  //
  // end :: b -> STOP b
, end:
  function _end(value) {
    return boo.derive(STOP, { value: value }) }


  ////// Function fold /////////////////////////////////////////////////////////
  //
  // Folds over the items of the stream.
  //
  // fold :: Stream a => @this:Stream, b, Stepper, Done -> this
, fold:
  function _fold(initial, step, done) {
    this.items.fold( initial
                   , function(result, item, next) {
                         finished_p(result)?  done(result.value)
                       : /* otherwise */      step(result, item, next) }
                   , done )
    return this}


  ///// Function as_array //////////////////////////////////////////////////////
  //
  // Returns an array with the items in the stream.
  //
  // as-array :: Stream a => @this:Stream, Done -> this
  //
, as_array:
  function _as_array(done) {
    this.fold( []
             , function(result, item, next) {
                 result.push(item)
                 next(result) }
             , done )
    return this }


  ///// Function value /////////////////////////////////////////////////////////
  //
  // Returns the result of folding the stream.
  //
  // value :: Stream a => @this:Stream, b, Done -> this
, value:
  function _value(initial, done) {
    this.fold( initial
             , function(result, item, next){ next(result) }
             , done )
    return this }


  ///// Function map ///////////////////////////////////////////////////////////
  //
  // Creates a new Stream that maps each item in the original stream by
  // the given mapping function.
  //
  // map :: Stream a => @Stream, (a, (a -> b) -> b) -> Stream b
, map:
  make_folder(function _map(f, result, item, step, next) {
    f(item, function(item) {
              step(result, item, next) })})


  ///// Function filter ////////////////////////////////////////////////////////
  //
  // Creates a new Stream that filters out items in the original stream
  // that doesn't pass the given filter predicate.
  //
  // filter :: Stream a => @Stream, (a, (a -> Bool) -> Bool) -> Stream a
, filter:
  make_folder(function _filter(f, result, item, step, next) {
    f(item, function(ok) { ok?              step(result, item, next)
                         : /* otherwise */  next(result) })})


  ///// Function every /////////////////////////////////////////////////////////
  //
  // Creates a new Stream that will reduce to ``true`` if all items in
  // the original Stream pass the predicate, or ``false`` otherwise.
  //
  // every :: Stream a => @Stream, (a, (a -> Bool) -> Bool) -> Stream Bool
  //
, every:
  make_folder(function _every(f, result, item, step, next) {
    var self = this
    f(item, function(ok) {   ok?            step(true, item, next)
                         : /* otherwise */  step(self.end(false), item, next) })})


  ///// Function any ///////////////////////////////////////////////////////////
  //
  // Creates a new Stream that will reduce to ``true`` if any items in
  // the original Stream pass the predicate, or ``false`` otherwise.
  //
  // any :: Stream a => @Stream, (a, (a -> Bool) -> Bool) -> Stream Bool
, any:
  make_folder(function _any(f, result, item, step, next) {
    var self = this
    f(item, function(ok) {   ok?            step(self.end(true), item, next)
                         : /* otherwise */  step(false, item, next) })})
})


//// == Exports ================================================================
module.exports = { Stream: Stream }
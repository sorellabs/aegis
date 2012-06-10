/// utils.js --- Utilities for streams
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

/// Module aegis.utils

//// == Helpers ================================================================

///// Function identity ////////////////////////////////////////////////////////
//
// Identity combinator from Lambda Calculus.
//
// identity :: a -> a
function identity(x){
  return x }



//// == Core implementation ====================================================

///// Function make_foldable ///////////////////////////////////////////////////
//
// Constructs a ``Foldable`` out of a folding process.
//
// make-foldable :: Coll a => (a, b, Stepper, Done -> ()) -> a -> Foldable a
function make_foldable(folder) {
  return function(xs) {
           return { fold: default_folder }

           function default_folder(initial, step, done) {
             done = done || identity
             folder(xs, initial, step, done) }}}


///// Function make_folder /////////////////////////////////////////////////////
//
// Constructs a ``Foldable`` factory for streams.
//
// make-folder :: Stream a => ((a -> b), b, a, Stepper, Done) -> (a -> b) -> Foldable a
function make_folder(process) {
  return function(f) {
           var xs = this
           return xs.derive({ fold: folder })

           function folder(initial, step, done) {
             var self = this
             xs.fold( initial
                    , function(result, item, next) {
                        process.call(self, f, result, item, step, next) }
                    , done )}}}


//// == Exports ================================================================
module.exports = { make_foldable : make_foldable
                 , make_folder   : make_folder }
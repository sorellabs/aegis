describe('{} aegis.core', function() {
  var ensure  = require('noire').ensure
  var sinon   = require('sinon')
  var _       = require('../src/core')
  var folders = require('../src/folders')

  describe('{} Stream', function() {
    function S(xs){ return _.Stream.make(xs) }
    function number_p(x, n) { n(typeof x == 'number') }
    function low_p(x, n) { n(x < 3) }
    function string_p(x, n) { n(typeof x == 'string') }
    function big_p(x, n) { n(x > 2) }


    var xs, ys, noop
    beforeEach(function() {
      xs   = folders.sequence([1, 2, 3, 4])
      ys   = folders.map({ a: 1, b: 2, c: 3, d: 4 })
      noop = sinon.spy()
    })

    describe('λ end', function() {
      it('Should wrap the value into a final value for a fold.', function() {
        ensure(_.Stream.end(1)).satisfy(_.internal.finished_p)
      })
      it('Should hold the value as the `value` property.', function() {
        ensure(_.Stream.end(1)).property('value').same(1)
      })
    })

    describe('λ fold', function() {
      it('Should return the original Stream.', function() {
        var s = S(xs)
        ensure(s.fold(noop, noop, noop)).same(s)
      })
      it('Should invoke the Foldable\'s fold.', function() {
        var mock = sinon.mock(xs)
        var spy  = sinon.spy()
        mock.expects('fold').once()
                            .callsArgWith(1, 1, noop)

        S(xs).fold(0, spy, noop)
        ensure(spy).property('called').ok()
        mock.verify()
      })
      it('Should finish as soon as it hits a final result for the fold.', function() {
        var mock = sinon.mock(xs)
        var step = sinon.spy(function(i){ step(i) })
        mock.expects('fold').callsArgWith(1, _.Stream.end(1), 2, step)

        S(xs).fold(0, step, noop)
        ensure(noop).property('calledOnce').ok()
        mock.verify()
      })
      it('Should continue folding until the Stream is consumed.', function() {
        var i    = 0
        var mock = sinon.mock(xs)
        var step = sinon.spy(function(x, k, n){ i < 4? step(++i) : noop() })
        mock.expects('fold').callsArgWith(1, i, 1, step)

        S(xs).fold(i, step, noop)
        ensure(step).property('callCount').same(5)
        ensure(noop).property('calledOnce').ok()
        mock.verify()
      })
    })

    describe('λ as-array', function() {
      it('Should aggregate all items of a Stream in an array.', function() {
        var s = S(xs), x = 0
        s.fold = function(r, step, d) {
          x < 4?  step(r, ++x, function(r) { s.fold(r, step, d) })
          :       d(r) }


        s.as_array(noop)
        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals([1, 2, 3, 4])
      })
    })

    describe('λ value', function() {
      it('Should return the final result of a Stream.', function() {
        var s = S(xs), x = 0
        s.fold = function(r,step,d) {
          x < 4?  step(++x, x, function(r){ s.fold(r, step, d) })
          :       d(x) }

        s.value(0, noop)
        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals(4)
      })
    })

    describe('λ map', function() {
      it('Should yield a new Stream.', function() {
        var s = S(xs)
        ensure(s.map(noop)).not().same(s)
      })
      it('Should map all items in a stream through a mapping function.', function() {
        var ones = sinon.stub().callsArgWith(1, 1)
        S(xs).map(ones).as_array(noop)
        S(ys).map(ones).as_array(noop)

        ensure(noop).property('calledTwice').ok()
        ensure(noop.args[0][0]).equals([1, 1, 1, 1])
        ensure(noop.args[1][0]).equals([1, 1, 1, 1])
      })
      it('Should not modify the items in the original Stream.', function() {
        var s = S(xs), ones = sinon.stub().callsArgWith(1, 1)
        s.map(ones).as_array(noop)
        s.as_array(noop)

        ensure(noop).property('calledTwice').ok()
        ensure(noop.args[0][0]).equals([1, 1, 1, 1])
        ensure(noop.args[1][0]).equals([1, 2, 3, 4])
      })
    })

    describe('λ filter', function() {
      function even(x, n){ n(x % 2 == 0) }

      it('Should yield a new Stream.', function() {
        var s = S(xs)
        ensure(s.filter(noop)).not().same(s)
      })
      it('Should keep only items that pass the predicate.', function() {
        S(xs).filter(even).as_array(noop)

        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals([2, 4])
      })
      it('Should not modify the items in the original Stream.', function() {
        var s = S(xs)
        s.filter(even).as_array(noop)
        s.as_array(noop)

        ensure(noop).property('calledTwice').ok()
        ensure(noop.args[0][0]).equals([2, 4])
        ensure(noop.args[1][0]).equals([1, 2, 3, 4])
      })
    })

    describe('λ every', function() {
      it('Should yield a new Stream.', function() {
        var s = S(xs)
        ensure(s.every(noop)).not().same(s)
      })
      it('Should fold to true if all items pass the predicate.', function() {
        S(xs).every(number_p).value(true, noop)

        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals(true)
      })
      it('Should fold to false immediately if any item fails.', function() {
        var s = S(xs)
        var spy = sinon.spy(low_p)
        s.every(spy).value(true, noop)

        ensure(spy).property('callCount').same(3)
        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals(false)
      })
      it('Should not modify the items in the original Stream.', function() {
        var s = S(xs)
        s.every(number_p).value(true, noop)
        s.as_array(noop)

        ensure(noop).property('calledTwice').ok()
        ensure(noop.args[0][0]).equals(true)
        ensure(noop.args[1][0]).equals([1, 2, 3, 4])
      })
    })
    describe('λ any', function() {
      it('Should yield a new Stream.', function() {
        var s = S(xs)
        ensure(s.any(noop)).not().same(s)
      })
      it('Should fold to false if none of the items pass the predicate.', function() {
        S(xs).any(string_p).value(false, noop)

        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals(false)
      })
      it('Should fold to true immediately if any of the items pass the predicate.', function() {
        var s = S(xs)
        var spy = sinon.spy(big_p)
        s.any(spy).value(false, noop)

        ensure(spy).property('callCount').same(3)
        ensure(noop).property('calledOnce').ok()
        ensure(noop.args[0][0]).equals(true)
      })
      it('Should not modify the items in the original Stream.', function() {
        var s = S(xs)
        s.any(string_p).value(false, noop)
        s.as_array(noop)

        ensure(noop).property('calledTwice').ok()
        ensure(noop.args[0][0]).equals(false)
        ensure(noop.args[1][0]).equals([1, 2, 3, 4])
      })
    })

  })
})
describe('{} aegis.folders', function() {
  var ensure = require('noire').ensure
  var sinon = require('sinon')
  var _ = require('../src/folders')

  var noop
  beforeEach(function() {
    noop = sinon.spy()
  })

  describe('λ sequence', function() {
    var sum, upcase
    beforeEach(function() {
      sum = sinon.spy(function(r, i, n){ n(r + i) })
      upcase = sinon.spy(function(r, i, n){ n(i.toUpperCase()) })
    })

    it('Given a sequence, should yield a Foldable over that sequence.', function() {
      ensure(_.sequence([1, 2, 3])).property('fold').type('function')
      ensure(_.sequence('foo')).property('fold').type('function')
    })
    it('Should fold over all the items of the sequence.', function() {
      _.sequence([1, 2, 3]).fold(0, sum, noop)
      _.sequence('bar').fold('', upcase, noop)

      ensure(sum).property('callCount').same(3)
      ensure(sum).invoke('calledWith', 0, 1).ok()
      ensure(sum).invoke('calledWith', 1, 2).ok()
      ensure(sum).invoke('calledWith', 3, 3).ok()

      ensure(upcase).property('callCount').same(3)
      ensure(upcase).invoke('calledWith', '', 'b').ok()
      ensure(upcase).invoke('calledWith', 'B', 'a').ok()
      ensure(upcase).invoke('calledWith', 'A', 'r').ok()
    })
    it('Should invoke `done` when consumed.', function() {
      _.sequence([1, 2, 3]).fold(0, sum, noop)
      _.sequence('foo').fold('-', sum, noop)
      ensure(noop).property('calledTwice').ok()
      ensure(noop).invoke('calledWith', 6).ok()
      ensure(noop).invoke('calledWith', '-foo').ok()
    })
  })

  describe('λ map', function() {
    var acc
    beforeEach(function() {
      acc = sinon.spy(function(r, i, n){ n(r.concat([i])) })
    })

    it('Given a map, should yield a Foldable over that map.', function() {
      ensure(_.map({ a: 1, b: 2 })).property('fold').type('function')
      ensure(_.map([1, 2])).property('fold').type('function')
    })
    it('Should fold over all the items of the map.', function() {
      _.map({ a: 1, b: 2 }).fold([], acc, noop)

      ensure(acc).property('callCount').same(2)
      ensure(acc.args[0][1]).equals(['a', 1])
      ensure(acc.args[1][1]).equals(['b', 2])
    })
    it('Should invoke `done` when consumed.', function() {
      _.map({ a: 1, b: 2 }).fold([], acc, noop)

      ensure(noop).property('calledOnce').ok()
      ensure(noop.args[0][0]).equals([['a', 1], ['b', 2]])
    })
  })

})
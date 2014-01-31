
/**
 * @list dependencies
 **/

var vows = require('vows')
  , assert = require('assert')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Promise = mongoose.Promise
  , events = require('events')
  , paginate = require('../lib/mongoose-paginate')(mongoose);

/**
 * connect to MongoDB with Mongoose
 **/

var MongoDB = process.env.MONGO_DB || 'mongodb://localhost/test';

mongoose.connect(MongoDB);

/**
 * @tests setup
 **/

var BlogSchema = new Schema({
  id    : ObjectId,
  title : String,
  entry : String,
  date  : Date
});

var BlogEntry = mongoose.model('BlogEntry', BlogSchema);

function setup(callback){
  var complete = 0;
  for (var i = 1; i < 101; i++) {
    var newEntry = new BlogEntry({
      title : 'Item #'+i,
      entry : 'This is the entry for Item #'+i
    });
    newEntry.save(function(error, result) {
      if (error) {
        console.error(error);
      } else {
        complete++;
        if (complete === 100) {
          callback(null, 100);
        }
      }
    });
  };
}

/**
 * teardown
 **/

function teardown(callback){
  var complete = 0;
  BlogEntry.find({}, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      for (result in results) {
        results[result].remove(function(error) {
          if (error) {
            callback(error, null);
          } else {
            complete++;
            if (complete === 100) {
              callback(null, 100);
            }
          };
        });
      };
    }
  });
};

/**
 * @tests vows
 **/

vows.describe('pagination module basic test').addBatch({
  'when requiring `mongoose-paginate`':{
    topic:function(){
      return paginate;
    },
    'there should be no errors and paginate should be a function':function(topic) {
      assert.equal(typeof(topic), 'function');
    }
  }
}).addBatch({
  'when creating 100 dummy documents with our test mongodb string':{
    topic:function(){
      setup(this.callback);
    },
    'there should be no errors and resultCount should be 100':function(error, resultCount) {
      assert.equal(error, null);
      assert.equal(resultCount, 100);
    }
  }
}).addBatch({
  'when paginating BlogEntry querying for all documents, with page 2, 10 per page':{
    topic:function(){
      BlogEntry.paginate({}, 2, 10, this.callback, {columns: 'title'});
    },
    'there should be no errors':function(error, pageCount, results){
      assert.equal(error, null);
    },
    'results.length should be 10, and the first result should contain the correct index #(11)':function(error, pageCount, results) {
      assert.equal(results.length, 10);
    },
    'the first result should contain the correct index #(11)':function(error, pageCount, results) {
      assert.equal(results[0].title, 'Item #11');
    },
    'the column entry should be undefined':function(error, pageCount, results) {
      assert.equal(typeof(results[0].entry), 'undefined');
    }
  }
}).addBatch({
  'when paginating BlogEntry querying for all documents, with page 2, 10 per page with a promise':{
    topic:function(){
      var mongoosePromise = BlogEntry.paginate({}, 2, 10, undefined, {columns: 'title'});
      var promise = new(events.EventEmitter);

      mongoosePromise.addBack(function(error, pageCount, results) {
        if (error) { promise.emit('error', error) }
        else { promise.emit('success', pageCount, results) }
      });

      return promise;
    },
    'there should be no errors':function(error, pageCount, results){
      assert.equal(error, null);
    },
    'pageCount should be 10':function(error, pageCount, results) {
      assert.equal(pageCount, 10);
    },
    'results.length should be 10':function(error, pageCount, results) {
      assert.equal(results.length, 10);
    },
    'the first result should contain the correct index #(11)':function(error, pageCount, results) {
      assert.equal(results[0].title, 'Item #11');
    },
    'the column entry should be undefined':function(error, pageCount, results) {
      assert.equal(typeof(results[0].entry), 'undefined');
    }
  }
}).addBatch({
  'when deleting all of our 100 dummy documents with our test mongodb string':{
    topic:function(){
      teardown(this.callback);
    },
    'there should be no errors and resultCount should be a number':function(error, resultCount) {
      assert.equal(error, null);
      assert.equal(resultCount, 100);
    }
  }
}).export(module);

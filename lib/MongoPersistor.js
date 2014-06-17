var mongoose = require("mongoose")
var Mixed = mongoose.Schema.Types.Mixed
var treeUtils = require("backside-utils")
var async = require("async")

var PersistorSchema = new mongoose.Schema({
  name: "string", // "databases"
  path: ["string"], // ["/books", "/books/programming", "/books/programming/databases"]
  parentPath: "string",  // "/books/programming"
  priority: Mixed,
  value: Mixed
})


// perhaps use this instead:
// http://docs.mongodb.org/manual/tutorial/model-tree-structures-with-materialized-paths/
PersistorSchema.index({path: 1, parentPath: 1, ".priority": 1, name: 1}, {unique: true})

PersistorSchema.statics.getRaw = function(key, cb) {
  var pathEl = treeUtils.buildPathArr(key).pop()
  this.find({path: pathEl}).sort({".priority": 1, name: 1}).lean().exec(cb)
}

PersistorSchema.statics.get = function(key, cb) {
  var pathArr = treeUtils.buildPathArr(key)
  this.getRaw(key, function(err, docs){
    if (err) return cb(err)
    if (!docs.length) {
      return cb()
    }

    var ret = treeUtils.reduceTree(docs, pathArr)

    cb(null, ret)

  })
}

PersistorSchema.statics.set = function(key, val, priority, cb) {
  var pathArr = treeUtils.buildPathArr(key)

  var topKey = key.split("/").pop()
  var docs = treeUtils.buildDocs(topKey, pathArr, val, priority)
  async.map(docs, this.saveSingleDoc.bind(this), function(err, docs) {
    if (err) return cb(err)
    cb(null, treeUtils.reduceTree(docs, pathArr))
  })
}

PersistorSchema.statics.saveSingleDoc = function(doc, cb) {
  this.findOneAndUpdate({path: doc.path}, doc, {upsert: true}, cb)
}

PersistorSchema.statics.remove = function(key, cb) {
  var self = this
  this.getRaw(key, function(err, docs) {
    if (err) return cb(err)
    if (!docs.length) return cb()
    var ids = docs.map(function(d) {
      return d._id
    })

    async.each(ids, self.findByIdAndRemove.bind(self), cb)
  })
}

PersistorSchema.statics.privateSet = function() {
  this.privateStore.set.apply(this.privateStore, arguments)
}

PersistorSchema.statics.privateGet = function(key, cb) {
  this.privateStore.get.apply(this.privateStore, arguments)
}

PersistorSchema.statics.privateRemove = function(key, cb) {
  this.privateStore.remove.apply(this.privateStore, arguments)
}


function PersistorBuilder(connectionString, opts) {
  connectionString = connectionString || process.env.MONGODB_URL || "mongodb://localhost/backside"
  opts = opts || {}
  this.db = mongoose.createConnection(connectionString, opts)

  var collName = opts.collection || process.env.MONGODB_COLLECTION || "backside"
  var privCollName = opts.privateCollection || process.env.MONGODB_PRIV_COLLECTION || "private"
  var model = this.db.model(collName, PersistorSchema, collName)
  // also add the private model as a property
  model.privateStore = this.db.model(privCollName, PersistorSchema, privCollName)
  return model
}

PersistorBuilder.createTestInstance = function(cb) {
  var mongoUrl = process.env.MONGODB_TEST_URL || "mongodb://localhost/test"
  var tester = new PersistorBuilder(mongoUrl)
  tester.collection.drop(function(err) {
    tester.create([
      {
        name: "bar",
        path: ["/", "/foo", "/foo/bar"],
        parentPath: "/foo",
        value : null,
        priority : 1
      },
      {
        name: "beep",
        path: ["/", "/foo", "/foo/bar", "/foo/bar/baz", "/foo/bar/baz/beep"],
        parentPath: "/foo/bar/baz",
        value : 1,
        priority : 1,
      },
      {
        name: "boop",
        path: ["/", "/foo", "/foo/bar", "/foo/bar/baz", "/foo/bar/baz/boop"],
        parentPath: "/foo/bar/baz",
        value : 1,
        priority : 1
      },
      {
        name: "bat",
        path: ["/", "/foo", "/foo/bar", "/foo/bar/bat"],
        parentPath: "/foo/bar",
        value : 4,
        priority : 2
      }
    ], function(err) {
      if (err) return cb(err)
      return cb(null, tester)
    })
  })
}

module.exports = PersistorBuilder

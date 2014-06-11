backside-mongo-store
============

A store for backside that uses mongo

# Configuration
This store takes a few options:
```JavaScript
new MongoStore(mongodbUri, [opts])
```
Where opts is:
```JavaScript
{
  collection: "backside", // the name of the collection to use for backside
  privateCollection: "private" // the name of the collection for private data
}
// this same opts array is also passed to the mongo driver, so all those are available as well
```


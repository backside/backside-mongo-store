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

# Configuration via environment variables
This can also be configured via environemt variables
```
MONGODB_URL=mongodb://myhost/db
MONGODB_COLLECTION=collectionName
MONGODB_PRIV_COLLECTION=collectionNameForPrivateData
```

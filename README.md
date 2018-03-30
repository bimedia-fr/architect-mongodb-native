architect-mongodb-native
========================

Expose a mongodb client as architect plugin.


### Installation

```sh
npm install --save architect-mongodb-native
```
### Config Format
```js
{
  "packagePath": "architect-mongodb-native",
  "url": "mongodb://127.0.0.1:27017/test"
}
```

### Supported config elements

#### url
MongoDB server url.

#### config
Additional mongodb [config parameters](http://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html#constructor).

### Usage

Boot [Architect](https://github.com/c9/architect) :

```js
var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, function (err, app) {
    if (err) {
        throw err;
    }
    console.log('application started');
});
```

Configure mongodb with `config.js` :

```js
module.exports = [{
    packagePath: "architect-mongodb-native",
    url : 'mongodb://127.0.0.1:27017/test'
}, './routes'];
```

Consume *mongo* service in your application :

```js
{
  "name": "routes",
  "version": "0.0.1",
  "main": "index.js",
  "private": true,

  "plugin": {
    "consumes": ["mongo"]
  }
}
```

Eventually use the `mongo` service in your app :

```js
module.exports = function setup(options, imports, register) {
    var db = imports.mongo.db;
    db.collection('test').update({hi: 'here'}, {$set: {hi: 'there'}}, {w:1}, function(err) {
      if (err) console.warn(err.message);
      else console.log('successfully updated');
    });
    register();
};
```

### Options
* url : mongoclient connect url
* config : additionnal connection parameter
* config.logger: ['error', 'info', 'debug'] enable mongodb driver logs with the selected level.

### multiple connections

Multiple mongo connection are supported. 
For instance :

```js
module.exports = [{
    packagePath: "architect-mongodb-native",
    first:{
      url : 'mongodb://127.0.0.1:27017/test'
    },
    second:{
      url : 'mongodb://127.0.0.1:27017/other'
    },
    config: {
      readPreference: 'secondaryPreferred',
      replicaSet: 'myreplset'
    }
}, './routes'];
```


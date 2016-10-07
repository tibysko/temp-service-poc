'use strict';

const express = require('express');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://mongodb:27017/myproject';

// Constants
console.log('process: ' + process.env);
const PORT = process.env.port | 8080;

// App
const app = express();
app.get('/', function (req, res) {
  MongoClient.connect(url, function (err, db) {
    getTopicsFromDb(db, function (data) {
      res.send(data);
    });
  });
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://mosquitto:1883');

client.on('connect', function () {
  client.subscribe('presence');
  client.subscribe('world');
  client.publish('presence', 'Hello mqtt')
})

client.on('message', function (topic, message) {

  console.log(topic + ': ' + message.toString())

  MongoClient.connect(url, function (err, db) {

    console.log("Connected correctly to server");

    insertTopicToDb(db, topic, message.toString(), function () {
      db.close();
    });
  });
});

function insertTopicToDb(db, topic, message, cb) {
  var collection = db.collection('topic');
  // Insert some documents 
  collection.insertMany([{
    topic: message
  }], function (err, result) {

    console.log("Inserted: " + JSON.stringify(result));
    cb(result);
  });

};

function getTopicsFromDb(db, callback) {
  // Get the documents collection 
  var collection = db.collection('topic');
  // Find some documents 
  collection.find({}).toArray(function (err, docs) {

    console.log("Found the following records");
    console.dir(docs);
    callback(docs);
  });
}



// Use connect method to connect to the server
MongoClient.connect(url, function (err, db) {
  console.log("Connected successfully to server");
  console.log('error: ' + err);

  var createCollection = function (db, callback) {
  
    db.createCollection("topic", {
        "capped": true,
        "size": 100000,
        "max": 5000
      },
      function (err, results) {
        console.log("Topic Collection created.");
        callback();
      }
    );
  };

  createCollection(db, function () {});


});
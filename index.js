"use strict"

const express = require('express');
const app = express();
const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const path = require('path');
const url = process.env.MONGOLAB_URI_BETTERIMAGE;
const port = process.env.PORT || 3000;
const request = require('request');
const api_url = "https://www.googleapis.com/customsearch/v1?key=AIzaSyD_a8NSXTmXOOrs-CvNLVYCkEeAKesXQxA&cx=012257678451160308612:jwmptq5q4b0&q=";

app.use(express.static(path.join(__dirname, 'public')));
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.get('/api/imagesearch/:query', (req, res) => {
  const params = req.params.query;
  const size = req.query.offset || 10;
  const search_url = api_url.concat(params);
  saveToDB(params, req, res);
  // add body to callback args will fuck up your response
  request.get(search_url, (err, response) => {
    var results = JSON.parse(response.body).items.slice(0, size);
    var images = getImagesInfo(results);
    res.send(images);
  });
});

app.get('/api/latest/imagesearch', (req, res) => {
  getData(req, res);
});

app.listen(port);

function getImagesInfo(arr) {
  return arr.map((val) => {
    var og_url = val.pagemap.metatags[0]['og:image'];
    var snippet = val.title;
    var thumbnail = val.pagemap.cse_thumbnail !== undefined ? val.pagemap.cse_thumbnail[0].src : "no thumbnail";
    var context = val.link;
    return  { "url": og_url,
              "snippet": snippet,
              "thumbnail": thumbnail,
              "context": context
            }
  });
}

function saveToDB(params, req, res) {
  mongo.connect(url, (err, db) => {
    if(err) { throw err; }
    else {
      var collection = db.collection('queries');
      collection.insert({
        "term": params
      }, (err, docs) => {
        if(err) throw err;
        else
          var created_at = ObjectId(docs.ops._id).getTimestamp();
          // res.send({"term": params, "when": created_at});
      });
    }
  });
}

function getData(req, res) {
  mongo.connect(url, (err, db) => {
    if(err) { throw err; }
    else {
      var collection = db.collection('queries');
      collection.find({}, {
        "term": 1
      }).toArray((err, docs) => {
        var history = docs.map((val) => {
          return {
            "term": val.term,
            "when": ObjectId(val._id).getTimestamp()
          }
        })
        res.send(history);
      })
    }
  });
}

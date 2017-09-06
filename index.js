const express = require('express');
const app = express();
const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const path = require('path');
const url = "mongodb://localhost:27017/image_queries";
const port = process.env.PORT || 3000;
const request = require('request');
const api_url = "https://www.googleapis.com/customsearch/v1?key=AIzaSyD_a8NSXTmXOOrs-CvNLVYCkEeAKesXQxA&cx=012257678451160308612:jwmptq5q4b0&q=";

app.use(express.static(path.join(__dirname, 'public')));
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.get('/api/imagesearch/:query', (req, res) => {
  const params = req.params.query;
  const search_url = api_url.concat(params);
  saveToDB(params, req, res);
  request(search_url).pipe(res);
});

app.listen(port);

function saveToDB(params, req, res) {
  mongo.connect(url, (err, db) => {
    if(err) throw err;
    else
      const collection = db.collection('queries');
      collection.insert({
        "term": params
      }, (err, docs) => {
        if(err) throw err;
        else
          const created_at = ObjectId(docs.ops._id).getTimestamp();
          // res.send({"term": params, "when": created_at});
      });
  });
}

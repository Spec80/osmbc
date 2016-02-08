"use strict";

var twit = require("twit");
var config = require('../config.js');
var request = require('request');
var async = require('async');
var debug = require('debug')('OSMBC:model:twitter');
var fs = require("fs");


    
function expandUrl(shortUrl,callback) {
  debug("expandUrl");
  request( { method: "HEAD", url: shortUrl, followAllRedirects: true },
    function (error, response) {
      if (error) return callback(null,shortUrl);
      return callback(null,response.request.href);
    }
  );
}

var client = new twit(
  config.getValue("twitter")
);


function expandTwitterUrl(url,callback) {
  debug("expandTwitterUrl");
  if (!url) return callback();

  // No Twitter Url, return url as result.
    
 
  if ((url.substring(0,20)!=="https://twitter.com/") && (url.substring(0,19)!=="http://twitter.com/")) {
    return callback(null,url);
  } 
    
 
  if (url.indexOf("/status/")<0) return callback(null,url);

  var id = url.substring(url.indexOf("/status/")+8,99);
  client.get("/statuses/show/"+id,function(err,result) {
    debug("client.get");
    // not working, ignore error
    console.log(err);   
    if (err) return callback(null,url);
    if (!result) return callback(null,url);

    var collection = url + "\n\nTweet by "+result.user.name+"\n";
    collection += result.text.substring(0,result.text.length-24)+"\n";
    collection += "(Retweets: "+result.retweet_count +" Favs: "+result.favorite_count+")\n";




    async.eachSeries(result.entities.urls,function(item,cb){
      var u = item.expanded_url;
      expandUrl(u,function(err,url){
        collection = collection.replace(item.url,url);
        cb();
      });
    }, function finalFunction(err){
      if (err) return callback(err);
      return callback(null,collection);
    });
  });
}

module.exports.expandTwitterUrl = expandTwitterUrl;

module.exports.for_debug_only= {twitterClient : client};

"use strict";



var should = require('should');
var sinon  = require('sinon');


var testutil = require('./testutil.js');

var articleModule = require('../model/article.js');
var blogModule    = require('../model/blog.js');


var mailReceiver  = require('../notification/slackReceiver.js');

var nock = require('nock');




function checkPostJson(check) {

  return function(body) {
    should(body).eql(check);
    return true;    
  };
}



describe('notification/slackReceiver', function() {
  beforeEach(function (bddone) {
    testutil.clearDB(bddone);
  }); 
  describe('articles',function() {
    it('should slack message, when collecting article',function (bddone){
      var slack = nock('https://hooks.slack.com/')
                .post('/services/articleKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/1|Test Title> added to <https://testosm.bc/blog/WN789|WN789>\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcarticle"}))  
                .reply(200,"ok");
      articleModule.createNewArticle(function(err,article){
        article.setAndSave({OSMUser:"testuser"},{blog:"WN789",collection:"newtext",title:"Test Title"},function(err) {
          should.not.exist(err);
          should(slack.isDone()).is.True();
          bddone();
        });
      });
    });
    it('should slack message, when adding comment.',function (bddone){
      var slack = nock('https://hooks.slack.com/')
                .post('/services/articleKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/1|Test Title> added comment\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcarticle"}))
                .reply(200,"ok");
      articleModule.createNewArticle(function(err,article){
        article.setAndSave({OSMUser:"testuser"},{blog:"WN789",title:"Test Title",comment:"Information for @User3"},function(err) {
          should.not.exist(err);
          should(slack.isDone()).is.True();
          bddone();
        });
      });
    });
  });
  describe('blogs',function() {
    it('should slack message when creating a blog',function (bddone){
      var slack = nock('https://hooks.slack.com/')
                .post('/services/blogKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/WN251|WN251> was created\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcblog"}))
                .reply(200,"ok");
      blogModule.createNewBlog({OSMUser:"testuser"},function(err){
        should.not.exist(err);
        should(slack.isDone()).is.True();

        bddone();
      });
    });
    it('should slack message, when change blog status',function (bddone){
      var slack1 = nock('https://hooks.slack.com/')
                .post('/services/blogKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/WN251|WN251> was created\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcblog"}))
                .reply(200,"ok");
      blogModule.createNewBlog({OSMUser:"testuser"},function(err,blog){
        var slack2 = nock('https://hooks.slack.com/')
                  .post('/services/blogKey',checkPostJson(
                    {"text":"<https://testosm.bc/blog/WN251|WN251> changed status to edit\n",
                    "username":"osmbcbot",
                    "channel":"#osmbcblog"}))
                  .reply(200,"ok");
        should.not.exist(err);
        // reset sinon spy:
        blog.setAndSave({OSMUser:"testuser"},{status:"edit"},function(err){
          should.not.exist(err);
          should(slack1.isDone()).is.True();
          should(slack2.isDone()).is.True();

     
          bddone();
        });
      });
    });
    it('should slack message, when review status is set',function (bddone){
      var slack1 = nock('https://hooks.slack.com/')
                .post('/services/blogKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/blog|blog> was created\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcblog"}))
                .reply(200,"ok");
      blogModule.createNewBlog({OSMUser:"testuser"},{name:"blog",status:"edit"},function(err,blog){
        var slack2 = nock('https://hooks.slack.com/')
                  .post('/services/blogKey',checkPostJson(
                    {"text":"<https://testosm.bc/blog/blog|blog>(ES) has been reviewed by testuser (I have reviewed)",
                    "username":"osmbcbot",
                    "channel":"#osmbcblog"}))
                  .reply(200,"ok");
        should.not.exist(err);
        blog.setReviewComment("ES",{OSMUser:"testuser"},"I have reviewed",function(err){
          should.not.exist(err);
          should(slack1.isDone()).is.True();
          should(slack2.isDone()).is.True();

     
          bddone();
        });
      });
    });
    it('should slack message, when review is marked as exported',function (bddone){
      var slack1 = nock('https://hooks.slack.com/')
                .post('/services/blogKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/blog|blog> was created\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcblog"}))
                .reply(200,"ok");
      blogModule.createNewBlog({OSMUser:"testuser"},{name:"blog",status:"edit"},function(err,blog){
        var slack2 = nock('https://hooks.slack.com/')
                  .post('/services/blogKey',checkPostJson(
                    {"text":"<https://testosm.bc/blog/blog|blog>(ES) is exported to WordPress",
                    "username":"osmbcbot",
                    "channel":"#osmbcblog"}))
                  .reply(200,"ok");
        should.not.exist(err);
        // reset sinon spy:
        blog.setReviewComment("ES",{OSMUser:"testuser"},"markexported",function(err){
          should.not.exist(err);
          should(slack1.isDone()).is.True();
          should(slack2.isDone()).is.True();

   
          bddone();
        });
      });
    });
    it('should slack message, when blog is closed',function (bddone){
      var slack1 = nock('https://hooks.slack.com/')
                .post('/services/blogKey',checkPostJson(
                  {"text":"<https://testosm.bc/blog/blog|blog> was created\n",
                  "username":"osmbcbot",
                  "channel":"#osmbcblog"}))
                .reply(200,"ok");
      blogModule.createNewBlog({OSMUser:"testuser"},{name:"blog",status:"edit"},function(err,blog){
        var slack2 = nock('https://hooks.slack.com/')
                  .post('/services/blogKey',checkPostJson(
                    {"text":"<https://testosm.bc/blog/blog|blog>(ES) has been closed by testuser",
                    "username":"osmbcbot",
                    "channel":"#osmbcblog"}))
                  .reply(200,"ok");
        should.not.exist(err);
        // reset sinon spy:
        blog.closeBlog("ES",{OSMUser:"testuser"},"true",function(err){
          should.not.exist(err);
          should(slack1.isDone()).is.True();
          should(slack2.isDone()).is.True();

          bddone();
        });
      });
    });
  });
});

// Article createNewArticle
// create article with prototyp
// create Article without prototyp
// create article with ID (non existing in db, existing in DB)


var pg     =require('pg');
var async  = require('async');
var should = require('should');
var path   = require('path');

var config = require('../config.js');


var articleModule = require('../model/article.js');
var logModule = require('../model/logModule.js');

function getJsonWithId(table,id,cb) {
   pg.connect(config.pgstring, function(err, client, pgdone) {
    should.not.exist(err);
    var query = client.query('select data from '+table+' where id = $1',[id]);
    var result;
    query.on('row',function(row) {
      result = row.data;
    })
    query.on('end',function(err,r) {
      pgdone();
      cb(null,result);
      return;
    })
   })
}

describe('Article', function() {
  before(function (bddone) {
    async.series([
      function(done) {config.initialise(done)},
      function(done) {articleModule.dropTable(done)},
      function(done) {articleModule.createTable(done)},
      function(done) {logModule.dropTable(done)},
      function(done) {logModule.createTable(done)}
    ],function(err) {
      if (err) console.dir(err);
      should.not.exist(err);
      bddone();
    });
  }) 

  describe('createNewArticle',function() {
    it('should createNewArticle with prototype',function(bddone) {
      var newArticle = articleModule.createNewArticle({blog:"test",markdown:"**"},function (err,result){
        should.not.exist(err);
        var id = result.id;
        getJsonWithId("article",id,function(err,result){
          should.not.exist(err);
          should(result.blog).equal('test');
          should(result.markdown).equal('**');
          bddone();
        })
      })
    });
    it('should createNewArticle without prototype',function(bddone) {
      var newArticle = articleModule.createNewArticle(function (err,result){
        should.not.exist(err);
        var id = result.id;
        getJsonWithId("article",id,function(err,result){
          should.not.exist(err);
          bddone();
        })
      });
    })
    it('should create no New Article with ID',function(bddone){
      (function() {
        var newArticle = articleModule.createNewArticle({id:2,blog:"test",markdown:"**"},function (err,result){
        })
      }).should.throw();
      bddone();
    })
  })
  describe('setAndSave',function() {
    it('should set only the one Value in the database', function (bddone){
      var newArticle;
      articleModule.createNewArticle({markdown:"markdown",blog:"TEST"},function(err,result){
        should.not.exist(err);
        newArticle = result;
        var id =result.id;
        newArticle.markdown = "This Value will not be logged";
        newArticle.setAndSave("user",{blog:"Reference",collection:"text"},function(err,result) {
          should.not.exist(err);
          getJsonWithId("article",id,function(err,result){
            should.not.exist(err);
            delete result._meta;
            should(result).eql({id:id,markdown:"This Value will not be logged",blog:"Reference",collection:"text"});
            logModule.find({},"property",function (err,result){
              should.not.exist(err);
              should.exist(result);
              should(result.length).equal(2);
              var r0id = result[0].id;
              var r1id = result[1].id;
              var t0 = result[0].timestamp;
              var t1 = result[1].timestamp;
              var now = new Date();
              var t0diff = ((new Date(t0)).getTime()-now.getTime());
              var t1diff = ((new Date(t1)).getTime()-now.getTime());

              // The Value for comparison should be small, but not to small
              // for the test machine.
              should(t0diff).be.below(10);
              should(t1diff).be.below(10);
              should(result[0]).eql({id:r0id,timestamp:t0,oid:id,user:"user",table:"article",property:"blog",from:"TEST",to:"Reference"});
              should(result[1]).eql({id:r1id,timestamp:t1,oid:id,user:"user",table:"article",property:"collection",to:"text"});
              bddone();
            })
          })
        })
      })
    })
  })
  describe('findFunctions',function() {
    var idToFindLater;
    before(function (bddone) {
      // Initialise some Test Data for the find functions
      async.series([
        function c1(cb) {articleModule.createNewArticle({blog:"WN1",markdown:"test1",collection:"col1",category:"catA"},cb)},
        function c2(cb) {articleModule.createNewArticle({blog:"WN1",markdown:"test2",collection:"col2",category:"catB"},cb)},
        function c3(cb) {articleModule.createNewArticle({blog:"WN2",markdown:"test3",collection:"col3",category:"catA"},
                         function(err,result){
                          should.not.exist(err);
                          idToFindLater = result.id;
                          cb(err);
                         })}

        ],function(err) {
          should.not.exist(err);
          bddone();
        });
    })
    describe('find',function() {
      it('should find multiple objects with sort',function(bddone){
        articleModule.find({blog:"WN1"},"collection",function(err,result){
          should.not.exist(err);
          should.exist(result);
          should(result.length).equal(2);
          delete result[0]._meta;
          delete result[0].id;
          delete result[1]._meta;
          delete result[1].id;
          should(result[0]).eql({blog:"WN1",markdown:"test1",collection:"col1",category:"catA"});
          should(result[1]).eql({blog:"WN1",markdown:"test2",collection:"col2",category:"catB"});
          bddone();
        })
      })
    })
    describe('findOne',function() {
      it('should findOne object with sort',function(bddone){
        articleModule.findOne({blog:"WN1"},"collection",function(err,result){
          should.not.exist(err);
          should.exist(result);
          delete result._meta;
          delete result.id;
          should(result).eql({blog:"WN1",markdown:"test1",collection:"col1",category:"catA"});
          bddone();
        })
      })
    })
    describe('findById',function() {
      it('should find saved Object',function(bddone){
        articleModule.findById(idToFindLater,function(err,result){
          should.not.exist(err);
          should.exist(result);
          delete result._meta;
          delete result.id;
          should(result).eql({blog:"WN2",markdown:"test3",collection:"col3",category:"catA"});
          bddone();
        })
      })
    })
  })
  describe('displayTitle',function() {
    var article;
    it('should return title first',function(bddone){
      article = articleModule.create({title:"Titel",markdown:"markdown"});
      should(article.displayTitle()).equal("Titel");

      article = articleModule.create({title:"Very Long Title",markdown:"markdown"});
      should(article.displayTitle(10)).equal("Very Long ...");
      bddone();
    })
    it('should return markdown second',function(bddone){
      article = articleModule.create({markdown:"markdown",collection:"col",category:"CAT"});
      should(article.displayTitle()).equal("markdown");

      article = articleModule.create({title:"",markdown:"markdown",collection:"col",category:"CAT"});
      should(article.displayTitle()).equal("markdown");

      article = articleModule.create({title:"",markdown:"* This is more markdown text to test the default limit of charachter",collection:"col",category:"CAT"});
      should(article.displayTitle()).equal("* This is more markdown text t...");
      bddone();
    })
    it('should return collection third',function(bddone){
      article = articleModule.create({markdown:"",collection:"col",category:"CAT"});
      should(article.displayTitle()).equal("col");

      article = articleModule.create({title:"",collection:"col",category:"CAT"});
      should(article.displayTitle()).equal("col");

      article = articleModule.create({collection:"Extrem shortening",category:"CAT"});
      should(article.displayTitle(2)).equal("Ex...");
      bddone();

    })
  })
})

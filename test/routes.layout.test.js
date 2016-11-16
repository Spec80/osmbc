"use strict";

var async = require('async');
var should = require('should');
var config = require('../config');


var testutil = require('../test/testutil.js');

var layout = require('../routes/layout.js');




describe('routes/layout',function() {
  var baseLink;
  before(function(bddone){
    baseLink = 'http://localhost:' + config.getServerPort() + config.getValue("htmlroot");
    async.series([
      testutil.clearDB,
      testutil.startServer,
    ],bddone);

  });
  after(function(bddone){
    testutil.stopServer();
    bddone();
  });
  it("should initialise all layout variables",function(bddone){
    function getMainLang(){return "DE";}
    function getSecondLang(){return null;}
    var req= {query:{},session:{},user:{getMainLang:getMainLang,getSecondLang:getSecondLang,language:"DE"}};
    var res = {};
    layout.prepareRenderLayout(req,res,function done(){
      console.dir(res);

      let l = res.rendervar.layout;
      should(typeof l.user).eql('object');
      should(Array.isArray(l.listOfOrphanBlog)).be.True();
      should(Array.isArray(l.listOfOpenBlog)).be.True();
      should(Array.isArray(l.listOfEditBlog)).be.True();
      should(Array.isArray(l.listOfReviewBlog)).be.True();
      should(l.usedLanguages).eql({DE:true});
      bddone();
    });

  });

});
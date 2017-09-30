"use strict";

var async = require("async");
var sinon = require("sinon");
var should = require("should");
var userRouter = require("../routes/users.js");
var userModule = require("../model/user.js");
var testutil = require("./testutil.js");


describe("router/user", function() {
  describe("createUser ", function() {
    beforeEach(function(bddone) {
      testutil.clearDB(bddone);
    });
    it("should call create an user", function(bddone) {
      var req = {};

      var res = {};
      res.set = function() {};
      var next;
      var userId;


      async.series([
        function(callback) {
          res.redirect = sinon.spy(function () { callback(); });
          next = sinon.spy(callback);
          userRouter.createUser(req, res, next);
        },
        function searchArticle(callback) {
          userModule.findOne({}, function(err, result) {
            should.not.exist(err);
            should.exist(result);
            userId = result.id;
            callback();
          });
        }

      ],
        function(err) {
          should.not.exist(err);
          should(next.called).be.false();
          should(res.redirect.called).be.true();
          should(res.redirect.firstCall.calledWith("/usert/" + userId + "?edit=true")).be.true();
          bddone();
        }
      );
    });
  });
  describe("postUserId", function() {
    it("should call save changed Values", function(bddone) {
      var req = {body: {OSMUser: "testNew", access: "full"}, params: {}, user: {displayName: "test"}};

      var res = {};
      res.set = function() {};
      var next;
      var userId;
      var newUser;

      async.series([
        function createUser(callback) {
          userModule.createNewUser({}, function(err, user) {
            if (err) return callback(err);
            userId = user.id;
            req.params.user_id = userId;
            callback();
          });
        },
        function(callback) {
          res.redirect = sinon.spy(function () { callback(); });
          next = sinon.spy(callback);
          userRouter.postUserId(req, res, next);
        },
        function searchArticle(callback) {
          userModule.findById(userId, function(err, result) {
            should.not.exist(err);
            should.exist(result);
            newUser = result;
            callback();
          });
        }

      ],
        function(err) {
          should.not.exist(err);
          should(newUser.OSMUser).equal("testNew");
          should(newUser.access).equal("full");
          should(next.called).be.false();
          should(res.redirect.called).be.true();
          should(res.redirect.firstCall.calledWith("/usert/" + userId)).be.true();
          bddone();
        }
      );
    });
  });
  describe("renderUserId", function() {
    after(function (bddone) {
      bddone();
    });
    it("should call next if user not exist", function(bddone) {
      this.timeout(this.timeout()*3);
      userModule.createNewUser({displayName: "TeST"}, function(err, user) {
        should.not.exist(err);
        should(user.id).not.equal(0);
        var newId = user.id + 1;
        var req = {query: {}, params: {}};
        req.params.user_id = newId;
        var res = {};
        res.set = function() {};
        var next;

        async.series([
          function(callback) {
            res.render = sinon.spy(callback);
            next = sinon.spy(callback);
            userRouter.renderUserId(req, res, next);
          }],
          function(err) {
            should.exist(err);
            should(err.message).eql("User ID >" + newId + "< Not Found");
            should(next.called).be.true();
            should(res.render.called).be.false();
            bddone();
          }
        );
      });
    });
  });
  describe("renderList", function() {
    before(testutil.clearDB);
    it("should render 2 of 3 users", function(bddone) {
      // Create Users First
      async.series([
        function prepareUser1(cb) {
          userModule.createNewUser({displayName: "Test1", access: "full"}, cb);
        },
        function prepareUser2(cb) {
          userModule.createNewUser({displayName: "Test2", access: "full"}, cb);
        },
        function prepareUser3(cb) {
          userModule.createNewUser({displayName: "Test3", access: "denied"}, cb);
        },
        function startTheTest(cb) {
          var req = {query: {}, params: {}};
          req.query.access = "full";
          var res = {rendervar: "TEST"};
          res.set = function() {};
          var next;

          async.series([
            function(callback) {
              res.render = sinon.spy(callback);
              next = sinon.spy(callback);
              userRouter.renderList(req, res, next);
            }],
            function() {
              should(next.called).be.false();
              should(res.render.called).be.true();
              should(res.render.firstCall.calledWith("user"));
              var param = res.render.firstCall.args[1];
              should(param.users.length).equal(2);
              should(param.users[0].displayName).equal("Test1");
              should(param.users[1].displayName).equal("Test2");

              cb();
            }
          );
        }


      ], function(err) {
        should.not.exist(err);
        bddone();
      });
    });
  });
});

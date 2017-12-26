"use strict";

var async = require("async");
var testutil = require("./testutil.js");
var nock = require("nock");
var should  = require("should");
var path = require("path");
var mockdate = require("mockdate");


var userModule = require("../model/user.js");






describe("views/tools", function() {
  this.timeout(20000);
  var browser;
  beforeEach(function(bddone) {
    async.series([
      testutil.clearDB,
      function createUser(cb) { userModule.createNewUser({OSMUser: "TheFive", access: "full"}, cb); },
      testutil.startServer.bind(null, "TheFive")
    ], function(err) {
      browser = testutil.getBrowser();
      bddone(err);
    });
  });
  before(function(bddone) {
    var fileName = path.join(__dirname, "/data/calendarData.wiki");
    mockdate.set("2015-11-05");

    nock("https://wiki.openstreetmap.org")
     .get("/w/api.php?action=query&titles=Template:Calendar&prop=revisions&rvprop=content&format=json")
     .times(3)
     .replyWithFile(200, fileName);
    return bddone();
  });
  after(function(bddone) {
    mockdate.reset();
    return bddone();
  });
  afterEach(function(bddone) {
    testutil.stopServer(bddone);
  });
  it.skip("should open new tool", function(bddone) {
    async.series([
      function setLanguage (cb) {
        browser.visit("/osmbc.html", cb);
      },
      function setLanguage (cb) {
        browser.visit("/language?lang=EN", cb);
      },
      function visitCalendar (cb) {
        browser.visit("/tool/calendarAllLang", cb);
      }
    ], function(err) {
      should.not.exist(err);
      browser.assert.expectHtml.call(browser, "calendarAllMarkdown.html", bddone);
    });
  });
  it("should use picture tool", function(bddone) {
    var fileName = path.join(__dirname, "/data/picture.jpg");
    nock("https://blog.openstreetmap.org")
      .get("/picture.jpg")
      .times(2)
      .replyWithFile(200, fileName);

    async.series([
      function visitCalendar (cb) {
        browser.visit("/tool/picturetool", cb);
      },
      function fillValues(cb) {
        browser
          .select("pictureLanguage", "EN")
          .fill("pictureAText", "AltText")
          .fill("pictureURL", "https://blog.openstreetmap.org/picture.jpg")
          .fill("pictureMarkup", "test")
          .select("pictureLicense", "CC3")
          .fill("pictureAuthor", "test")
          .pressButton("OK", cb);
      }
    ], function(err) {
      should.not.exist(err);
      should(browser.evaluate("document.getElementById('markdown').value")).eql("![AltText](https://blog.openstreetmap.org/picture.jpg =800x800)\ntest | Picture by test under [CC-BY-SA 3.0](https://creativecommons.org/licenses/by/3.0/)");
      bddone();
    });
  });
});

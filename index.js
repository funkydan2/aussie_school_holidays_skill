"use strict";
module.change_code = 1;
var _ = require("lodash");
var express = require("express");
var alexa = require("alexa-app");
var moment = require("moment");
require("moment-timezone");
var AmazonDateParser = require("amazon-date-parser");

var app = express();

// Setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app("");

//My Helper Objects
var QLDHelper = require("./qld_ical_helper");
var NSWHelper = require("./nsw_ical_helper");
var DBHelper = require("./userdb_helper.js");

const PORT = process.env.PORT || 3000;

// POST calls to / in express will be handled by the app.request() function
alexaApp.express({
  expressApp: app,
  checkCert: true,
  // sets up a GET route when set to true. This is handy for testing in
  // development, but not recommended for production.
  debug: true
});

app.set("view engine", "ejs");

alexaApp.launch(function(req, res) {
  var prompt = "Welcome to the Aussie School Holidays Skill. ";
  prompt += 'You can say something like, "is today a school day?" or, ';
  prompt += '"how long until the holidays?"';

  var firstTimePrompt = "Welcome to the Aussie School Holidays Skill. ";
  firstTimePrompt += "To get started I need to know which state you are in. ";
  firstTimePrompt += "Please say, 'set state'.";

  var firstTimeRePrompt = "To setup this skill, please say, 'set state'.";

  let db = new DBHelper();

  if (db.userExists) {
    res
      .say(prompt)
      .reprompt(prompt)
      .shouldEndSession(false);
  }
  else {
    res
      .say(firstTimePrompt)
      .reprompt(firstTimeRePrompt)
      .shouldEndSession(false);
  }
});

/*
Need a 'set state' intent.
It'll be a 'dialog' function where Alexa asks the user for a state slot
and then saves it to the database
https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html#dialog-reqs
https://github.com/alexa-js/alexa-app#dialog
*/

/*
Need a 'change state' intent.
It'll be a 'dialog' intent where Alexa asks for a new start
and then saves it to the database
*/

alexaApp.intent(
  "HolidayCheck",
  {
    slots: {
      DATE: "AMAZON.DATE"
    },
    utterances: ["{is} {-|DATE} {a} {holiday|school day}"]
  },
  function(req, res) {
    //get the slot
    var prompt, reprompt;

    /*
    First - check if user is in the database.
    If they aren't, ask them to call the 'set state' intent
    */


    var today = moment().tz("Australia/Brisbane");

    if (_.isUndefined(req.slot("DATE")) || _.isEmpty(req.slot("DATE"))) {
      prompt = "To find out about holidays you need to tell me a date. ";
      prompt +=
        'Say something like is <emphasis level="strong">tomorrow</emphasis> a school day?';
      reprompt = "Please ask me about Queensland school holidays.";
      res
        .say(prompt)
        .reprompt(reprompt)
        .shouldEndSession(false)
        .send();
      return;
    }

    var aDate = new AmazonDateParser(req.slot("DATE"));
    var date = moment(aDate.startDate).tz("Australia/Brisbane");

    var calCheck = new QLDHelper();

    return calCheck
      .isHoliday(date)
      .then(function(holiday) {
        if (moment(today).isSame(date, "day")) {
          if (holiday) {
            prompt = "Good news, you're on holidays. Get out and play!";
          } else {
            prompt = "It's on! Time to pack your bag. You have to go to school";
          }
        } else {
          if (holiday) {
            prompt =
              "Good news, " +
              moment(date).format("dddd, MMMM Do YYYY") +
              " is not a school day.";
          } else {
            prompt =
              "I'm sorry to say, " +
              moment(date).format("dddd, MMMM Do YYYY") +
              " is a school day.";
          }
        }
        res.say(prompt).shouldEndSession(true);
      })
      .catch(function(err) {
        console.log(err.statusCode);
        prompt = "An error occured. Please try again.";
        reprompt = "Please ask me about school holidays.";
        res
          .say(prompt)
          .reprompt(reprompt)
          .shouldEndSession(false)
          .send();
      });
  }
);

alexaApp.intent(
  "HowLong",
  {
    utterances: ["{How long until|When are} {the} {|next} {holiday|holidays}"]
  },
  function(req, res) {
    var prompt;
    var today = moment().tz("Australia/Brisbane");

    var calCheck = new QLDHelper();

    return calCheck.nextHoliday(today).then(function(days) {
      if (days < 0) {
        prompt = "Hmm, aren't you on holidays now?";
      } else if (days > 14) {
        prompt =
          "There are " + Math.floor(days / 7) + " weeks until the holidays.";
      } else if (days > 7) {
        prompt =
          "There are only " +
          days +
          " days until the holidays. You're going to make it!";
      } else {
        prompt =
          "Almost there. Only " +
          days +
          " until the holidays. I can almost taste the freedom!";
      }

      res.say(prompt).shouldEndSession(true);
    });
  }
);

alexaApp.intent(
  "AMAZON.HelpIntent",
  {
    slots: {},
    utterances: {}
  },
  function(req, res) {
    var prompt = "This is the Aussie School Holidays Skill. ";
    prompt += "To change the state say 'change state'. ";
    prompt += 'You can ask "is today a school day?" or, ';
    prompt += '"how long until the holidays?"';

    var reprompt = "What would you like to do?";

    res
      .say(prompt)
      .reprompt(reprompt)
      .shouldEndSession(false);
  }
);

alexaApp.intent(
  "AMAZON.StopIntent",
  {
    slots: {},
    utterances: []
  },
  function(req, res) {
    var stopOutput =
      "Good bye. Thanks for using Queensland School Holidays on Alexa.";
    res.say(stopOutput);
  }
);

alexaApp.intent(
  "AMAZON.CancelIntent",
  {
    slots: {},
    utterances: []
  },
  function(req, res) {
    var cancelOutput = "No problem. Request cancelled.";
    res.say(cancelOutput);
  }
);

module.exports = alexaApp;
app.listen(PORT, () => console.log("Listening on port " + PORT + "."));

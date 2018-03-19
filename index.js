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

const errPrompt =
  "<say-as interpret-as='interjection'>bummer</say-as>, An error occured. Please try again.";
const errRePrompt = "Please ask me about school holidays.";

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
  var prompt = "<say-as interpret-as='interjection'>g'day</say-as>. ";
  prompt += "Welcome to the Aussie School Holidays Skill. ";
  prompt += 'You can say something like, "is today a school day?" or, ';
  prompt += '"how long until the holidays?"';

  var firstTimePrompt = "<say-as interpret-as='interjection'>g'day</say-as>. ";
  firstTimePrompt += "Welcome to the Aussie School Holidays Skill. ";
  firstTimePrompt += "To get started I need to know which state you are in. ";
  firstTimePrompt += "Please say, 'set state'.";

  var firstTimeRePrompt = "To setup this skill, please say, 'set state'.";

  let db = new DBHelper();

  return db.getState(req.userId).then(function(state) {
    if (state) {
      res
        .say(prompt)
        .reprompt(prompt)
        .shouldEndSession(false)
        .send();
    } else {
      res
        .say(firstTimePrompt)
        .reprompt(firstTimeRePrompt)
        .shouldEndSession(false)
        .send();
    }
  });
});

/*
Need a 'set/change state' intent.
It'll be a 'dialog' function where Alexa asks the user for a state slot
and then saves it to the database
https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html#dialog-reqs
https://github.com/alexa-js/alexa-app#dialog
*/

alexaApp.intent(
  "SetState",
  {
    dialog: { type: "delegate" },
    utterances: ["{set|change} {state|location}"]
  },
  function(req, res) {
    if (req.getDialog().isStarted() || req.getDialog().isInProgress()) {
      req.getDialog().handleDialogDelegation();
    } else if (req.getDialog().isCompleted()) {
      let db = new DBHelper();
      let stateID;
      let prompt;
      switch (req.slot("STATE").toLowerCase()) {
        case "queensland":
          stateID = "QLD";
          break;
        case "new south wales":
          stateID = "NSW";
          break;
        case "victoria":
          stateID = "VIC";
          break;
        case "australian capital territoy":
          stateID = "ACT";
          break;
        case "south australia":
          stateID = "SA";
          break;
        case "northern territory":
          stateID = "NT";
          break;
        case "western australia":
          stateID = "WA";
          break;
      }

      if (stateID == "QLD") {
        return db
          .setState(req.userId, stateID)
          .then(function() {
            prompt = "Your state is now " + req.slot("STATE") + ". ";
            prompt =
              "That's <say-as interpret-as='interjection'>awesome</say-as>! ";
            prompt += "You can now ask me about holidays for your state.";
            res
              .say(prompt)
              .reprompt("Ask me about holidays.")
              .shouldEndSession(false)
              .send();
          })
          .catch(function(err) {
            console.log(err.statusCode);
            res
              .say(errPrompt)
              .reprompt(errRePrompt)
              .shouldEndSession(false)
              .send();
          });
      } else if (stateID == "NSW") {
        prompt = "For New South Wales users, we also need to set the region. ";
        prompt +=
          "Please say, 'set region to eastern' or 'set region to western'";
        res
          .say(prompt)
          .reprompt("Please set your region.")
          .shouldEndSession(false)
          .send();
      } else {
        prompt = "<say-as interpret-as='interjection'>bummer</say-as>. ";
        prompt += "Currently I only know about holidays ";
        prompt += " in Queensland and New South Wales. ";
        prompt += "But I'm learning more every day!";
        res
          .say(prompt)
          .shouldEndSession(true)
          .send();
      }
    }
  }
);

alexaApp.intent(
  "SetRegion",
  {
    dialog: { type: "delegate" },
    utterances: ["{set} {region}"]
  },
  function(req, res) {
    if (req.getDialog().isStarted() || req.getDialog().isInProgress()) {
      req.getDialog().handleDialogDelegation();
    } else if (req.getDialog().isCompleted()) {
      let db = new DBHelper();
      let stateRegion = "NSW-" + req.slot("REGION");

      console.log(stateRegion);
      return db
        .setState(req.userId, stateRegion)
        .then(function() {
          let prompt = "Your location has been stored. ";
          prompt += "Your state is set to New South Wales ";
          prompt += "and your region is set to " + req.slot("REGION") + ". ";
          prompt += "Now, ask me about holidays for your location.";
          console.log(prompt);
          res
            .say(prompt)
            .reprompt("Ask me about holidays.")
            .shouldEndSession(false)
            .send();
        })
        .catch(function(err) {
          console.log(err.statusCode);
          res
            .say(errPrompt)
            .reprompt(errRePrompt)
            .shouldEndSession(false)
            .send();
        });
    }
  }
);

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
    let prompt, reprompt;
    let db = new DBHelper();

    //Check whether the DATE slot was passed in.
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

    return db
      .getState(req.userId)
      .then(function(state) {
        if (_.isUndefined(state)) {
          prompt = `It looks like this is the first time you've used this skill.
                  To get started, you need to let me know which state you're in.
                  Say 'Set State' to get started.`;
          reprompt = "Say 'Set State' to get started.";
          res
            .say(prompt)
            .reprompt(reprompt)
            .shouldEndSession(false)
            .send();
          return;
        } else {
          let today, aDate, date, calCheck;
          if (state == "QLD") {
            moment.tz.setDefault("Australia/Brisbane");
            today = moment().tz("Australia/Brisbane");

            aDate = new AmazonDateParser(req.slot("DATE"));
            date = moment(aDate.startDate).tz("Australia/Brisbane");

            calCheck = new QLDHelper();
          } else if (state.search("NSW") == 0) {
            moment.tz.setDefault("Australia/Sydney");
            today = moment().tz("Australia/Sydney");

            aDate = new AmazonDateParser(req.slot("DATE"));
            date = moment(aDate.startDate).tz("Australia/Sydney");
            if (state.search("east") >= 3) {
              calCheck = new NSWHelper("eastern");
            } else if (state.search("west") >= 3) {
              calCheck = new NSWHelper("western");
            }
          }

          return calCheck.isHoliday(date).then(function(holiday) {
            if (moment(today).isSame(date, "day")) {
              if (holiday) {
                prompt = "Good news, you're on holidays. Get out and play!";
              } else {
                prompt =
                  "It's on! Time to pack your bag. You have to go to school";
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
          });
        }
      })
      .catch(function(err) {
        console.log(err.statusCode);
        res
          .say(errPrompt)
          .reprompt(errRePrompt)
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
    var prompt, reprompt;
    var today, calCheck;

    let db = new DBHelper();

    return db
      .getState(req.userId)
      .then(function(state) {
        if (_.isUndefined(state)) {
          prompt = `It looks like this is the first time you've used this skill.
                  To get started, you need to let me know which state you're in.
                  Say 'Set State' to get started.`;
          reprompt = "Say 'Set State' to get started.";
          res
            .say(prompt)
            .reprompt(reprompt)
            .shouldEndSession(false)
            .send();
          return;
        } else {
          let today, calCheck;
          if (state == "QLD") {
            moment.tz.setDefault("Australia/Brisbane");
            today = moment().tz("Australia/Brisbane");
            calCheck = new QLDHelper();
          } else if (state.search("NSW") == 0) {
            moment.tz.setDefault("Australia/Sydney");
            today = moment().tz("Australia/Sydney");

            if (state.search("east") >= 3) {
              calCheck = new NSWHelper("eastern");
            } else if (state.search("west") >= 3) {
              calCheck = new NSWHelper("western");
            }
          }

          return calCheck.nextHoliday(today).then(function(days) {
            if (days.schoolDays < 0) {
              prompt = "Hmm, aren't you on holidays now?";
            } else if (days.totalDays > 14) {
              prompt =
                "There are " +
                Math.floor(days / 7) +
                " weeks until the holidays.";
            } else if (days.totalDays > 7) {
              prompt =
                "There are only " +
                days.schoolDays +
                " days until the holidays. You're going to make it!";
            } else {
              prompt =
                "Almost there. Only " +
                days.schoolDays +
                " until the holidays. I can almost taste the freedom!";
            }
            res.say(prompt).shouldEndSession(true);
          });
        }
      })
      .catch(function(err) {
        console.log("HowLong error ", err.statusCode);
        res
          .say(errPrompt)
          .reprompt(errRePrompt)
          .shouldEndSession(false)
          .send();
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
      "Good bye. Thanks for using Aussie School Holidays on Alexa.";
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

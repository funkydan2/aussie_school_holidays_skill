'use strict';
module.change_code = 1;
var _ = require('lodash');
var express = require('express');
var alexa = require('alexa-app');
var moment = require('moment');

var app = express();

// Setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app('');
var AmazonDateParser = require('amazon-date-parser');

//My Helper Objects
var QSHHelper = require('./qsh_ical_helper');

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
    var prompt = 'Welcome to the Queensland School Holidays Skill. ';
    prompt += 'You can say something like <emphasis level="moderate">is today a school day?</emphasis> or ';
    prompt += '<emphasis level="moderate">how long until the holidays?</emphasis>';
    res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

alexaApp.intent('HolidayCheck', {
        'slots': {
            'DATE': 'AMAZON.DATE'
        },
        'utterances': ['{is} {-|DATE} {a} {holiday|school day}']
    },
    function(req, res) {
      //get the slot
      var prompt;
      var today = new Date();

      var aDate = new AmazonDateParser(req.slot('DATE'));
  
      var date = aDate.startDate;
 
      var calCheck = new QSHHelper();
  
      return calCheck.isHoliday(date).then(function(holiday){

        if (moment(date).isSame(today, 'day')){
          if (holiday) {
            prompt = "Good news, you're on holidays. Get out and play!";
          }
          else {
            prompt = "It's on! Time to pack your bag. You have to go to school"
          }
        }
        else {
          if (holiday) {
            prompt = "Good news, " + date.toDateString() + " is a holiday.";
          }
          else {
            prompt = "I'm sorry to say. " + date.toDateString() + " is a school day.";
          }
        }
        res.say(prompt).shouldEndSession(true);
      }).catch(function(err) {
            console.log(err.statusCode);
            prompt = 'An error occured. Please try again.';
            var reprompt = "Please ask about school holidays.";
            res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
      });
});

alexaApp.intent('HowLong', {
        'utterances': ['{How long until|When are} {the} {|next} {holiday|holidays}']
    },
    function(req, res) {
      
      var prompt;
      var today = new Date();
  
      var calCheck = new QSHHelper();
      
      return calCheck.nextHoliday(today).then(function(days){
        
        if (days < 0) {
          prompt = "Hmm, aren't you on holidays now?";
        }
        else if (days > 14) {
          prompt = "There are " + Math.floor(days/7) + " weeks until the holidays.";
        }
        else if (days > 7) {
          prompt = "There are only " + days + " days until the holidays. You're going to make it!";
        }
        else {
          prompt = "Almost there. Only " + days + " until the holidays. I can almost taste the freedom!";
        }
        
        res.say(prompt).shouldEndSession(true);
      });
});



alexaApp.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
}, function(req, res) {
    var stopOutput = "Good bye. Thanks for using Queensland School Holidays on Alexa.";
    res.say(stopOutput);
});

alexaApp.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
}, function(req, res) {
    var cancelOutput = "No problem. Request cancelled.";
    res.say(cancelOutput);
});


module.exports = alexaApp;
app.listen(PORT, () => console.log("Listening on port " + PORT + "."));
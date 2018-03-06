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
        'utterances': ['{is} {DATE} a holiday?']
    },
    function(req, res) {
        //get the slot
        var date = new AmazonDateParser(req.slot('DATE'));
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
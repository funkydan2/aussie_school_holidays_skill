/*
This module uses data provided by the QLD Government's Department of Education publicly
available school calendar, parses it, and returns values depending on the function called.

Data is sourced from - http://education.qld.gov.au/public_media/calendar/holidays.html
and the code is inspired by https://github.com/semaja2/moment-holiday-australia

*/

'use strict';

var _ = require('lodash');
var ical = require('ical');
var moment = require('moment');

const HolCal = 'http://www.google.com/calendar/ical/msb2hrag08it6vobioc2ihgd94%40group.calendar.google.com/public/basic.ics';
const EdCal = 'http://education.qld.gov.au/qld-school-holidays.ics';

function getCalendar(ICS) {
  return new Promise(function(resolve, reject) {
    ical.fromURL(ICS, {}, (err, calendar) => {
      if (err) {
        console.error('Calendar parsing error', err);
        reject(err);
      }

      //      console.log("Calendar parsed!");
      resolve(calendar);
    });
  });
}

function getPrePostEvents(cal, date) {
  /* Returns an object
   * "Pre" is the event preceding DATE
   * (or the event which begins on DATE)
   * "Post" is the next event after DATE.
   */
  var preEvent, postEvent;

  for (var key in cal) {
    //Only do the work if looking at the 'outside' of an object.
    //Need to look at better ways
    if (cal.hasOwnProperty(key)) {
      var e = cal[key];

      if (moment(e.start).isSameOrBefore(date, 'day')) {
        if (_.isUndefined(preEvent)) {
          preEvent = e;
        } else if (e.start > preEvent.start) {
          preEvent = e;
        }
      }

      if (moment(e.start).isAfter(date)) {
        if (_.isUndefined(postEvent)) {
          postEvent = e;
        } else if (moment(e.start).isBefore(postEvent.start)) {
          postEvent = e;
        }
      }
    }
  }
  return {
    "pre": preEvent,
    "post": postEvent
  };
}

function getTermBoundaries(date) {
  return new Promise(function(resolve,reject){
    var preBoundary, postBoundary;

    getCalendar(EdCal).then(function(calendar) {

      for (var key in calendar) {
        if (calendar.hasOwnProperty(key)) {
          var e = calendar[key];
          var termRE = RegExp('^term', 'i');
          if (termRE.test(e.summary.val)) {
            if (moment(e.start).isSameOrBefore(date, 'day')) {
              if (_.isUndefined(preBoundary) || moment(preBoundary.start).isBefore(e.start), 'day'){
                preBoundary = e;
              }
            }
            if (moment(e.start).isSameOrAfter(date, 'day')) {
              if (_.isUndefined(postBoundary) || moment(postBoundary.start).isAfter(e.start, 'day')) {
                postBoundary = e;
              }
            }
          }
        }
      }

      if (_.isUndefined(preBoundary) || _.isUndefined(postBoundary)) {
        reject( new Error('undefined'));
        return;
      }
      else {
        resolve( {'pre': preBoundary,
                  'post': postBoundary});
        return;
      }
    }).catch(function(error) {
      console.log("Failed: ", error);
      reject(error);
      return;
    });
  });
}

function QSH_iCal_Helper() {}

QSH_iCal_Helper.prototype.isHoliday = function(date) {
  //Returns Promise of a boolean.
  //Resolves 'true' if date is a holiday.
  var termRE = new RegExp('term','i');
  var studentFreeRE = new RegExp('student free', 'i');
  var termStartRE = new RegExp('(starts|begins)', 'i');
  var termEndRE = new RegExp('(ends|finishes)', 'i');


    //Easy one first. If it's a weekend, return true!
    var weekend = (date.getDay() == 0 || date.getDay() == 6);

    //Next, if date is a public holiday, return true!
    var publicHol = getCalendar(HolCal).then(function(cal) {

      var events = getPrePostEvents(cal, date);

      var event = events.pre;
      if (moment(event.start).isSame(date, 'day')) {
        console.log("It's ", event.summary, "!");
        return true;
      }
      else {return false;}
    });

    //Now check for Student Free Days
    var studentFree = getCalendar(EdCal).then(function(cal){
      return getPrePostEvents(cal,date);
    }).then(function(events) {

      var preEvent = events.pre;
      var postEvent = events.post;

      var preTitle = preEvent.summary.val;
      var postTitle = postEvent.summary.val;

      if (moment(preEvent.start).isSame(date, 'day')) {
        console.log(preTitle);
        if (studentFreeRE.test(preTitle)) {
          //date is a Student Free Day
          return true;
        }
        if (termRE.test(preTitle)) {
          //The given day is labelled as either first or last of term
          console.log(date, " is first or last day of term.");
          return false;
        }
      }
      else {return false;}
    });

    var termTime = getTermBoundaries(date).then(function(b){
      //Now check whether DATE is inside or outside of term boundaries
      var preTitle = b.pre.summary.val;
      var postTitle = b.post.summary.val;
      if (termStartRE.test(preTitle) && termEndRE.test(postTitle)){
        //It's term time.
        return false;
      }
      else if (termEndRE.test(preTitle) && termStartRE.test(postTitle)){
        //Holiday time!
        return true;
      }
      else {return false;}
    });

  return new Promise (function(resolve,reject){
    Promise.all([weekend, publicHol, studentFree, termTime])
      .then(function(values){
        if (values[0]) {resolve (true);}
        else if (values[1]) {resolve (true);}
        else if (values[2]) {resolve (true);}
        else if (values[3]) {resolve (true);}
        else{resolve (false);}
        return;
    }).catch(function(error) {
      console.log("Failed: ", error);
      reject(error);
      return;
    });
  });
};

QSH_iCal_Helper.prototype.nextHoliday = function(date) {
  //Returns the promise of a real number
  //Number is the time (in decimal weeks) until the next holidays
  //If date is during a holiday, it will still give the *next*
  return new Promise (function(resolve,reject){

    getTermBoundaries(date).then(function(bounds){
      var nextHoliday;
      var preTitle = bounds.pre.summary.val;
      var postTitle = bounds.post.summary.val;
      var termEndsRE = new RegExp('(end|finish)', 'i');

      if (termEndsRE.test(preTitle)){
        resolve(-1); //It's holidays now!
        return;
      }
      else if (termEndsRE.test(postTitle)){
        nextHoliday = bounds.post.start;
      }

      nextHoliday = moment(nextHoliday).add(1, 'days');
      var weeks = moment(nextHoliday).diff(date, 'weeks');
      resolve(weeks);
      return;
    }).catch(function(error) {
      console.log("Failed: ", error);
      reject(error);
      return;
    });

  });
};

module.exports = QSH_iCal_Helper;

/*
This module uses data provided by the NSW Government's Department of Education publicly
available school calendar, parses it, and returns values depending on the function called.

Data is sourced from - https://education.nsw.gov.au/public-schools/going-to-a-public-school/calendars
under a Creative Commons By 4.0 license.
*/
"use strict";

var _ = require("lodash");
var moment = require("moment");

var cached_calendar = require("./cached_calendar_helper.js");

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

      if (moment(e.start).isSameOrBefore(date, "day")) {
        if (_.isUndefined(preEvent)) {
          preEvent = e;
        } else if (moment(e.start).isAfter(preEvent.start)) {
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
    pre: preEvent,
    post: postEvent
  };
}

function getTermEnd(schoolCalendar, region, date) {
  let termRE;
  let termEnd;

  if (region == "eastern") {
    termRE = new RegExp("term.+east", "i");
  } else if (region == "western") {
    termRE = new RegExp("term.+west", "i");
  }

  for (var key in schoolCalendar) {
    if (schoolCalendar.hasOwnProperty(key)) {
      var e = schoolCalendar[key];
      if (termRE.test(e.summary)) {
        if (moment(e.end).isSameOrAfter(date, "day")) {
          if (_.isUndefined(termEnd)) {
            termEnd = e.end;
          } else if (moment(e.end).isBefore(termEnd)) {
            termEnd = e.end;
          }
        }
      }
    }
  }
  return termEnd;
}

function getToday(schoolCalendar, date) {
  var dateEvents = [];
  //This function returns an array with all the events on date.
  for (var key in schoolCalendar) {
    if (schoolCalendar.hasOwnProperty(key)) {
      let e = schoolCalendar[key];

      if (moment(date).isBetween(e.start, e.end)) {
        dateEvents.push(e.summary);
      }
    }
  }
  return dateEvents;
}

function holidayChecker(holidayCalendar, schoolCalendar, region, date) {
  let events, preEvent;
  let today, termRE, holRE;

  if (region == "eastern") {
    termRE = new RegExp("term.+students.+east", "i");
    holRE = new RegExp("holiday.+east", "i");
  } else if (region == "western") {
    termRE = new RegExp("term.+students.+west", "i");
    holRE = new RegExp("holiday.+west", "i");
  }

  //Check for weekend
  if (moment(date).day() == 0 || moment(date).day() == 6) {
    return true;
  }
  //Check for public holidays
  events = getPrePostEvents(holidayCalendar, date);
  preEvent = events.pre;
  if (moment(preEvent.start).isSame(date, "day")) {
    console.log("It's ", preEvent.summary, "!");
    return true;
  }

  //Check school calendar - what kind of day is it?
  events = getToday(schoolCalendar, date);
  for (var i = 0; i < events.length; i++) {
    if (holRE.test(events[i])) {
      return true;
    } else if (termRE.test(events[i])) {
      return false;
    }
  }
  return false;
}

function NSW_iCal_Helper(region) {
  this.region = region;
}

NSW_iCal_Helper.prototype.isHoliday = function(date) {
  //Returns Promise of a boolean.
  //Resolves 'true' if date is a holiday.

  let holidayCal = new cached_calendar("NSW", "public");
  let schoolCal = new cached_calendar("NSW", "school");
  let region = this.region;

  return new Promise(function(resolve, reject) {
    Promise.all([holidayCal.getCalendar(), schoolCal.getCalendar()])
      .then(function(calendars) {
        resolve(holidayChecker(calendars[0], calendars[1], region, date));
      })
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
        return;
      });
  });
};

NSW_iCal_Helper.prototype.nextHoliday = function(date) {
  //Returns the promise of a real number
  //Number is the time (in decimal weeks) until the next holidays
  //If date is during a holiday, it will still give the *next*
  let r = this.region;
  let howLong = { totalDays: 0, schoolDays: 0 };

  let holidayCal = new cached_calendar("NSW", "public");
  let schoolCal = new cached_calendar("NSW", "school");

  return new Promise(function(resolve, reject) {
    Promise.all([holidayCal.getCalendar(), schoolCal.getCalendar()])
      .then(function(calendars) {
        let termEnd = getTermEnd(calendars[1], r, date);
        howLong.totalDays = moment(termEnd).diff(date, "days") + 1;

        let d = date;
        while (moment(d).isSameOrBefore(termEnd)) {
          if (!holidayChecker(calendars[0], calendars[1], r, d)) {
            howLong.schoolDays++;
          }
          d = moment(d).add(1, "days");
        }

        resolve(howLong);
      })
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
      });
  });
};

module.exports = NSW_iCal_Helper;

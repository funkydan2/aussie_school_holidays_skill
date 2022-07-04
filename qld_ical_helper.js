/*
This module uses data provided by the QLD Government's Department of Education publicly
available school calendar, parses it, and returns values depending on the function called.

Data is sourced from - http://education.qld.gov.au/public_media/calendar/holidays.html
and the code is inspired by https://github.com/semaja2/moment-holiday-australia

*/

"use strict";

var _ = require("lodash");
var moment = require("moment-timezone");
moment.tz.setDefault("Australia/Brisbane");

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
    post: postEvent,
  };
}

function getTermEnd(schoolCalendar, date) {
  let holidayRE;
  let termEnd;
  holidayRE = new RegExp("holidays", "i");

  for (var key in schoolCalendar) {
    if (schoolCalendar.hasOwnProperty(key)) {
      var e = schoolCalendar[key];

      if (holidayRE.test(JSON.stringify(e.summary))) {
        if (moment(e.end).isSameOrAfter(date, "day")) {
          if (_.isUndefined(termEnd)) {
            termEnd = e.start;
          } else if (moment(e.start).isBefore(termEnd)) {
            termEnd = e.start;
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
        dateEvents.push(e.summary.val);
      }
    }
  }
  return dateEvents;
}

function holidayChecker(holidayCalendar, schoolCalendar, date) {
  const studentFreeRE = new RegExp("student free", "i");
  const holRE = new RegExp("holidays", "i");

  let events, preEvent, postEvent;
  let preTitle, postTitle;

  let cc = new cached_calendar();

  //Check if it's a weekend.
  if (moment(date).day() == 0 || moment(date).day() == 6) {
    return true;
  }

  //Check if it's a public holidays
  events = getPrePostEvents(holidayCalendar, date);

  preEvent = events.pre;
  if (moment(preEvent.start).isSame(date, "day")) {
    console.log("It's ", preEvent.summary, "!");
    return true;
  }

  //Check school calendar - what kind of day is it?
  events = getToday(schoolCalendar, date);
  for (var i = 0; i < events.length; i++) {
    if (holRE.test(events[i]) || studentFreeRE.test(events[i])) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}

function QSH_iCal_Helper() {}

QSH_iCal_Helper.prototype.isHoliday = function (date) {
  //Returns Promise of a boolean.
  //Resolves 'true' if date is a holiday.

  let holidayCal = new cached_calendar("QLD", "public");
  let schoolCal = new cached_calendar("QLD", "school");

  return new Promise(function (resolve, reject) {
    Promise.all([holidayCal.getCalendar(), schoolCal.getCalendar()])
      .then(function (values) {
        resolve(holidayChecker(values[0], values[1], date));
      })
      .catch(function (error) {
        console.log("Failed: ", error);
        reject(error);
        return;
      });
  });
};

QSH_iCal_Helper.prototype.nextHoliday = function (date) {
  //Returns the promise of a real number
  //Number is the time (in decimal weeks) until the next holidays
  //If date is during a holiday, it will still give the *next*
  let howLong = { totalDays: 0, schoolDays: 0 };
  let holidayCal = new cached_calendar("QLD", "public");
  let schoolCal = new cached_calendar("QLD", "school");

  return new Promise(function (resolve, reject) {
    Promise.all([holidayCal.getCalendar(), schoolCal.getCalendar()])
      .then(function (values) {
        let holidayCal = values[0];
        let schoolCal = values[1];
        let termEnd = getTermEnd(schoolCal, date);

        let nextHoliday;

        nextHoliday = moment(termEnd).add(1, "days");
        howLong.totalDays = moment(nextHoliday).diff(date, "days") + 1;

        //Calculate the number of School Days
        let d = date;
        while (moment(d).isSameOrBefore(nextHoliday)) {
          if (!holidayChecker(holidayCal, schoolCal, d)) {
            howLong.schoolDays++;
          }

          d = moment(d).add(1, "days");
        }

        resolve(howLong);
        return;
      })
      .catch(function (error) {
        console.log("Failed: ", error);
        reject(error);
        return;
      });
  });
};

module.exports = QSH_iCal_Helper;

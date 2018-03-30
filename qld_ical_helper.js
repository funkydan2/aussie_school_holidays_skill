/*
This module uses data provided by the QLD Government's Department of Education publicly
available school calendar, parses it, and returns values depending on the function called.

Data is sourced from - http://education.qld.gov.au/public_media/calendar/holidays.html
and the code is inspired by https://github.com/semaja2/moment-holiday-australia

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

function getTermBoundaries(schoolCalendar, date) {
  let bounds = {};
  let preBoundary, postBoundary;

  for (let key in schoolCalendar) {
    if (schoolCalendar.hasOwnProperty(key)) {
      let e = schoolCalendar[key];
      const termRE = RegExp("^term", "i");
      if (termRE.test(e.summary.val)) {
        if (moment(e.start).isSameOrBefore(date, "day")) {
          if (
            (_.isUndefined(preBoundary) ||
              moment(preBoundary.start).isBefore(e.start),
            "day")
          ) {
            preBoundary = e;
          }
        }
        if (moment(e.start).isSameOrAfter(date, "day")) {
          if (
            _.isUndefined(postBoundary) ||
            moment(postBoundary.start).isAfter(e.start, "day")
          ) {
            postBoundary = e;
          }
        }
      }
    }
  }

  bounds = {
    pre: preBoundary,
    post: postBoundary
  };
  return bounds;
}

function holidayChecker(holidayCalendar, schoolCalendar, date) {
  const termRE = new RegExp("term", "i");
  const studentFreeRE = new RegExp("student free", "i");
  const termStartRE = new RegExp("(starts|begins)", "i");
  const termEndRE = new RegExp("(ends|finishes)", "i");

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

  //Check if it's a pupil free days
  events = getPrePostEvents(schoolCalendar, date);

  preEvent = events.pre;
  postEvent = events.post;

  preTitle = preEvent.summary.val;
  postTitle = postEvent.summary.val;

  if (moment(preEvent.start).isSame(date, "day")) {
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

  //Check if it's outside of term time
  let b = getTermBoundaries(schoolCalendar, date);
  //Now check whether DATE is inside or outside of term boundaries
  preTitle = b.pre.summary.val;
  postTitle = b.post.summary.val;
  if (termStartRE.test(preTitle) && termEndRE.test(postTitle)) {
    //It's term time.
    return false;
  } else if (termEndRE.test(preTitle) && termStartRE.test(postTitle)) {
    //Holiday time!
    return true;
  } else {
    return false;
  }
}

function QSH_iCal_Helper() {}

QSH_iCal_Helper.prototype.isHoliday = function(date) {
  //Returns Promise of a boolean.
  //Resolves 'true' if date is a holiday.

  let holidayCal = new cached_calendar("QLD", "public");
  let schoolCal = new cached_calendar("QLD", "school");

  return new Promise(function(resolve, reject) {
    Promise.all([holidayCal.getCalendar(), schoolCal.getCalendar()])
      .then(function(values) {
        resolve(holidayChecker(values[0], values[1], date));
      })
      .catch(function(error) {
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
  let howLong = { totalDays: 0, schoolDays: 0 };
  let holidayCal = new cached_calendar("QLD", "public");
  let schoolCal = new cached_calendar("QLD", "school");

  return new Promise(function(resolve, reject) {
    Promise.all([holidayCal.getCalendar(), schoolCal.getCalendar()])
      .then(function(values) {
        let holidayCal = values[0];
        let schoolCal = values[1];
        let bounds = getTermBoundaries(schoolCal, date);

        let nextHoliday;
        let preTitle = bounds.pre.summary.val;
        let postTitle = bounds.post.summary.val;
        let termEndsRE = new RegExp("(end|finish)", "i");

        if (termEndsRE.test(preTitle)) {
          howLong = {
            totalDays: -1,
            schoolDays: -1
          };
          resolve(howLong); //It's holidays now!
          return;
        } else if (termEndsRE.test(postTitle)) {
          nextHoliday = bounds.post.start;
        }

        nextHoliday = moment(nextHoliday).add(1, "days");
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
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
        return;
      });
  });
};

module.exports = QSH_iCal_Helper;

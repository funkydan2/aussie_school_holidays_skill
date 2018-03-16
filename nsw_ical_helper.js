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

function getNextHoliday(region, date) {
  return new Promise(function(resolve, reject) {
    let holRE;
    let nextHoliday;

    if (region == "eastern") {
      holRE = new RegExp("holiday.+east", "i");
    }else if (region == "western"){
      holRE = new RegExp("holiday.+west", "i");
    }

    var cc = new cached_calendar();

    cc
      .getCalendar("NSW", "school")
      .then(function(calendar) {
        for (var key in calendar) {
          if (calendar.hasOwnProperty(key)) {
            var e = calendar[key];
            if (holRE.test(e.summary)) {
              if (moment(e.start).isSameOrAfter(date, "day")) {
                if (_.isUndefined(nextHoliday)) {
                  nextHoliday = e.start;
                } else if (moment(e.start).isBefore(nextHoliday)) {
                  nextHoliday = e.start;
                }
              }
            }
          }
        }
        resolve(nextHoliday);
      })
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
        return;
      });
  });
}

function getToday(date) {
  return new Promise(function(resolve, reject) {
    var dateEvents = [];
    //This function returns an array with all the events on date.
    let cc = new cached_calendar();

    cc
      .getCalendar("NSW", "school")
      .then(function(calendar) {
        for (var key in calendar) {
          if (calendar.hasOwnProperty(key)) {
            let e = calendar[key];

            if (moment(date).isBetween(e.start, e.end)) {
              dateEvents.push(e.summary);
            }
          }
        }
        resolve(dateEvents);
      })
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
        return;
      });
  });
}

function NSW_iCal_Helper(region) {
  this.region = region;
}

NSW_iCal_Helper.prototype.isHoliday = function(date) {
  //Returns Promise of a boolean.
  //Resolves 'true' if date is a holiday.
  let termRE, holRE;
  if (this.region == "eastern"){
    termRE = new RegExp("term.+students.+east", "i");
    holRE = new RegExp("holiday.+east", "i");
  }else if (this.region == "western"){
    termRE = new RegExp("term.+students.+west", "i");
    holRE = new RegExp("holiday.+west", "i");
  }

  var cc = new cached_calendar();

  //Easy one first. If it's a weekend, return true!
  var weekend = moment(date).day() == 0 || moment(date).day() == 6;

  //Next, if date is a public holiday, return true!
  var publicHol = cc.getCalendar("NSW", "public").then(function(cal) {
    var events = getPrePostEvents(cal, date);

    var event = events.pre;
    if (moment(event.start).isSame(date, "day")) {
      console.log("It's ", event.summary, "!");
      return true;
    } else {
      return false;
    }
  });

  var holidayTime = getToday(date).then(function(events) {
    //Now check whether DATE is inside or outside of term boundaries
    for (var i = 0; i < events.length; i++) {
      if (holRE.test(events[i])) {
        return true;
      } else if (termRE.test(events[i])) {
        return false;
      }
    }
  });

  return new Promise(function(resolve, reject) {
    Promise.all([weekend, publicHol, holidayTime])
      .then(function(values) {
        if (values[0]) {
          resolve(true);
        } else if (values[1]) {
          resolve(true);
        } else if (values[2]) {
          resolve(true);
        } else {
          resolve(false);
        }
        return;
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

  return new Promise(function(resolve, reject) {
    getNextHoliday(r, date)
      .then(function(holiday) {
        var days = moment(holiday).diff(date, "days");
        resolve(days);
      })
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
      });
  });
};

module.exports = NSW_iCal_Helper;

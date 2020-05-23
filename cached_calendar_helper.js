"use strict";

var ical = require("ical");
var moment = require("moment");
var fs = require("fs");
var got = require("got");

const QHolCalURL = "http://public-holidays.dteoh.com/qld.ics";
const QHolCalF = ".data/qld_public_holidays.ics";
const QEdCalURL = "https://education.qld.gov.au/about/Documents/qld-school-holidays.ics";
const QEdCalF = ".data/qld_school_holidays.ics";

const NSWHolCalURL = "http://public-holidays.dteoh.com/nsw.ics";
const NSWHolCalF = ".data/nsw_public_holidays.ics";
const NSWEdCalURL =
  "https://education.nsw.gov.au/content/dam/main-education/public-schools/going-to-a-public-school/media/documents/NSW-public-schools-term-dates-and-holidays_psnswtermdates-gmail.com.ics";
const NSWEdCalF = ".data/nsw_school_holidays.ics";

const VHolCalURL = "http://public-holidays.dteoh.com/vic.ics";
const VHolCalF = ".data/vic_public_holidays.ics";
const VEdCalURL =
  "https://calendar.google.com/calendar/ical/teg3ioau8grqdcs00vku8eefp4%40group.calendar.google.com/public/basic.ics";
const VEdCalF = ".data/vic_school_holidays.ics";

const PUBLIC = "public";
const SCHOOL = "school";

function updateCache(url, file) {
  
  return new Promise(function(resolve, reject) {
    
    got.stream(url).pipe(fs.createWriteStream(file))
    .on('error', function(err){
      console.error("http-get error: ", err);
      reject(err); })
    .on('close', function(){
      //update timestamp!
      fs.utimes(file, new Date(), new Date(), function(err) {
        if (err) {
          console.error("Timestamp error: ", err);
          reject(err);
        }
        resolve(true);
      });
    });
  });
}

function Cached_Calendar_Helper(state, type) {
  this.state = state;
  this.type = type;
}

Cached_Calendar_Helper.prototype.getCalendar = function() {
  let state = this.state;
  let type = this.type;

  return new Promise(function(resolve, reject) {
    var url, filename;

    switch (state) {
      case "NSW":
        switch (type) {
          case PUBLIC:
            url = NSWHolCalURL;
            filename = NSWHolCalF;
            break;
          case SCHOOL:
            url = NSWEdCalURL;
            filename = NSWEdCalF;
            break;
        }
        break;
      case "QLD":
        switch (type) {
          case PUBLIC:
            url = QHolCalURL;
            filename = QHolCalF;
            break;
          case SCHOOL:
            url = QEdCalURL;
            filename = QEdCalF;
            break;
        }
        break;
      case "VIC":
        switch (type) {
          case PUBLIC:
            url = VHolCalURL;
            filename = VHolCalF;
            break;
          case SCHOOL:
            url = VEdCalURL;
            filename = VEdCalF;
            break;
        }
        break;
    }

    let refreshCache = new Promise(function(resolve, reject) {
      fs.stat(filename, function(err, stats) {
        if (err) {
          resolve(true);
        } else if (moment().diff(stats.mtime, "months") > 1) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    refreshCache
      .then(function(refresh) {
        if (refresh) {
          return updateCache(url, filename);
        }
      })
      .then(function() {
        let calendar = ical.parseFile(filename);
        resolve(calendar);
      })
      .catch(function(error) {
        console.log("Failed: ", error);
        reject(error);
      });
  });
};

module.exports = Cached_Calendar_Helper;

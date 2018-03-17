Queensland School Holidays Alexa Skill
=========================

Using publicly accessible data this skill allows users to ask whether a particular day is a holiday, or how long until the end of the next term.

Data is from:
* Qld Government (used under CC By 4.0 license)
* NSW Government (used under CC By 4.0 license)
* http://public-holidays.dteoh.com

This skill is available [for Australian Alexa users](https://www.amazon.com.au/Daniel-Saunders-Queensland-School-Holidays/dp/B07B8ZQLMK/ref=sr_1_1?s=digital-skills&ie=UTF8&qid=1521263206&sr=1-1&keywords=aussie+holidays).

Please use [github](https://github.com/funkydan2/aussie_school_holidays_skill/issues) for bug reports and feature requests.

To-Do
----------------------
* Change *days until holidays* to return the number of *school days* (or maybe an object with totalWeeks, totalDays, and schoolDays).
* Link to github on the Alexa Page for bug reports and feature requests
* *Delete me* intent
* Incorporate Victoria
  * https://www.vic.gov.au/calendar.html
  * http://www.vic.gov.au/themes/v6/images/VictoriaCalendar-SchoolsTerms.ics
  * http://www.vic.gov.au/themes/v6/images/VictoriaCalendar-PublicHolidays.ics
* Look into
  * South Australia
  * Tasmania
  * Western Australia
  * ACT and NT
* For QLD:
  * Deal with the staggered year ending for grades 10-12
* More fun responses!

Installation Instructions
----------------------
If you want to use this code on your own server, you need to kick things off by running `node install.js` to create the initial database.
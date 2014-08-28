var urlFormat = require('url').format;
var crypto = require('crypto');
var util = require('util');

var request = require('request');

// stevage.github.io/PTV-API-doc

// http://www.data.vic.gov.au/raw_data/ptv-timetable-api/6056
// https://github.com/stevage/ptvpy/blob/master/ptvapi.py
// https://github.com/wongm/ptv-api-php-test-harness/blob/master/testharness.php

// proxy to https://developers.google.com/transit/gtfs/ ?

var endpoint = "http://timetableapi.ptv.vic.gov.au";


function createSignature(key, url, args) {
  return crypto.createHmac('sha1', key)
    .update(urlFormat({pathname: '/v2' + url, query: args}))
    .digest('hex').toUpperCase();
}

function PTV(opts) {
  this.devId = opts.devId;
  this.key = opts.key;
  this._activeReqs = 0;
}

PTV.prototype._callAPIutc = function(url, utc, cb) {
  var result;
  var query = { devid: this.devId };
  if (utc)
    query.for_utc = utc.toISOString();
  var signature = createSignature(this.key, url, query);
  query.signature = signature;
  this._activeReqs++;
  var ptv = this;
  request({
    url: endpoint + '/v2' + url,
    qs: query
  }, function(error, response, body) {
    ptv._activeReqs--;
    if (!error && response.statusCode == 200) {
      try {
        result = JSON.parse(body);
      } catch(e) {
        return cb(e);
      }
      cb(null, result);
    } else {
      if (error)
        return cb(error);
      cb(response.statusCode);
    }
  });
};

PTV.prototype._callAPI = function(url, cb) {
  this._callAPIutc(url, null, cb);
};


PTV.prototype.stopsNearby = function(latitude, longitude, cb) {
  this._callAPI(
    util.format('/nearme/latitude/%d/longitude/%d', latitude, longitude),
    function(err, res) {
      if (err) return cb(err);
      return cb(null, res.map(function(s) { return s.result; }));
    }
  );
};

PTV.prototype.transportPOIsByMap = function(poi, lat1, long1, lat2, long2,
  griddepth, limit, cb) {
  this._callAPI(
    util.format('/poi/%s/lat1/%d/long1/%d/lat2/%d/long2/%d/griddepth/%d/limit/%d',
      encodeURI(poi), lat1, long1, lat2, long2, griddepth, limit),
    cb
  );
};

PTV.prototype.search = function(what, cb) {
  this._callAPI(
    '/search/' + encodeURI(what),
    cb
  );
};

PTV.mode = {
  train: 0,
  tram: 1,
  bus: 2,
  vline: 3,
  nightrider: 4
};

PTV.modeName = ['train', 'tram', 'bus', 'vline', 'nightrider'];

PTV.prototype.broadNextDepartures = function(mode, stop, limit, date, cb) {
  if (!date)
    date = new Date();
  this._callAPIutc(
    util.format('/mode/%d/stop/%d/departures/by-destination/limit/%d',
      mode, stop, limit),
    date,
    function(err, res) {
      if (err) return cb(err);
      //if (!res || !res.values)
      //  console.log(res);
      cb(null, res.values);
    }
  );
};

PTV.prototype.specificNextDepartures = function(mode, line, stop,
  directionid, limit, date, cb) {
  if (!date)
    date = new Date();
  this._callAPIutc(
    util.format('/mode/%d/line/%d/stop/%d/directionid/%d/departures/all/limit/%d',
      mode, line, stop, directionid, limit),
    date,
    function(err, res) {
      if (err) return cb(err);
      //if (!res || !res.values)
      //  console.log(res);
      cb(null, res.values);
    }
  );
};

PTV.prototype.stoppingPattern = function(mode, run, stop, date, cb) {
  if (!date)
    date = new Date();
  this._callAPIutc(
    util.format('/mode/%d/run/%d/stop/%d/stopping-pattern',
      mode, run, stop),
    date,
    function(err, res) {
      if (err) return cb(err);
      cb(null, res.values);
    }
  );
};

PTV.prototype.stopsOnALine = function(mode, line, cb) {
  this._callAPI(
    util.format('/mode/%d/line/%d/stops-for-line', mode, line),
    cb
  );
};

module.exports = PTV;
module.exports.createClient = function(opts) {
  return new PTV(opts);
};

//var pt = new PTV({ key: key, devId: devId});
//pt.search('Hoddle St', console.log);
//pt.transportPOIsByMap(2,-37,145,-37.5,145.5,3,10, console.log);
//pt.broadNextDepartures(0,1104,2,null,console.log);
//pt.specificNextDepartures(1,1881,2026,24,1, null, console.log);
//pt.stoppingPattern(0,4780,1104, null, console.log);
//pt.stopsOnALine(4,'1818');

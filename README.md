node-ptv
========

Unofficial node.js client for Public Transport Victoria API

```js
  var ptv = require('ptv');

  var pt = ptv.createClient({devId: 12345, key: 'foobar'});
  pt.stoppingPattern(ptv.mode.train, 4780, 1104, null, function(err, pattern) {
    //
  });

```

To get api devId / key please email APIKeyRequest@ptv.vic.gov.au with
subject "PTV Timetable API - request for key"

## See also
  - [Unofficial api documentation](http://stevage.github.io/PTV-API-doc/)
  - [python client](https://github.com/stevage/ptvpy)
  - [php client]( https://github.com/wongm/ptv-api-php-test-harness)

## License

MIT

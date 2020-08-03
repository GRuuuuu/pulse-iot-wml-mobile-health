var express = require('express'),
    http = require('http'),
    app = express(),
    path = require('path'),
    cfenv = require("cfenv"),
    appEnv = cfenv.getAppEnv(),
    bodyParser = require('body-parser'),
    cloudant = require('@cloudant/cloudant'),
    device_type = "mypulse",
    device_info = null,
    dbname = 'device_info',
    host = (process.env.VCAP_APP_HOST || 'localhost'),
    port = (process.env.PORT || 3000),
    api = require('./routes/api');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', port);
app.use('/api', api);
/*
if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	console.log(env);

	if (env["cloudantNoSQLDB"]) {
		db_props = env['cloudantNoSQLDB'][0]['credentials'];
		console.log(db_props);
	} else {
		console.log('You must bind the Cloudant DB to this application');
	}

	if (env["iotf-service"]) {
		iot_props = env['iotf-service'][0]['credentials'];
		console.log(iot_props);
	} else {
		console.log('You must bind the Internet of Things service to this application');
	}
}*/


//***Put the credentials here***
db_props= {username: "...",
apikey: "..."};


cloudant({account:db_props.username, plugins:{iamauth:{iamApiKey:db_props.apikey}}}, function(err, cloudant) {
  console.log('Connected to Cloudant');
  console.log("[ERR] connect cloudant: "+err);
  cloudant.db.list().then((body) => {
    if(body.indexOf(dbname) < 0){
      cloudant.db.create(dbname).then(() => {
        device_info=cloudant.use(dbname);
        console.log("created DB " + dbname);
      }).catch((err) => { console.log("[ERR]create DB: "+err);});
    }
    else {
      console.log("found DB " + dbname);
      device_info = cloudant.use(dbname);
    }
  }).catch((err) => { console.log("[ERR]list DB: "+err); });
  
})

app.get('/api/:sensordata', function(req, res) {
	var data = req.params.sensordata;
  var parsed = JSON.parse(data);
  device_info.insert({data: data, deviceid: parsed.d.deviceid, date: new Date()});//, data, function(err, body) {
});

app.listen(app.get('port'), function() {
  console.log('Server started at ' + host + ":" + port);
});

module.exports = app;

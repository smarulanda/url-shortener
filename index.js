var express = require('express');
var bodyParser = require('body-parser');
var random = require('random-key');
var pg = require('pg-promise')();

var app = express();
var db = pg(process.env.DATABASE_URL || 'postgres://psql:psql@localhost');

app.set('port', (process.env.PORT || 3000));

// Set view directory and engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Set a public directory
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Root directory, the home page
app.get('/', function (req, res) {
	res.render('index');
});

//
app.post('/shorten', function (req, res) {
    var url = req.body.url;
    var key = random.generate(6);

    // check that URL has been submitted
    if (typeof url === 'undefined') {
        res.redirect('/');
    }
    // insert the new record, render view with link
    db.none("INSERT INTO entry(key, url) values($1, $2)", [key, url])
    .then(function (data) {
       	res.render('shorten', { link: req.headers.origin + "/" + key });
    });
});

app.post('/api/generatelink', function (req, res) {
    var url = req.url;
    var key = random.generate(6);
	url = url.replace('/api/generatelink?url=','');
    // check that URL has been submitted
    if (typeof url === 'undefined') {
        res.redirect('/');
    }
    
    db.none("INSERT INTO entry(key, url) values($1, $2)", [key, url])
    .then(function (data) {
		res.status(200).send(key);
    });
});

// Check for key and redirect
app.get('/:key', function (req, res) {
	let text = 'SELECT * FROM entry WHERE key = $1';
	db.one(text, [req.params.key])
	.then(function (entry) {
		
	var webpage = entry.url;
	
	if(webpage.indexOf('www.') == -1){

		webpage = 'www.' + webpage;
	}
	if(webpage.indexOf('http://') == -1 || webpage.indexOf('https://') == -1){

		webpage = 'http://' + webpage;
	}
	
	
	res.redirect(301, webpage);
		
	})
	.catch(function () {
		res.redirect('/');
	});
});
	


app.listen(app.get('port'), function () {
	console.log('listening on port ' + app.get('port'));
});
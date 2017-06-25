var express = require('express');
var bodyParser = require('body-parser');
var rk = require('random-key');
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

// Root directory, the home page
app.get('/', function (req, res) {
	res.render('index');
});

// Post url and shorten
app.post('/shorten', function (req, res) {
	var url = req.body.url;
	var key = rk.generate(5);

	if (typeof url === 'undefined') {
		res.redirect('/');
	}

	db.none("insert into entry(key, url) values($1, $2, $3)", [key, url])
	.then(function (data) {
		res.render('shorten', { key: key });
	});
});

// Check for key and redirect
app.get('/:key', function (req, res) {
	db.one('select * from entry where key = $1', req.params.key)
	.then(function (entry) {
		// Increase the count, then redirect
		db.none('update entry set count = $1 where id = $2', [entry.count + 1, entry.id])
		.then(function (data) {
			res.redirect(entry.url);
		});
	});
});

app.listen(app.get('port'), function () {
	console.log('listening on port ' + app.get('port'));
});
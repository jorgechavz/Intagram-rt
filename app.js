var express = require('express');
var app = express();
var server = require('http').Server(app);
var port = process.env.PORT || 5000;
var io = require('socket.io').listen(app.listen(port),{ log: false });
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = ('request');
var sentiment = require('sentiment');
var request = require('request');

//Hashtags that you want to see in real time
var hashes = ["branding","mercadotecnia","marketingonline","brandmatters"];

//Intagram KEYS
var clientID = '<YOUR CLIENT ID>',
    clientSecret = '<YOUR CLIENT SECRET>',
    callback_Url = '<YOUR CALLBACK URL>',
    access_token = "<YOUR ACCESS TOKEN>";

//Twitter Keys
var consumerKey = '<YOUR CUSTOMER KEY>',
    consumerSecret = '<YOUR CONSUMERSECRET>',
    accessToken = '<YOUR ACCESS TOKEN>',
    accessTokenSecret = '<YOUR ACCESS TOKEN SECRET>'

//Configuracion de Twitter API
var Twit = require('twit');
var T = new Twit({
    consumer_key:         consumerKey
  , consumer_secret:      consumerSecret
  , access_token:         accessToken
  , access_token_secret:  accessTokenSecret
});

//Configuracion de Intragram API
Instagram = require('instagram-node-lib');
Instagram.set('client_id', clientID);
Instagram.set('client_secret', clientSecret);
Instagram.set('callback_url', callback_Url+'/callback');
Instagram.set('redirect_uri', callback_Url);
Instagram.set("access_token",access_token);
Instagram.set('maxSockets', 10);

//Stream this hashtags
var stream = T.stream('statuses/filter', { track: hashes });




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.set('port', port);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


io.sockets.on("connection",function(socket){


  for(var i = 0;i < hashes.length;i++){
    T.get('search/tweets', { q: "#"+hashes[i], count: 10 }, function(err, data, response) {
      socket.emit("first tweets",data);
    });
    Instagram.tags.recent({
       name: hashes[i],
       complete: function(data) {
         socket.emit('first', { firstShow: data });
       }
    });
    Instagram.tags.subscribe({
      object: 'tag',
      object_id: hashes[i],
      aspect: 'media',
      callback_url: 'https://'+callback_Url+'/callback',
      type: 'subscription',
      id: '#'
    });
  }


  stream.on('tweet', function (tweet) {
    socket.emit("new tweet",tweet);
  });

  socket.on("liketo",function(object){
    var ido = object.object.id;
    console.log(object);
    //Like
    Instagram.media.like({ media_id: ido });
  });

});


app.get("/delete",function(req,res){
  request.del('https://api.instagram.com/v1/subscriptions?client_secret='+clientSecret+'&client_id='+clientID, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      JSON.parse(body).data.forEach(function(sub){
        console.log(sub.object_id);
      });
      res.render("delete",{subs:JSON.parse(body).data});
    }
  });
});




app.get("/subscriptions",function(req,res){
  var url = "https://api.instagram.com/v1/subscriptions?client_secret="+clientSecret+"&client_id="+clientID;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      res.json(body);
      res.end();
    }
    res.end();
  });
});

app.get("/",function(req,res){
  res.render("index",{title:"Mension"});
});


//here we will make a handshake with instagram
app.get('/callback', function(req, res){
    var handshake =  Instagram.subscriptions.handshake(req, res);
});


//Everytime Instagram do a post request to our server
app.post("/callback",function(req,res){
  var data = req.body;
  data.forEach(function(tag) {
      var url = 'https://api.instagram.com/v1/tags/' + tag.object_id + '/media/recent?client_id='+clientID;
      sendMessage(url);
    });
    res.end();
});
function sendMessage(url) {
  io.sockets.emit('show', { show: url });
}


app.get("/oauth",function(req,res){
  url = Instagram.oauth.authorization_url({
    scope: 'comments likes relationships', // use a space when specifying a scope; it will be encoded into a plus
    display: 'touch'
  });
  res.redirect(url);
});
// error handlers

// development error handler
// will print stacktrace

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});



if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

console.log("Escuchando puerto "+app.get("port"));

module.exports = app;

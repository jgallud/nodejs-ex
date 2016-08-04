//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

//app.engine('html', require('ejs').renderFile);
//app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

//app.use('/',exp.static(__dirname));

app.get('/', function (req, res) {
  var contenido=fs.readFileSync("views/quest-mobile.html");
  res.setHeader("Content-Type","text/html");
  res.send(contenido);
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.get("/respuestas", function(request,response){
  var contenido;
  //response.setHeader('Content-Type', 'application/json');
  if (!db) {
    initDb(function(err){});
  }
  if (db) {

    //db.collection('respuestas2').find().toArray

    db.collection("respuestas2",function(error,col){
      //console.log("Tenemos la colección");
      usuarioCol=col;
    });
  
    usuarioCol.find().toArray(function(err, docs){
      //console.log("retrieved records:");
      contenido=docs;
      response.send(contenido);
    });
  }
  else{
    response.send('{error:"No se ha inicializado db"}');
  }
});

app.post("/peticion",function(request,response){
  var body='';
    var resultado;//=JSON.parse(body);
  //console.log("petición post recibida");
  request.on('data', function(chunk) {
    
    body+=chunk;//chunk.toString();      
    resultado=JSON.parse(body);
    //console.log(resultado);
    });
    request.on('end', function() {
      // empty 200 OK response for now    
      response.writeHead(200, "OK", {'Content-Type': 'text/html'});     
      response.end();

      console.log(resultado);
    });
    if (!db) {
    initDb(function(err){});
    }
    if (db) {
      var col = db.collection('respuestas2');

      //db.collection("respuestas2",function(error,col){
       // //console.log("Tenemos la colección");
      //  usuarioCol=col;
      //});
      usuarioCol.insert(resultado,function(error){
            if(error){
              console.log("Hubo un error");
            }
            else{
              console.log("Elemento insertado");
            }
          });
    }
    else
    { 
      response.send('{error:"No se ha inicializado db"}');
    }
});


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

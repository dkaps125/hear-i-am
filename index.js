const tau = 2 * Math.PI;

// Importing libraries
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var sock = require('socket.io');
var http = require('http');
var baud = require('baudio');
var ffmpeg = require('fluent-ffmpeg');

//Initializing server
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.render('index');
});

var server = http.Server(app).listen(9001, function() {
    console.log("Server up!");
});

var io = sock.listen(server);

var width = 700;
var height = 700;

var curData = {
    black : [],
    blue : [],
    red : [],
    green : [],
    yellow : []
};

var colors = {}

var overtones = {
    black: [],
    blue: [],
    red: [],
    green: [],
    yellow: []
}

for (var k in overtones) {
    if (overtones.hasOwnProperty(k)) {
        l = 1;
        while (l > 0) {
            var ne = Math.random() * Math.random();

            if (ne > l) {
                overtones[k].push(l);
                break;
            }

            l = l - ne;
            overtones[k].push(l);
        }
    }
}

var curLines = [];

//make these functions for which overtones
var compute = {
    black : function(avgX, avgY, count) {
        return function(t) {
            var f = 0;
            for (var k in overtones.black) {
                f += (overtones.black[k] * Math.sin(tau*t*avgX*k));
            } 
            return (f * (Math.sin(tau * t * (avgY % 2)))); 
        };
    },
    blue : function(avgX, avgY, count) {
        return function(t) {
            var f = 0;
            for (var k in overtones.blue) {
                f += (overtones.blue[k] * Math.sin(tau*t*avgX*k));
            } 
            return f * (Math.sin(tau * t * (avgY % 5))); 
        }
    },
    red : function(avgX, avgY, count) {
        return function(t) {
            var f = 0;
            for (var k in overtones.red) {
                f += (overtones.red[k] * Math.sin(tau*t*avgX*k));
            } 
            return f * (Math.sin(tau * t * (avgY % 7))); 
        }
    },
    green : function(avgX, avgY, count) {
        return function(t) {
            var f = 0;
            for (var k in overtones.green) {
                f += (overtones.green[k] * Math.sin(tau*t*avgX*k));
            } 
            return f * (Math.sin(tau * t * (avgY % 7))); 
        }
    },
    yellow : function(avgX, avgY, count) {
        return function(t) {
            var f = 0;
            for (var k in overtones.yellow) {
                f += (overtones.yellow[k] * Math.sin(tau*t*avgX*k));
            } 
            return f * (Math.sin(tau * t * (avgY % 10))); 
        }
    },
};

var gen = {};

var s = baud(function(t) {
    //console.log(t);
    return 0;
});

s.play();

setInterval(function() {
    //have a function that takes a pitch and and a function
    // and returns a function that takes time and produces some sequence of over
    s._fn = function(t) {
        var m = 0;
        for (var j in colors) {
            if (colors.hasOwnProperty(j) && curLines.hasOwnProperty(j)) {
                var color = colors[j];

                if (curLines[j].hasOwnProperty(color)) {
                    var x = curLines[j][color][0] * 700;
                    var y = curLines[j][color][1] * 700;
                    var d = compute[color](x, y, 1);
                    var n = d(t);
                    if (!isNaN(n)) {
                        m = m + n;
                    } 
                }
            }
        }

        return (m) / 20;
    };

}, 500)

var contains = function(d, c) {
    for (var i in d) {
        var p = d[i];

        if (p[0] === c[0] && p[1] === c[1]) {
            return true;
        }
    }

    return false;
}

io.sockets.on('connection', function(socket) {
    console.log(socket.id);
    socket.emit('init', curData);

    socket.on('drawing', (data) => {
        if (!curLines.hasOwnProperty(socket.id)) {
            curLines[socket.id] = {};
        }

        curLines[socket.id][data.color] = [data.x, data.y];

        if (!contains(curData[data.color], [data.x, data.y])) {
            curData[data.color].push([data.x, data.y]);
        }
        socket.broadcast.emit('drawing', data);
    });

    socket.on('color', function(data) {
        colors[socket.id] = data.color;
    })

    socket.on('del', function(data) {
        if (curLines.hasOwnProperty(socket.id)) {
            if (curLines[socket.id].hasOwnProperty(data.color)) {
                delete curLines[socket.id][data.color];
            }
        }
    });
});

'use strict';

(function() {
    var socket = io();
    var canvas = document.getElementsByClassName('whiteboard')[0];
    var colors = document.getElementsByClassName('color');
    var del = document.getElementsByClassName('del')[0];
    var context = canvas.getContext('2d');
    var hammertime = new Hammer.Manager(canvas); 

    var current = {
        color: 'black'
    };
    socket.emit('color', current);

    var drawing = false;

    var allLines = {};
    var linex = [];
    var liney = [];

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

    hammertime.add( new Hammer.Pan({direction: Hammer.DIRECTION_ALL, threshold: 0}) );
    hammertime.add( new Hammer.Tap() );

    hammertime.on("panstart", panStart(onMouseDown));
    hammertime.on("panmove", panStart(onMouseMove));
    hammertime.on("panend", panStart(onMouseUp));
    hammertime.on("pancancel", panStart(onMouseUp));

    del.addEventListener('click', onDel, false);

    function panStart(fun) {
        return function(e) {
            fun({clientX: e.center.x, clientY: e.center.y});
        }
    }


    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', onColorUpdate, false);
    }

    socket.on('drawing', onDrawingEvent);
    socket.on('init', onInit);

    window.addEventListener('resize', onResize, false);
    onResize();

    function onInit(data) {
        var h = canvas.height;
        var w = canvas.width;
        for (var k in data) {
            if (data.hasOwnProperty(k)) {
                for (var i in data[k]) {
                    var p = data[k][i];
                    drawLine(p[0] * w, p[1] * h, k, false);
                }
            }       
        }
    }


    function drawLine(x, y, color, emit) {
        var endAngle = 2 * Math.PI;

        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        context.arc(x, y, 10, 0, endAngle);
        context.stroke();
        context.fill();

        if (!emit) {
            return; 
        }

        var w = canvas.width;
        var h = canvas.height;

        socket.emit('drawing', {
            x: x / w,
            y: y / h,
            color: color
        });
    }

    function onMouseDown(e) {
        drawing = true;
    }

    function onMouseUp(e) {
        if (!drawing) {return;}

        drawing = false;
        drawLine(e.clientX, e.clientY, current.color, true);
    }

    function onMouseMove(e) {
        if (!drawing) {return;} 
        drawLine(e.clientX, e.clientY, current.color, true);
    }

    function onColorUpdate(e) {
        current.color = e.target.className.split(' ')[1];

        socket.emit('color', current);
    }

    function throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function() {
            var time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    function onDrawingEvent(data) {
        var w = canvas.width;
        var h = canvas.height;
        drawLine(data.x * w, data.y * h, data.color, false);
    }

    function onDel() {
        socket.emit('del', current);
    }

    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        onInit();
    }
})();

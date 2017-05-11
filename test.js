var b = require('baudio');


var o = [];
var l = 1;
while (l > 0) {
    var ne = Math.random() * (Math.random());

    if (ne > l) {
        o.push(l);
        break;
    }

    l = l - ne;
    o.push(ne);
}

console.log(o);


var s = b(function(t) {
    //var m = melody[Math.floor(t * 2 % melody.length)];
    var m = 0;
    var f = 440;
    for (var k in o) {
        m += (o[k] * Math.sin(t * 2 * Math.PI * f * k));   
    }

    return m;
    //return Math.sin(t * Math.PI * 2 * 400) + Math.sin(t * Math.PI * 2 * 401);
});

s.play();

var maxVel = 10;
var nodes, links;
var go = true;


var def0 = {
    groups: [
        {id:"A", num: 12, mass:1, damp:0.96}
    ],
    links: [
        {from:"A", to:"A", type:"r", layout:"chain", dst:60, rch:1000, render:'x'},
        {from:"A", to:"A", type:"repel", layout:"all", dst:-60, rch:120}
    ]
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('container');
    frameRate(30);
    background(255);

    editor = select("#editor");
    area = select("#editor-area");
    editor.hide();
    let update = select("#update");
    update.mouseClicked( function(){ reset(true) } );

    /*let def = def0;
    nodes = [];
    links = [];

    for(let g of def.groups) {
        for(let i=0; i<g.num; i++) {
            let no = new Node();
            no.mass = g.mass;
            no.damp = g.damp;
            no.group = g.id;
            nodes.push(no);
        }
    }

    for(let l of def.links) {
        for(let i=0; i<nodes.length; i++) {
            for(let j=0; j<nodes.length; j++) {
                if(nodes[i].group == l.from && nodes[j].group == l.to) {
                    let li = new Link(nodes[i], nodes[j], l);
                }
            }
        }
    }*/
    reset(false);

    console.log(nodes.length, links.length);
}

function reset(fromEditor) {
    let _def;
    if(fromEditor) {
        _def = JSON.parse(area.value());
    } else {
        _def = def0;
    }
    area.value( JSON.stringify(_def, replacer, 2) );

    nodes = [];
    links = [];
    let gs = {};

    for(let g of _def.groups) {
        gs[g.id] = [];
        for(let i=0; i<g.num; i++) {
            let no = new Node();
            no.mass = g.mass;
            no.damp = g.damp;
            no.group = g.id;
            nodes.push(no);
            gs[g.id].push(no);
        }
    }

    for(let l of _def.links) {
        if(l.layout == "all") {
            for(let i=0; i<gs[l.from].length; i++) {
                for(let j=0; j<gs[l.to].length; j++) {
                    new Link(gs[l.from][i], gs[l.to][j], l);
                }
            }
        } else if(l.layout == "chain") {
            let n = min( gs[l.from].length, gs[l.to].length );
            for(let i=0; i<n-1; i++) {
                new Link(gs[l.from][i], gs[l.to][i+1], l);
            }
        } else if(l.layout == "loop") {
            let n = min( gs[l.from].length, gs[l.to].length );
            for(let i=0; i<n; i++) {
                new Link(gs[l.from][i], gs[l.to][(i+1) % n], l);
            }
        }
    }

}

function replacer(key, val) {
    if(typeof(val) == "number") return Math.floor(val*100)/100;
    return val;
}

function draw() {
    if(go) {
        background(255);
        //console.log('step');

        for(let li of links) {
            li.step();
        }

        for(let no of nodes) {
            no.step();
        }
    }
}

class Node {
    constructor() {
        this.group = '';
        this.pos = createVector( random(width), random(height) );
        this.prev = this.pos.copy();
        this.vel = createVector();
        this.mass = 1;
        this.damp = 0.85;
    }

    step() {
        this.vel.limit(maxVel);
        this.pos.add(this.vel);
        this.vel.mult(this.damp);

        fill(0, 192);
        ellipse(this.pos.x, this.pos.y, this.mass*12);
    }
}

class Link {
    constructor(a, b, l) {
        this.a = a;
        this.b = b;
        this.dst = l.dst;
        this.rch = l.rch;
        this.f = 1;
        this.type = l.type;
        this.render = 'render' in l ? l.render : null;

        links.push(this);
    }

    step() {
        let dif = p5.Vector.sub(this.b.pos, this.a.pos);
        let d = max(dif.mag(), 0.0001);
        let acc = 0;

        if(this.type == "repel") {
            acc = -maxVel * 1/d;
        } else {
            if(d < this.rch) {
                acc = (d - this.dst) * map(d, 0, this.rch, 0.005, 0);
            }
        }
        //dif.normalize();
        dif.setMag(acc);
        this.a.vel.add(dif);
        this.b.vel.sub(dif);

        if(this.render != null) {
            stroke(0, 64);
            line(this.a.pos.x, this.a.pos.y, this.b.pos.x, this.b.pos.y);
        }
    }
}

function mousePressed() {

}

function keyTyped() {
    if (document.activeElement === document.getElementById('editor-area')) return;

    if (key === ' ') {
        go = !go;
        console.log("go", go);
    } else if (key === 'r') {
        reset(false);
    } else if (key === 's') {
        let gt = getTime();
        saveCanvas("TG-" + gt + ".jpg");
    } /*else if (key === 'j') {
        let gt = getTime();
        let v = JSON.parse( area.value() );
        saveJSON(v, "TG-" + gt + ".json", false);
    } else if (key === 'g') {
        generate();
    }*/ else if (key === 'e') {
        if (editor.style("display") == "block") editor.hide();
        else editor.show();
    }
    // uncomment to prevent any default behavior
    return false;
}

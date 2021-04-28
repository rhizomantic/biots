var maxVel = 10;
var nodes, links;
var go = true;
var t = 0;


var def0 = {
    groups: [
        {id:"A", num: 6, mass:1, damp:0.3}
    ],
    links: [
        {from:"A", to:"A", type:"r", layout:"fan", dst:{ min:100, dif:400, terms:"t", ease:"none", dur:45, bounce:false }, rch:1200, render:'x'},
        {from:"A", to:"A", type:"repel", layout:"all", dst:60, rch:300}
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
            let no = new Node(g);
            //no.mass = g.mass;
            //no.damp = g.damp;
            //no.group = g.id;
            no.nrm = g.num == 1 ? 0 : (1 / (g.num)) * i;
            no.nrm1 = g.num == 1 ? 1 : (1 / (g.num-1)) * i;
            nodes.push(no);
            gs[g.id].push(no);
        }
    }

    for(let l of _def.links) {
        if(l.layout == "all") {
            let fl = gs[l.from].length, tl = gs[l.to].length, n = 0;
            for(let i=0; i<fl; i++) {
                for(let j=0; j<tl; j++) {
                    let neo = new Link(gs[l.from][i], gs[l.to][j], l);
                    neo.nrm = 1 / (fl*tl) * n;
                    neo.nrm1 = 1 / (fl*tl-1) * n;
                    console.log(1 / (fl*tl) * n, neo);
                    n++;
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
        }  else if(l.layout == "comb") {
            if(l.from == l.to) continue; //No crear relaciones de nodos consigo mismos
            let n = min( gs[l.from].length, gs[l.to].length );
            for(let i=0; i<n; i++) {
                new Link(gs[l.from][i], gs[l.to][i], l);
            }
        }  else if(l.layout == "fan") {
            let ini = l.from == l.to ? 1 : 0;
            for(let i=ini; i<gs[l.from].length; i++) {
                new Link(gs[l.from][i], gs[l.to][0], l);
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
            //if(int(random(300)) == 5) console.log(li);
        }

        for(let no of nodes) {
            no.step();
        }

        t ++;
    }
}

class Node {
    constructor(n) {
        this.group = '';
        this.nrm = 0;
        this.nrm1 = 1;
        this.pos = createVector( random(width), random(height) );
        this.prev = this.pos.copy();
        this.vel = createVector();
        this.mass = 1;//'mass' in n ? parse(this, 'mass', n.mass) : 1;
        this.damp = 0.85;//'damp' in n ? parse(this, 'damp', n.damp) :0.85;

        /*for(let [k,v] of Object.entries(n)) {
            parse(this, k, v);
        }*/
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
        this.tweens = [];
        this.nrm = 0;
        this.nrm1 = 1;
        this.gen = Math.random();
        this.a = a;
        this.b = b;
        this.dst = read(this, l, 'dst', 100);//'dst' in l ? parse(this, 'dst', l.dst) : 100;//readTerms(l.dst, this);
        this.rch = read(this, l, 'rch', 200);//'reach' in l ? parse(this, 'reach', l.reach) : 200;
        this.f = 1;
        this.type = l.type;
        this.render = 'render' in l ? l.render : null;

        //parse(this, 'dst', l.dst);
        //parse(this, 'rch', l.rch);


        links.push(this);
    }

    step() {
        for(let tw of this.tweens) {
            tw.step();
        }

        let dif = p5.Vector.sub(this.b.pos, this.a.pos);
        let d = max(dif.mag(), 0.0001);
        let acc = 0;

        if(this.type == "repel") {
            acc = -maxVel * 1/(d*d);
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

class Tween {
    constructor(me, key, val) {
        this.obj = me;
        this.prop = key;

        this.terms = 'terms' in val ? val.terms : 'ix';
        this.ease = 'ease' in val ? val.ease : "none";
        this.pow = 'pow' in val ? readTerms(val.pow, me) : 1;;
        this.min = 'min' in val ? readTerms(val.min, me) : 0;
        this.dif = 'dif' in val ? readTerms(val.dif, me) : 1;
        this.dur = 'dur' in val ? readTerms(val.dur, me) : 0;
        this.bounce = 'bounce' in val ? val.bounce : true;
        this.base = 0;
        this.time = 0;

        let ts = val.terms.split('+')
        for(let t of ts) {
            let ps = t.split('*');
            if(ps[0] == 't' || ps[0] == 'time') {
                this.time = ps.length > 1 ? parseFloat(ps[1]) : 1;
            } else {
                this.base += readTerm(t, me);
            }
        }
    }

    step() {
        let x = this.base;

        if(this.dur > 0 && this.time > 0) {
            let ti;
            if(this.bounce) ti = floor(t / (this.dur+1)) % 2 == 0 ? t % (this.dur+1) : (this.dur+1) - (t % (this.dur+1));
            else ti = t % (this.dur+1);
            x += (1 / this.dur) * ti * this.time;
        }

        if(x > 1) x = floor(x % 2) == 1 && this.bounce ? 1 - (x % 1) : x % 1;

        this.obj[this.prop] = this.min + this.applyEasing(this.ease, x, this.pow) * this.dif;
    }

    applyEasing(type, x, p) {
        if(type == "simple") {
            return p < 0 ? 1 - Math.pow(1-x, Math.abs(p)) : Math.pow(x, Math.abs(p));
        } else if (type == "IO") {
            if(x < 0.5) return (p < 0 ? 1 - Math.pow(1-x*2, Math.abs(p)) : Math.pow(x*2, Math.abs(p))) * 0.5;
            else return (1 - (p < 0 ? 1 - Math.pow(1-(1-(x-0.5)*2), Math.abs(p)) : Math.pow(1-(x-0.5)*2, Math.abs(p)))) * 0.5 + 0.5;
        } else if (type == "hill") {
            x = x < 0.5 ? x * 2 : 1 - (x-0.5)*2;
            return p < 0 ? 1 - Math.pow(1-x, Math.abs(p)) : Math.pow(x, Math.abs(p));
        } else if (type == "sine") {
            return Math.sin(x*p*Math.PI*2) * 0.5 + 0.5;
        } else {
            return x;
        }

    }
}

function read(me, obj, prop, dft = 0) {
    if(!(prop in obj)) return dft;

    let val = obj[prop];
    if(val === undefined) return dft;
    if(! isNaN(val)) return val;
    if(typeof val === 'string') return readTerms(val, me);

    me.tweens.push( new Tween(me, prop, val) );
    return dft;
}

function parse(me, key, val) {
    if(! isNaN(val)){
        me[key] = val;
    } else if(typeof val === 'string') {
        me[key] = readTerms(val, me);
    } else {
        me.tweens.push( new Tween(me, key, val) );
    }
}

/*function readTween(key, val, me) {
    val.terms = 'terms' in c ? val.terms : "ix";

    let out = {};
    out.ease = 'ease' in c ? val.ease : "none";
    out.pow = 'pow' in c ? readTerms(val.pow) : 1;;
    out.min = 'min' in c ? readTerms(val.min) : 0;
    out.dif = 'dif' in c ? readTerms(val.dif) : 1;
    out.dur = 'dur' in c ? readTerms(val.dur) : 0;
    out.bounce = 'bounce' in c ? val.bounce : true;
    out.base = 0;
    out.time = 0;

    let ts = val.terms.split('+')
    for(let t of ts) {
        let ps = t.split('*');
        if(ps[0] == 't' || ps[0] == 'time') {
            out.time = ps.length > 1 ? parseFloat(ps[1]) : 1;
        } else {
            out.base += readTerm(t);
        }
    }

    return out;
}*/

function readTerms(terms, me) {
    if(! isNaN(terms)) return terms;

    let o = 0;
    let ts = terms.split('+')
    for(let t of ts) {
        o += Number( this.readTerm(t, me) );
    }

    return o;
}

function readTerm(term, me) {
    if(! isNaN(term)) return term;

    let ps = term.split('*');
    let o = 1;
    for(let p of ps) {
        if(p == "ix") o *= me.nrm;
        //else if(p == "ix1") o *= me.nrm1;
        else if(p == "gen") o *= me.gen;
        else if(p == "rnd") o *= Math.random();
        //else if(p == "seed") o *= seed;
        else if(p == "pi") o *= PI;
        else if(p == "2pi") o *= TWO_PI;
        else o *= Number(p);
    }

    return o;
}



function pick(...opts) {
    if( opts.length == 1 && Array.isArray(opts[0]) ) return opts[0][floor(random(opts[0].length))]
    return opts[floor(random(opts.length))];
}

function contrast(n, f) {
  return constrain(f*(n-0.5) + 0.5, 0, 1);
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

const radius = 8;
const width = 1000;
const height = 500;
const max_speed = 4;
const inc = 0.01;
const datasize = 100;
const magnitude = 5;

function Point(sketch){
    const x = Math.random() * width;
    const y = Math.random() * height;
    this.position = sketch.createVector(x,y);
    this.prevPostion = sketch.createVector(x,y);
    this.velocity = sketch.createVector(0,0);
    this.mass = 5;
    
};

const getForce = (sketch,scale,x,y,z) => {
    const angle = scale(sketch.noise(x*inc,y*inc,z*inc));
    const acc = p5.Vector.fromAngle(angle);
    return acc.setMag(magnitude);
};


Point.prototype.tick = function(sketch,z,scale){
    this.draw(sketch);
    const force = getForce(sketch,scale,this.position.x,this.position.y,z);
    this.applyForce(force);
    this.round(sketch);
};

Point.prototype.applyForce = function(force){
    this.prevPostion = this.position.copy();
    const acc = p5.Vector.div(force,this.mass);
    this.velocity.add(acc);
    this.position.add(this.velocity);
    this.velocity.limit(max_speed);
};

Point.prototype.draw = function(sketch){
    sketch.push();
    sketch.strokeWeight(0.5);
    sketch.stroke(1,50);
    sketch.line(this.prevPostion.x,this.prevPostion.y,this.position.x,this.position.y);
    sketch.pop();
};

Point.prototype.round = function(sketch){
    if (this.position.x < 0 ){
	this.position.x = sketch.width;
	this.prevPostion.x = sketch.width;
    }else if (this.position > sketch.width){
	this.position.x = 0;
	this.prevPostion.x = 0;
    };
    if (this.position.y < 0 ){
	this.position.y = sketch.height;
	this.prevPostion.y = sketch.height;
    }else if (this.position > sketch.height){
	this.position.y = height;
	this.prevPostion.y = height;
    };
};

const s = (sketch) => {
    let points = Array.from({length:datasize})
	    .map(e => new Point(sketch));
    let z = 0;
    let max = -1;
    let min = 1;
    let scaleRadian ;
    let forceField ;
    sketch.setup = () =>{
	sketch.createCanvas(width,height);
	sketch.noiseSeed(90);
	for (let x = 0 ; x < width ; x += 1){
	    for (let y = 0 ; y < height ; y += 1){
		max = Math.max(max,sketch.noise(x*inc,y*inc,0));
		min = Math.min(min,sketch.noise(x*inc,y*inc,0));
	    }
	}
	scaleRadian = x => sketch.map(x,min,max,0,sketch.TWO_PI);
	sketch.stroke(10);
    };
    
    sketch.draw = () =>{
	// sketch.background(255);
	// for (let x = 0; x < width ; x +=10){
	//     for (let y = 0; y < height ; y += 10){
	// 	const radian = scaleRadian(sketch.noise(x*inc,y*inc,z*inc));
	// 	let direction =p5.Vector.fromAngle(radian);
	// 	direction.mult(5);
	// 	sketch.strokeWeight(1);
	// 	sketch.line(x,y,x+direction.x,y+direction.y);
	//     }
	// }
	z += 1;
	for (let point of points) {
	    point.tick(sketch,z,scaleRadian);
	};

	if (sketch.frameCount > 600){
	    sketch.noLoop();
	}
    };
};

let p = new p5(s,"canvas");

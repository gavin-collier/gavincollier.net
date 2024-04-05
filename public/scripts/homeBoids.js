class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    distance(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
        }
        return this;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    static fromAngle(angle, magnitude) {
        return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
    }

    limit(max) {
        const mag = this.magnitude();
        if (mag > max) {
            this.divide(mag); // Normalize to unit vector
            this.multiply(max); // Scale to max
        }
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class Boid {
    constructor(canvas) {
        this.pos = new Vector(Math.random() * canvas.width, Math.random() * canvas.height);
        this.velocity = Vector.fromAngle(Math.random() * Math.PI * 2, 1);
        this.canvas = canvas;
    }

    draw(ctx) {
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.moveTo(this.pos.x + Math.cos(angle) * 10, this.pos.y + Math.sin(angle) * 10);
        ctx.lineTo(this.pos.x + Math.cos(angle - Math.PI * 0.75) * 10, this.pos.y + Math.sin(angle - Math.PI * 0.75) * 10);
        ctx.lineTo(this.pos.x + Math.cos(angle + Math.PI * 0.75) * 10, this.pos.y + Math.sin(angle + Math.PI * 0.75) * 10);
        ctx.closePath();
        ctx.fill();
    }

    move(boids) {
        let separation = new Vector(0, 0);
        let alignment = this.velocity.clone();
        let cohesion = new Vector(0, 0);
        let mouseAttraction = new Vector(0, 0);
        let total = 0;
    
        for (let other of boids) {
            let distance = this.pos.distance(other.pos);
            if (other !== this && distance < 50) {
                let difference = new Vector(this.pos.x - other.pos.x, this.pos.y - other.pos.y);
                difference.normalize();
                difference.divide(distance);
                separation.add(difference);
                alignment.add(other.velocity);
                cohesion.add(other.pos);
                total++;
            }
        }
    
        if (total > 0) {
            separation.divide(total);
            separation.normalize();
            separation.multiply(1.5); // Adjust speed
    
            alignment.divide(total);
            alignment.normalize();
    
            cohesion.divide(total);
            cohesion.subtract(this.pos);
            cohesion.normalize();
        }
    
        // if (mousePos !== null) {
        //     mouseAttraction = new Vector(mousePos.x - this.pos.x, mousePos.y - this.pos.y);
        //     mouseAttraction.normalize(); 
        //     mouseAttraction.multiply(0.5); 
        // }
        if (mousePos !== null) {
            let towardsMouse = new Vector(mousePos.x - this.pos.x, mousePos.y - this.pos.y);
            let distanceToMouse = towardsMouse.distance(new Vector(0, 0));
            towardsMouse.normalize();
            if (distanceToMouse > 0) {
                let forceMagnitude = Math.min(10 / distanceToMouse, 1); // Control the force based on distance
                towardsMouse.multiply(forceMagnitude);
            }
            mouseAttraction = towardsMouse;
        }
    
        this.velocity.add(separation);
        this.velocity.add(alignment);
        this.velocity.add(cohesion);
        this.velocity.add(mouseAttraction);
        this.velocity.normalize();
        this.velocity.multiply(1); 
    
        this.pos.add(this.velocity);
    

        if (this.pos.x < 0) this.pos.x = this.canvas.width;
        if (this.pos.y < 0) this.pos.y = this.canvas.height;
        if (this.pos.x > this.canvas.width) this.pos.x = 0;
        if (this.pos.y > this.canvas.height) this.pos.y = 0;
    }    
}

const canvas = document.getElementById('home-boids');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
let mousePos = null;

canvas.addEventListener('mousemove', function (e) {
    mousePos = { x: e.offsetX, y: e.offsetY };
});

canvas.addEventListener('mouseleave', function () {
    mousePos = null;
});

function setup() {
    resizeCanvas();

    const boids = [];
    for (let i = 0; i < 150; i++) {
        boids.push(new Boid(canvas));
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let boid of boids) {
            boid.move(boids);
            boid.draw(ctx);
        }

        createText();

        requestAnimationFrame(animate);
    }

    animate();
}

setup();

function resizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    // You might want to reinitialize or adjust your boids here if needed
    // For example, if their positions should be bounded by the new canvas size
    // This is also where you'd re-draw any static elements if they're not handled in your animation loop
}

// Add this event listener after defining setup and resizeCanvas
window.addEventListener('resize', resizeCanvas);

function createText() {
    // Styles
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fontSizeTitle = 3.5 * dpr;
    var fontSizeSubtitle = 1.75 * dpr;
    ctx.font = `${fontSizeTitle}rem Times New Roman`;

    ctx.fillText("Gavin Collier", canvas.width / 2, canvas.height / 2 - 100);
    ctx.font = `${fontSizeSubtitle}rem Times New Roman`;
    ctx.fillText("I'm currently a student at ASU and working part-time as a student IT technician.", canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText("I have a lifelong love of computers and programming, I hope to turn this lifelong interest into a carrier someday!", canvas.width / 2, canvas.height / 2 + 75);
}
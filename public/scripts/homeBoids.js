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

    limit(min, max) {
        this.x = (max > this.x && min < this.x) ? this.x : (this.x > max ? max : (this.x < min ? min : this.x));
        this.y = (max > this.y && min < this.y) ? this.y : (this.y > max ? max : (this.y < min ? min : this.y));
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
        ctx.beginPath();
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        // ctx.font = `1rem Times New Roman`;
        // ctx.fillText("x: " + parseFloat(this.velocity.x).toFixed(5) + " y: " + parseFloat(this.velocity.y).toFixed(5), this.pos.x, this.pos.y - 25);
        // ctx.fillText("tx: " + parseFloat(this.targetVelocity.x).toFixed(5) + " ty: " + parseFloat(this.targetVelocity.y).toFixed(5), this.pos.x, this.pos.y - 10);
        ctx.fillStyle = 'gray';

        ctx.moveTo(this.pos.x + Math.cos(angle) * 10, this.pos.y + Math.sin(angle) * 10);
        ctx.lineTo(this.pos.x + Math.cos(angle - Math.PI * 0.75) * 10, this.pos.y + Math.sin(angle - Math.PI * 0.75) * 10);
        ctx.lineTo(this.pos.x + Math.cos(angle + Math.PI * 0.75) * 10, this.pos.y + Math.sin(angle + Math.PI * 0.75) * 10);
        ctx.closePath();
        ctx.fill();
    }

    pidOut(p, i, min, max) {
        if (p > i && p < max) {
            return Math.min(.4, Math.max(-.4, p + i));
        }
        return Math.min(.4, Math.max(-.4, p));
    }

    move(boids) {
        let separation = new Vector(0, 0);
        let alignment = this.velocity.clone();
        let cohesion = new Vector(0, 0);
        let mouseAttraction = new Vector(0, 0);
        let total = 0;
        let distance;

        for (let other of boids) {
            if (other === this) continue;
            distance = this.pos.distance(other.pos);

            if (distance < 50) {
                let difference = this.pos.clone().subtract(other.pos).normalize().divide(distance < 10 ? distance * 0.5 : distance);
                separation.add(difference);
                alignment.add(other.velocity);
                cohesion.add(other.pos);
                total++;
            }
        }

        this.targetVelocity = new Vector(0, 0);

        if (total > 0) {
            separation.divide(total).normalize().multiply(distance < 10 ? 2 : 1.5); // Stronger separation force if very close
            alignment.divide(total).normalize();
            cohesion.divide(total).subtract(this.pos).normalize();

            this.targetVelocity.add(separation).add(cohesion).add(alignment);
        }

        if (mousePos !== null) {
            let towardsMouse = new Vector(mousePos.x - this.pos.x, mousePos.y - this.pos.y);
            let distanceToMouse = towardsMouse.distance(new Vector(0, 0));
            towardsMouse.normalize();
            if (distanceToMouse > 0) {
                let forceMagnitude = Math.min(10 / distanceToMouse, 1);
                towardsMouse.multiply(forceMagnitude * 2);
            }
            mouseAttraction = towardsMouse;
            mouseAttraction.limit(-.02, .02);
        } else {
            this.targetVelocity.add(alignment);
        }
        this.targetVelocity.add(mouseAttraction);

        this.targetVelocity.normalize().limit(-0.5, 0.5);
        this.velocity.add(this.targetVelocity.subtract(this.velocity).multiply(0.1));

        // Keep boid within canvas bounds
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

window.addEventListener('mousemove', function (e) {
    if (e.offsetY > canvas.height) {
        mousePos = null;
    } else {
        mousePos = { x: e.offsetX, y: e.offsetY };
    }
    console.log("mouse move: " + mousePos.x + ", " + mousePos.y);
});

window.addEventListener('mouseleave', function () {
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
        requestAnimationFrame(animate);
    }

    animate();
}

setup();

function resizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
}

// Add this event listener after defining setup and resizeCanvas
window.addEventListener('resize', resizeCanvas);

// function createText() {
//     // Styles
//     ctx.fillStyle = 'white';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     var fontSizeTitle = 3.5 * dpr;
//     var fontSizeSubtitle = 1.75 * dpr;
//     ctx.font = `${fontSizeTitle}rem Times New Roman`;

//     ctx.fillText("Gavin Collier", canvas.width / 2, canvas.height / 2 - 100);
//     ctx.font = `${fontSizeSubtitle}rem Times New Roman`;
//     ctx.fillText("I'm currently a student at ASU and working part-time as a student IT technician.", canvas.width / 2, canvas.height / 2 + 25);
//     ctx.fillText("I have a lifelong love of computers and programming, I hope to turn this lifelong interest into a carrier someday!", canvas.width / 2, canvas.height / 2 + 75);
// }
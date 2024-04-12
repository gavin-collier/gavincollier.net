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
                let difference = this.pos.clone().subtract(other.pos).normalize().divide(distance < 10 ? distance * .6 : distance);
                separation.add(difference);
                alignment.add(other.velocity.clone().divide(distance / 8));
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

        // Keep boid within canvas
        this.pos.add(this.velocity);
        if (this.pos.x < -10) this.pos.x = this.canvas.width + 10;
        if (this.pos.y < -10) this.pos.y = this.canvas.height + 10;
        if (this.pos.x > this.canvas.width + 10) this.pos.x = -10;
        if (this.pos.y > this.canvas.height + 10) this.pos.y = -10;
    }

}

const canvas = document.getElementById('home-boids');
const parrentDiv = document.getElementById("Home");
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
let mousePos = null;

parrentDiv.addEventListener('mousemove', function (e) {
    if (e.offsetY > canvas.height) {
        mousePos = null;
    } else {
        mousePos = { x: e.x, y: e.y };
    }
    // console.log("mouse move: x:" + mousePos.x + ", y:" + mousePos.y);
});

parrentDiv.addEventListener('mouseleave', function () {
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
        if (mousePos != null) {
            drawCircle(ctx, mousePos.x, mousePos.y, 10)
        }
        requestAnimationFrame(animate);
    }

    animate();
}

setup();

function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'lightblue';
    ctx.stroke();
}

function resizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
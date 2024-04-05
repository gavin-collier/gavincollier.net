// class Boid {
//     static avgHeading = 0;
//     static boidCount = 0;
//     static avgPos = [0, 0];

//     constructor() {
//         this.x = Math.random() * (c.width);
//         this.y = Math.random() * (c.height);
//         this.heading = Math.random() * (360);;
//         this.velocity = 1;
//         Boid.boidCount++;
//     }

//     static getBoidCount() {
//         return Boid.boidCount;
//     }

//     static resetAvgHeading() {
//         Boid.avgHeading = 0;
//     }

//     static setAvgHeading(avgHeading) {
//         Boid.avgHeading = avgHeading;
//     }

//     static resetAvgPos() {
//         Boid.avgPos = [0, 0];
//     }

//     static setAvgPos(avgPos) {
//         Boid.avgPos = avgPos;
//     }

//     drawBoid(x, y, angle) {
//         const side = boidSize / 2;

//         // Calculate the center of the triangle for rotation
//         const centerX = x;
//         const centerY = y - boidSize / 6; // Adjusted for the shape of the triangle

//         // Convert angle from degrees to radians
//         const radians = angle * Math.PI / 180;

//         // Translate context to center of the triangle for rotation
//         ctx.save(); // Save the current context state
//         ctx.translate(centerX, centerY);
//         ctx.rotate(-radians); // Rotate context
//         ctx.translate(-centerX, -centerY); // Translate back

//         // Recalculate vertices relative to the new context origin
//         const x1 = x;
//         const y1 = y + boidSize / 2;
//         const x2 = x - side;
//         const y2 = y - boidSize / 2;
//         const x3 = x;
//         const y3 = y - boidSize / 10;
//         const x4 = x + side;
//         const y4 = y - boidSize / 2;

//         // Begin path for triangle
//         ctx.beginPath();
//         ctx.moveTo(x1, y1); // Move to the first vertex
//         ctx.lineTo(x2, y2); // Draw line to the second vertex
//         ctx.lineTo(x3, y3); // Draw line to the third vertex
//         ctx.lineTo(x4, y4); // Draw line to the forth vertex
//         ctx.closePath(); // Close the path

//         // Style and fill the triangle
//         ctx.fillStyle = 'white'; // Fill color
//         ctx.fill(); // Fill the triangle

//         ctx.restore(); // Restore the original context state
//     }

//     moveAway(boids, minSeparation = 50) {
//         let moveX = 0;
//         let moveY = 0;
//         let tooCloseCount = 0;

//         boids.forEach(other => {
//             if (other !== this) {
//                 const distance = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
//                 if (distance < minSeparation) {
//                     moveX += this.x - other.x;
//                     moveY += this.y - other.y;
//                     tooCloseCount++;
//                 }
//             }
//         });

//         if (tooCloseCount > 0) {
//             moveX /= tooCloseCount;
//             moveY /= tooCloseCount;

//             // Normalize the move away vector
//             const length = Math.sqrt(moveX ** 2 + moveY ** 2);
//             if (length > 0) {
//                 moveX /= length;
//                 moveY /= length;
//             }

//             // Apply the move away vector to the boid's position
//             this.x += moveX;
//             this.y += moveY;
//         }
//     }

//     moveCloser() {
//         const dx = Boid.avgPos[0] - this.x;
//         const dy = Boid.avgPos[1] - this.y;
//         console.log("avgPos = " + Boid.avgPos);

//         // Use atan2 to find the angle in radians
//         const angleRadians = Math.atan2(dx, dy);

//         // Convert the angle from radians to degrees
//         this.heading = angleRadians * 180 / Math.PI;
//     }

//     moveWith() {
//         this.heading -= (this.heading - Boid.avgHeading) / 20;
//     }

//     move(boids) {
//         this.moveAway(boids);
//         this.moveCloser();
//         this.moveWith();

//         // Convert angle from degrees to radians
//         const radians = this.heading * Math.PI / 180;

//         // Calculate the change in x and y based on the angle and velocity
//         const dx = Math.sin(radians) * this.velocity;
//         const dy = Math.cos(radians) * this.velocity;

//         // Update the position
//         this.x += dx;
//         this.y += dy;

//         const edge = boidSize * 2;
//         this.x = (this.x < 0 + edge) ? 0 + edge : this.x;
//         this.y = (this.y < 0 + edge) ? 0 + edge : this.y;
//         this.x = (this.x > c.width - edge) ? c.width - edge : this.x;
//         this.y = (this.y > c.height - edge) ? c.height - edge : this.y;

//         ctx.fillStyle = 'white';
//         this.drawBoid(this.x, this.y, this.heading)
//     }

// }

// const c = document.getElementById("home-boids");
// var ctx = c.getContext("2d");
// var dpr = window.devicePixelRatio || 1;
// var rect = c.getBoundingClientRect();
// c.width = rect.width * dpr;
// c.height = rect.height * dpr;
// ctx.scale(dpr, dpr);
// c.style.width = rect.width + 'px';
// c.style.height = rect.height + 'px';

// var mousePos = {
//     x: rect.width / 2,
//     y: rect.height / 2
// };

// const boidSize = 25;

// var boids = [new Boid, new Boid, new Boid];
// for (let i = 0; i < 100; i++){
//     boids.push(new Boid);
// }
// window.requestAnimationFrame(draw);

// c.addEventListener('mousemove', function (evt) {
//     mousePos = getMousePos(c, evt);
// }, false);

// c.addEventListener('mouseenter', function (evt) {
//     if (!mousePos) {
//         mousePos = getMousePos(c, evt);
//     }
// }, false);

// function getMousePos(canvas, evt) {
//     var rect = canvas.getBoundingClientRect();
//     return {
//         x: (evt.clientX - rect.left) * dpr,
//         y: (evt.clientY - rect.top) * dpr
//     };
// }

// function draw() {
//     ctx.clearRect(0, 0, c.width, c.height);
//     createText();

//     let avgHeading = 0;
//     let avgPos = [0, 0];
//     boids.forEach(boid => {
//         avgHeading += boid.heading;
//         avgPos[0] += boid.x;
//         avgPos[1] += boid.y;
//     });

//     avgPos[0] += mousePos.x;
//     avgPos[1] += mousePos.y;

//     Boid.setAvgHeading(avgHeading / boids.length);
//     // Boid.setAvgPos([avgPos[0] / (boids.length + 1), avgPos[1] / (boids.length + 1)]);
//     Boid.setAvgPos([mousePos.x, mousePos.y])

//     boids.forEach(boid => {
//         boid.move(boids);
//     });

//     Boid.resetAvgHeading();
//     Boid.resetAvgPos();

//     window.requestAnimationFrame(draw);
// }

// function getCursorPosition(canvas, event) {
//     const rect = canvas.getBoundingClientRect()
//     const x = event.clientX - rect.left
//     const y = event.clientY - rect.top
//     console.log("x: " + x + " y: " + y)
// }

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

        this.velocity.add(separation);
        this.velocity.add(alignment);
        this.velocity.add(cohesion);
        this.velocity.normalize();
        this.velocity.multiply(1); // Adjust speed if necessary

        this.pos.add(this.velocity);

        // Keep within bounds
        if (this.pos.x < 0) this.pos.x = this.canvas.width;
        if (this.pos.y < 0) this.pos.y = this.canvas.height;
        if (this.pos.x > this.canvas.width) this.pos.x = 0;
        if (this.pos.y > this.canvas.height) this.pos.y = 0;
    }
}
const canvas = document.getElementById('home-boids');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
function setup() {

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const boids = [];
    for (let i = 0; i < 100; i++) {
        boids.push(new Boid(canvas));
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        createText();
        for (let boid of boids) {
            boid.move(boids);
            boid.draw(ctx);
        }
        requestAnimationFrame(animate);
    }

    animate();
}

setup();

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
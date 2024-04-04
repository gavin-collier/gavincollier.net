class gridSquare {
    constructor(x, y, width, height, i, j) {
        this.x = x;
        this.y = y;
        this.endX = x + width;
        this.endY = y + height;
        this.i = i;
        this.j = j;
    }
}

class Boid {
    static avgHeading = [0, 0];

    constructor() {
        this.x = c.width / 2;
        this.y = c.height / 2;
        this.currentSquare = this.findCurrentGridSquare();
        this.xVelocity = 1;
        this.yVelocity = 1;
    }

    static resetAvgHeading(){
        this.avgHeading = [0, 0];
    }

    findCurrentGridSquare() {
        let foundI = 0;
        for (let i = 0; i < canvasGrid[0].length; i++) {
            if (this.x > canvasGrid[i][0].x && this.x < canvasGrid[i][0].endX) {
                foundI = i;
            }
        }

        let foundJ = 0;
        for (let j = 0; j < canvasGrid[1].length; j++) {
            if (this.y > canvasGrid[foundI][j].y && this.y < canvasGrid[foundI][j].endY) {
                foundJ = j;
            }
        }
        return canvasGrid[foundI][foundJ];
    }

    moveAway() {

    }

    moveCloser() {

    }

    moveWith() {
        avgHeading[0] = (this.xVelocity > 1) ? 1 : 0;
        avgHeading[1] = (this.yVelocity > 1) ? 1 : 0;

        this.xVelocity += avgHeading[0];
        this.yVelocity += avgHeading[1];
    }

    move() {
        this.xVelocity += Math.random() * (2 + 2) - 2;
        this.yVelocity += Math.random() * (2 + 2) - 2;
        this.xVelocity = (this.xVelocity > 2) ? 2 : this.xVelocity;
        this.xVelocity = (this.xVelocity < -2) ? -2 : this.xVelocity;
        this.yVelocity = (this.yVelocity > 2) ? 2 : this.yVelocity;
        this.yVelocity = (this.yVelocity < -2) ? -2 : this.yVelocity;

        this.x += this.xVelocity;
        this.y += this.yVelocity;
        

        const edge = boidSize * 1.2;
        this.x = (this.x < 0 + edge) ? 0 + edge : this.x;
        this.y = (this.y < 0 + edge) ? 0 + edge : this.y;
        this.x = (this.x > c.width - edge) ? c.width - edge : this.x;
        this.y = (this.y > c.height - edge) ? c.height - edge : this.y;

        ctx.fillStyle = 'white';
        drawTriangle(this.x, this.y)

        this.currentSquare = this.findCurrentGridSquare();
        console.log(this.currentSquare);
    }

}

const c = document.getElementById("home-boids");
var ctx = c.getContext("2d");
var dpr = window.devicePixelRatio || 1;
var rect = c.getBoundingClientRect();
c.width = rect.width * dpr;
c.height = rect.height * dpr;
ctx.scale(dpr, dpr);
c.style.width = rect.width + 'px';
c.style.height = rect.height + 'px';

const canvasGrid = divideCanvas(500);
const boidSize = 50;
console.log(canvasGrid);

var testBoid = [new Boid, new Boid, new Boid, new Boid];
window.requestAnimationFrame(draw);

function draw() {
    Boid.resetAvgHeading();
    ctx.clearRect(0, 0, c.width, c.height);

    testBoid.forEach(boid => {
        boid.move();
    })
    createText();
    window.requestAnimationFrame(draw);
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    console.log("x: " + x + " y: " + y)
}

function drawTriangle(x, y) {
    const side = boidSize;

    const height = (5 * Math.sqrt(3)) * 5;

    // Calculate the vertices of the triangle
    const x1 = x - side / 2;
    const y1 = y + height / 3;
    const x2 = x + side / 2;
    const y2 = y1;
    const x3 = x;
    const y3 = y - (2 * height) / 3;

    // Begin path for triangle
    ctx.beginPath();
    ctx.moveTo(x1, y1); // Move to the first vertex
    ctx.lineTo(x2, y2); // Draw line to the second vertex
    ctx.lineTo(x3, y3); // Draw line to the third vertex
    ctx.closePath(); // Close the path to automatically draw the last side

    // You can style the triangle
    ctx.fillStyle = 'white'; // Fill color
    ctx.fill(); // Fill the triangle
}

function divideCanvas(n) {
    var canvasGrid = [];

    const aspectRatio = c.width / c.height;
    const squaresPerColumn = Math.round(Math.sqrt(n / aspectRatio));
    const squaresPerRow = Math.round(n / squaresPerColumn);

    const squareWidth = c.width / squaresPerRow;
    const squareHeight = c.height / squaresPerColumn;
    const borderSize = 2;


    for (let i = 0; i < squaresPerRow; i++) {
        canvasGrid.push([]);
        for (let j = 0; j < squaresPerColumn; j++) {
            const x = i * squareWidth + borderSize;
            const y = j * squareHeight + borderSize;
            const width = squareWidth - (borderSize * 2);
            const height = squareHeight - (borderSize * 2);
            canvasGrid[i][j] = new gridSquare(x, y, width, height, i, j);
        }
    }

    return canvasGrid;
}

function createText() {
    // Styles
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fontSizeTitle = 3.5 * dpr;
    var fontSizeSubtitle = 1.75 * dpr;
    ctx.font = `${fontSizeTitle}rem Times New Roman`;

    ctx.fillText("Gavin Collier", c.width / 2, c.height / 2 - 100);
    ctx.font = `${fontSizeSubtitle}rem Times New Roman`;
    ctx.fillText("I'm currently a student at ASU and working part-time as a student IT technician.", c.width / 2, c.height / 2 + 25);
    ctx.fillText("I have a lifelong love of computers and programming, I hope to turn this lifelong interest into a carrier someday!", c.width / 2, c.height / 2 + 75);
}
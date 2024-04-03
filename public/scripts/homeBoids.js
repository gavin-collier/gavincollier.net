const Boid = {
    x : 0,
    y : 0,
    xVelocity : 1,
    yVelocity : -1,
    moveAway : function () {
        
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
createText();

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
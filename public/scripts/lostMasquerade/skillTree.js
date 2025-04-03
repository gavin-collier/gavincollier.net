const canvas = document.getElementById('skillCanvas');
const parrentDiv = document.getElementById("skillCanvas-container")
const ctx = canvas.getContext('2d');
const sidebar = document.getElementById('sidebar');
const nodeTitle = document.getElementById('nodeTitle');
const nodeTooltip = document.getElementById('nodeTooltip');
const closeSidebarBtn = document.getElementById('closeSidebar');

let nodes = [];
let links = [];

let scale = 1;
let offsetX = 0, offsetY = 0;
let dragStart = null;
let hoveredNode = null;

function draw() {
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.clearRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);

    links.forEach(link => {
        const from = nodes.find(n => n.id === link.from);
        const to = nodes.find(n => n.id === link.to);
        drawCurve(from, to);
    });

    nodes.forEach(drawNode);
}

function drawNode(node) {
    const w = 160, h = 40;
    ctx.fillStyle = node.color;
    ctx.fillRect(node.x, node.y, w, h);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(node.x, node.y, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText(node.label, node.x + 10, node.y + 25);
}

function drawCurve(from, to) {
    const startX = from.x + 80;
    const startY = from.y + 40;
    const endX = to.x + 80;
    const endY = to.y;

    const cp1X = startX;
    const cp1Y = (startY + endY) / 2;
    const cp2X = endX;
    const cp2Y = (startY + endY) / 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function toWorldCoords(x, y) {
    return {
        x: (x - offsetX) / scale,
        y: (y - offsetY) / scale
    };
}

function getNodeAt(x, y) {
    return nodes.find(n =>
        x > n.x && x < n.x + 160 && y > n.y && y < n.y + 40
    );
}

canvas.addEventListener('mousedown', e => {
    const mouse = toWorldCoords(e.clientX, e.clientY);
    const node = getNodeAt(mouse.x, mouse.y);
    if (node) {
        openSidebar(node);
    } else {
        dragStart = { x: e.clientX - offsetX, y: e.clientY - offsetY };
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (dragStart) {
      dragStart = null;
      const mouse = toWorldCoords(e.clientX, e.clientY);
      const clickedNode = getNodeAt(mouse.x, mouse.y);
  
      if (clickedNode) {
        openSidebar(clickedNode);
      }
    }
  });
  

canvas.addEventListener('mousemove', e => {
    if (dragStart) {
        offsetX = e.clientX - dragStart.x;
        offsetY = e.clientY - dragStart.y;
        draw();
    } else {
        const mouse = toWorldCoords(e.clientX, e.clientY);
        const node = getNodeAt(mouse.x, mouse.y);
        hoveredNode = node;
        canvas.style.cursor = node ? 'pointer' : 'default';
    }
});

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const mouse = toWorldCoords(e.clientX, e.clientY);
    const zoom = 1 - e.deltaY * 0.001;
    const newScale = scale * zoom;
    offsetX -= (mouse.x * newScale - mouse.x * scale);
    offsetY -= (mouse.y * newScale - mouse.y * scale);
    scale = newScale;
    draw();
});

function openSidebar(node) {
    console.log("Opening SideBar!");
    sidebar.style.display = "block";
    nodeTitle.textContent = node.label || "Unknown Skill";
    nodeTooltip.textContent = node.tooltip || "No description available.";
    sidebar.style.width = "35vw"; // Adjust as needed
  }

closeSidebarBtn.addEventListener('click', () => {
    sidebar.style.display = "none";
    sidebar.style.width = "0"; // Adjust as needed
});

async function loadJSON() {
    const res = await fetch("/masquerade/herald/skilltree.json");
    const data = await res.json();
    nodes = data.nodes.map(n => ({ ...n, expanded: true, hidden: false }));
    links = data.links;
    draw();
}

setup();
window.addEventListener('resize', resizeCanvas);

function setup() {
    resizeCanvas();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
loadJSON();

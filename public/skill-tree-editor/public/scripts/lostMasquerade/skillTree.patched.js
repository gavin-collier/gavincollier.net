const canvas = document.getElementById('skillCanvas');
const ctx = canvas.getContext("2d");

let nodes = [];
let links = [];
let selectedNode = null;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    links.forEach(link => {
        const from = nodes.find(n => n.id === link.from);
        const to = nodes.find(n => n.id === link.to);
        drawCurve(from, to);
    });
    nodes.forEach(drawNode);
}

function drawNode(node) {
    const w = 160, h = 60;
    ctx.fillStyle = "#888";
    ctx.fillRect(node.x, node.y, w, h);
    ctx.strokeStyle = selectedNode === node ? "#FFD700" : "#fff";
    ctx.strokeRect(node.x, node.y, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.id, node.x + w / 2, node.y + h / 2);
}

function drawCurve(from, to) {
    const startX = from.x + 80;
    const startY = from.y + 60;
    const endX = to.x + 80;
    const endY = to.y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "#aaa";
    ctx.stroke();
}

function addNode(id, x, y) {
    const newNode = { id, x, y, cost: 0, type: "Other", requirements: {}, exclusions: [] };
    nodes.push(newNode);
    draw();
}

function editNode(id, newProperties) {
    const node = nodes.find(n => n.id === id);
    if (node) {
        Object.assign(node, newProperties);
        draw();
    }
}

function deleteNode(id) {
    nodes = nodes.filter(n => n.id !== id);
    links = links.filter(link => link.from !== id && link.to !== id);
    draw();
}

function updateConnection(fromId, toId) {
    if (!links.some(link => link.from === fromId && link.to === toId)) {
        links.push({ from: fromId, to: toId });
        draw();
    }
}

canvas.addEventListener('click', (e) => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    selectedNode = nodes.find(n => mouseX > n.x && mouseX < n.x + 160 && mouseY > n.y && mouseY < n.y + 60);
    draw();
});

document.getElementById('addNodeButton').addEventListener('click', () => {
    const nodeId = prompt("Enter node ID:");
    const x = Math.random() * (canvas.width - 160);
    const y = Math.random() * (canvas.height - 60);
    addNode(nodeId, x, y);
});

document.getElementById('editNodeButton').addEventListener('click', () => {
    if (selectedNode) {
        const newId = prompt("Enter new ID:", selectedNode.id);
        const newCost = prompt("Enter new cost:", selectedNode.cost);
        editNode(selectedNode.id, { id: newId, cost: newCost });
    }
});

document.getElementById('deleteNodeButton').addEventListener('click', () => {
    if (selectedNode) {
        deleteNode(selectedNode.id);
        selectedNode = null;
    }
});

document.getElementById('updateConnectionButton').addEventListener('click', () => {
    const fromId = prompt("Enter from node ID:");
    const toId = prompt("Enter to node ID:");
    updateConnection(fromId, toId);
});

async function loadJSON() {
    const res = await fetch("/masquerade/herald/skilltree.json");
    const data = await res.json();
    nodes = data.nodes;
    links = data.links;
    draw();
}

loadJSON();
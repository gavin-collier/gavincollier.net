const canvas = document.getElementById('skillCanvas');
const parentDiv = document.getElementById("skillCanvas-container")
const ctx = canvas.getContext("2d");

const TYPE_COLORS = {
    "Other": "#a85fe3",
    "Defense": "#f0b55d",
    "Attack": "#e27f6d",
    "Speed": "#7bb8e7",
    "Energy": "#f0f0f0"
};

let purchasedNodes = new Set();
let totalCost = 0;

const costDisplayBox = document.createElement("div");
costDisplayBox.style.position = "absolute";
costDisplayBox.style.top = "10px";
costDisplayBox.style.right = "10px";
costDisplayBox.style.padding = "10px";
costDisplayBox.style.backgroundColor = "#222";
costDisplayBox.style.color = "#fff";
costDisplayBox.style.border = "1px solid #888";
costDisplayBox.style.fontFamily = "sans-serif";
costDisplayBox.innerText = "Total Cost: 0";
document.body.appendChild(costDisplayBox);

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
    const w = 160, h = 60;
    const color = TYPE_COLORS[node.type] || "#888";
    ctx.fillStyle = color;
    ctx.fillRect(node.x, node.y, w, h);
    ctx.strokeStyle = purchasedNodes.has(node.id) ? "#FFD700" : "#fff";
    ctx.strokeRect(node.x, node.y, w, h);

    // Label
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.id, node.x + w / 2, node.y + h / 2);

    // Cost box (top-right)
    ctx.fillStyle = "#000";
    ctx.fillRect(node.x + w - 25, node.y, 25, 18);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(node.x + w - 25, node.y, 25, 18);
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.cost, node.x + w - 12.5, node.y + 9);
};

function drawCurve(from, to) {
    const startX = from.x + 80;
    const startY = from.y + 60;
    const endX = to.x + 80;
    const endY = to.y;
  
    const cp1X = startX;
    const cp1Y = (startY + endY) / 2;
    const cp2X = endX;
    const cp2Y = (startY + endY) / 2;
  
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
  
    // Gold if both purchased
    const isPurchasedPath = purchasedNodes.has(from.id) && purchasedNodes.has(to.id);
    ctx.strokeStyle = isPurchasedPath ? "#FFD700" : "#aaa";
    ctx.lineWidth = isPurchasedPath ? 3 : 2;
    ctx.stroke();
  }
  

function toWorldCoords(x, y) {
    return {
        x: (x - offsetX) / scale,
        y: (y - offsetY) / scale
    };
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

function getNodeAt(x, y) {
    return nodes.find(n =>
        x > n.x && x < n.x + 160 && y > n.y - 40 && y < n.y + 30
    );
}

function getParents(node) {
    return links
      .filter(link => link.to === node.id)
      .map(link => nodes.find(n => n.id === link.from));
  }  

canvas.addEventListener('mousemove', e => {
    if (dragStart) {
        canvas.style.cursor = 'grabbing';

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
    const sidebar = document.getElementById("sidebar");
    const nodeTitle = document.getElementById("nodeTitle");
    const detailsBox = document.getElementById("nodeDetails");

    const populateSidebar = () => {
        nodeTitle.textContent = node.id || "Unknown Skill";
        nodeTitle.style.color = TYPE_COLORS[node.type] || "#888";
        detailsBox.innerHTML = `
        <p><strong>Type:</strong> ${node.type}</p>
        <p><strong>Cost:</strong> ${node.cost}</p>
        ${node.requirements ? `<p><strong>Requirements:</strong> ${Object.entries(node.requirements).map(([t, v]) => `(${t} ${v})`).join(', ')}</p>` : ''}
        ${node.exclusions?.length ? `<p><strong>Excludes:</strong> ${node.exclusions.join(', ')}</p>` : ''}
        <p class="tooltip-text">${node.description || 'No description provided.'}</p>
      `;

        const existingBtn = document.getElementById("buyButton");
        if (existingBtn) existingBtn.remove();

        const buyBtn = document.createElement("button");
        buyBtn.id = "buyButton";
        buyBtn.innerText = "Buy";
        buyBtn.style.marginTop = "10px";

        const hasParent = getParents(node).some(parent => purchasedNodes.has(parent.id));
        const disabled = node.exclusions?.some(id => purchasedNodes.has(id)) ||
                         !meetsRequirements(node.requirements) ||
                         (getParents(node).length > 0 && !hasParent);

        if (purchasedNodes.has(node.id)) {
            buyBtn.disabled = true;
            buyBtn.innerText = "Purchased";
        } else if (disabled) {
            buyBtn.disabled = true;
            buyBtn.style.opacity = 0.5;
        }

        buyBtn.onclick = () => {
            purchasedNodes.add(node.id);
            totalCost += node.cost;
            costDisplayBox.innerText = "Total Cost: " + totalCost;
            buyBtn.disabled = true;
            buyBtn.innerText = "Purchased";
            draw();
        };

        detailsBox.appendChild(buyBtn);
        sidebar.style.right = "5vw";
    };

    if (sidebar.style.right === "0px" || sidebar.style.right === "5vw") {
        // Sidebar is open; close first, then repopulate after transition
        sidebar.style.right = "-50vw";
        setTimeout(populateSidebar, 300); // matches CSS transition duration
    } else {
        populateSidebar();
    }
}

closeSidebarBtn.addEventListener('click', () => {
    sidebar.style.right = "-50vw"
});

function meetsRequirements(reqs) {
    if (!reqs) return true;

    const spentByType = {};
    for (let id of purchasedNodes) {
        const n = nodes.find(n => n.id === id);
        if (n) {
            spentByType[n.type] = (spentByType[n.type] || 0) + n.cost;
        }
    }

    return Object.entries(reqs).every(([type, amountNeeded]) =>
        (spentByType[type] || 0) >= amountNeeded
    );
}


async function loadJSON() {
    console.log("Patched!")
    const res = await fetch("/masquerade/herald/skilltree.json");
    const data = await res.json();
    nodes = data.nodes.map(n => ({ ...n, expanded: true, hidden: false }));
    links = data.links;
    draw();
}

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

resizeCanvas();
loadJSON();
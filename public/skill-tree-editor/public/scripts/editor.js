const editorContainer = document.getElementById('editor-container');
const nodeForm = document.getElementById('node-form');
const nodeList = document.getElementById('nodeList');
const connectionsList = document.getElementById('connectionsList');
const skillCanvas = document.getElementById('skillCanvas');
const ctx = skillCanvas.getContext('2d');
let nodes = [];
let connections = [];
let selectedNodeIds = new Set();
let draggingNodeId = null;
let dragOffset = { x: 0, y: 0 };

// --- Make skill tree canvas resizable and zoomable, like skillTree.patched.js ---
let scale = 1;
let minScale = 0.1;
let maxScale = 3;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let panStart = { x: 0, y: 0 };

function addNode() {
    const nodeId = document.getElementById('nodeId').value;
    const nodeType = document.getElementById('nodeType').value;
    const nodeCost = parseInt(document.getElementById('nodeCost').value);
    const nodeDescription = document.getElementById('nodeDescription').value;
    const nodeX = parseInt(document.getElementById('nodeX').value) || 0;
    const nodeY = parseInt(document.getElementById('nodeY').value) || 0;
    // Exclusions
    const exclContainer = document.getElementById('exclusionsEditor');
    const exclusions = exclContainer && exclContainer._exclusions ? [...exclContainer._exclusions] : [];
    // Requirements
    const reqsContainer = document.getElementById('requirementsEditor');
    const requirements = reqsContainer && reqsContainer._requirements ? {...reqsContainer._requirements} : {};
    const newNode = {
        id: nodeId,
        type: nodeType,
        cost: nodeCost,
        description: nodeDescription,
        x: nodeX,
        y: nodeY,
        requirements,
        exclusions
    };

    nodes.push(newNode);
    updateNodeList();
    saveToJSON();
}

function editNode(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        document.getElementById('nodeId').value = node.id;
        document.getElementById('nodeType').value = node.type;
        document.getElementById('nodeCost').value = node.cost;
        document.getElementById('nodeDescription').value = node.description;
        document.getElementById('nodeX').value = node.x || 0;
        document.getElementById('nodeY').value = node.y || 0;
        showNodeConnections(node.id);
        // Patch: load exclusions/requirements
        patchNodeFormExclusionsRequirements(node);
    }
}

// --- Canvas click: select node and populate editor and connection fields ---
skillCanvas.addEventListener('mousedown', e => {
    if (e.button === 0) { // left click
        const rect = skillCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - offsetX) / scale;
        const y = (e.clientY - rect.top - offsetY) / scale;
        const node = nodes.find(n => x > n.x && x < n.x + 160 && y > n.y && y < n.y + 70);
        if (node) {
            if (e.shiftKey) {
                // Only populate To node in connection editor
                toNodeInput.value = node.id;
            } else {
                selectedNodeIds.clear();
                selectedNodeIds.add(node.id);
                editNode(node.id);
                fromNodeInput.value = node.id;
                drawSkillTree();
            }
        }
    }
});

function deleteNode(nodeId) {
    nodes = nodes.filter(n => n.id !== nodeId);
    updateNodeList();
    saveToJSON();
}

function updateConnection(fromNodeId, toNodeId) {
    if (!fromNodeId || !toNodeId) return;
    const exists = connections.some(c => c.from === fromNodeId && c.to === toNodeId);
    if (!exists) {
        connections.push({ from: fromNodeId, to: toNodeId });
        saveToJSON();
        drawSkillTree();
    }
}

function updateNodeList() {
    if (!nodeList) return; // Prevent error if nodeList is not present
    nodeList.innerHTML = '';
    nodes.forEach(node => {
        const li = document.createElement('li');
        li.textContent = `${node.id} (${node.type})`;
        li.appendChild(createEditButton(node.id));
        li.appendChild(createDeleteButton(node.id));
        nodeList.appendChild(li);
    });
}

// Fix: Only get connectionsList if it exists in the DOM
function updateConnectionsList() {
    if (!connectionsList) return; // Prevent error if connectionsList is not present
    connectionsList.innerHTML = '';
    connections.forEach(conn => {
        const li = document.createElement('li');
        li.textContent = `${conn.from} -> ${conn.to}`;
        connectionsList.appendChild(li);
    });
}

function createEditButton(nodeId) {
    const button = document.createElement('button');
    button.textContent = 'Edit';
    button.onclick = () => editNode(nodeId);
    return button;
}

function createDeleteButton(nodeId) {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.onclick = () => deleteNode(nodeId);
    return button;
}

function saveToJSON() {
    const data = {
        nodes: nodes,
        connections: connections
    };
    const json = JSON.stringify(data, null, 2);
    fetch('/masquerade/herald/skilltree.json', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: json
    });
}

nodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addNode();
    nodeForm.reset();
});

// Add file input for uploading JSON
const uploadInput = document.createElement('input');
uploadInput.type = 'file';
uploadInput.accept = '.json,application/json';
uploadInput.style.margin = '10px 0';
uploadInput.addEventListener('change', handleFileUpload);
document.getElementById('editor-container').insertBefore(uploadInput, document.getElementById('skill-tree-display').nextSibling);

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            nodes = data.nodes || [];
            connections = data.connections || data.links || [];
            updateNodeList();
            updateConnectionsList();
            drawSkillTree();
        } catch (err) {
            alert('Invalid JSON file.');
        }
    };
    reader.readAsText(file);
}

function resizeSkillCanvas() {
    // Make canvas fill the display div
    const display = document.getElementById('skill-tree-display');
    skillCanvas.width = window.innerWidth * 0.95;
    skillCanvas.height = Math.max(600, window.innerHeight * 0.7);
    drawSkillTree();
}

window.addEventListener('resize', resizeSkillCanvas);
resizeSkillCanvas();

function toWorldCoords(x, y) {
    return {
        x: (x - offsetX) / scale,
        y: (y - offsetY) / scale
    };
}

const TYPE_COLORS = {
    "Other": "#a85fe3",
    "Defense": "#f0b55d",
    "Attack": "#e27f6d",
    "Speed": "#7bb8e7",
    "Energy": "#f0f0f0"
};

function drawSkillTree() {
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.clearRect(-offsetX / scale, -offsetY / scale, skillCanvas.width / scale, skillCanvas.height / scale);
    // Draw connections as bezier curves
    connections.forEach(conn => {
        const from = nodes.find(n => n.id === conn.from);
        const to = nodes.find(n => n.id === conn.to);
        if (from && to) {
            // Match skillTree.patched.js: from bottom center to top center
            const startX = from.x + 80;
            const startY = from.y + 40;
            const endX = to.x + 80;
            const endY = to.y + 40;
            const cp1X = startX;
            const cp1Y = (startY + endY) / 2;
            const cp2X = endX;
            const cp2Y = (startY + endY) / 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    // Draw nodes
    nodes.forEach(node => {
        ctx.save();
        ctx.fillStyle = TYPE_COLORS[node.type] || '#6b6b6b';
        ctx.strokeStyle = selectedNodeIds.has(node.id) ? '#f1c40f' : '#222';
        ctx.lineWidth = 2;
        ctx.fillRect(node.x, node.y, 160, 70);
        ctx.strokeRect(node.x, node.y, 160, 70);
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x + 80, node.y + 35);
        ctx.restore();
    });
}

// Zoom with mouse wheel
skillCanvas.addEventListener('wheel', e => {
    e.preventDefault();
    const mouse = toWorldCoords(e.offsetX, e.offsetY);
    let zoom = 1 - e.deltaY * 0.001;
    let newScale = Math.max(minScale, Math.min(maxScale, scale * zoom));
    offsetX -= (mouse.x * newScale - mouse.x * scale);
    offsetY -= (mouse.y * newScale - mouse.y * scale);
    scale = newScale;
    drawSkillTree();
});

// Pan with right mouse or middle mouse
skillCanvas.addEventListener('mousedown', e => {
    if (e.button === 1 || e.button === 2) {
        isPanning = true;
        panStart.x = e.clientX - offsetX;
        panStart.y = e.clientY - offsetY;
        skillCanvas.style.cursor = 'grabbing';
        if (e.button === 2) e.preventDefault(); // Prevent right-click menu
    }
});

// Prevent context menu on right click for the canvas
skillCanvas.addEventListener('contextmenu', e => {
    e.preventDefault();
});

window.addEventListener('mousemove', e => {
    if (isPanning) {
        offsetX = e.clientX - panStart.x;
        offsetY = e.clientY - panStart.y;
        drawSkillTree();
    }
});

window.addEventListener('mouseup', e => {
    if (isPanning) {
        isPanning = false;
        skillCanvas.style.cursor = 'default';
    }
});

// --- Improved Batch Location Updater ---
const batchForm = document.createElement('form');
batchForm.id = 'batch-location-updater';
batchForm.style.background = '#fff';
batchForm.style.padding = '15px';
batchForm.style.borderRadius = '5px';
batchForm.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
batchForm.style.marginTop = '20px';
batchForm.style.width = '100%';
batchForm.style.maxWidth = '400px';
batchForm.style.display = 'flex';
batchForm.style.flexDirection = 'column';
batchForm.style.alignItems = 'flex-start';

batchForm.innerHTML = `
    <h3 style="margin-bottom:10px;">Batch Location Updater</h3>
    <div style="display:flex;gap:10px;width:100%;margin-bottom:10px;">
        <label style="flex:1;">Current X: <input type="number" id="batchCurrentX" readonly style="width:80px;background:#eee;"></label>
        <label style="flex:1;">Current Y: <input type="number" id="batchCurrentY" readonly style="width:80px;background:#eee;"></label>
    </div>
    <div style="display:flex;gap:10px;width:100%;margin-bottom:10px;">
        <label style="flex:1;">ΔX: <input type="number" id="batchDx" value="0" style="width:80px;"></label>
        <label style="flex:1;">ΔY: <input type="number" id="batchDy" value="0" style="width:80px;"></label>
    </div>
    <div style="display:flex;gap:10px;width:100%;margin-bottom:10px;">
        <button type="submit" class="editor-btn" style="flex:1;">Shift Selected</button>
        <button type="button" id="shiftMatchingXBtn" class="editor-btn" style="background:#3498db;flex:1;">Shift All with X</button>
        <button type="button" id="shiftMatchingYBtn" class="editor-btn" style="background:#f39c12;flex:1;">Shift All with Y</button>
    </div>
`;

// Remove old batchForm if present
const oldBatchForm = document.getElementById('batch-location-updater');
if (oldBatchForm) oldBatchForm.remove();
document.getElementById('editor-container').appendChild(batchForm);

function updateBatchCurrentXY() {
    // If one node selected, show its X/Y. If multiple, show first. If none, blank.
    let x = '', y = '';
    if (selectedNodeIds.size > 0) {
        const node = nodes.find(n => selectedNodeIds.has(n.id));
        if (node) {
            x = node.x;
            y = node.y;
        }
    }
    document.getElementById('batchCurrentX').value = x;
    document.getElementById('batchCurrentY').value = y;
}

batchForm.onsubmit = function(e) {
    e.preventDefault();
    const dx = parseInt(document.getElementById('batchDx').value) || 0;
    const dy = parseInt(document.getElementById('batchDy').value) || 0;
    nodes.forEach(n => {
        if (selectedNodeIds.has(n.id)) {
            n.x += dx;
            n.y += dy;
        }
    });
    drawSkillTree();
    updateBatchCurrentXY();
};

document.getElementById('shiftMatchingXBtn').onclick = function() {
    const dx = parseInt(document.getElementById('batchDx').value) || 0;
    let matchX = '';
    if (selectedNodeIds.size > 0) {
        const node = nodes.find(n => selectedNodeIds.has(n.id));
        if (node) matchX = node.x;
    }
    if (matchX === '') return;
    nodes.forEach(n => {
        if (n.x === matchX) n.x += dx;
    });
    drawSkillTree();
    updateBatchCurrentXY();
};

document.getElementById('shiftMatchingYBtn').onclick = function() {
    const dy = parseInt(document.getElementById('batchDy').value) || 0;
    let matchY = '';
    if (selectedNodeIds.size > 0) {
        const node = nodes.find(n => selectedNodeIds.has(n.id));
        if (node) matchY = node.y;
    }
    if (matchY === '') return;
    nodes.forEach(n => {
        if (n.y === matchY) n.y += dy;
    });
    drawSkillTree();
    updateBatchCurrentXY();
};

// Update batch X/Y when node selection changes
function patchBatchUpdaterSelection() {
    updateBatchCurrentXY();
}
// Patch into canvas click
const oldSkillCanvasHandler = skillCanvas.onmousedown;
skillCanvas.addEventListener('mousedown', function(e) {
    setTimeout(updateBatchCurrentXY, 0);
    if (typeof oldSkillCanvasHandler === 'function') oldSkillCanvasHandler(e);
});
// Also update after Shift Selected
document.getElementById('addNodeBtn').onclick = function() {
    addNode();
    drawSkillTree();
    updateRawJsonArea();
};
document.getElementById('editNodeBtn').onclick = function() {
    const nodeId = document.getElementById('nodeId').value;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        node.type = document.getElementById('nodeType').value;
        node.cost = parseInt(document.getElementById('nodeCost').value);
        node.description = document.getElementById('nodeDescription').value;
        node.x = parseInt(document.getElementById('nodeX').value) || 0;
        node.y = parseInt(document.getElementById('nodeY').value) || 0;
        // Exclusions
        const exclContainer = document.getElementById('exclusionsEditor');
        node.exclusions = exclContainer && exclContainer._exclusions ? [...exclContainer._exclusions] : [];
        // Requirements
        const reqsContainer = document.getElementById('requirementsEditor');
        node.requirements = reqsContainer && reqsContainer._requirements ? {...reqsContainer._requirements} : {};
        updateNodeList();
        drawSkillTree();
        updateRawJsonArea();
        saveToJSON();
    }
};
document.getElementById('deleteNodeBtn').onclick = function() {
    const nodeId = document.getElementById('nodeId').value;
    deleteNode(nodeId);
    drawSkillTree();
    updateRawJsonArea();
};

// Add a button to clear all fields in the active edit node
const clearNodeBtn = document.createElement('button');
clearNodeBtn.textContent = 'Clear Fields';
clearNodeBtn.className = 'editor-btn';
clearNodeBtn.style.background = '#888';
clearNodeBtn.style.marginLeft = '10px';
clearNodeBtn.onclick = function() {
    document.getElementById('nodeId').value = '';
    document.getElementById('nodeType').value = 'Other';
    document.getElementById('nodeCost').value = '';
    document.getElementById('nodeDescription').value = '';
    document.getElementById('nodeX').value = '';
    document.getElementById('nodeY').value = '';
};
// Insert after the delete button in the node form
const deleteBtn = document.getElementById('deleteNodeBtn');
deleteBtn.parentNode.insertBefore(clearNodeBtn, deleteBtn.nextSibling);

// --- Connection Editor: Add delete and auto-populate features ---
const fromNodeInput = document.getElementById('fromNode');
const toNodeInput = document.getElementById('toNode');
const updateConnectionBtn = document.getElementById('updateConnectionBtn');

// --- Remove global connection list, fix FROM/TO display in node-specific list ---
// Remove renderConnectionList and its call, and only show node-specific connections

// --- Show connections for selected node in connection editor ---
function showNodeConnections(nodeId) {
    let nodeConnDiv = document.getElementById('node-connection-list');
    if (!nodeConnDiv) {
        nodeConnDiv = document.createElement('div');
        nodeConnDiv.id = 'node-connection-list';
        document.getElementById('connection-form').appendChild(nodeConnDiv);
    }
    nodeConnDiv.innerHTML = '';
    if (!nodeId) return;
    const fromConns = connections.filter(c => c.from === nodeId);
    const toConns = connections.filter(c => c.to === nodeId);
    if (fromConns.length === 0 && toConns.length === 0) {
        nodeConnDiv.innerHTML = '<p style="color:#888">No connections for this node</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    fromConns.forEach((conn) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.marginBottom = '4px';
        // FROM (selected node) → TO (conn.to)
        li.innerHTML = `<span style='flex:1;'><strong>To:</strong> <span class='conn-id' style='color:#3498db;cursor:pointer;'>${conn.to}</span></span>`;
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Remove';
        delBtn.className = 'editor-btn';
        delBtn.style.background = '#c0392b';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = () => {
            const idx = connections.findIndex(c => c.from === conn.from && c.to === conn.to);
            if (idx !== -1) {
                connections.splice(idx, 1);
                showNodeConnections(nodeId);
                saveToJSON();
                drawSkillTree();
            }
        };
        // Populate To box on click
        li.querySelector('.conn-id').onclick = () => {
            toNodeInput.value = conn.to;
        };
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
    toConns.forEach((conn) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.marginBottom = '4px';
        // FROM (conn.from) → TO (selected node)
        li.innerHTML = `<span style='flex:1;'><strong>From:</strong> <span class='conn-id' style='color:#e67e22;cursor:pointer;'>${conn.from}</span></span>`;
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Remove';
        delBtn.className = 'editor-btn';
        delBtn.style.background = '#c0392b';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = () => {
            const idx = connections.findIndex(c => c.from === conn.from && c.to === conn.to);
            if (idx !== -1) {
                connections.splice(idx, 1);
                showNodeConnections(nodeId);
                saveToJSON();
                drawSkillTree();
            }
        };
        // Populate From box on click
        li.querySelector('.conn-id').onclick = () => {
            fromNodeInput.value = conn.from;
        };
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
    nodeConnDiv.appendChild(ul);
}

// Patch editNode to show connections for selected node
function editNode(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        document.getElementById('nodeId').value = node.id;
        document.getElementById('nodeType').value = node.type;
        document.getElementById('nodeCost').value = node.cost;
        document.getElementById('nodeDescription').value = node.description;
        document.getElementById('nodeX').value = node.x || 0;
        document.getElementById('nodeY').value = node.y || 0;
        showNodeConnections(node.id);
        // Patch: load exclusions/requirements
        patchNodeFormExclusionsRequirements(node);
    }
}

// --- Add RAW JSON view toggle and download/save functionality ---
const nodeFormDiv = document.getElementById('node-form');
const buttonGroup = document.createElement('div');
buttonGroup.style.display = 'flex';
buttonGroup.style.justifyContent = 'flex-end';
buttonGroup.style.gap = '10px';
buttonGroup.style.marginBottom = '10px';

const toggleRawBtn = document.createElement('button');
toggleRawBtn.textContent = 'Show RAW JSON';
toggleRawBtn.className = 'editor-btn toggle-raw-btn';

const saveJsonBtn = document.createElement('button');
saveJsonBtn.textContent = 'Download JSON';
saveJsonBtn.className = 'editor-btn download-json-btn';

buttonGroup.appendChild(toggleRawBtn);
buttonGroup.appendChild(saveJsonBtn);

// Insert button group above node form
nodeFormDiv.parentNode.insertBefore(buttonGroup, nodeFormDiv);

// RAW JSON container styled to match node form
const rawJsonContainer = document.createElement('div');
rawJsonContainer.style.display = 'none';
rawJsonContainer.style.background = '#fff';
rawJsonContainer.style.padding = '15px';
rawJsonContainer.style.borderRadius = '5px';
rawJsonContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
rawJsonContainer.style.marginTop = '20px';
rawJsonContainer.style.width = '100%';

const rawJsonArea = document.createElement('textarea');
rawJsonArea.style.width = '100%';
rawJsonArea.style.height = '250px';
rawJsonArea.style.background = '#222';
rawJsonArea.style.color = '#fff';
rawJsonArea.style.fontFamily = 'monospace';
rawJsonArea.style.fontSize = '14px';
rawJsonArea.style.border = 'none';
rawJsonArea.style.resize = 'vertical';
rawJsonArea.style.borderRadius = '4px';
rawJsonArea.style.padding = '10px';
rawJsonContainer.appendChild(rawJsonArea);

// Insert RAW JSON container in place of node form
nodeFormDiv.parentNode.insertBefore(rawJsonContainer, nodeFormDiv);

function updateRawJsonArea() {
    // Use the correct property name for connections/links
    rawJsonArea.value = JSON.stringify({ nodes, links: connections }, null, 2);
}

// Listen for changes in the RAW JSON area
rawJsonArea.addEventListener('input', function() {
    try {
        const parsed = JSON.parse(rawJsonArea.value);
        if (Array.isArray(parsed.nodes) && (Array.isArray(parsed.connections) || Array.isArray(parsed.links))) {
            nodes = parsed.nodes;
            connections = parsed.connections || parsed.links;
            rawJsonArea.style.border = '2px solid #2ecc71'; // green border for valid
            drawSkillTree();
        } else {
            rawJsonArea.style.border = '2px solid #e74c3c'; // red border for invalid structure
        }
    } catch (e) {
        rawJsonArea.style.border = '2px solid #e74c3c'; // red border for invalid JSON
    }
});

toggleRawBtn.onclick = function() {
    if (rawJsonContainer.style.display === 'none') {
        updateRawJsonArea();
        rawJsonContainer.style.display = 'block';
        nodeFormDiv.style.display = 'none';
        toggleRawBtn.textContent = 'Hide RAW JSON';
    } else {
        rawJsonContainer.style.display = 'none';
        nodeFormDiv.style.display = 'block';
        toggleRawBtn.textContent = 'Show RAW JSON';
    }
};

saveJsonBtn.onclick = function() {
    updateRawJsonArea();
    const blob = new Blob([rawJsonArea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillTree.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- Fix: Add new connection from the connection editor ---
updateConnectionBtn.onclick = function() {
    const from = fromNodeInput.value.trim();
    const to = toNodeInput.value.trim();
    if (!from || !to) return;
    // Prevent duplicate
    if (!connections.some(c => c.from === from && c.to === to)) {
        connections.push({ from, to });
        // Optionally clear the fields after adding
        // fromNodeInput.value = '';
        // toNodeInput.value = '';
        // Update any UI that shows connections for selected node
        if (selectedNodeIds.has(from)) showNodeConnections(from);
        if (selectedNodeIds.has(to)) showNodeConnections(to);
        saveToJSON();
        drawSkillTree();
        updateRawJsonArea && updateRawJsonArea();
    }
}

// --- Move Mode Implementation ---
let moveMode = false;
let moveModeBtn = document.createElement('button');
moveModeBtn.textContent = 'Move Mode: OFF';
moveModeBtn.className = 'editor-btn';
moveModeBtn.style.position = 'absolute';
moveModeBtn.style.top = '10px';
moveModeBtn.style.left = '10px';
moveModeBtn.style.zIndex = 10;
moveModeBtn.style.background = '#f39c12';
moveModeBtn.style.fontWeight = 'bold';
moveModeBtn.style.border = '2px solid #d35400';
moveModeBtn.style.boxShadow = '0 2px 8px rgba(243,156,18,0.18)';
moveModeBtn.style.transition = 'background 0.2s, box-shadow 0.2s';

// Insert button into the editor container, above the canvas
const skillTreeDisplay = document.getElementById('skill-tree-display');
skillTreeDisplay.style.position = 'relative';
skillTreeDisplay.appendChild(moveModeBtn);

moveModeBtn.onclick = function() {
    moveMode = !moveMode;
    moveModeBtn.textContent = moveMode ? 'Move Mode: ON' : 'Move Mode: OFF';
    moveModeBtn.style.background = moveMode ? '#27ae60' : '#f39c12';
    moveModeBtn.style.border = moveMode ? '2px solid #229954' : '2px solid #d35400';
    drawSkillTree();
};

// --- Multi-select and group drag logic ---
let isDraggingNodes = false;
let dragStartMouse = { x: 0, y: 0 };
let dragStartPositions = {};

skillCanvas.addEventListener('mousedown', function(e) {
    if (!moveMode) return;
    const rect = skillCanvas.getBoundingClientRect();
    const mouse = toWorldCoords(e.clientX - rect.left, e.clientY - rect.top);
    // Find node under mouse
    let hitNode = null;
    for (let node of nodes) {
        if (
            mouse.x >= node.x && mouse.x <= node.x + 160 &&
            mouse.y >= node.y && mouse.y <= node.y + 60
        ) {
            hitNode = node;
            break;
        }
    }
    if (hitNode) {
        if (e.shiftKey) {
            // Multi-select
            if (selectedNodeIds.has(hitNode.id)) {
                selectedNodeIds.delete(hitNode.id);
            } else {
                selectedNodeIds.add(hitNode.id);
            }
        } else {
            // Single select
            if (!selectedNodeIds.has(hitNode.id) || selectedNodeIds.size > 1) {
                selectedNodeIds.clear();
                selectedNodeIds.add(hitNode.id);
            }
        }
        // Start drag if left mouse
        if (e.button === 0) {
            isDraggingNodes = true;
            dragStartMouse = { x: mouse.x, y: mouse.y };
            dragStartPositions = {};
            for (let id of selectedNodeIds) {
                const n = nodes.find(n => n.id === id);
                dragStartPositions[id] = { x: n.x, y: n.y };
            }
        }
        drawSkillTree();
        e.preventDefault();
        return;
    } else {
        // Clicked empty space: clear selection
        if (!e.shiftKey) {
            selectedNodeIds.clear();
            drawSkillTree();
        }
    }
});

window.addEventListener('mousemove', function(e) {
    if (!moveMode || !isDraggingNodes) return;
    const rect = skillCanvas.getBoundingClientRect();
    const mouse = toWorldCoords(e.clientX - rect.left, e.clientY - rect.top);
    const dx = mouse.x - dragStartMouse.x;
    const dy = mouse.y - dragStartMouse.y;
    for (let id of selectedNodeIds) {
        const n = nodes.find(n => n.id === id);
        if (n && dragStartPositions[id]) {
            n.x = dragStartPositions[id].x + dx;
            n.y = dragStartPositions[id].y + dy;
        }
    }
    drawSkillTree();
});

window.addEventListener('mouseup', function(e) {
    if (!moveMode || !isDraggingNodes) return;
    isDraggingNodes = false;
    // Snap all selected nodes to nearest 25
    for (let id of selectedNodeIds) {
        const n = nodes.find(n => n.id === id);
        if (n) {
            n.x = Math.round(n.x / 25) * 25;
            n.y = Math.round(n.y / 25) * 25;
        }
    }
    saveToJSON && saveToJSON();
    drawSkillTree();
});

// --- Visual indication in drawSkillTree ---
const oldDrawSkillTree = drawSkillTree;
drawSkillTree = function() {
    ctx.save();
    oldDrawSkillTree();
    // Highlight selected nodes in move mode
    if (moveMode) {
        for (let id of selectedNodeIds) {
            const n = nodes.find(n => n.id === id);
            if (n) {
                ctx.save();
                ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
                ctx.strokeStyle = '#27ae60';
                ctx.lineWidth = 5;
                ctx.strokeRect(n.x - 4, n.y - 4, 168, 68);
                ctx.restore();
            }
        }
        // Draw a green border around the canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, skillCanvas.width, skillCanvas.height);
    }
    ctx.restore();
};

// --- Undo Functionality for Node Add/Edit/Delete ---
let nodeHistory = [];
function pushNodeHistory() {
    // Deep copy nodes only (not connections)
    nodeHistory.push(JSON.parse(JSON.stringify(nodes)));
    // Limit history size
    if (nodeHistory.length > 50) nodeHistory.shift();
}
function undoNodeAction() {
    if (nodeHistory.length > 0) {
        nodes = JSON.parse(JSON.stringify(nodeHistory.pop()));
        updateNodeList();
        drawSkillTree();
        updateRawJsonArea && updateRawJsonArea();
        saveToJSON && saveToJSON();
    }
}

// Add Undo button to node form controls
const undoNodeBtn = document.createElement('button');
undoNodeBtn.textContent = 'Undo Node';
undoNodeBtn.className = 'editor-btn';
undoNodeBtn.style.background = '#b2bec3';
undoNodeBtn.style.marginLeft = '10px';
undoNodeBtn.onclick = function(e) {
    e.preventDefault();
    undoNodeAction();
};
// Insert after the clear fields button
clearNodeBtn.parentNode.insertBefore(undoNodeBtn, clearNodeBtn.nextSibling);

// Patch add/edit/delete node to push history
const _addNode = addNode;
addNode = function() {
    pushNodeHistory();
    _addNode();
};
const _editNodeBtn = document.getElementById('editNodeBtn').onclick;
document.getElementById('editNodeBtn').onclick = function() {
    pushNodeHistory();
    _editNodeBtn();
};
const _deleteNodeBtn = document.getElementById('deleteNodeBtn').onclick;
document.getElementById('deleteNodeBtn').onclick = function() {
    pushNodeHistory();
    _deleteNodeBtn();
};

// Patch node form to support new exclusions and requirements editors
function patchNodeFormExclusionsRequirements(node) {
    if (window._patchNodeFormExclusionsRequirements) {
        window._patchNodeFormExclusionsRequirements(node);
    }
}

// Patch editNode to load exclusions/requirements
const _editNodeOrig = editNode;
editNode = function(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    _editNodeOrig(nodeId);
    patchNodeFormExclusionsRequirements(node);
};

// Patch addNodeBtn to call patchNodeFormExclusionsRequirements after add
const addNodeBtn = document.getElementById('addNodeBtn');
addNodeBtn.onclick = function() {
    addNode();
    patchNodeFormExclusionsRequirements();
    drawSkillTree();
    updateRawJsonArea && updateRawJsonArea();
};

// Patch editNodeBtn to save exclusions/requirements and reload UI
const editNodeBtn = document.getElementById('editNodeBtn');
editNodeBtn.onclick = function() {
    const nodeId = document.getElementById('nodeId').value;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        node.type = document.getElementById('nodeType').value;
        node.cost = parseInt(document.getElementById('nodeCost').value);
        node.description = document.getElementById('nodeDescription').value;
        node.x = parseInt(document.getElementById('nodeX').value) || 0;
        node.y = parseInt(document.getElementById('nodeY').value) || 0;
        // Exclusions
        const exclContainer = document.getElementById('exclusionsEditor');
        node.exclusions = exclContainer && exclContainer._exclusions ? [...exclContainer._exclusions] : [];
        // Requirements
        const reqsContainer = document.getElementById('requirementsEditor');
        node.requirements = reqsContainer && reqsContainer._requirements ? {...reqsContainer._requirements} : {};
        updateNodeList();
        drawSkillTree();
        updateRawJsonArea && updateRawJsonArea();
        saveToJSON();
        patchNodeFormExclusionsRequirements(node); // always reload UI
    }
};

// Patch addNode to save exclusions/requirements
const _addNodeOrig = addNode;
addNode = function() {
    const nodeId = document.getElementById('nodeId').value;
    const nodeType = document.getElementById('nodeType').value;
    const nodeCost = parseInt(document.getElementById('nodeCost').value);
    const nodeDescription = document.getElementById('nodeDescription').value;
    const nodeX = parseInt(document.getElementById('nodeX').value) || 0;
    const nodeY = parseInt(document.getElementById('nodeY').value) || 0;
    // Exclusions
    const exclContainer = document.getElementById('exclusionsEditor');
    const exclusions = exclContainer && exclContainer._exclusions ? [...exclContainer._exclusions] : [];
    // Requirements
    const reqsContainer = document.getElementById('requirementsEditor');
    const requirements = reqsContainer && reqsContainer._requirements ? {...reqsContainer._requirements} : {};
    const newNode = {
        id: nodeId,
        type: nodeType,
        cost: nodeCost,
        description: nodeDescription,
        x: nodeX,
        y: nodeY,
        requirements,
        exclusions
    };
    nodes.push(newNode);
    updateNodeList();
    saveToJSON();
};

// Patch clear fields button to reset exclusions/requirements UI
if (typeof clearNodeBtn !== 'undefined') {
    const _clearNodeBtnOrig = clearNodeBtn.onclick;
    clearNodeBtn.onclick = function() {
        document.getElementById('nodeId').value = '';
        document.getElementById('nodeType').value = 'Other';
        document.getElementById('nodeCost').value = '';
        document.getElementById('nodeDescription').value = '';
        document.getElementById('nodeX').value = '';
        document.getElementById('nodeY').value = '';
        patchNodeFormExclusionsRequirements();
        if (_clearNodeBtnOrig) _clearNodeBtnOrig();
    };
}

// On page load, update exclusions and requirements UI
window.addEventListener('DOMContentLoaded', function() {
    if (typeof renderExclusionsEditor === 'function') renderExclusionsEditor([], '');
    if (typeof renderRequirementsEditor === 'function') renderRequirementsEditor({});
});

// Exclusions Editor Logic
function getExclusionOptions(currentNodeId) {
    if (!window.nodes) return [];
    return window.nodes.map(n => n.id).filter(id => id !== currentNodeId);
}

function renderExclusionsEditor(exclusions, currentNodeId) {
    const container = document.getElementById('exclusionsEditor');
    container.innerHTML = '';
    if (!Array.isArray(exclusions)) exclusions = [];
    if (exclusions.length === 0) {
        const none = document.createElement('div');
        none.textContent = 'None';
        none.style.color = '#888';
        none.style.fontStyle = 'italic';
        none.style.marginBottom = '6px';
        container.appendChild(none);
    }
    exclusions.forEach((excl, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '6px';
        // Text input for exclusion
        const input = document.createElement('input');
        input.type = 'text';
        input.value = excl;
        input.style.flex = '1';
        // Only update on blur (when user leaves the field)
        input.onblur = () => {
            exclusions[idx] = input.value;
            updateNodeExclusions(exclusions, currentNodeId);
        };
        // Remove button
        const rmBtn = document.createElement('button');
        rmBtn.textContent = 'Remove';
        rmBtn.className = 'editor-btn';
        rmBtn.style.background = '#c0392b';
        rmBtn.onclick = function() {
            exclusions.splice(idx, 1);
            updateNodeExclusions(exclusions, currentNodeId);
        };
        row.appendChild(input);
        row.appendChild(rmBtn);
        container.appendChild(row);
    });
    // Add Exclusion button
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add Exclusion';
    addBtn.className = 'editor-btn';
    addBtn.style.background = '#888';
    addBtn.style.display = 'inline-block';
    addBtn.onclick = function() {
        exclusions.push('');
        updateNodeExclusions(exclusions, currentNodeId);
    };
    container.appendChild(addBtn);
    container._exclusions = exclusions;
}

function updateNodeExclusions(exclusions, currentNodeId, skipRender) {
    // Find the node by ID and update its exclusions in the main nodes array
    if (!Array.isArray(exclusions)) exclusions = [];
    const node = nodes.find(n => n.id === currentNodeId);
    if (node) {
        // Remove empty exclusions and duplicates
        node.exclusions = exclusions.filter((ex, idx, arr) => ex && arr.indexOf(ex) === idx);
        // Save to JSON and update UI
        saveToJSON && saveToJSON();
        updateRawJsonArea && updateRawJsonArea();
        drawSkillTree && drawSkillTree();
        if (!skipRender) renderExclusionsEditor(node.exclusions, currentNodeId);
    }
}

window._patchNodeFormExclusions = function(node) {
    const currentNodeId = node && node.id ? node.id : document.getElementById('nodeId').value;
    renderExclusionsEditor(node && node.exclusions ? [...node.exclusions] : [], currentNodeId);
};
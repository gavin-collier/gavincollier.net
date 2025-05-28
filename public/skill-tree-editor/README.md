# Skill Tree Editor

## Overview
The Skill Tree Editor is a dynamic web application that allows users to create, edit, and manage a skill tree represented in a JSON format. This tool provides an intuitive interface for users to manipulate nodes and their connections, making it easier to design and visualize skill trees for games or other applications.

## Features
- **Add New Nodes**: Users can create new skill nodes with customizable properties.
- **Edit Existing Nodes**: Modify the attributes of existing nodes, including name, type, cost, and description.
- **Delete Nodes**: Remove nodes from the skill tree as needed.
- **Update Connections**: Change the relationships between nodes to reflect new skill dependencies or exclusions.
- **User-Friendly Interface**: The editor is designed to be intuitive, with clear forms and buttons for all actions.

## Project Structure
```
skill-tree-editor
├── public
│   ├── scripts
│   │   ├── editor.js        # Main JavaScript file for the editor functionality
│   │   └── lostMasquerade
│   │       └── skillTree.patched.js
│   ├── static
│   │   ├── styles
│   │   │   └── editor.css   # CSS styles for the editor interface
│   │   └── JSON
│   │       └── skillTree.json # JSON file representing the skill tree
│   └── views
│       └── editor.html      # HTML structure for the editor
├── package.json              # NPM configuration file
└── README.md                 # Project documentation
```

## Installation
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Run `npm install` to install the necessary dependencies.

## Usage
1. Start the application by running `node index.js` (or the appropriate command for your setup).
2. Open your web browser and navigate to `http://localhost:555/masquerade/herald` to access the skill tree editor.
3. Use the interface to add, edit, or delete nodes and connections as needed.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
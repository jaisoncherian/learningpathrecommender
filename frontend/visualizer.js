/**
 * Interactive Path Visualizer
 * Uses Vis.js to render a dependency graph of the learning path
 */

let network = null;

function initVisualizer() {
    const listBtn = document.getElementById('view-list-btn');
    const graphBtn = document.getElementById('view-graph-btn');
    const pathList = document.getElementById('path-list');
    const pathVisualizer = document.getElementById('path-visualizer');

    if (listBtn && graphBtn) {
        listBtn.addEventListener('click', () => {
            listBtn.classList.add('active');
            graphBtn.classList.remove('active');
            pathList.classList.remove('hidden');
            pathVisualizer.classList.add('hidden');
        });

        graphBtn.addEventListener('click', () => {
            graphBtn.classList.add('active');
            listBtn.classList.remove('active');
            pathList.classList.add('hidden');
            pathVisualizer.classList.remove('hidden');

            // Re-render or stabilize graph when shown
            if (network) {
                network.fit();
            }
        });
    }
}

function renderInteractivePath(path) {
    const container = document.getElementById('path-visualizer');
    if (!container) return;

    // Prepare nodes and edges
    const nodes = [];
    const edges = [];
    const courseIds = new Set(path.map(c => c.id));

    path.forEach((course, index) => {
        // Map difficulty to color
        let color = '#38bdf8'; // Intermediate
        if (course.difficulty === 'Beginner') color = '#10b981';
        if (course.difficulty === 'Advanced') color = '#ef4444';

        nodes.push({
            id: course.id,
            label: course.title,
            title: `Difficulty: ${course.difficulty}\nTime: ${course.time}`,
            color: {
                background: '#1f2937',
                border: color,
                highlight: { background: color, border: '#fff' }
            },
            font: { color: '#f1f5f9', size: 14, face: 'Inter' },
            shape: 'box',
            margin: 10,
            borderWidth: 2,
            shadow: true
        });

        // Add edges from prerequisites (only if they are in the current path)
        if (course.prerequisites) {
            course.prerequisites.forEach(prereqId => {
                if (courseIds.has(prereqId)) {
                    edges.push({
                        from: prereqId,
                        to: course.id,
                        arrows: 'to',
                        color: { color: '#475569', highlight: '#38bdf8' },
                        width: 2
                    });
                }
            });
        }
    });

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        nodes: {
            shape: 'box',
            font: { face: 'Inter' }
        },
        edges: {
            smooth: {
                type: 'cubicBezier',
                forceDirection: 'horizontal',
                roundness: 0.4
            }
        },
        layout: {
            hierarchical: {
                direction: 'LR', // Left to Right
                sortMethod: 'directed',
                nodeSpacing: 150,
                levelSeparation: 250
            }
        },
        physics: {
            enabled: false
        },
        interaction: {
            dragNodes: true,
            hover: true,
            zoomView: false,
            dragView: true
        }
    };

    if (network) {
        network.destroy();
    }

    network = new vis.Network(container, data, options);

    // Node click event
    network.on('click', function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const course = path.find(c => c.id === nodeId);
            if (course && course.url) {
                // Optional: Show a preview or open link
                console.log('Clicked course:', course.title);
            }
        }
    });

    // Handle view switches
    initVisualizer();
}

window.renderInteractivePath = renderInteractivePath;

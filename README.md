# nodius-layouting

A **zero-dependency**, high-performance graph layouting library for node-based technical diagrams.

Built for real-world use cases: data pipelines, visual programming environments, workflow editors, and any system where nodes with typed handles are connected by edges.

## Features

- **Zero runtime dependencies** - Pure TypeScript, nothing else
- **Optimized Sugiyama-based layout** - Produces clean, hierarchical technical diagrams
- **Handle-aware** - Each node has multiple handles (input/output) with precise positioning on any side (top, right, bottom, left) with configurable offsets
- **Orthogonal edge routing** - Clean right-angle edge paths that respect handle positions
- **Incremental layout** - Add or remove nodes without recomputing the entire layout
- **4 layout directions** - Top-to-bottom, left-to-right, bottom-to-top, right-to-left
- **Cycle support** - Automatically handles cyclic graphs
- **Scales to 1000+ nodes** - Optimized algorithms (merge-sort crossing count, adaptive iterations)

## Performance

Benchmarked on a standard development machine:

| Graph Size | Time |
|---|---|
| 100 nodes, 737 edges (dense) | ~70ms |
| 200 nodes | ~25ms |
| 500 nodes | ~100ms |
| 1000 nodes | ~150ms |

## Installation

```bash
npm install nodius-layouting
```

## Quick Start

```typescript
import { layout } from 'nodius-layouting';

const result = layout({
  nodes: [
    {
      id: 'source',
      width: 120,
      height: 60,
      handles: [
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ],
    },
    {
      id: 'transform',
      width: 150,
      height: 80,
      handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
        { id: 'err', type: 'output', position: 'right', offset: 0.5 },
      ],
    },
    {
      id: 'sink',
      width: 120,
      height: 60,
      handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
      ],
    },
  ],
  edges: [
    { id: 'e1', from: 'source', to: 'transform', fromHandle: 'out', toHandle: 'in' },
    { id: 'e2', from: 'transform', to: 'sink', fromHandle: 'out', toHandle: 'in' },
  ],
});

// result.nodes → positioned nodes with absolute handle coordinates
// result.edges → routed edges with waypoint arrays
```

## API

### `layout(input, options?)`

Compute a complete layout for the given graph. Returns positioned nodes and routed edges.

```typescript
function layout(input: LayoutInput, options?: LayoutOptions): LayoutResult;
```

### `IncrementalLayout`

Maintains layout state for incremental updates. Use this when you need to add or remove nodes without full recomputation.

```typescript
import { IncrementalLayout } from 'nodius-layouting';

const inc = new IncrementalLayout({ direction: 'LR' });

// Set initial graph
const result1 = inc.setGraph({ nodes: [...], edges: [...] });

// Add nodes and edges incrementally
const result2 = inc.addNodes(
  [{ id: 'new_node', width: 100, height: 60, handles: [...] }],
  [{ id: 'new_edge', from: 'existing', to: 'new_node', fromHandle: 'out', toHandle: 'in' }]
);

// Remove nodes (connected edges are removed automatically)
const result3 = inc.removeNodes(['node_to_remove']);

// Add/remove edges independently
inc.addEdges([...]);
inc.removeEdges(['edge_id']);

// Get current result
const current = inc.getResult();
```

### Types

#### Input Types

```typescript
interface NodeInput {
  id: string;
  width: number;
  height: number;
  handles: HandleInput[];
}

interface HandleInput {
  id: string;
  type: 'input' | 'output';
  position: 'top' | 'right' | 'bottom' | 'left';
  offset?: number; // 0-1 position along the side. Default: 0.5
}

interface EdgeInput {
  id: string;
  from: string;       // Source node ID
  to: string;         // Target node ID
  fromHandle: string; // Source handle ID
  toHandle: string;   // Target handle ID
}

interface LayoutInput {
  nodes: NodeInput[];
  edges: EdgeInput[];
}
```

#### Options

```typescript
interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';       // Default: 'TB'
  nodeSpacing?: number;                           // Default: 40
  layerSpacing?: number;                          // Default: 60
  crossingMinimizationIterations?: number;        // Default: 24
  coordinateOptimizationIterations?: number;      // Default: 8
  edgeMargin?: number;                            // Default: 20
}
```

#### Output Types

```typescript
interface LayoutResult {
  nodes: NodeOutput[];
  edges: EdgeOutput[];
}

interface NodeOutput {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  handles: HandleOutput[]; // Absolute positions
}

interface HandleOutput {
  id: string;
  type: 'input' | 'output';
  position: 'top' | 'right' | 'bottom' | 'left';
  x: number; // Absolute x position
  y: number; // Absolute y position
}

interface EdgeOutput {
  id: string;
  from: string;
  to: string;
  fromHandle: string;
  toHandle: string;
  points: Point[]; // Ordered waypoints from source to target
}
```

## Algorithm

The layout engine uses a modified **Sugiyama algorithm** with five phases:

1. **Cycle Breaking** - DFS-based back edge detection and reversal
2. **Layer Assignment** - Longest-path layering with dummy node insertion for long edges
3. **Crossing Minimization** - Barycenter heuristic with up/down sweeps and transpose improvement. Uses merge-sort based O(E log V) inversion counting
4. **Coordinate Assignment** - Median-based iterative positioning with spacing constraints and multi-pass centering
5. **Edge Routing** - Orthogonal path computation through dummy node waypoints with handle-aware entry/exit directions

### Incremental Layout

The `IncrementalLayout` class provides position stability when modifying graphs:

- New nodes are inserted into appropriate layers based on their connections
- Existing node positions are blended (70% new / 30% old) to reduce visual disruption
- Full crossing minimization and coordinate assignment run on the updated graph
- Only affected edges are re-routed

## Playground

A visual playground is included in the `playground/` directory:

```bash
cd playground
npm install
npm run dev
```

This opens a Vite dev server with:
- Predefined example graphs (chain, diamond, data pipeline, hub, binary tree, cycle)
- Editable JSON input
- Before/after SVG visualization
- Configurable layout direction and spacing
- Real-time performance metrics

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the library
npm run build
```

## License

MIT

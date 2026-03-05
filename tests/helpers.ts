import { NodeInput, EdgeInput, LayoutInput, LayoutResult, NodeOutput } from '../src/types';

/** Create a simple node with bottom output and top input handles */
export function makeNode(
  id: string,
  width = 120,
  height = 60,
  handles?: NodeInput['handles']
): NodeInput {
  return {
    id,
    width,
    height,
    handles: handles ?? [
      { id: `${id}_in`, type: 'input', position: 'top', offset: 0.5 },
      { id: `${id}_out`, type: 'output', position: 'bottom', offset: 0.5 },
    ],
  };
}

/** Create a simple edge */
export function makeEdge(
  id: string,
  from: string,
  to: string,
  fromHandle?: string,
  toHandle?: string
): EdgeInput {
  return {
    id,
    from,
    to,
    fromHandle: fromHandle ?? `${from}_out`,
    toHandle: toHandle ?? `${to}_in`,
  };
}

/** Create a simple linear chain: A -> B -> C -> ... */
export function makeChain(count: number): LayoutInput {
  const nodes: NodeInput[] = [];
  const edges: EdgeInput[] = [];

  for (let i = 0; i < count; i++) {
    nodes.push(makeNode(`n${i}`));
    if (i > 0) {
      edges.push(makeEdge(`e${i - 1}_${i}`, `n${i - 1}`, `n${i}`));
    }
  }

  return { nodes, edges };
}

/** Create a diamond graph: A -> B, A -> C, B -> D, C -> D */
export function makeDiamond(): LayoutInput {
  return {
    nodes: [
      makeNode('A'),
      makeNode('B'),
      makeNode('C'),
      makeNode('D'),
    ],
    edges: [
      makeEdge('e_AB', 'A', 'B'),
      makeEdge('e_AC', 'A', 'C'),
      makeEdge('e_BD', 'B', 'D'),
      makeEdge('e_CD', 'C', 'D'),
    ],
  };
}

/** Check that no two nodes overlap */
export function checkNoOverlaps(result: LayoutResult, spacing = 0): boolean {
  const nodes = result.nodes;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const overlapX = a.x < b.x + b.width + spacing && b.x < a.x + a.width + spacing;
      const overlapY = a.y < b.y + b.height + spacing && b.y < a.y + a.height + spacing;
      if (overlapX && overlapY) {
        return false;
      }
    }
  }
  return true;
}

/** Check that all positions are finite numbers */
export function checkFinitePositions(result: LayoutResult): boolean {
  for (const node of result.nodes) {
    if (!isFinite(node.x) || !isFinite(node.y)) return false;
    for (const handle of node.handles) {
      if (!isFinite(handle.x) || !isFinite(handle.y)) return false;
    }
  }
  for (const edge of result.edges) {
    for (const point of edge.points) {
      if (!isFinite(point.x) || !isFinite(point.y)) return false;
    }
  }
  return true;
}

/** Check that all edges reference valid nodes */
export function checkEdgeValidity(result: LayoutResult): boolean {
  const nodeIds = new Set(result.nodes.map(n => n.id));
  for (const edge of result.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) return false;
  }
  return true;
}

/** Get node by ID from result */
export function getNode(result: LayoutResult, id: string): NodeOutput | undefined {
  return result.nodes.find(n => n.id === id);
}

/** Generate a random DAG with specified number of nodes and edge density */
export function makeRandomDAG(nodeCount: number, edgeDensity = 0.3, seed = 42): LayoutInput {
  const rng = seedRandom(seed);
  const nodes: NodeInput[] = [];
  const edges: EdgeInput[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const handleCount = Math.floor(rng() * 4) + 1;
    const handles: NodeInput['handles'] = [];

    // Always add at least one input and one output
    handles.push({ id: `n${i}_in`, type: 'input', position: 'top', offset: 0.5 });
    handles.push({ id: `n${i}_out`, type: 'output', position: 'bottom', offset: 0.5 });

    // Add extra handles
    const sides: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];
    for (let h = 2; h < handleCount + 2; h++) {
      const side = sides[Math.floor(rng() * 4)];
      const type = rng() > 0.5 ? 'input' : 'output';
      handles.push({
        id: `n${i}_h${h}`,
        type,
        position: side,
        offset: rng(),
      });
    }

    nodes.push({
      id: `n${i}`,
      width: 80 + Math.floor(rng() * 120),
      height: 40 + Math.floor(rng() * 80),
      handles,
    });
  }

  // Create edges (forward only for DAG)
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (rng() < edgeDensity) {
        edges.push(makeEdge(`e${i}_${j}`, `n${i}`, `n${j}`));
      }
    }
  }

  return { nodes, edges };
}

/** Simple seeded random number generator */
function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Generate a complex multi-handle graph */
export function makeMultiHandleGraph(): LayoutInput {
  const nodes: NodeInput[] = [
    {
      id: 'input',
      width: 100,
      height: 80,
      handles: [
        { id: 'out1', type: 'output', position: 'right', offset: 0.25 },
        { id: 'out2', type: 'output', position: 'right', offset: 0.5 },
        { id: 'out3', type: 'output', position: 'right', offset: 0.75 },
        { id: 'out_bottom', type: 'output', position: 'bottom', offset: 0.5 },
      ],
    },
    {
      id: 'processor1',
      width: 140,
      height: 100,
      handles: [
        { id: 'in1', type: 'input', position: 'left', offset: 0.3 },
        { id: 'in2', type: 'input', position: 'left', offset: 0.7 },
        { id: 'in_top', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out1', type: 'output', position: 'right', offset: 0.5 },
        { id: 'out_bottom', type: 'output', position: 'bottom', offset: 0.5 },
      ],
    },
    {
      id: 'processor2',
      width: 140,
      height: 80,
      handles: [
        { id: 'in1', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out1', type: 'output', position: 'bottom', offset: 0.3 },
        { id: 'out2', type: 'output', position: 'bottom', offset: 0.7 },
      ],
    },
    {
      id: 'merger',
      width: 120,
      height: 60,
      handles: [
        { id: 'in1', type: 'input', position: 'left', offset: 0.3 },
        { id: 'in2', type: 'input', position: 'left', offset: 0.7 },
        { id: 'in_top', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out1', type: 'output', position: 'right', offset: 0.5 },
      ],
    },
    {
      id: 'output',
      width: 100,
      height: 60,
      handles: [
        { id: 'in1', type: 'input', position: 'left', offset: 0.5 },
        { id: 'in_top', type: 'input', position: 'top', offset: 0.5 },
      ],
    },
  ];

  const edges: EdgeInput[] = [
    { id: 'e1', from: 'input', to: 'processor1', fromHandle: 'out1', toHandle: 'in1' },
    { id: 'e2', from: 'input', to: 'processor1', fromHandle: 'out2', toHandle: 'in2' },
    { id: 'e3', from: 'input', to: 'processor2', fromHandle: 'out_bottom', toHandle: 'in1' },
    { id: 'e4', from: 'processor1', to: 'merger', fromHandle: 'out1', toHandle: 'in1' },
    { id: 'e5', from: 'processor1', to: 'merger', fromHandle: 'out_bottom', toHandle: 'in_top' },
    { id: 'e6', from: 'processor2', to: 'merger', fromHandle: 'out1', toHandle: 'in2' },
    { id: 'e7', from: 'processor2', to: 'output', fromHandle: 'out2', toHandle: 'in_top' },
    { id: 'e8', from: 'merger', to: 'output', fromHandle: 'out1', toHandle: 'in1' },
  ];

  return { nodes, edges };
}

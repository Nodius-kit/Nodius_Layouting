import { describe, it, expect } from 'vitest';
import { layout } from '../src';
import { makeNode, makeEdge, makeRandomDAG, makeMultiHandleGraph, checkNoOverlaps, checkFinitePositions, checkEdgeValidity } from './helpers';
import { NodeInput, EdgeInput } from '../src/types';

describe('Complex Graphs', () => {
  it('should layout a wide graph (many nodes in one layer)', () => {
    const nodes: NodeInput[] = [
      makeNode('root'),
      ...Array.from({ length: 20 }, (_, i) => makeNode(`leaf${i}`)),
    ];

    const edges: EdgeInput[] = Array.from({ length: 20 }, (_, i) =>
      makeEdge(`e${i}`, 'root', `leaf${i}`)
    );

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(21);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout a deep chain (many layers)', () => {
    const nodes: NodeInput[] = Array.from({ length: 30 }, (_, i) => makeNode(`n${i}`));
    const edges: EdgeInput[] = Array.from({ length: 29 }, (_, i) =>
      makeEdge(`e${i}`, `n${i}`, `n${i + 1}`)
    );

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(30);
    // Verify order
    for (let i = 0; i < 29; i++) {
      const curr = result.nodes.find(n => n.id === `n${i}`)!;
      const next = result.nodes.find(n => n.id === `n${i + 1}`)!;
      expect(curr.y).toBeLessThan(next.y);
    }

    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout a binary tree', () => {
    const nodes: NodeInput[] = [];
    const edges: EdgeInput[] = [];

    // Create a binary tree of depth 5 (31 nodes)
    for (let i = 0; i < 31; i++) {
      nodes.push(makeNode(`n${i}`));
      if (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        edges.push(makeEdge(`e${i}`, `n${parent}`, `n${i}`));
      }
    }

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(31);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });

  it('should layout a random DAG with 50 nodes', () => {
    const input = makeRandomDAG(50, 0.1);
    const result = layout(input);

    expect(result.nodes).toHaveLength(50);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });

  it('should layout a random DAG with 100 nodes', () => {
    const input = makeRandomDAG(100, 0.05);
    const result = layout(input);

    expect(result.nodes).toHaveLength(100);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });

  it('should layout a random DAG with 200 nodes', () => {
    const input = makeRandomDAG(200, 0.03);
    const result = layout(input);

    expect(result.nodes).toHaveLength(200);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });

  it('should layout the multi-handle example graph', () => {
    const input = makeMultiHandleGraph();
    const result = layout(input);

    expect(result.nodes).toHaveLength(5);
    expect(result.edges).toHaveLength(8);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });

  it('should handle a graph with variable node sizes', () => {
    const nodes: NodeInput[] = [
      makeNode('small', 50, 30),
      makeNode('medium', 120, 80),
      makeNode('large', 300, 150),
      makeNode('tall', 60, 200),
      makeNode('wide', 250, 40),
    ];

    const edges: EdgeInput[] = [
      makeEdge('e1', 'small', 'medium'),
      makeEdge('e2', 'small', 'large'),
      makeEdge('e3', 'medium', 'tall'),
      makeEdge('e4', 'large', 'wide'),
      makeEdge('e5', 'tall', 'wide'),
    ];

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(5);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle a dense graph with many edges', () => {
    const nodes: NodeInput[] = Array.from({ length: 10 }, (_, i) => makeNode(`n${i}`));
    const edges: EdgeInput[] = [];

    // Connect every node to every later node
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        edges.push(makeEdge(`e${i}_${j}`, `n${i}`, `n${j}`));
      }
    }

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(10);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle multiple connected components', () => {
    const nodes: NodeInput[] = [
      // Component 1
      makeNode('a1'), makeNode('a2'), makeNode('a3'),
      // Component 2
      makeNode('b1'), makeNode('b2'),
      // Component 3 (isolated)
      makeNode('c1'),
    ];

    const edges: EdgeInput[] = [
      makeEdge('e1', 'a1', 'a2'),
      makeEdge('e2', 'a2', 'a3'),
      makeEdge('e3', 'b1', 'b2'),
    ];

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(6);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should layout a complex pipeline graph', () => {
    // Simulate a data processing pipeline
    const nodes: NodeInput[] = [
      {
        id: 'source1', width: 100, height: 60,
        handles: [
          { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
        ],
      },
      {
        id: 'source2', width: 100, height: 60,
        handles: [
          { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
        ],
      },
      {
        id: 'transform', width: 160, height: 80,
        handles: [
          { id: 'in1', type: 'input', position: 'top', offset: 0.3 },
          { id: 'in2', type: 'input', position: 'top', offset: 0.7 },
          { id: 'out1', type: 'output', position: 'bottom', offset: 0.3 },
          { id: 'out2', type: 'output', position: 'bottom', offset: 0.7 },
          { id: 'err', type: 'output', position: 'right', offset: 0.5 },
        ],
      },
      {
        id: 'filter', width: 120, height: 60,
        handles: [
          { id: 'in', type: 'input', position: 'top', offset: 0.5 },
          { id: 'pass', type: 'output', position: 'bottom', offset: 0.3 },
          { id: 'reject', type: 'output', position: 'bottom', offset: 0.7 },
        ],
      },
      {
        id: 'aggregate', width: 140, height: 70,
        handles: [
          { id: 'in', type: 'input', position: 'top', offset: 0.5 },
          { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
        ],
      },
      {
        id: 'error_handler', width: 120, height: 60,
        handles: [
          { id: 'in', type: 'input', position: 'left', offset: 0.5 },
          { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
        ],
      },
      {
        id: 'sink1', width: 100, height: 60,
        handles: [
          { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        ],
      },
      {
        id: 'sink2', width: 100, height: 60,
        handles: [
          { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        ],
      },
    ];

    const edges: EdgeInput[] = [
      { id: 'e1', from: 'source1', to: 'transform', fromHandle: 'out', toHandle: 'in1' },
      { id: 'e2', from: 'source2', to: 'transform', fromHandle: 'out', toHandle: 'in2' },
      { id: 'e3', from: 'transform', to: 'filter', fromHandle: 'out1', toHandle: 'in' },
      { id: 'e4', from: 'transform', to: 'aggregate', fromHandle: 'out2', toHandle: 'in' },
      { id: 'e5', from: 'transform', to: 'error_handler', fromHandle: 'err', toHandle: 'in' },
      { id: 'e6', from: 'filter', to: 'sink1', fromHandle: 'pass', toHandle: 'in' },
      { id: 'e7', from: 'filter', to: 'sink2', fromHandle: 'reject', toHandle: 'in' },
      { id: 'e8', from: 'aggregate', to: 'sink1', fromHandle: 'out', toHandle: 'in' },
    ];

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(8);
    expect(result.edges).toHaveLength(8);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
    expect(checkEdgeValidity(result)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { layout } from '../src';
import { makeNode, makeEdge, checkFinitePositions, getNode } from './helpers';
import { NodeInput, EdgeInput } from '../src/types';

describe('Edge Routing', () => {
  it('should route edges with at least 2 points', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].points.length).toBeGreaterThanOrEqual(2);
  });

  it('should start and end edges at handle positions', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('e1', 'A', 'B')],
    });

    const a = getNode(result, 'A')!;
    const b = getNode(result, 'B')!;
    const edge = result.edges[0];

    // First point: A's output handle (bottom center)
    const firstPoint = edge.points[0];
    expect(firstPoint.x).toBeCloseTo(a.x + a.width / 2);
    expect(firstPoint.y).toBeCloseTo(a.y + a.height);

    // Last point: B's input handle (top center)
    const lastPoint = edge.points[edge.points.length - 1];
    expect(lastPoint.x).toBeCloseTo(b.x + b.width / 2);
    expect(lastPoint.y).toBeCloseTo(b.y);
  });

  it('should route edges through long spans with waypoints', () => {
    // Create A -> B -> C with edge from A to C (spanning 2 layers)
    const result = layout({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'A', 'C'),
        makeEdge('e3', 'B', 'C'),
      ],
    });

    // The edge from A to C might span multiple layers
    const longEdge = result.edges.find(e => e.id === 'e2');
    expect(longEdge).toBeDefined();
    expect(longEdge!.points.length).toBeGreaterThanOrEqual(2);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should route edges between different handle sides', () => {
    const nodes: NodeInput[] = [
      {
        id: 'A',
        width: 120,
        height: 80,
        handles: [
          { id: 'right_out', type: 'output', position: 'right', offset: 0.5 },
        ],
      },
      {
        id: 'B',
        width: 120,
        height: 80,
        handles: [
          { id: 'left_in', type: 'input', position: 'left', offset: 0.5 },
        ],
      },
    ];

    const edges: EdgeInput[] = [
      { id: 'e1', from: 'A', to: 'B', fromHandle: 'right_out', toHandle: 'left_in' },
    ];

    const result = layout({ nodes, edges });
    const edge = result.edges[0];

    expect(edge.points.length).toBeGreaterThanOrEqual(2);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle multiple edges between same nodes', () => {
    const nodes: NodeInput[] = [
      {
        id: 'A',
        width: 120,
        height: 80,
        handles: [
          { id: 'out1', type: 'output', position: 'bottom', offset: 0.3 },
          { id: 'out2', type: 'output', position: 'bottom', offset: 0.7 },
        ],
      },
      {
        id: 'B',
        width: 120,
        height: 80,
        handles: [
          { id: 'in1', type: 'input', position: 'top', offset: 0.3 },
          { id: 'in2', type: 'input', position: 'top', offset: 0.7 },
        ],
      },
    ];

    const edges: EdgeInput[] = [
      { id: 'e1', from: 'A', to: 'B', fromHandle: 'out1', toHandle: 'in1' },
      { id: 'e2', from: 'A', to: 'B', fromHandle: 'out2', toHandle: 'in2' },
    ];

    const result = layout({ nodes, edges });

    expect(result.edges).toHaveLength(2);

    // Both edges should have valid routes
    for (const edge of result.edges) {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
    }

    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should preserve edge IDs and handle references', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [makeEdge('myEdge', 'A', 'B')],
    });

    const edge = result.edges[0];
    expect(edge.id).toBe('myEdge');
    expect(edge.from).toBe('A');
    expect(edge.to).toBe('B');
    expect(edge.fromHandle).toBe('A_out');
    expect(edge.toHandle).toBe('B_in');
  });
});

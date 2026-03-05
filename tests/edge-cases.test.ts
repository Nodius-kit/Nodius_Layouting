import { describe, it, expect } from 'vitest';
import { layout } from '../src';
import { makeNode, makeEdge, checkNoOverlaps, checkFinitePositions } from './helpers';
import { NodeInput, EdgeInput } from '../src/types';

describe('Edge Cases', () => {
  it('should handle a graph with a cycle (A -> B -> A)', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'B', 'A'),
      ],
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(2);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle a triangle cycle (A -> B -> C -> A)', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B'), makeNode('C')],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'B', 'C'),
        makeEdge('e3', 'C', 'A'),
      ],
    });

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(3);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle a self-loop', () => {
    const node: NodeInput = {
      id: 'A',
      width: 120,
      height: 60,
      handles: [
        { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        { id: 'out', type: 'output', position: 'bottom', offset: 0.5 },
      ],
    };

    const result = layout({
      nodes: [node],
      edges: [{ id: 'self', from: 'A', to: 'A', fromHandle: 'out', toHandle: 'in' }],
    });

    expect(result.nodes).toHaveLength(1);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle nodes with no handles', () => {
    const result = layout({
      nodes: [
        { id: 'A', width: 100, height: 50, handles: [] },
        { id: 'B', width: 100, height: 50, handles: [] },
      ],
      edges: [],
    });

    expect(result.nodes).toHaveLength(2);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle nodes with only input handles', () => {
    const result = layout({
      nodes: [
        {
          id: 'A',
          width: 100,
          height: 50,
          handles: [
            { id: 'in1', type: 'input', position: 'top', offset: 0.3 },
            { id: 'in2', type: 'input', position: 'top', offset: 0.7 },
          ],
        },
      ],
      edges: [],
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].handles).toHaveLength(2);
  });

  it('should handle a very wide graph (100 siblings)', () => {
    const nodes: NodeInput[] = [
      makeNode('root'),
      ...Array.from({ length: 100 }, (_, i) => makeNode(`child${i}`)),
    ];

    const edges: EdgeInput[] = Array.from({ length: 100 }, (_, i) =>
      makeEdge(`e${i}`, 'root', `child${i}`)
    );

    const result = layout({ nodes, edges });

    expect(result.nodes).toHaveLength(101);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle nodes with zero dimensions', () => {
    const result = layout({
      nodes: [
        { id: 'A', width: 0, height: 0, handles: [] },
        { id: 'B', width: 100, height: 50, handles: [
          { id: 'in', type: 'input', position: 'top', offset: 0.5 },
        ] },
      ],
      edges: [],
    });

    expect(result.nodes).toHaveLength(2);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle duplicate edge connections', () => {
    const result = layout({
      nodes: [makeNode('A'), makeNode('B')],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'A', 'B'),
      ],
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(2);
    expect(checkFinitePositions(result)).toBe(true);
  });

  it('should handle complex cycles with multiple entry points', () => {
    const result = layout({
      nodes: [
        makeNode('A'), makeNode('B'), makeNode('C'),
        makeNode('D'), makeNode('E'),
      ],
      edges: [
        makeEdge('e1', 'A', 'B'),
        makeEdge('e2', 'B', 'C'),
        makeEdge('e3', 'C', 'D'),
        makeEdge('e4', 'D', 'B'), // cycle: B -> C -> D -> B
        makeEdge('e5', 'D', 'E'),
      ],
    });

    expect(result.nodes).toHaveLength(5);
    expect(checkNoOverlaps(result)).toBe(true);
    expect(checkFinitePositions(result)).toBe(true);
  });
});

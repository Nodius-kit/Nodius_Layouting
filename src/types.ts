/** Position on a node where a handle can be placed */
export type HandleSide = 'top' | 'right' | 'bottom' | 'left';

/** Handle type - input receives connections, output sends connections */
export type HandleType = 'input' | 'output';

/** Layout direction */
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

/** A 2D point */
export interface Point {
  x: number;
  y: number;
}

/** Handle definition on a node */
export interface HandleInput {
  id: string;
  type: HandleType;
  position: HandleSide;
  /** Position along the side (0 = start, 1 = end). Default: 0.5 */
  offset?: number;
}

/** Node input definition */
export interface NodeInput {
  id: string;
  width: number;
  height: number;
  handles: HandleInput[];
}

/** Edge input definition */
export interface EdgeInput {
  id: string;
  from: string;
  to: string;
  fromHandle: string;
  toHandle: string;
}

/** Complete layout input */
export interface LayoutInput {
  nodes: NodeInput[];
  edges: EdgeInput[];
}

/** Layout configuration options */
export interface LayoutOptions {
  /** Layout direction. Default: 'TB' */
  direction?: LayoutDirection;
  /** Minimum spacing between nodes in the same layer. Default: 40 */
  nodeSpacing?: number;
  /** Minimum spacing between layers. Default: 60 */
  layerSpacing?: number;
  /** Number of iterations for crossing minimization. Default: 24 */
  crossingMinimizationIterations?: number;
  /** Number of iterations for coordinate optimization. Default: 8 */
  coordinateOptimizationIterations?: number;
  /** Margin for edge routing (distance from node before turning). Default: 20 */
  edgeMargin?: number;
}

/** Resolved options with all defaults applied */
export interface ResolvedOptions {
  direction: LayoutDirection;
  nodeSpacing: number;
  layerSpacing: number;
  crossingMinimizationIterations: number;
  coordinateOptimizationIterations: number;
  edgeMargin: number;
}

export function resolveOptions(options?: LayoutOptions): ResolvedOptions {
  return {
    direction: options?.direction ?? 'TB',
    nodeSpacing: options?.nodeSpacing ?? 40,
    layerSpacing: options?.layerSpacing ?? 60,
    crossingMinimizationIterations: options?.crossingMinimizationIterations ?? 24,
    coordinateOptimizationIterations: options?.coordinateOptimizationIterations ?? 8,
    edgeMargin: options?.edgeMargin ?? 20,
  };
}

/** Positioned handle in the output */
export interface HandleOutput {
  id: string;
  type: HandleType;
  position: HandleSide;
  x: number;
  y: number;
}

/** Positioned node in the output */
export interface NodeOutput {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  handles: HandleOutput[];
}

/** Routed edge in the output */
export interface EdgeOutput {
  id: string;
  from: string;
  to: string;
  fromHandle: string;
  toHandle: string;
  points: Point[];
}

/** Complete layout result */
export interface LayoutResult {
  nodes: NodeOutput[];
  edges: EdgeOutput[];
}

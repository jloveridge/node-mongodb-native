import { AggregateOperation, AggregateOptions } from '../operations/aggregate';
import { AbstractCursor, ExecutionResult } from './abstract_cursor';
import { executeOperation } from '../operations/execute_operation';
import type { Document } from '../bson';
import type { Sort } from '../sort';
import type { Topology } from '../sdam/topology';
import type { Callback } from '../utils';
import type { ClientSession } from '../sessions';
import type { CursorOptions } from './cursor';
import type { OperationParent } from '../operations/command';
import type { AbstractCursorOptions } from './abstract_cursor';

/** @public */
export interface AggregationCursorOptions extends CursorOptions, AggregateOptions {}

/**
 * The **AggregationCursor** class is an internal class that embodies an aggregation cursor on MongoDB
 * allowing for iteration over the results returned from the underlying query. It supports
 * one by one document iteration, conversion to an array or can be iterated as a Node 4.X
 * or higher stream
 * @public
 */
export class AggregationCursor extends AbstractCursor {
  parent?: OperationParent; // TEMPORARY
  pipeline: Document[];
  options: AggregateOptions;

  /** @internal */
  constructor(
    parent: OperationParent | undefined,
    topology: Topology,
    pipeline: Document[] = [],
    options: AggregateOptions = {}
  ) {
    super(topology, options);

    this.parent = parent;
    this.pipeline = pipeline;
    this.options = options;
  }

  /** @internal */
  _initialize(
    session: ClientSession | undefined,
    options: AbstractCursorOptions,
    callback: Callback<ExecutionResult>
  ): void {
    const aggregateOperation = new AggregateOperation(this.parent, this.pipeline, {
      session,
      ...options,
      ...this.options
    });

    executeOperation(this.topology, aggregateOperation, (err, response) => {
      if (err || response == null) return callback(err);

      // NOTE: `executeOperation` should be improved to allow returning an intermediate
      //       representation including the selected server, session, and server response.
      callback(undefined, {
        namespace: aggregateOperation.ns,
        server: aggregateOperation.server,
        session,
        response
      });
    });
  }

  /**
   * Execute the explain for the cursor
   *
   * @param callback - The result callback.
   */
  explain(): Promise<Document | null>;
  explain(callback: Callback<Document | null>): void;
  explain(callback?: Callback<Document | null>): Promise<Document | null> | void {
    return executeOperation(
      this.topology,
      new AggregateOperation(this.parent, this.pipeline, { ...this.options, explain: true }),
      callback
    );
  }

  /** Add a group stage to the aggregation pipeline */
  group($group: Document): this {
    this.pipeline.push({ $group });
    return this;
  }

  /** Add a limit stage to the aggregation pipeline */
  limit($limit: number): this {
    this.pipeline.push({ $limit });
    return this;
  }

  /** Add a match stage to the aggregation pipeline */
  match($match: Document): this {
    this.pipeline.push({ $match });
    return this;
  }

  /** Add a out stage to the aggregation pipeline */
  out($out: number): this {
    this.pipeline.push({ $out });
    return this;
  }

  /** Add a project stage to the aggregation pipeline */
  project($project: Document): this {
    this.pipeline.push({ $project });
    return this;
  }

  /** Add a lookup stage to the aggregation pipeline */
  lookup($lookup: Document): this {
    this.pipeline.push({ $lookup });
    return this;
  }

  /** Add a redact stage to the aggregation pipeline */
  redact($redact: Document): this {
    this.pipeline.push({ $redact });
    return this;
  }

  /** Add a skip stage to the aggregation pipeline */
  skip($skip: number): this {
    this.pipeline.push({ $skip });
    return this;
  }

  /** Add a sort stage to the aggregation pipeline */
  sort($sort: Sort): this {
    this.pipeline.push({ $sort });
    return this;
  }

  /** Add a unwind stage to the aggregation pipeline */
  unwind($unwind: number): this {
    this.pipeline.push({ $unwind });
    return this;
  }

  // deprecated methods
  /** @deprecated Add a geoNear stage to the aggregation pipeline */
  geoNear($geoNear: Document): this {
    this.pipeline.push({ $geoNear });
    return this;
  }
}

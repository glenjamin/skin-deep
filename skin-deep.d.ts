import { ReactElement, ComponentClass } from 'react';

export type Selector = any;
export type Matcher = any;

export interface Tree<P, C> {
  type: ComponentClass<P> | string;
  props: P;
  reRender(props: P, context?: C): void;
  getMountedInstance(): Object;
  subTree(query: Selector, predicate?: Matcher): Tree<any, any>;
  everySubTree(query: Selector, predicate?: Matcher): Tree<any, any>[];
  dive(paths: Selector[]): Tree<any, {}>;
  dive<C>(paths: Selector[], context: C): Tree<any, C>;
  text(): string;
  getRenderOutput(): ReactElement<P>;
  toString(): string;
}

export function shallowRender<P>(element: ReactElement<P>|JSX.Element): Tree<P, {}>;
export function shallowRender<P, C>(element: ReactElement<P>|JSX.Element, context: C): Tree<P, C>;

export function hasClass(node: JSX.Element, cls: string): boolean;
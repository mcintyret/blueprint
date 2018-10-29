/*
 * Copyright 2018 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import * as React from "react";
import ResizeObserver from "resize-observer-polyfill";

import { findDOMNode } from "react-dom";
import { DISPLAYNAME_PREFIX } from "../../common/props";
import { safeInvoke } from "../../common/utils";

/** A parallel type to `ResizeObserverEntry` (from resize-observer-polyfill). */
export interface IResizeEntry {
    /** Measured dimensions of the target. */
    contentRect: DOMRectReadOnly;

    /** The resized element. */
    target: Element;
}

/** `ResizeSensor` requires a single DOM element child and will error otherwise. */
export interface IResizeSensorProps {
    /**
     * Callback invoked when the wrapped element resizes.
     *
     * The `entries` array contains an entry for each observed element. In the
     * default case (no `observeParents`), the array will contain only one
     * element: the single child of the `ResizeSensor`.
     *
     * Note that this method is called _asynchronously_ after a resize is
     * detected and typically it will be called no more than once per frame.
     */
    onResize: (entries: IResizeEntry[]) => void;

    /**
     * If `true`, all parent DOM elements of the container will also be
     * observed for size changes. The array of entries passed to `onResize`
     * will now contain an entry for each parent element up to the root of the
     * document.
     *
     * Only enable this prop if a parent element resizes in a way that does
     * not also cause the child element to resize.
     * @default false
     */
    observeParents?: boolean;
}

export class ResizeSensor extends React.PureComponent<IResizeSensorProps> {
    public static displayName = `${DISPLAYNAME_PREFIX}.ResizeSensor`;

    private element: Element | null = null;
    private observer = new ResizeObserver(entries => safeInvoke(this.props.onResize, entries));

    public render() {
        // pass-through render of single child
        return React.Children.only(this.props.children);
    }

    public componentDidMount() {
        // using findDOMNode for two reasons:
        // 1. cloning to insert a ref is unwieldy and not performant.
        // 2. ensure that we get an actual DOM node for observing.
        this.observeElement(findDOMNode(this));
    }

    public componentDidUpdate(prevProps: IResizeSensorProps) {
        this.observeElement(findDOMNode(this), this.props.observeParents !== prevProps.observeParents);
    }

    public componentWillUnmount() {
        this.observer.disconnect();
    }

    /**
     * Observe the given element, if defined and different from the currently
     * observed element. Pass `force` argument to skip element checks and always
     * re-observe.
     */
    private observeElement(element: Element | Text | null, force = false) {
        if (!(element instanceof Element)) {
            // stop everything if not defined
            this.observer.disconnect();
            return;
        }

        if (element === this.element && !force) {
            // quit if given same element -- nothing to update (unless forced)
            return;
        } else {
            // clear observer list if new element
            this.observer.disconnect();
            // remember element reference for next time
            this.element = element;
        }

        // observer callback is invoked immediately when observing new elements
        this.observer.observe(element);

        if (this.props.observeParents) {
            let parent = element.parentElement;
            while (parent != null) {
                this.observer.observe(parent);
                parent = parent.parentElement;
            }
        }
    }
}

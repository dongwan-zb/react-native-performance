import React, {useRef, useCallback} from 'react';
import type {ComponentProps} from 'react';
import {PerformanceMeasureView, inMemoryCounter, useStateController} from '@shopify/react-native-performance';
import {useFocusEffect} from 'react-navigation-hooks';

export type Props = ComponentProps<typeof PerformanceMeasureView>;

/**
 * Performance view similar to `PerformanceMeasureView` but meant to be used with `react-navigation`.
 * If the screen is not mounted in a react-navigation context, it might misbehave and is therefore not recommended.
 */
export const ReactNavigationPerformanceView = (props: Props) => {
  const componentInstanceId = useRef(props.componentInstanceId ?? inMemoryCounter()).current;
  const stateController = useStateController();

  useFocusEffect(
    useCallback(() => {
      stateController.stopFlowIfNeeded(componentInstanceId);
    }, [stateController, componentInstanceId]),
  );

  const interactive = props.interactive;

  /**
   * Represents previous renderPassName passed via `props`.
   * Does not include `TRANSITION_END` event.
   */
  const lastRenderPassName = useRef<string | undefined>(undefined);
  const renderProps = useRef({
    renderPassName: props.renderPassName,
    interactive,
  });

  // If a user has not changed the `renderPassName`, we keep `TRANSITION_END` as the current one.
  // This is to avoid emitting reports of render passes where user has not explicitly changed it.
  // `PerformanceMeasureView` will log a reused `renderPassName`
  // and subsequent render passes with a different `renderPassName` will still be reported.
  // Check out this link for more details: https://github.com/Shopify/react-native-performance/pull/363
  if (lastRenderPassName.current !== props.renderPassName) {
    renderProps.current = {renderPassName: props.renderPassName, interactive};
  }
  lastRenderPassName.current = props.renderPassName;

  return (
    <PerformanceMeasureView
      {...props}
      componentInstanceId={componentInstanceId}
      renderPassName={renderProps.current.renderPassName}
      interactive={renderProps.current.interactive}
    />
  );
};

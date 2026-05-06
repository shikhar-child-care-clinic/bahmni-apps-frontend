import { ComponentType, LazyExoticComponent } from 'react';

export interface WidgetProps {
  config?: Record<string, unknown>;
  episodeOfCareUuids?: string[];
  encounterUuids?: string[];
  visitUuids?: string[];
  /**
   * Optional callback invoked when the user clicks the Edit button in a widget header.
   * When omitted the Edit button is not rendered (backward compatible).
   * The clinical app provides this to trigger the encounter resume/new decision flow.
   */
  onEdit?: () => void;
  /**
   * Whether the current encounter can be resumed (resolved at page level).
   * When `true`, the Edit button is shown; when `false` or `undefined`, it is hidden.
   */
  canResume?: boolean;
}
export interface WidgetConfig {
  type: string;
  component: LazyExoticComponent<ComponentType<WidgetProps>>;
}

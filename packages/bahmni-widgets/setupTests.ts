import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { initFontAwesome } from '@bahmni/design-system';
import './setupTests.i18n';

// Initialize FontAwesome icons for tests
initFontAwesome();

global.TextEncoder = TextEncoder;
// @ts-expect-error - Ignoring type issues with Node.js util TextDecoder
global.TextDecoder = TextDecoder;

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

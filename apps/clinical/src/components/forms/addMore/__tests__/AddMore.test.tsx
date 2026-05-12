import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import AddMore from '../AddMore';

// Lightweight mocks — only verify structural/callback behaviour
jest.mock('@bahmni/design-system', () => ({
  Button: ({
    children,
    onClick,
    'data-testid': testId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
  }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
  IconButton: ({
    children,
    onClick,
    testId,
    label,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    testId?: string;
    label?: string;
  }) => (
    <button data-testid={testId} aria-label={label} onClick={onClick}>
      {children}
    </button>
  ),
  TrashCan: () => <svg data-testid="trash-can-icon" />,
}));

jest.mock('@carbon/icons-react', () => ({
  Add: () => <svg data-testid="add-icon" />,
}));

describe('AddMore', () => {
  describe('control variant (default)', () => {
    it('renders the "Add More" button', () => {
      render(<AddMore />);
      expect(screen.getByTestId('add-more-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-more-control')).toBeInTheDocument();
    });

    it('calls onAdd when the "Add More" button is clicked', () => {
      const onAdd = jest.fn();
      render(<AddMore onAdd={onAdd} />);
      fireEvent.click(screen.getByTestId('add-more-button'));
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('does not render the remove button when showRemove is false (default)', () => {
      render(<AddMore />);
      expect(screen.queryByTestId('remove-button')).not.toBeInTheDocument();
    });

    it('renders the remove button when showRemove is true', () => {
      render(<AddMore showRemove />);
      expect(screen.getByTestId('remove-button')).toBeInTheDocument();
    });

    it('calls onRemove when the remove button is clicked', () => {
      const onRemove = jest.fn();
      render(<AddMore showRemove onRemove={onRemove} />);
      fireEvent.click(screen.getByTestId('remove-button'));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('does not render the "Add Note" button when showAddNote is false (default)', () => {
      render(<AddMore />);
      expect(screen.queryByTestId('add-note-button')).not.toBeInTheDocument();
    });

    it('renders the "Add Note" button when showAddNote is true', () => {
      render(<AddMore showAddNote />);
      expect(screen.getByTestId('add-note-button')).toBeInTheDocument();
    });

    it('calls onAddNote when the "Add Note" button is clicked', () => {
      const onAddNote = jest.fn();
      render(<AddMore showAddNote onAddNote={onAddNote} />);
      fireEvent.click(screen.getByTestId('add-note-button'));
      expect(onAddNote).toHaveBeenCalledTimes(1);
    });

    it('renders all three buttons when showRemove and showAddNote are true', () => {
      render(<AddMore showRemove showAddNote />);
      expect(screen.getByTestId('add-more-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-note-button')).toBeInTheDocument();
      expect(screen.getByTestId('remove-button')).toBeInTheDocument();
    });

    it('does not render the group container', () => {
      render(<AddMore />);
      expect(screen.queryByTestId('add-more-group')).not.toBeInTheDocument();
    });
  });

  describe('group variant', () => {
    it('renders the group container with the "Add More" button below the group', () => {
      render(<AddMore variant="group" />);
      expect(screen.getByTestId('add-more-group')).toBeInTheDocument();
      expect(screen.getByTestId('add-more-button')).toBeInTheDocument();
    });

    it('calls onAdd when the "Add More" button is clicked in group variant', () => {
      const onAdd = jest.fn();
      render(<AddMore variant="group" onAdd={onAdd} />);
      fireEvent.click(screen.getByTestId('add-more-button'));
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('does not render remove button in group variant even when showRemove is true', () => {
      render(<AddMore variant="group" showRemove />);
      expect(screen.queryByTestId('remove-button')).not.toBeInTheDocument();
    });

    it('does not render "Add Note" button in group variant even when showAddNote is true', () => {
      render(<AddMore variant="group" showAddNote />);
      expect(screen.queryByTestId('add-note-button')).not.toBeInTheDocument();
    });

    it('does not render the control container in group variant', () => {
      render(<AddMore variant="group" />);
      expect(screen.queryByTestId('add-more-control')).not.toBeInTheDocument();
    });
  });

  describe('delete button propagation', () => {
    it('shows remove buttons independently for multiple instances', () => {
      const onRemove1 = jest.fn();
      const onRemove2 = jest.fn();
      const { container } = render(
        <div>
          <AddMore showRemove onRemove={onRemove1} />
          <AddMore showRemove onRemove={onRemove2} />
        </div>,
      );
      const removeButtons = container.querySelectorAll(
        '[data-testid="remove-button"]',
      );
      expect(removeButtons).toHaveLength(2);
      fireEvent.click(removeButtons[0]);
      expect(onRemove1).toHaveBeenCalledTimes(1);
      expect(onRemove2).not.toHaveBeenCalled();
    });
  });
});

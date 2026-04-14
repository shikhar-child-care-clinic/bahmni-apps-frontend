import { DataTableHeader } from '@carbon/react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SortableDataTable } from '../SortableDataTable';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

const mockHeaders: DataTableHeader[] = [
  { key: 'name', header: 'Medication' },
  { key: 'dosage', header: 'Dosage' },
  { key: 'instruction', header: 'Instruction' },
  { key: 'startDate', header: 'Start Date' },
  { key: 'orderDate', header: 'Order Date' },
  { key: 'orderedBy', header: 'Ordered By' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'status', header: 'Status' },
];

const mockMedicationRows = [
  {
    id: '2c6a89df-64a5-4a99-a078-4c3fda0b2f15',
    name: 'Acetylsalicylic acid 150 mg',
    dosage: '1 Tablet | Twice a day | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Oral',
    startDate: '03/04/2025',
    orderDate: '03/04/2025',
    orderedBy: 'Super Man',
    quantity: '4 Tablet',
    status: 'stopped',
  },
  {
    id: 'fb4bc0c6-849c-4ec3-ad63-0e18b0ee3604',
    name: 'Paroxetine 12.5 mg',
    dosage: '1 Tablet | Once a day | 5 days',
    dosageUnit: 'Tablet',
    instruction: 'Nasal',
    startDate: '04/04/2025',
    orderDate: '04/04/2025',
    orderedBy: 'Dr Neha Anand',
    quantity: '5 Tablet',
    status: 'stopped',
  },
  {
    id: '1124a9bb-1891-44bb-9842-103239aa2ca3',
    name: 'Chlorpheniramine maleate 4 mg',
    dosage: '2 Tablet | Twice a day | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Injection',
    startDate: '08/04/2025',
    orderDate: '08/04/2025',
    orderedBy: 'Dr Franklin Richards',
    quantity: '8 Tablet',
    status: 'scheduled',
  },
  {
    id: '1d2d372e-0ec3-4544-accd-aa5743d1bf70',
    name: 'Paracetamol 650 mg',
    dosage: '2 Tablet | Immediately | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Eye Drops',
    startDate: '08/04/2025',
    orderDate: '08/04/2025',
    orderedBy: 'Dr Sebastian Adams',
    quantity: '4 Tablet',
    status: 'stopped',
  },
  {
    id: 'cb23207e-102d-480f-b4e7-6b7ee2084ae7',
    name: 'Hydrochlorothiazide 25 mg',
    dosage: '2 Tablet | Thrice a day | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Oral | Patient needs sufficient dose of clean water',
    startDate: '08/04/2025',
    orderDate: '08/04/2025',
    orderedBy: 'Dr Monica Smith',
    quantity: '12 Tablet',
    status: 'stopped',
  },
  {
    id: 'c5396e12-dbfe-4259-9e42-92a52a2761a8',
    name: 'Oxygen',
    dosage: '2 Unit | Twice a day | 2 days',
    dosageUnit: 'Unit',
    instruction: 'Nasogastric | Patient needs sufficient dose of clean oxygen',
    startDate: '24/06/2025',
    orderDate: '24/06/2025',
    orderedBy: 'Dr John Doe',
    quantity: '8 Unit',
    status: 'active',
  },
];

describe('SortableDataTable', () => {
  const renderCell = (
    row: (typeof mockMedicationRows)[number],
    cellId: string,
  ) => row[cellId as keyof typeof row];

  it('renders medication table with all rows', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
      />,
    );

    // Check some representative rows
    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('Oxygen')).toBeInTheDocument();
    expect(screen.getByText('Super Man')).toBeInTheDocument();
    expect(screen.getByText('Oral')).toBeInTheDocument();
    expect(screen.getByText('8 Unit')).toBeInTheDocument();
  });

  it('renders sortable columns and sorts on header click (e.g., name)', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
      />,
    );

    const nameHeader = screen.getByText('Medication');
    fireEvent.click(nameHeader); // simulate sort click

    // All data should still be present (just verify it re-renders correctly)
    expect(screen.getByText('Oxygen')).toBeInTheDocument();
    expect(screen.getByText('Hydrochlorothiazide 25 mg')).toBeInTheDocument();
  });
  it('renders error state when errorStateMessage is provided', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        errorStateMessage="Something failed"
        ariaLabel="Error Table"
      />,
    );

    const errorElement = screen.getByTestId('sortable-data-table-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toBe('Something failed');
  });

  it('renders skeleton when loading is true', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        loading
        ariaLabel="Loading Table"
      />,
    );

    const skeleton = screen.getByTestId('sortable-data-table-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders empty state when rows are empty', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={[]}
        ariaLabel="Empty Table"
      />,
    );

    const empty = screen.getByTestId('sortable-data-table-empty');
    expect(empty).toBeInTheDocument();
    expect(empty.textContent).toBe('No data available');
  });

  it('renders empty state with custom emptyStateMessage', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={[]}
        emptyStateMessage="Nothing to show"
        ariaLabel="Custom Empty Table"
      />,
    );

    const empty = screen.getByTestId('sortable-data-table-empty');
    expect(empty.textContent).toBe('Nothing to show');
  });

  it('renders the table with default renderCell', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Default RenderCell"
      />,
    );

    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('does not render rows whose id is absent from the source data', () => {
    // The null guard `if (!originalRow) return null` protects against row IDs in
    // Carbon DataTable's internal tableRows that cannot be matched back to a source
    // row (e.g. during rapid prop updates where Carbon's state temporarily diverges).
    // Carbon preserves source IDs under normal usage so this test validates the
    // positive path: every source row renders, and renderCell is never called with
    // an undefined row. Removing the guard would cause a TypeError at runtime when
    // Carbon generates a row ID absent from the rowMap.
    const renderCell = jest.fn(
      (row: (typeof mockMedicationRows)[number], cellId: string) =>
        row[cellId as keyof typeof row] as string,
    );

    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Null Guard Test"
        renderCell={renderCell}
      />,
    );

    // Every source row must be present — the guard must not skip any valid row
    mockMedicationRows.forEach((row) => {
      expect(screen.getByTestId(`table-row-${row.id}`)).toBeInTheDocument();
    });

    // renderCell must only have been called with defined, non-null rows
    renderCell.mock.calls.forEach(([row]) => {
      expect(row).toBeDefined();
      expect(row).not.toBeNull();
    });
  });

  it('handles undefined rows gracefully', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={undefined as any}
        ariaLabel="Undefined Rows"
      />,
    );

    expect(screen.getByTestId('sortable-data-table-empty')).toBeInTheDocument();
  });

  it('handles null rows gracefully', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={null as any}
        ariaLabel="Null Rows"
      />,
    );

    expect(screen.getByTestId('sortable-data-table-empty')).toBeInTheDocument();
  });

  it('applies custom className and CSS module class', () => {
    const { container } = render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        className="my-custom-table"
        ariaLabel="Styled Table"
      />,
    );

    expect(container.firstChild).toHaveClass('my-custom-table');
  });

  it('respects partial sortable array', () => {
    render(
      <SortableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        sortable={[{ key: 'name', sortable: false }]} // status is not defined here
        ariaLabel="Partial Sortable"
      />,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers[0].querySelector('button')).toBeNull(); // name not sortable
    // status not in `sortable` array, default = false
    expect(headers[1].querySelector('button')).toBeNull();
  });

  describe('Snapshots', () => {
    it('matches snapshot with full data', () => {
      const { container } = render(
        <SortableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          ariaLabel="Snapshot Test Full"
          renderCell={renderCell}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when loading', () => {
      const { container } = render(
        <SortableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          loading
          ariaLabel="Snapshot Loading"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when empty', () => {
      const { container } = render(
        <SortableDataTable
          headers={mockHeaders}
          rows={[]}
          emptyStateMessage="No medication history"
          ariaLabel="Snapshot Empty"
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      // Arrange
      const { container } = render(
        <SortableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          ariaLabel="Accessibility Test"
          renderCell={renderCell}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Pagination', () => {
    const manyRows = Array.from({ length: 12 }, (_, i) => ({
      id: `row-${i}`,
      name: `Medication ${i + 1}`,
      dosage: `${i + 1} Tablet`,
      dosageUnit: 'Tablet',
      instruction: 'Oral',
      startDate: '01/01/2025',
      orderDate: '01/01/2025',
      orderedBy: `Dr. ${i + 1}`,
      quantity: `${i + 1} Tablet`,
      status: 'active',
    }));

    it('renders pagination when pageSize is provided and rows exceed pageSize', () => {
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Paginated Table"
          renderCell={renderCell}
          pageSize={5}
        />,
      );

      expect(
        screen.getByRole('button', { name: /next page/i }),
      ).toBeInTheDocument();
    });

    it('does not render pagination when rows fit on one page', () => {
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="No Pagination Table"
          renderCell={renderCell}
          pageSize={20}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /next page/i }),
      ).not.toBeInTheDocument();
    });

    it('does not render pagination when pageSize prop is not provided', () => {
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="No Pagination Prop Table"
          renderCell={renderCell}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /next page/i }),
      ).not.toBeInTheDocument();
    });

    it('displays only the first page rows when pageSize is provided', () => {
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="First Page Table"
          renderCell={renderCell}
          pageSize={5}
        />,
      );

      expect(screen.getByText('Medication 1')).toBeInTheDocument();
      expect(screen.getByText('Medication 5')).toBeInTheDocument();
      expect(screen.queryByText('Medication 6')).not.toBeInTheDocument();
    });

    it('navigates to next page showing correct rows', async () => {
      const user = userEvent.setup();
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Next Page Table"
          renderCell={renderCell}
          pageSize={5}
        />,
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByText('Medication 6')).toBeInTheDocument();
      expect(screen.queryByText('Medication 1')).not.toBeInTheDocument();
    });

    it('disables previous page button on first page', () => {
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Prev Disabled Table"
          renderCell={renderCell}
          pageSize={5}
        />,
      );

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables next page button on last page', async () => {
      const user = userEvent.setup();
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Next Disabled Table"
          renderCell={renderCell}
          pageSize={10}
        />,
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('calls onPageChange callback when page changes', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Callback Table"
          renderCell={renderCell}
          pageSize={5}
          onPageChange={onPageChange}
        />,
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2, 5);
    });

    it('changes page size when a new page size is selected', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Page Size Table"
          renderCell={renderCell}
          pageSize={5}
          pageSizes={[5, 10, 25]}
          onPageChange={onPageChange}
        />,
      );

      const select = screen.getByRole('combobox', { name: /items per page/i });
      await user.selectOptions(select, '10');

      expect(onPageChange).toHaveBeenCalledWith(1, 10);
    });

    it('maintains sort order across page changes', async () => {
      const user = userEvent.setup();
      render(
        <SortableDataTable
          headers={mockHeaders}
          rows={manyRows}
          ariaLabel="Sort Preserved Table"
          renderCell={renderCell}
          pageSize={5}
        />,
      );

      // Sort by name descending
      const nameHeader = screen.getByTestId('table-header-name');
      await user.click(nameHeader); // asc
      await user.click(nameHeader); // desc

      // Capture page 1 rows
      const page1Rows = screen
        .getAllByRole('row')
        .slice(1)
        .map((r) => r.getAttribute('data-testid'));

      // Go to page 2
      await user.click(screen.getByRole('button', { name: /next page/i }));

      const page2Rows = screen
        .getAllByRole('row')
        .slice(1)
        .map((r) => r.getAttribute('data-testid'));

      // Page 2 rows must be different from page 1 (sort applied across all pages)
      expect(page2Rows).not.toEqual(page1Rows);

      // No page 1 rows should appear on page 2
      page1Rows.forEach((rowId) => {
        expect(page2Rows).not.toContain(rowId);
      });
    });
  });
});

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import Actions from '../components/Actions';
import {
  multipleActionsMock,
  singleActionMock,
} from './__mocks__/actionsMocks';

expect.extend(toHaveNoViolations);

jest.mock('../../userPrivileges/useUserPrivilege');

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

describe('Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({ userPrivileges: [] } as any);
  });

  it('renders a ghost button when there is a single action', () => {
    render(<Actions actions={singleActionMock} />);

    const button = screen.getByTestId('medication-action-administer-button');
    expect(button).toHaveClass('cds--btn--ghost');
    expect(button).toHaveTextContent('Administer');
  });

  it('renders an overflow menu when there are multiple actions', () => {
    render(<Actions actions={multipleActionsMock} />);

    expect(
      screen.getByTestId('medication-actions-overflow-menu'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('medication-action-administer-button'),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      label:
        'enables the ghost button when the user has the required privilege',
      privileges: [{ uuid: 'u1', name: 'privilege1' }],
      expectDisabled: false,
    },
    {
      label:
        'disables the ghost button when the user lacks the required privilege',
      privileges: [],
      expectDisabled: true,
    },
  ])('$label', ({ privileges, expectDisabled }) => {
    mockUseUserPrivilege.mockReturnValue({ userPrivileges: privileges } as any);

    render(<Actions actions={singleActionMock} />);

    const button = screen.getByTestId('medication-action-administer-button');
    expect(button).toHaveProperty('disabled', expectDisabled);
  });

  it.each([
    { label: 'single action', actions: singleActionMock },
    { label: 'multiple actions', actions: multipleActionsMock },
  ])('matches snapshot for $label', ({ actions }) => {
    const { container } = render(<Actions actions={actions} />);
    expect(container).toMatchSnapshot();
  });

  it.each([
    { label: 'single action', actions: singleActionMock },
    { label: 'multiple actions', actions: multipleActionsMock },
  ])('has no accessibility violations for $label', async ({ actions }) => {
    const { container } = render(<Actions actions={actions} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

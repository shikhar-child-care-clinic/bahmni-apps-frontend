import { render, screen, fireEvent } from '@testing-library/react';
import PrintModal from '../PrintModal';

describe('PrintModal', () => {
  it('shows loading spinner when isLoading is true', () => {
    render(<PrintModal open isLoading onClose={jest.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Preparing document/i)).toBeInTheDocument();
  });

  it('shows error message when error is set', () => {
    render(<PrintModal open error="Template not found" onClose={jest.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Template not found')).toBeInTheDocument();
  });

  it('renders iframe when htmlContent is provided', () => {
    render(
      <PrintModal
        open
        htmlContent="<html><body>Hello</body></html>"
        onClose={jest.fn()}
      />,
    );
    const iframe = screen.getByTitle(/preview/i);
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('sandbox');
  });

  it('disables Print button when there is no content', () => {
    render(<PrintModal open isLoading onClose={jest.fn()} />);
    expect(screen.getByText('Print')).toBeDisabled();
  });

  it('enables Print button when htmlContent is present', () => {
    render(<PrintModal open htmlContent="<html/>" onClose={jest.fn()} />);
    expect(screen.getByText('Print')).not.toBeDisabled();
  });

  it('does not render Download PDF button when onDownloadPdf is not provided', () => {
    render(<PrintModal open htmlContent="<html/>" onClose={jest.fn()} />);
    expect(screen.queryByText(/Download PDF/i)).not.toBeInTheDocument();
  });

  it('renders Download PDF button when onDownloadPdf is provided', () => {
    render(
      <PrintModal
        open
        htmlContent="<html/>"
        onClose={jest.fn()}
        onDownloadPdf={jest.fn()}
      />,
    );
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(<PrintModal open htmlContent="<html/>" onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDownloadPdf when Download PDF is clicked', () => {
    const onDownloadPdf = jest.fn();
    render(
      <PrintModal
        open
        htmlContent="<html/>"
        onClose={jest.fn()}
        onDownloadPdf={onDownloadPdf}
      />,
    );
    fireEvent.click(screen.getByText('Download PDF'));
    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
  });

  it('shows Generating PDF text when isDownloadingPdf is true', () => {
    render(
      <PrintModal
        open
        htmlContent="<html/>"
        onClose={jest.fn()}
        onDownloadPdf={jest.fn()}
        isDownloadingPdf
      />,
    );
    expect(screen.getByText('Generating PDF…')).toBeInTheDocument();
  });
});

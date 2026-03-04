import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PdfTile } from '../PdfTile';

jest.mock('../styles/PdfTile.module.scss', () => ({
  thumbnailButton: 'thumbnailButton-class',
  pdfThumbnail: 'pdfThumbnail-class',
  modalPdfContainer: 'modalPdfContainer-class',
  modalPdf: 'modalPdf-class',
}));

describe('PdfTile', () => {
  const defaultProps = {
    pdfSrc: '100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.pdf',
    id: 'test-pdf',
  };

  it('should render thumbnail button and pdf icon', () => {
    render(<PdfTile {...defaultProps} />);

    const button = screen.getByTestId('test-pdf-test-id');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    const thumbnail = screen.getByTestId('test-pdf-thumbnail-test-id');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveTextContent('📄');
  });

  it('should open modal when thumbnail is clicked', async () => {
    render(<PdfTile {...defaultProps} modalTitle="PDF Preview" />);

    const button = screen.getByTestId('test-pdf-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('PDF Preview')).toBeInTheDocument();
    });
  });

  it('should call onModalOpen callback when modal opens', () => {
    const onModalOpen = jest.fn();
    render(<PdfTile {...defaultProps} onModalOpen={onModalOpen} />);

    const button = screen.getByTestId('test-pdf-test-id');
    fireEvent.click(button);

    expect(onModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose callback when modal closes', async () => {
    const onModalClose = jest.fn();
    render(
      <PdfTile
        {...defaultProps}
        modalTitle="PDF Preview"
        onModalClose={onModalClose}
      />,
    );

    const button = screen.getByTestId('test-pdf-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('PDF Preview')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('should render modal embed with correct PDF src', async () => {
    render(<PdfTile {...defaultProps} modalTitle="PDF Preview" />);

    const button = screen.getByTestId('test-pdf-test-id');
    fireEvent.click(button);

    await waitFor(() => {
      const embedElement = screen.getByTestId('test-pdf-modal-pdf-test-id');
      expect(embedElement).toBeInTheDocument();
      expect(embedElement).toHaveAttribute('type', 'application/pdf');
      expect(embedElement).toHaveAttribute(
        'src',
        '/openmrs/auth?requested_document=/document_images/100/9-Consultation-27627c65-5f95-4118-b8e5-89f0aa8cc3b8.pdf',
      );
    });
  });
});

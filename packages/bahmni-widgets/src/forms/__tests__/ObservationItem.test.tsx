import { render, screen } from '@testing-library/react';

import { ObservationData } from '../models';
import { ObservationItem } from '../ObservationItem';

// Mock the design system components
jest.mock('@bahmni/design-system', () => ({
  ImageTile: ({ imageSrc, alt, id }: any) => (
    <div data-testid="image-tile" data-src={imageSrc} data-alt={alt} data-id={id}>
      Image: {imageSrc}
    </div>
  ),
  VideoTile: ({ videoSrc, id }: any) => (
    <div data-testid="video-tile" data-src={videoSrc} data-id={id}>
      Video: {videoSrc}
    </div>
  ),
}));

// Mock the services
jest.mock('@bahmni/services', () => ({
  getValueType: (value: string) => {
    if (!value) return 'string';
    const lower = value.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) {
      return 'Image';
    }
    if (lower.endsWith('.mp4') || lower.endsWith('.avi') || lower.endsWith('.mov')) {
      return 'Video';
    }
    return 'string';
  },
}));

describe('ObservationItem', () => {
  const mockObservation: ObservationData = {
    concept: {
      name: 'Heart Rate',
      uuid: 'hr-uuid',
      shortName: 'HR',
    },
    value: 75,
    valueAsString: '75',
    conceptNameToDisplay: 'HR',
  };

  describe('Range Display', () => {
    it('should display range when both low and high are present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          lowNormal: 60,
          hiNormal: 100,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.getByText(/\(60 - 100\)/)).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });

    it('should display >low when only low is present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          lowNormal: 95,
          units: '%',
        },
        conceptNameToDisplay: 'SpO2',
        valueAsString: '96',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/SpO2/)).toBeInTheDocument();
      expect(screen.getByText(/\(>95\)/)).toBeInTheDocument();
      expect(screen.getByText(/96 %/)).toBeInTheDocument();
    });

    it('should display <high when only high is present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          hiNormal: 100,
          units: 'mg/dL',
        },
        conceptNameToDisplay: 'Blood Sugar',
        valueAsString: '85',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/Blood Sugar/)).toBeInTheDocument();
      expect(screen.getByText(/\(<100\)/)).toBeInTheDocument();
      expect(screen.getByText(/85 mg\/dL/)).toBeInTheDocument();
    });

    it('should not display range when both low and high are null', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });
  });

  describe('Units Display', () => {
    it('should display units when present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });

    it('should not display units when not present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.queryByText(/beats\/min/)).not.toBeInTheDocument();
    });
  });

  describe('Abnormal Value Highlighting', () => {
    it('should apply abnormal styling when interpretation is ABNORMAL', () => {
      const observation: ObservationData = {
        ...mockObservation,
        interpretation: 'ABNORMAL',
        concept: {
          ...mockObservation.concept,
          lowNormal: 60,
          hiNormal: 100,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/75 beats\/min/);
      expect(valueElement).toHaveClass('abnormalValue');

      const labelElement = screen.getByText(/HR/);
      expect(labelElement).toHaveClass('abnormalValue');
    });

    it('should not apply abnormal styling when interpretation is not ABNORMAL', () => {
      const observation: ObservationData = {
        ...mockObservation,
        interpretation: 'NORMAL',
        concept: {
          ...mockObservation.concept,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/75 beats\/min/);
      expect(valueElement).not.toHaveClass('abnormalValue');
    });
  });

  describe('Group Members', () => {
    it('should render group members recursively', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'Heart Rate',
              uuid: 'hr-uuid',
              lowNormal: 60,
              hiNormal: 100,
              units: 'beats/min',
            },
            value: 75,
            valueAsString: '75',
            conceptNameToDisplay: 'HR',
          },
          {
            concept: {
              name: 'SpO2',
              uuid: 'spo2-uuid',
              lowNormal: 95,
              units: '%',
            },
            value: 96,
            valueAsString: '96',
            conceptNameToDisplay: 'SpO2',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Vitals')).toBeInTheDocument();
      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.getByText(/\(60 - 100\)/)).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
      expect(screen.getByText(/SpO2/)).toBeInTheDocument();
      expect(screen.getByText(/\(>95\)/)).toBeInTheDocument();
      expect(screen.getByText(/96 %/)).toBeInTheDocument();
    });

    it('should apply abnormal styling to group members', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'Heart Rate',
              uuid: 'hr-uuid',
              lowNormal: 60,
              hiNormal: 100,
              units: 'beats/min',
            },
            value: 120,
            valueAsString: '120',
            conceptNameToDisplay: 'HR',
            interpretation: 'ABNORMAL',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/120 beats\/min/);
      expect(valueElement).toHaveClass('abnormalValue');
    });
  });

  describe('Comment Section', () => {
    it('should display comment when present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        comment: 'Patient was resting',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Patient was resting')).toBeInTheDocument();
    });

    it('should display comment with provider name', () => {
      const observation: ObservationData = {
        ...mockObservation,
        comment: 'Patient was resting',
        providers: [
          {
            uuid: 'provider-uuid',
            name: 'Dr. Smith',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(
        screen.getByText(/Patient was resting - by Dr. Smith/),
      ).toBeInTheDocument();
    });

    it('should not display comment section when comment is not present', () => {
      const observation: ObservationData = {
        ...mockObservation,
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.queryByText(/Patient was resting/)).not.toBeInTheDocument();
    });
  });

  describe('Media Rendering', () => {
    it('should render ImageTile for image URLs in top-level observations', () => {
      const observation: ObservationData = {
        ...mockObservation,
        valueAsString: 'http://example.com/image.jpg',
        conceptNameToDisplay: 'X-Ray',
      };

      render(<ObservationItem observation={observation} index={0} />);

      const imageTile = screen.getByTestId('image-tile');
      expect(imageTile).toBeInTheDocument();
      expect(imageTile).toHaveAttribute(
        'data-src',
        'http://example.com/image.jpg',
      );
      expect(screen.getByText(/Image: http:\/\/example.com\/image.jpg/)).toBeInTheDocument();
    });

    it('should render VideoTile for video URLs in top-level observations', () => {
      const observation: ObservationData = {
        ...mockObservation,
        valueAsString: 'http://example.com/video.mp4',
        conceptNameToDisplay: 'Procedure Video',
      };

      render(<ObservationItem observation={observation} index={0} />);

      const videoTile = screen.getByTestId('video-tile');
      expect(videoTile).toBeInTheDocument();
      expect(videoTile).toHaveAttribute(
        'data-src',
        'http://example.com/video.mp4',
      );
      expect(screen.getByText(/Video: http:\/\/example.com\/video.mp4/)).toBeInTheDocument();
    });

    it('should render plain text for non-media values', () => {
      const observation: ObservationData = {
        ...mockObservation,
        valueAsString: 'Normal findings',
        conceptNameToDisplay: 'Clinical Notes',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Normal findings')).toBeInTheDocument();
      expect(screen.queryByTestId('image-tile')).not.toBeInTheDocument();
      expect(screen.queryByTestId('video-tile')).not.toBeInTheDocument();
    });

    it('should render ImageTile for image URLs in group members', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Images',
          uuid: 'images-uuid',
        },
        conceptNameToDisplay: 'Medical Images',
        groupMembers: [
          {
            concept: {
              name: 'X-Ray',
              uuid: 'xray-uuid',
            },
            valueAsString: 'http://example.com/xray.png',
            conceptNameToDisplay: 'Chest X-Ray',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      const imageTile = screen.getByTestId('image-tile');
      expect(imageTile).toBeInTheDocument();
      expect(imageTile).toHaveAttribute(
        'data-src',
        'http://example.com/xray.png',
      );
    });

    it('should render VideoTile for video URLs in group members', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Videos',
          uuid: 'videos-uuid',
        },
        conceptNameToDisplay: 'Procedure Videos',
        groupMembers: [
          {
            concept: {
              name: 'Surgery',
              uuid: 'surgery-uuid',
            },
            valueAsString: 'http://example.com/surgery.avi',
            conceptNameToDisplay: 'Surgery Recording',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      const videoTile = screen.getByTestId('video-tile');
      expect(videoTile).toBeInTheDocument();
      expect(videoTile).toHaveAttribute(
        'data-src',
        'http://example.com/surgery.avi',
      );
    });
  });

  describe('Group Member Comments', () => {
    it('should display comment for group member leaf nodes', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'Heart Rate',
              uuid: 'hr-uuid',
              units: 'beats/min',
            },
            value: 75,
            valueAsString: '75',
            conceptNameToDisplay: 'HR',
            comment: 'Patient was exercising',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Patient was exercising')).toBeInTheDocument();
    });

    it('should display comment with provider name for group members', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'SpO2',
              uuid: 'spo2-uuid',
              units: '%',
            },
            value: 96,
            valueAsString: '96',
            conceptNameToDisplay: 'SpO2',
            comment: 'Patient on oxygen',
            providers: [
              {
                uuid: 'provider-uuid',
                name: 'Dr. Johnson',
              },
            ],
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(
        screen.getByText(/Patient on oxygen - by Dr. Johnson/),
      ).toBeInTheDocument();
    });

    it('should not display comment section for group members when comment is not present', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'Heart Rate',
              uuid: 'hr-uuid',
              units: 'beats/min',
            },
            value: 75,
            valueAsString: '75',
            conceptNameToDisplay: 'HR',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Vitals')).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
      // Should not have any comment-related test ids
      expect(
        screen.queryByTestId(/obs-member-comment/),
      ).not.toBeInTheDocument();
    });
  });
});

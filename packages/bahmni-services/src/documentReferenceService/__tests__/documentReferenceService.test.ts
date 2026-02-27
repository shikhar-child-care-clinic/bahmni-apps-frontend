import { Bundle, DocumentReference } from 'fhir/r4';
import { get } from '../../api';
import { getDocumentReferences } from '../documentReferenceService';

jest.mock('../../api');

const mockedGet = get as jest.MockedFunction<typeof get>;

const PATIENT_UUID = 'test-patient-uuid';
const BASE_URL = `/openmrs/ws/fhir2/R4/DocumentReference?patient=${PATIENT_UUID}&_sort=-date`;

const mockDocumentReference: DocumentReference = {
  resourceType: 'DocumentReference',
  id: 'doc-1',
  status: 'current',
  masterIdentifier: { value: 'Prescription_2024' },
  content: [
    {
      attachment: {
        contentType: 'application/pdf',
        url: '100/doc-uuid__prescription.pdf',
      },
    },
  ],
};

const mockBundle: Bundle<DocumentReference> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockDocumentReference }],
};

describe('documentReferenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocumentReferences', () => {
    it('fetches documents with correct URL for a given patient', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID);

      expect(mockedGet).toHaveBeenCalledWith(BASE_URL);
    });

    it('returns the FHIR bundle from the API', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      const result = await getDocumentReferences(PATIENT_UUID);

      expect(result).toEqual(mockBundle);
    });

    it('appends encounter filter when encounterUuids are provided', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);
      const encounterUuids = ['enc-uuid-1', 'enc-uuid-2'];

      await getDocumentReferences(PATIENT_UUID, encounterUuids);

      expect(mockedGet).toHaveBeenCalledWith(
        `${BASE_URL}&encounter=enc-uuid-1,enc-uuid-2`,
      );
    });

    it('appends single encounter filter correctly', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID, ['enc-uuid-1']);

      expect(mockedGet).toHaveBeenCalledWith(
        `${BASE_URL}&encounter=enc-uuid-1`,
      );
    });

    it('does not append encounter filter when encounterUuids is empty array', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID, []);

      expect(mockedGet).toHaveBeenCalledWith(BASE_URL);
    });

    it('does not append encounter filter when encounterUuids is undefined', async () => {
      mockedGet.mockResolvedValueOnce(mockBundle);

      await getDocumentReferences(PATIENT_UUID, undefined);

      expect(mockedGet).toHaveBeenCalledWith(BASE_URL);
    });

    it('throws error when API call fails', async () => {
      const errorMessage = 'Network error';
      mockedGet.mockRejectedValueOnce(new Error(errorMessage));

      await expect(getDocumentReferences(PATIENT_UUID)).rejects.toThrow(
        errorMessage,
      );
    });

    it('returns bundle with empty entry when no documents exist', async () => {
      const emptyBundle: Bundle<DocumentReference> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };
      mockedGet.mockResolvedValueOnce(emptyBundle);

      const result = await getDocumentReferences(PATIENT_UUID);

      expect(result.entry).toHaveLength(0);
    });
  });
});

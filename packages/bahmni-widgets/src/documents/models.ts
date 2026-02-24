/**
 * Interface representing a formatted document for easier consumption by components
 */
export interface DocumentViewModel {
  readonly id: string;
  readonly name: string;
  readonly documentType?: string;
  readonly uploadedOn: string;
  readonly uploadedBy?: string;
  readonly contentType?: string;
  readonly documentUrl: string;
}

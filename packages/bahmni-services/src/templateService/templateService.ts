import { get, post } from '../api';
import client from '../api/client';
import { TEMPLATE_SERVICE_BASE } from './constants';
import type { RenderRequest, TemplateListResponse } from './models';

/**
 * Fetches the list of all available templates from the template service.
 * The UI uses this to determine which print buttons to show.
 *
 * On network error or if the service is not deployed, the caller should
 * catch and return an empty list so print buttons simply don't appear.
 */
export async function getTemplates(): Promise<TemplateListResponse> {
  return get<TemplateListResponse>(`${TEMPLATE_SERVICE_BASE}/templates`);
}

/**
 * Renders a template and returns the result as an HTML string.
 * The HTML is displayed in an <iframe> inside PrintModal.
 */
export async function renderAsHtml(request: RenderRequest): Promise<string> {
  return post<string>(`${TEMPLATE_SERVICE_BASE}/render`, request);
}

/**
 * Renders a template and returns the result as a PDF Blob.
 * The Blob is used to trigger a browser file download.
 *
 * NOTE: Uses the raw axios client directly because the standard post() wrapper
 * always parses responses as JSON. PDF responses are binary and must be
 * received as Blob.
 */
export async function renderAsPdf(request: RenderRequest): Promise<Blob> {
  const response = await client.post(
    `${TEMPLATE_SERVICE_BASE}/render`,
    request,
    { responseType: 'blob' },
  );
  return response.data as Blob;
}

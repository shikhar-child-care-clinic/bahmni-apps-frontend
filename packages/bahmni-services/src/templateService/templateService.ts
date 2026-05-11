import { get, post } from '../api';
import { TEMPLATE_SERVICE_BASE } from './constants';
import type {
  RenderRequest,
  RenderResponse,
  TemplateListResponse,
} from './models';

export async function getTemplates(): Promise<TemplateListResponse> {
  return get<TemplateListResponse>(`${TEMPLATE_SERVICE_BASE}/templates`);
}

export async function renderAsHtml(request: RenderRequest): Promise<string> {
  const response = await post<RenderResponse>(
    `${TEMPLATE_SERVICE_BASE}/render`,
    request,
  );
  return response.html;
}

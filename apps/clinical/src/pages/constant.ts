import { CLINICAL_V2_CONFIG_BASE_URL } from "../constants/app";

export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `${CLINICAL_V2_CONFIG_BASE_URL}/dashboards/${dashboardURL}`;

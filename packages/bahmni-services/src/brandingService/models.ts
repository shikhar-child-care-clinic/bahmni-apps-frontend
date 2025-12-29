export interface LoginBranding {
  logo?: string;
  showHeaderText?: boolean;
  showTitleText?: boolean;
}

export interface WhiteLabelResponse {
  loginPage?: LoginBranding;
}

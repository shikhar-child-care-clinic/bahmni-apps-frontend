export interface Module {
  id: string;
  label: string;
  icon: string;
  order?: number;
  url?: string;
  privileges?: string[];
}

export interface HomeConfig {
  modules: Module[];
}

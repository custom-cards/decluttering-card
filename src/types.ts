/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DeclutteringCardConfig {
  variables?: VariablesConfig[];
  template: string;
}

export interface VariablesConfig {
  [key: string]: any;
}

export interface TemplateConfig {
  default: VariablesConfig[];
  card?: any;
  element?: any;
}

export interface DeclutteringCardConfig {
    variables?: VariablesConfig[];
    template: string;
}

export interface VariablesConfig {
    [key: string]: any;
}

export interface TemplateConfig {
    default: VariablesConfig[];
    card: any;
}

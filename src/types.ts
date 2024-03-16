import { HomeAssistant, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DeclutteringCardConfig extends LovelaceCardConfig {
  variables?: VariablesConfig[];
  template: string;
}

export interface DeclutteringTemplateConfig extends LovelaceCardConfig, TemplateConfig {
  template: string;
}

export interface VariablesConfig {
  [key: string]: any;
}

export interface TemplateConfig {
  default?: VariablesConfig[];
  card?: any;
  row?: any;
  element?: any;
}

export interface LovelaceElement extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceElementConfig): void;
}

export interface LovelaceElementConfig {
  type: string;
  style: Record<string, string>;
  [key: string]: any;
}

export interface LovelaceRow extends HTMLElement {
  hass?: HomeAssistant;
  editMode?: boolean;
  setConfig(config: LovelaceRowConfig);
}

export interface LovelaceRowConfig {
  type?: string;
  [key: string]: any;
}

export type LovelaceThing = LovelaceCard | LovelaceElement | LovelaceRow;
export type LovelaceThingConfig = LovelaceCardConfig | LovelaceElementConfig | LovelaceRowConfig;
export type LovelaceThingType = 'card' | 'row' | 'element';

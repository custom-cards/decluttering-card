import { LitElement, html, customElement, property, state, TemplateResult, css, CSSResult } from 'lit-element';
import {
  HomeAssistant,
  createThing,
  fireEvent,
  LovelaceCardConfig,
  LovelaceCard,
  LovelaceCardEditor,
  LovelaceConfig,
} from 'custom-card-helpers';
import { DeclutteringCardConfig, DeclutteringTemplateConfig, TemplateConfig, VariablesConfig } from './types';
import deepReplace from './deep-replace';
import { getLovelaceConfig } from './utils';
import { ResizeObserver } from 'resize-observer';
import * as pjson from '../package.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HELPERS = (window as any).loadCardHelpers ? (window as any).loadCardHelpers() : undefined;

console.info(
  `%c DECLUTTERING-CARD \n%c   Version ${pjson.version}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

async function loadCardPicker(): Promise<void> {
  // Ensure hui-card-element-editor and hui-card-picker are loaded.
  // They happen to be used by the vertical-stack card editor but there must be a better way?
  let cls = customElements.get('hui-vertical-stack-card');
  if (!cls) {
    (await HELPERS).createCardElement({ type: 'vertical-stack', cards: [] });
    await customElements.whenDefined('hui-vertical-stack-card');
    cls = customElements.get('hui-vertical-stack-card');
  }
  if (cls) await cls.prototype.constructor.getConfigElement();
}

function getTemplateConfig(ll: LovelaceConfig, template: string): TemplateConfig | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates = (ll as any).decluttering_templates;
  const config = templates?.[template] as TemplateConfig;
  if (config) return config;

  if (ll.views) {
    for (const view of ll.views) {
      if (view.cards) {
        for (const card of view.cards) {
          if (card.type === 'custom:decluttering-template' && card.template === template) {
            return card as DeclutteringTemplateConfig;
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sections = (view as any).sections;
      if (sections) {
        for (const section of sections) {
          if (section.cards) {
            for (const card of section.cards) {
              if (card.type === 'custom:decluttering-template' && card.template === template) {
                return card as DeclutteringTemplateConfig;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function getTemplates(ll: LovelaceConfig): Record<string, TemplateConfig> {
  const templates: Record<string, TemplateConfig> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dt = (ll as any).decluttering_templates;
  if (dt) Object.assign(templates, dt);

  if (ll.views) {
    for (const view of ll.views) {
      if (view.cards) {
        for (const card of view.cards) {
          if (card.type === 'custom:decluttering-template') {
            templates[card.template] = card as DeclutteringTemplateConfig;
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sections = (view as any).sections;
      if (sections) {
        for (const section of sections) {
          if (section.cards) {
            for (const card of section.cards) {
              if (card.type === 'custom:decluttering-template') {
                templates[card.template] = card as DeclutteringTemplateConfig;
              }
            }
          }
        }
      }
    }
  }
  return templates;
}

class DeclutteringElement extends LitElement {
  @state() private _hass?: HomeAssistant;
  @state() private _card?: LovelaceCard;

  private _config?: LovelaceCardConfig;
  private _ro?: ResizeObserver;
  private _savedStyles?: Map<string, [string, string]>;

  set hass(hass: HomeAssistant) {
    if (!hass) return;
    this._hass = hass;
    if (this._card) this._card.hass = hass;
  }

  static get styles(): CSSResult {
    return css`
      :host(.child-card-hidden) {
        display: none;
      }
      :host([edit-mode='true']) {
        display: block !important;
        border: 1px solid var(--primary-color);
      }
    `;
  }

  protected firstUpdated(): void {
    this.updateComplete.then(() => {
      this._displayHidden();
    });
  }

  protected _displayHidden(): void {
    if (this._card?.style.display === 'none') {
      this.classList.add('child-card-hidden');
    } else if (this.classList.contains('child-card-hidden')) {
      this.classList.remove('child-card-hidden');
    }
  }

  protected _setTemplateConfig(templateConfig: TemplateConfig, variables: VariablesConfig[] | undefined): void {
    if (!(templateConfig.card || templateConfig.element)) {
      throw new Error('You should define either a card or an element in the template');
    } else if (templateConfig.card && templateConfig.element) {
      throw new Error('You cannnot define both a card and an element in the template');
    }

    const type = templateConfig.card ? 'card' : 'element';
    const config = deepReplace(variables, templateConfig);
    this._config = config;
    DeclutteringElement._createCard(config, type, (card: LovelaceCard) => {
      if (this._config === config) this._setCard(card, templateConfig.element ? config.style : undefined);
    });
  }

  private _setCard(card: LovelaceCard, style?: Record<string, string>): void {
    this._savedStyles?.forEach((v, k) => this.style.setProperty(k, v[0], v[1]));
    this._savedStyles = undefined;

    if (style) {
      this._savedStyles = new Map();
      Object.keys(style).forEach(prop => {
        this._savedStyles?.set(prop, [this.style.getPropertyValue(prop), this.style.getPropertyPriority(prop)]);
        this.style.setProperty(prop, style[prop]);
      });
    }

    this._card = card;
    if (this._hass) card.hass = this._hass;
    this._ro = new ResizeObserver(() => {
      this._displayHidden();
    });
    this._ro.observe(card);
  }

  protected render(): TemplateResult | void {
    if (!this._hass || !this._card) return html``;

    return html`
      <div id="root">${this._card}</div>
    `;
  }

  private static async _createCard(
    config: LovelaceCardConfig,
    type: 'element' | 'card',
    handler: (card: LovelaceCard) => void,
  ): Promise<void> {
    let element: LovelaceCard;
    if (HELPERS) {
      if (type === 'card') {
        if (config.type === 'divider') element = (await HELPERS).createRowElement(config);
        else element = (await HELPERS).createCardElement(config);
        // fireEvent(element, 'll-rebuild');
      } else {
        element = (await HELPERS).createHuiElement(config);
      }
    } else {
      element = createThing(config);
    }
    element.addEventListener(
      'll-rebuild',
      ev => {
        ev.stopPropagation();
        DeclutteringElement._createCard(config, type, (card: LovelaceCard) => {
          element.replaceWith(card);
          handler(card);
        });
      },
      { once: true },
    );
    element.id = 'declutter-child';
    handler(element);
  }

  public getCardSize(): Promise<number> | number {
    return this._card && typeof this._card.getCardSize === 'function' ? this._card.getCardSize() : 1;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards = (window as any).customCards || [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({
  type: 'decluttering-card',
  name: 'Decluttering card',
  preview: false,
  description: 'Reuse multiple times the same card configuration with variables to declutter your config.',
});

@customElement('decluttering-card')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DeclutteringCard extends DeclutteringElement {
  static getConfigElement(): HTMLElement {
    return document.createElement('decluttering-card-editor');
  }

  static getStubConfig(): DeclutteringCardConfig {
    return {
      type: 'custom:decluttering-card',
      template: 'follow_the_sun',
    };
  }

  public setConfig(config: DeclutteringCardConfig): void {
    if (!config.template) {
      throw new Error('Missing template object in your config');
    }
    const ll = getLovelaceConfig();
    if (!ll) {
      throw new Error('Could not retrieve the lovelace configuration.');
    }
    const templateConfig = getTemplateConfig(ll, config.template);
    if (!templateConfig) {
      throw new Error(
        `The template "${config.template}" doesn't exist in decluttering_templates or in a custom:decluttering-template card`,
      );
    }
    this._setTemplateConfig(templateConfig, config.variables);
  }
}

@customElement('decluttering-card-editor')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DeclutteringCardEditor extends LitElement implements LovelaceCardEditor {
  @state() private _lovelace?: LovelaceConfig;
  @state() private _config?: DeclutteringCardConfig;

  @property() public hass?: HomeAssistant;

  private _templates?: Record<string, TemplateConfig>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _schema: any;
  private _loadedElements = false;

  set lovelace(lovelace: LovelaceConfig) {
    this._lovelace = lovelace;
    this._templates = undefined;
    this._schema = undefined;
  }

  public setConfig(config: DeclutteringCardConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._lovelace || !this._config) return html``;

    if (!this._templates) this._templates = getTemplates(this._lovelace);
    if (!this._schema) {
      this._schema = [
        {
          name: 'template',
          label: 'Template to use',
          selector: {
            select: {
              mode: 'dropdown',
              sort: true,
              custom_value: true,
              options: Object.keys(this._templates),
            },
          },
        },
        {
          name: 'variables',
          label: 'Variables',
          helper: 'Example: - variable_name: value',
          selector: { object: {} },
        },
      ];
    }

    const error: Record<string, string | string[]> = {};
    if (!this._templates[this._config.template]) {
      error.template = 'No template exists with this name';
    }
    if (this._config.variables !== undefined && !Array.isArray(this._config.variables)) {
      error.variables = 'The list of variables must be an array of key and value pairs';
    }

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema}
        .error=${error}
        .computeLabel=${(s): string => s.label ?? s.name}
        .computeHelper=${(s): string => s.helper ?? ''}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    fireEvent(this, 'config-changed', { config: ev.detail.value });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards = (window as any).customCards || [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({
  type: 'decluttering-template',
  name: 'Decluttering template',
  preview: false,
  description: 'Define a reusable template for decluttering cards to instantiate.',
});

@customElement('decluttering-template')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DeclutteringTemplate extends DeclutteringElement {
  @property({ attribute: 'edit-mode', reflect: true }) editMode;
  @state() private _previewMode = false;
  @state() private _template?: string;

  static getConfigElement(): HTMLElement {
    return document.createElement('decluttering-template-editor');
  }

  static getStubConfig(): DeclutteringTemplateConfig {
    return {
      type: 'custom:decluttering-template',
      template: 'follow_the_sun',
      card: {
        type: 'entity',
        entity: 'sun.sun',
      },
    };
  }

  static get styles(): CSSResult {
    return css`
      ${DeclutteringElement.styles}
      .badge {
        margin: 8px;
        color: var(--primary-color);
      }
    `;
  }

  public setConfig(config: DeclutteringTemplateConfig): void {
    if (!config.template) {
      throw new Error('Missing template property');
    }
    this._template = config.template;
    this._setTemplateConfig(config, undefined);
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    this._previewMode = this.parentElement?.localName === 'hui-card-preview';
    if (!this.editMode && !this._previewMode) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }
  }

  protected render(): TemplateResult | void {
    if (this._template) {
      if (this._previewMode) return super.render();
      if (this.editMode) {
        return html`
          <div class="badge">${this._template}</div>
          ${super.render()}
        `;
      }
    }
    return html``;
  }
}

@customElement('decluttering-template-editor')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DeclutteringTemplateEditor extends LitElement implements LovelaceCardEditor {
  @state() private _config?: DeclutteringTemplateConfig;
  @state() private _selectedTab = 0;

  @property() public lovelace?: LovelaceConfig;
  @property() public hass?: HomeAssistant;

  private _loadedElements = false;

  private static schema = [
    {
      name: 'template',
      label: 'Template to define',
      selector: { text: {} },
    },
    {
      name: 'default',
      label: 'Variables',
      helper: 'Example: - variable_name: default_value',
      selector: { object: {} },
    },
  ];

  public setConfig(config: DeclutteringTemplateConfig): void {
    this._config = config;
  }

  static get styles(): CSSResult {
    return css`
      ${DeclutteringElement.styles}
      .toolbar {
        display: flex;
        --paper-tabs-selection-bar-color: var(--primary-color);
        --paper-tab-ink: var(--primary-color);
      }
      paper-tabs {
        display: flex;
        font-size: 14px;
        flex-grow: 1;
        text-transform: uppercase;
      }
    `;
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    if (!this._loadedElements) {
      await loadCardPicker();
      this._loadedElements = true;
    }
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) return html``;

    const error: Record<string, string | string[]> = {};
    if (this._config.default !== undefined && !Array.isArray(this._config.default)) {
      error.default = 'The list of variables must be an array of key and value pairs';
    }

    return html`
      <div class="toolbar">
        <paper-tabs .selected=${this._selectedTab} scrollable @iron-activate=${this._activateTab}>
          <paper-tab>Settings</paper-tab>
          <paper-tab>Card</paper-tab>
          <paper-tab>Change Card Type</paper-tab>
        </paper-tabs>
      </div>
      ${this._selectedTab === 0
        ? html`
            <ha-form
              .hass=${this.hass}
              .data=${this._config}
              .schema=${DeclutteringTemplateEditor.schema}
              .error=${error}
              .computeLabel=${(s): string => s.label ?? s.name}
              .computeHelper=${(s): string => s.helper ?? ''}
              @value-changed=${this._valueChanged}
            ></ha-form>
          `
        : this._selectedTab == 1
        ? html`
            <hui-card-element-editor
              .hass=${this.hass}
              .lovelace=${this.lovelace}
              .value=${this._config.card}
              @config-changed=${this._cardChanged}
            ></hui-card-element-editor>
          `
        : html`
            <hui-card-picker
              .hass=${this.hass}
              .lovelace=${this.lovelace}
              @config-changed=${this._cardPicked}
            ></hui-card-picker>
          `}
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    fireEvent(this, 'config-changed', { config: ev.detail.value });
  }

  private _cardChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this._config) return;

    this._config.card = ev.detail.config;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _cardPicked(ev: CustomEvent): void {
    this._selectedTab = 1;
    this._cardChanged(ev);
  }

  private _activateTab(ev: CustomEvent): void {
    this._selectedTab = parseInt(ev.detail.selected);
  }
}

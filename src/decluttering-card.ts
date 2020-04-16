import { LitElement, html, customElement, property, TemplateResult, css, CSSResult } from 'lit-element';
import { HomeAssistant, getLovelace, createThing, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { DeclutteringCardConfig, TemplateConfig } from './types';
import deepReplace from './deep-replace';
import getLovelaceCast from './getLovelaceCast';
import * as pjson from '../package.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HELPERS = (window as any).loadCardHelpers ? (window as any).loadCardHelpers() : undefined;

console.info(
  `%c DECLUTTERING-CARD \n%c   Version ${pjson.version}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('decluttering-card')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DeclutteringCard extends LitElement {
  @property() protected _card?: LovelaceCard;

  @property() private _hass?: HomeAssistant;

  @property() private _config?: LovelaceCardConfig;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (this._card) {
      this._card.hass = hass;
    }
  }

  static get styles(): CSSResult {
    return css`
      :host(.child-card-hidden) {
        display: none;
      }
    `;
  }

  protected updated(): void {
    this.updateComplete.then(() => {
      if (this._card?.style.display === 'none') {
        this.className = 'child-card-hidden';
      } else if (this.className === 'child-card-hidden') {
        this.className = '';
      }
    });
  }

  public setConfig(config: DeclutteringCardConfig): void {
    if (!config.template) {
      throw new Error('Missing template object in your config');
    }
    const ll = getLovelace() || getLovelaceCast();
    if (!ll.config && !ll.config.decluttering_templates) {
      throw new Error("The object decluttering_templates doesn't exist in your main lovelace config.");
    }
    const templateConfig = ll.config.decluttering_templates[config.template] as TemplateConfig;
    if (!templateConfig) {
      throw new Error(`The template "${config.template}" doesn't exist in decluttering_templates`);
    } else if (!(templateConfig.card || templateConfig.element)) {
      throw new Error('You shoud define either a card or an element in the template');
    } else if (templateConfig.card && templateConfig.element) {
      throw new Error('You can define a card and an element in the template');
    }
    this._config = deepReplace(config.variables, templateConfig);
    const type = templateConfig.card ? 'card' : 'element';
    this._createCard(this._config, type).then(card => {
      this._card = card;
      return this._card;
    });
  }

  protected render(): TemplateResult | void {
    if (!this._hass || !this._card || !this._config) return html``;

    return html`
      <div id="root">${this._card}</div>
    `;
  }

  private async _createCard(config: LovelaceCardConfig, type: 'element' | 'card'): Promise<LovelaceCard> {
    let element: LovelaceCard;
    if (HELPERS) {
      if (type === 'card') {
        if (config.type === 'divider') element = (await HELPERS).createRowElement(config);
        else element = (await HELPERS).createCardElement(config);
        // fireEvent(element, 'll-rebuild');
      } else {
        element = (await HELPERS).createHuiElement(config);
        if (config.style) {
          Object.keys(config.style).forEach(prop => {
            this.style.setProperty(prop, config.style[prop]);
          });
        }
      }
    } else {
      element = createThing(config);
    }
    if (this._hass) {
      element.hass = this._hass;
    }
    element.addEventListener(
      'll-rebuild',
      ev => {
        ev.stopPropagation();
        this._rebuildCard(element, config, type);
      },
      { once: true },
    );
    element.id = 'declutter-child';
    return element;
  }

  private async _rebuildCard(
    element: LovelaceCard,
    config: LovelaceCardConfig,
    type: 'element' | 'card',
  ): Promise<void> {
    const newCard = await this._createCard(config, type);
    element.replaceWith(newCard);
    this._card = newCard;
    return;
  }

  public getCardSize(): number {
    return this._card && typeof this._card.getCardSize === 'function' ? this._card.getCardSize() : 1;
  }
}

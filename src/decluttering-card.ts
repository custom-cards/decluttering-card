import { LitElement, html, customElement, property, TemplateResult } from 'lit-element';
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

  public setConfig(config: DeclutteringCardConfig): void {
    if (!config.template) {
      throw new Error('Missing template object in your config');
    }
    const ll = getLovelace() || getLovelaceCast();
    if (!ll.config && !ll.config.decluttering_templates) {
      throw new Error("The object decluttering_templates doesn't exist in your main lovelace config.");
    }
    const templateConfig = ll.config.decluttering_templates[config.template] as TemplateConfig;
    if (!templateConfig || !templateConfig.card) {
      throw new Error(`The template "${config.template}" doesn't exist in decluttering_templates`);
    }
    this._config = deepReplace(config.variables, templateConfig);
    this._createCard(this._config).then(card => {
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

  private async _createCard(config: LovelaceCardConfig): Promise<LovelaceCard> {
    let element: LovelaceCard;
    if (HELPERS) {
      if (config.type === 'divider') element = (await HELPERS).createRowElement(config);
      else element = (await HELPERS).createCardElement(config);
      // fireEvent(element, 'll-rebuild');
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
        this._rebuildCard(element, config);
      },
      { once: true },
    );
    return element;
  }

  private async _rebuildCard(element: LovelaceCard, config: LovelaceCardConfig): Promise<void> {
    const newCard = await this._createCard(config);
    element.replaceWith(newCard);
    return;
  }

  public getCardSize(): number {
    return this._card && typeof this._card.getCardSize === 'function' ? this._card.getCardSize() : 1;
  }
}

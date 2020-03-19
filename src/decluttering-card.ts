import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
} from 'lit-element';
import {
  HomeAssistant,
  getLovelace,
  createThing,
  fireEvent,
} from 'custom-card-helpers';
import { DeclutteringCardConfig, TemplateConfig } from './types';
import deepReplace from './deep-replace';
import getLovelaceCast from './getLovelaceCast';
import { CARD_VERSION } from './version-const';

const HELPERS = (window as any).loadCardHelpers ? (window as any).loadCardHelpers() : undefined;

console.info(
  `%c DECLUTTERING-CARD \n%c   Version ${CARD_VERSION}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('decluttering-card')
class DeclutteringCard extends LitElement {
  @property() protected _card?: any;

  @property() private _hass?: HomeAssistant;

  @property() private _config?: DeclutteringCardConfig;

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
      throw new Error('The object decluttering_templates doesn\'t exist in your main lovelace config.');
    }
    const templateConfig = ll.config.decluttering_templates[config.template] as TemplateConfig;
    if (!templateConfig || !templateConfig.card) {
      throw new Error(`The template "${config.template}" doesn't exist in decluttering_templates`);
    }
    this._config = deepReplace(config.variables, templateConfig);
    this._createCard(this._config).then((card) => {
      this._card = card;
      return this._card;
    });
  }

  protected render(): TemplateResult | void {
    if (!this._hass || !this._card || !this._config)
      return html``;

    return html`<div>${this._card}</div>`;
  }

  private async _createCard(config: any): Promise<any> {
    let element: any;
    if (HELPERS) {
      element = (await HELPERS).createCardElement(config);
      // fireEvent(element, 'll-rebuild');
    } else {
      element = createThing(config);
    }
    if (this._hass) {
      element.hass = this._hass;
    }
    element.addEventListener(
      'll-rebuild',
      (ev) => {
        ev.stopPropagation();
        this._rebuildCard(element, config);
      },
      { once: true },
    );
    return element;
  }

  private async _rebuildCard(element: any, config: any) {
    const newCard = await this._createCard(config);
    element.replaceWith(newCard);
  }

  public getCardSize(): number {
    return this._card && typeof this._card.getCardSize === 'function'
      ? this._card.getCardSize() : 1;
  }
}

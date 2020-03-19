import {
  HomeAssistant,
  getLovelace,
  createThing,
  fireEvent,
} from 'custom-card-helpers';
import { DeclutteringCardConfig, TemplateConfig } from './types';
import deepReplace from './deep-replace';
import getLovelaceCast from './getLovelaceCast';

let helpers = (window as any).cardHelpers;
const helperPromise = new Promise(async (resolve) => {
  if (helpers) resolve();
  if ((window as any).loadCardHelpers) {
    helpers = await (window as any).loadCardHelpers();
    (window as any).cardHelpers = helpers;
    resolve();
  }
});

class DeclutteringCard extends HTMLElement {
  private _card?: any;

  constructor() {
    super();
    // Make use of shadowRoot to avoid conflicts when reusing
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass: HomeAssistant) {
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

    const root = this.shadowRoot;
    while (root && root.hasChildNodes()) {
      root.removeChild(root.lastChild!);
    }
    const main = document.createElement('div');
    main.id = 'root';
    root!.appendChild(main);

    if (helpers) {
      const element = helpers.createCardElement(deepReplace(config.variables, templateConfig));
      element.hass = this.hass;
      main!.appendChild(element);
      this._card = element;
      // fireEvent(element, 'll-rebuild');
      return element;
    } else {
      const element = createThing(deepReplace(config.variables, templateConfig));
      element.hass = this.hass;
      main!.appendChild(element);
      this._card = element;
      helperPromise.then(() => {
        fireEvent(element, 'll-rebuild', {});
      });
      return element;
    }
  }

  getCardSize() {
    return typeof this._card.getCardSize === 'function' ? this._card.getCardSize() : 1;
  }
}

customElements.define('decluttering-card', DeclutteringCard);

import {
    LitElement,
    html,
    customElement,
    property,
    TemplateResult,
    PropertyValues,
} from 'lit-element';
import { LovelaceTemplateCardConfig } from './types';
import {
    HomeAssistant,
    getLovelace,
    hasConfigOrEntityChanged,
    createThing,
} from 'custom-card-helpers';
import deepReplace from './deep-replace';

@customElement('lovelace-template-card')
class LovelaceTemplateCard extends LitElement {
    @property() public hass?: HomeAssistant;

    @property() private _config?: LovelaceTemplateCardConfig;

    @property() private _card?: any;

    protected render(): TemplateResult | void {
        if (!this._config || !this.hass) {
            return html``;
        }
        const elt = createThing(deepReplace(this._config.variables, this._card));
        elt.hass = this.hass;
        return html`${elt}`;
    }

    protected shouldUpdate(changedProps: PropertyValues): boolean {
        if (changedProps.has("_config")) {
            return true;
        }
        return false;
    }

    public setConfig(config: LovelaceTemplateCardConfig): void {
        const ll = getLovelace();
        this._config = config;
        if (!this._config.template) {
            throw new Error('Missing template object in your config');
        }
        if (!ll.config && !ll.config.lovelace_templates) {
            throw new Error('The object lovelace_templates doesn\'t exist in your main lovelace config.');
        }
        this._card = ll.config.lovelace_templates[this._config.template]
        if (!this._card) {
            throw new Error(`The template "${this._config.template}" doesn't exist in lovelace_templates`);
        }
    }
}

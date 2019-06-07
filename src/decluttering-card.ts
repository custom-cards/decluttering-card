import { DeclutteringCardConfig, TemplateConfig } from './types';
import {
    HomeAssistant,
    getLovelace,
} from 'custom-card-helpers';
import deepReplace from './deep-replace';

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
        const ll = getLovelace();
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
        const main = document.createElement('div')
        main.id = 'root';
        root!.appendChild(main);

        const _createThing = (tag: string, config: any) => {
            const element = document.createElement(tag) as any;
            try {
                element.setConfig(config);
            } catch (err) {
                console.error(tag, err);
                return _createError(err.message, config);
            }
            return element;
        };

        const _createError = (error, config) => {
            return _createThing("hui-error-card", {
                type: "error",
                error,
                config,
            });
        };

        const _fireEvent = (ev, detail, entity: any = null) => {
            ev = new Event(ev, {
                bubbles: true,
                cancelable: false,
                composed: true,
            });
            ev.detail = detail || {};

            if (entity) {
                entity!.dispatchEvent(ev);
            } else {
                document!
                    .querySelector("home-assistant")!
                    .shadowRoot!.querySelector("home-assistant-main")!
                    .shadowRoot!.querySelector("app-drawer-layout partial-panel-resolver")!
                    .shadowRoot!.querySelector("ha-panel-lovelace")!
                    .shadowRoot!.querySelector("hui-root")!
                    .shadowRoot!.querySelector("ha-app-layout #view")!
                    .firstElementChild!
                    .dispatchEvent(ev);
            }
        }

        let tag = templateConfig.card.type;

        if (tag.startsWith("divider")) {
            tag = `hui-divider-row`;
        } else if (tag.startsWith("custom:")) {
            tag = tag.substr("custom:".length);
        } else {
            tag = `hui-${tag}-card`;
        }

        if (customElements.get(tag)) {
            const element = _createThing(tag, deepReplace(config.variables, templateConfig));
            main!.appendChild(element);
            this._card = element;
        } else {
            // If element doesn't exist (yet) create an error
            const element = _createError(
                `Custom element doesn't exist: ${tag}.`,
                templateConfig
            );
            element.style.display = "None";

            const time = setTimeout(() => {
                element.style.display = "";
            }, 2000);

            // Remove error if element is defined later
            customElements.whenDefined(tag).then(() => {
                clearTimeout(time);
                _fireEvent("ll-rebuild", {}, element);
            });

            main!.appendChild(element);
            this._card = element;
        }
    }

    getCardSize() {
        return typeof this._card.getCardSize === 'function' ? this._card.getCardSize() : 1
    }
}

customElements.define('decluttering-card', DeclutteringCard);

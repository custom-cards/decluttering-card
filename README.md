# Decluttering Card
📝 Reuse multiple times the same card configuration with variables to declutter your config.

[![GitHub Release][releases-shield]][releases]
[![GitHub Activity][commits-shield]][commits]
[![custom_updater][customupdaterbadge]][customupdater]
[![License][license-shield]](LICENSE.md)

[![Project Maintenance][maintenance-shield]][maintainer]

[![Discord][discord-shield]][discord]
[![Community Forum][forum-shield]][forum]

[![Github][github]][maintainer]

This card is for [Lovelace](https://www.home-assistant.io/lovelace) on [Home Assistant](https://www.home-assistant.io/).

We all use multiple times the same block of configuration across our lovelace configuration and we don't want to change the same things in a hundred places across our configuration each time we want to modify something.

`decluttering-card` to the rescue!! This card allows you to reuse multiple times the same configuration in your lovelace configuration to avoid repetition and supports variables and default values.

## Configuration

### Defining your templates

First, you need to define your templates.

The templates are defined in an object at the root of your lovelace configuration. This object needs to be named `decluttering_templates`.

This object needs to contains your templates declaration, each template has a name and can contain variables. A variable needs to be enclosed in double square brackets `[[variable_name]]`. It will later be replaced by a real value when you instanciate a card which uses this template. If a variable is alone on it's line, enclose it in single quotes: `'[[variable_name]]'`.

You can also define default values for your variables in the `default` object.

For a card:

```yaml
decluttering_templates:
  <template_name>
    default:  # This is optional
      - <variable_name>: <variable_value>
      - <variable_name>: <variable_value>
      [...]
    card:  # This is where you put your card config (it can be a card embedding other cards)
      type: custom:my-super-card
      [...]
```

For a Picture-Element:

```yaml
decluttering_templates:
  <template_name>
    default:  # This is optional
      - <variable_name>: <variable_value>
      - <variable_name>: <variable_value>
      [...]
    element:  # This is where you put your element config
      type: icon
      [...]
```

Example in your `lovelace-ui.yaml`:
```yaml
resources:
  - url: /local/decluttering-card.js
    type: module

decluttering_templates:
  my_first_template:     # This is the name of a template
    default:
      - icon: fire
    card:
      type: custom:button-card
      name: '[[name]]'
      icon: 'mdi:[[icon]]'

  my_second_template:    # This is the name of another template
    card:
      type: custom:vertical-stack-in-card
      cards:
        - type: horizontal-stack
          cards:
            - type: custom:button-card
              entity: '[[entity_1]]'
            - type: custom:button-card
              entity: '[[entity_2]]'
```

### Using the card

| Name | Type | Requirement | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:decluttering-card`
| template | object | **Required** | The template to use from `decluttering_templates`
| variables | list | **Optional** | List of variables and their value to replace in the `template`

Example which references the previous templates:
```yaml
- type: custom:decluttering-card
  template: my_first_template
  variables:
    - name: Test Button
    - icon: arrow-up

- type: custom:decluttering-card
  template: my_first_template
  variables: Default Icon Button

- type: custom:decluttering-card
  template: my_second_template
  variables:
    - entity_1: switch.my_switch
    - entity_2: light.my_light
```


## Installation

### Step 1

Save [decluttering-card](https://github.com/custom-cards/decluttering-card/releases/download/latest/decluttering-card.js) to `<config directory>/www/decluttering-card.js` on your Home Assistant instanse.

**Example:**

```bash
wget https://raw.githubusercontent.com/custom-cards/decluttering-card/master/dist/decluttering-card.js
mv decluttering-card.js /config/www/
```

### Step 2

Link `decluttering-card` inside your `ui-lovelace.yaml` or Raw Editor in the UI Editor

```yaml
resources:
  - url: /local/decluttering-card.js
    type: module
```

### Step 3

Add a custom element in your `ui-lovelace.yaml` or in the UI Editor as a Manual Card

## Troubleshooting

See this guide: [Troubleshooting](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)

## Developers
Fork and then clone the repo to your local machine. From the cloned directory run

`npm install && npm run build`


[commits-shield]: https://img.shields.io/github/commit-activity/y/custom-cards/decluttering-card.svg?style=for-the-badge
[commits]: https://github.com/custom-cards/decluttering-card/commits/master
[customupdater]: https://github.com/custom-components/custom_updater
[customupdaterbadge]: https://img.shields.io/badge/custom__updater-true-success.svg?style=for-the-badge
[discord]: https://discord.gg/Qa5fW2R
[discord-shield]: https://img.shields.io/discord/330944238910963714.svg?style=for-the-badge
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=for-the-badge
[forum]: https://community.home-assistant.io/t/lovelace-decluttering-card/118625
[license-shield]: https://img.shields.io/github/license/custom-cards/decluttering-card.svg?style=for-the-badge
[maintenance-shield]: https://img.shields.io/badge/maintainer-RomRider-blue.svg?style=for-the-badge
[maintainer]: https://github.com/RomRider
[releases-shield]: https://img.shields.io/github/release/custom-cards/decluttering-card.svg?style=for-the-badge
[releases]: https://github.com/custom-cards/decluttering-card/releases
[github]: https://img.shields.io/github/followers/RomRider.svg?style=social

import { VariablesConfig, TemplateConfig } from "./types";

export default (
    variables: VariablesConfig[] | undefined,
    templateConfig: TemplateConfig,
): any => {
    if (!variables && !templateConfig.default) {
        return templateConfig;
    }
    let variableArray: VariablesConfig[] = [];
    if (variables) {
        variableArray = variables.slice(0);
    }
    if (templateConfig.default) {
        variableArray = variableArray.concat(templateConfig.default);
    }
    let jsonConfig = JSON.stringify(templateConfig.card);
    variableArray.forEach(variable => {
        const key = Object.keys(variable)[0];
        const value = Object.values(variable)[0];
        const rxp = new RegExp(`\\[\\[${key}\\]\\]`, "gm");
        const rxp2 = new RegExp(`"\\[\\[${key}\\]\\]"`, "gm");
        console.log(`${value}: ${typeof value}`);
        if (typeof value === 'number' || typeof value === 'boolean') {
            jsonConfig = jsonConfig.replace(rxp2, (value as unknown as string));
        }
        jsonConfig = jsonConfig.replace(rxp, value);
    });
    return JSON.parse(jsonConfig);
}

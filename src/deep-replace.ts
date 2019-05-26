import { VariablesConfig } from "./types";

export default (
    variables: VariablesConfig[] | undefined,
    cardConfig: any,
): any => {
    if (!variables) {
        return cardConfig;
    }
    let jsonConfig = JSON.stringify(cardConfig);
    variables.forEach(variable => {
        const key = Object.keys(variable)[0];
        const value = Object.values(variable)[0];
        const rxp = new RegExp(`\\[\\[${key}\\]\\]`, "gm");
        jsonConfig = jsonConfig.replace(rxp, value);
    });
    return JSON.parse(jsonConfig);
}

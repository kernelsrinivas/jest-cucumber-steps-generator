import { parseFeature, generateCodeFromFeature } from "jest-cucumber";
import formatter from "./formatter";

const STARTS_WITH = {
    TEST: 'test(',
    GIVEN: 'given(',
    WHEN: '<<|>>when(',
    THEN: '<<|>>then(',
    AND: '<<|>>and(',
    BUT: '<<|>>but('
};

const PRE_CODE = {
    TEST: `
    //const testInputs = {};
    //const testExpect = {};
    //let { getByTestId, getByA11yLabel, queryByTestId } = {};
    expect(false).toBe(true);
    `,
    GIVEN: `
    //({ getByTestId, getByA11yLabel, queryByTestId } = render(<></>))
    //const element = getByTestId(TID.*_TEST_ID);
    //expect(element.props).toBe(testExpect);
    expect(false).toBe(true);

    `,
    WHEN: `    
    //let element = getByTestId(TID.*_TEST_ID);
    //fireEvent(element, 'eventName', {});
    //await waitFor(() => expect(queryByTestId(TID.*_TEST_ID)).toBeTruthy());
    //element = getByTestId(TID.*_TEST_ID);
    //expect(element.props).toBe(testExpect);
    expect(false).toBe(true);

    `,
    THEN: `
    //const element = getByTestId(TID.*_TEST_ID);
    //expect(element.props).toBe(testExpect);
    expect(false).toBe(true);
    
    `,
    
    AND_BUT: `
    expect(false).toBe(true);

    `,
};

function generateCommandsFromFeatureAsText(featureAsText, selectionInformation) {
    const feature = parseFeature(featureAsText);
    if (areScenariosPresentIn(feature)) {
        return generateCommands(feature, selectionInformation);
    }
}
function areScenariosPresentIn(feature) {
    return feature.scenarios.length + feature.scenarioOutlines.length > 0;
}
function generateCommands(feature, selectionInformation) {
    if (isFeatureIn(selectionInformation)) {
        return generateFeatureCommands(feature);
    }
    if (isScenarioIn(selectionInformation)) {
        return generateScenarioCommands(feature, selectionInformation);
    }
    if (isStepIn(selectionInformation)) {
        return generateStepsCommands(feature, selectionInformation);
    }
}
function isFeatureIn(selectionInformation) {
    return selectionInformation.start === 1;
}
function isScenarioIn(selectionInformation) {
    return selectionInformation.text.toLowerCase().includes("scenario:");
}
function isStepIn(selectionInformation) {
    return !selectionInformation.text.toLowerCase().includes("scenario:");
}
function generateFeatureCommands(feature) {
    let commands = [];
    commands = generateCommandsFrom(feature);

    return formatter.format(commands, true);
}
function generateScenarioCommands(feature, selectionInformation) {
    let commands = [];
    feature.scenarios = filterScenariosFrom(feature.scenarios, selectionInformation);
    feature.scenarioOutlines = filterScenariosFrom(feature.scenarioOutlines, selectionInformation);
    commands = generateCommandsFrom(feature);

    return formatter.format(commands, false);
}
function filterScenariosFrom(scenarios, selectionInformation) {
    return scenarios.filter((scenario) => {
        const { lineNumber } = scenario;
        const { start, end } = selectionInformation;

        return lineNumber >= start && lineNumber <= end;
    });
}
function generateCommandsFrom(feature) {
    return feature.scenarios
        .concat(feature.scenarioOutlines)
        .sort((a, b) => Math.sign(a.lineNumber - b.lineNumber))
        .map((scenario) => {
            const output = generateCodeFromFeature(feature, scenario.lineNumber);
            let steps = output.split('=> {');
            steps = steps.map(step => step.replace('\n\n\t});\n', '<<|>>'))
            steps = steps.map(step => step.replace('\n\t', ''))
            steps = steps.map(step => {
                if(step.startsWith(STARTS_WITH.TEST)) {
                    return `${step} => {\n ${PRE_CODE.TEST}`;
                }
                if(step.startsWith(STARTS_WITH.GIVEN)) {
                    return `${step} => {\n ${PRE_CODE.GIVEN}`;
                }
                if(step.startsWith(STARTS_WITH.WHEN)) {
                    return `${step} => {\n ${PRE_CODE.WHEN}`;
                }
                if(step.startsWith(STARTS_WITH.THEN)) {
                    return `${step} => {\n ${PRE_CODE.THEN}`;
                }
                if(step.startsWith(STARTS_WITH.AND) || step.startsWith(STARTS_WITH.BUT)) {
                    return `${step} => {\n ${PRE_CODE.AND_BUT}`;
                }
                return step;
            })
            steps = steps.map(step => {
                if (step.endsWith('});')) {
                    return step.replace('<<|>>', '});')
                }
                return step.replace('<<|>>', '});\n\n')
            });
            return steps.join('');
        }); 
}
function generateStepsCommands(feature, selectionInformation) {
    const commands = [];
    const { start, end } = selectionInformation;
    for (var i = start; i <= end; i++) {
        let command = generateCodeFromFeature(feature, i);
        commands.push(command);
    }
    const output = formatter.format(commands, false);
    return output;
}

export default {
    generateCommandsFromFeatureAsText,
};

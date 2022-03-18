import * as vscode from "vscode";
import generator from "./modules/generator";

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand("extension.generateCodeFromFeature", run);
    context.subscriptions.push(disposable);
}
function run() {
    if (vscode.window.activeTextEditor) {
        generateCommands();
    }
}
function generateCommands() {
    const { documentText, selectionInformation } = processDocument();
    try {
        putCommandsInClipboard(documentText, selectionInformation);
    } catch (error) {
        handleError(error);
    }
}
function processDocument() {
    const editor = vscode.window.activeTextEditor;
    return {
        documentText: editor.document.getText(),
        selectionInformation: createSelectionLinesInformation(editor),
    };
}

function putCommandsInClipboard(documentText, selectionInformation) {
    const commandsGenerated = "Commands are in clipboard!";
    const commands = generator.generateCommandsFromFeatureAsText(documentText, selectionInformation);
    console.log("commands", commands);
    const code = `
    import "react-native";
    import React from "react";
    import { defineFeature, loadFeature } from 'jest-cucumber';
    import {render, fireEvent } from '@testing-library/react-native';
    
    //TODO! Update Exact Feature File Name
    const feature = loadFeature('./__tests__/features/featureName.feature');

    ${commands}`
    vscode.env.clipboard.writeText(code);
    vscode.window.showInformationMessage(commandsGenerated);
}
function handleError(error) {
    vscode.window.showErrorMessage(error.message);
}
function createSelectionLinesInformation(editor) {
    return {
        count: editor.document.lineCount,
        start: editor.selection.start.line + 1,
        end: editor.selection.end.line + 1,
        text: editor.document.getText(editor.selection),
    };
}

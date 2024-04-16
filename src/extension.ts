import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';

export function activate(context: vscode.ExtensionContext) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;
    let disposeFunction: (() => void) | undefined = undefined;

    context.subscriptions.push(
        vscode.commands.registerCommand('greek-words-for-translators.start', async () => {
            console.log("starting");
            const columnToShowIn = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;

            if (!currentPanel) {
                console.log("initializing state store");

                const { storeListener } = await initializeStateStore();
                disposeFunction = storeListener("verseRef", (value) => {
                    if (value) {
                        console.log("Showing value " + value.verseRef);
                        currentPanel?.webview.postMessage({
                            command: "reload",
                            data: { verseRef: value.verseRef, uri: value.uri },
                        });
                    }
                });

                currentPanel = vscode.window.createWebviewPanel(
                    'greek-words-view',
                    'Greek Words for Translators',
                    columnToShowIn || vscode.ViewColumn.One,
                    {}
                );
                currentPanel.webview.html = getWebviewContent();

                currentPanel.onDidDispose(() => {
                    currentPanel = undefined;
                    disposeFunction?.();
                }, null, context.subscriptions);
            } else {
                currentPanel.reveal(columnToShowIn);
            }
        })
    );
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Greek Words for Translators</title>
    </head>
    <body>
        <h1>Hello, Custom Panel!</h1>
    </body>
    </html>`;
}

import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import * as fs from 'fs';


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

                currentPanel = vscode.window.createWebviewPanel(
                    'greek-words-view',
                    'Greek Words for Translators',
                    columnToShowIn || vscode.ViewColumn.One,
                    {}
                );

				const { storeListener } = await initializeStateStore();
                disposeFunction = storeListener("verseRef", (value) => {
                    if (value) {

						
						// TODO: have this grab the specific CSV entries for the specific verse


						// // Get path to resource on disk
						// const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'g0000.txt');

						// // Get the special URI to use with the webview
						// const textSrc = currentPanel?.webview.asWebviewUri(onDiskPath);

						// // Read the text file synchronously
						// const fileContent = fs.readFileSync(onDiskPath.fsPath, 'utf8');

                        console.log("Showing value " + value.verseRef);
                        updateWebviewContent(currentPanel!!, value.verseRef);
                    }
                });

                currentPanel.webview.html = getWebviewContent("");

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

function getWebviewContent(verseRef: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Greek Words for Translators</title>
    </head>
    <body>
        <h1>Hello, Custom Panel!</h1>
        <p>Verse Reference: ${verseRef}</p>
    </body>
    </html>`;
}

function updateWebviewContent(panel: vscode.WebviewPanel, verseRef: string) {
    panel.webview.html = getWebviewContent(verseRef);
}

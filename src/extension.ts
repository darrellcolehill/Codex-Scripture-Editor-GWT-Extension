import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import * as fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';


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

						fetchMDContent(xmlData)
						.then((results) => {
							console.log(results);
							// Process or display the MD content as needed
						})
						.catch((error) => {
							console.error('Error fetching MD content:', error);
						});
						
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




async function fetchMDContent(xmlData: string): Promise<string[]> {
    const $ = cheerio.load(xmlData, { xmlMode: true });
    const wTags = $('w');
    const results: Promise<string>[] = [];

    wTags.each((index, element) => {
        const strongs = $(element).attr('strongs');
        if (strongs) {
            const mdUrl = `https://content.bibletranslationtools.org/WycliffeAssociates/en_gwt/src/branch/master/start.-,end/${strongs}.md`;
            const promise = axios.get(mdUrl).then((response) => response.data);
            results.push(promise);
        }
    });

    return Promise.all(results);
}

// Example usage
const xmlData = `<?xml version="1.0" standalone="yes" ?>
<xml xsi:schemaLocation="wa_ulb.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <book osisID="rom">
        <chapter osisID="rom.1">
            <verse name="Romans 1:1">
                <w OGNTsort="083218" strongs="G3972" morph="N-NSM-P" lemma="Παῦλος" text="Παῦλος">Paul,</w>
                <w OGNTsort="083219" strongs="G1401" morph="N-NSM" lemma="δοῦλος" text="δοῦλος">a servant</w>
                <!-- More <w> tags here -->
            </verse>
        </chapter>
    </book>
</xml>`;
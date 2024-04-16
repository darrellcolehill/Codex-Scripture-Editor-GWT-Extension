import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

interface WordData {
    text: string;
    strongs?: string;
}

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


						parseXml(xmlData)
						.then((result) => {
							console.log(result);
						})
						.catch((err) => {
							console.error(err);
						});

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




function parseXml(xmlData: string): Promise<WordData[]> {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser();

        parser.parseString(xmlData, (err, result) => {
            if (err) {
                reject(err);
            } else {
                const words: WordData[] = [];
                const wTags = result.xml.book[0].chapter[0].verse[0].w;

                if (wTags) {
                    wTags.forEach((wTag: any) => {
                        const text = wTag['_'];
                        const strongs = wTag['$']['strongs'];
                        words.push({ text, strongs });
                    });
                }

                resolve(words);
            }
        });
    });
}

// Example usage
const xmlData = `
<xml xsi:schemaLocation="wa_ulb.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <book osisID="rom">
        <chapter osisID="rom.1">
            <verse name="Romans 1:1">
                <w OGNTsort="083218" strongs="G3972" morph="N-NSM-P" lemma="Παῦλος" text="Παῦλος">Paul,</w>
                <w OGNTsort="083219" strongs="G1401" morph="N-NSM" lemma="δοῦλος" text="δοῦλος">a servant</w>
                <w OGNTsort="083221" strongs="G2424" morph="N-GSM-P" lemma="Ἰησοῦς" text="Ἰησοῦ">of Jesus</w>
                <w OGNTsort="083220" strongs="G5547" morph="N-GSM-T" lemma="Χριστός" text="Χριστοῦ">Christ,</w>
                <w OGNTsort="083222" strongs="G2822" morph="A-NSM" lemma="κλητός" text="κλητὸς">called</w>
            </verse>
        </chapter>
    </book>
</xml>
`;
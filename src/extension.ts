import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { bookNameMap } from './newTestamentBookNameMap';

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

						const scribeBookeName = value.verseRef.substring(0, 3);
						console.log("Scribe book name: " + scribeBookeName);
						let bookMap: any | null = null;

						// Iterate over the bookNameMap to find the first object with scribe equal to "REV"
						for (const key in bookNameMap) {
							if (Object.prototype.hasOwnProperty.call(bookNameMap, key)) {
								const book = bookNameMap[key];
								if (book.scribe === scribeBookeName) {
									bookMap = book;
									break; // Stop searching once the first match is found
								}
							}
						}

                        console.log("Showing value " + value.verseRef + " " + bookMap.enULBTagged);

						// Get path to resource on disk
						const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media/ulb_tagged_checked', bookMap.enULBTagged + '.xml');

						// Get the special URI to use with the webview
						const textSrc = currentPanel?.webview.asWebviewUri(onDiskPath);

						// // Read the text file synchronously
						const xmlFileContent = fs.readFileSync(onDiskPath.fsPath, 'utf8');


						// Define the regular expression pattern
						const regex = /(\d+):(\d+)/;

						// Use the exec() method to extract chapter and verse numbers
						const match = regex.exec(value.verseRef);
						var chapter: number | undefined;
						var verse: number | undefined; 

						if (match !== null) {
							chapter = parseInt(match[1]); // Extracted chapter number
							verse = parseInt(match[2]); // Extracted verse number
							console.log("Chapter:", chapter);
							console.log("Verse:", verse);
						} else {
							console.log("No match found.");
						}


						parseXml(xmlFileContent, chapter, verse)
						.then((result) => {
							console.log(result);
						})
						.catch((err) => {
							console.error(err);
						});


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


function padStrongsWithZeros(words: WordData[]): void {
    words.forEach((word) => {
        if (word.strongs && word.strongs.startsWith('G')) {
            const num = parseInt(word.strongs.substring(1));
            if (num < 1000) {
                const paddedStrong = `G${num.toString().padStart(4, '0')}`;
                word.strongs = paddedStrong;
            }
        }
    });
}

function parseXml(xmlData: string, chapter?: number, verse?: number): Promise<WordData[]> {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser();

        parser.parseString(xmlData, (err, result) => {
            if (err || chapter === undefined || verse === undefined) {
                reject(err);
            } else {
                const words: WordData[] = [];

				// TODO: have this go to the correct chapter/verse that is passed in. 
                const wTags = result.xml.book[0].chapter[chapter - 1].verse[verse - 1].w;

                if (wTags) {
                    wTags.forEach((wTag: any) => {
                        const text = wTag['_'];
                        const strongs = wTag['$']['strongs'];
                        words.push({ text, strongs });
                    });
                }

                padStrongsWithZeros(words);
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
                <w OGNTsort="083222" strongs="G2" morph="A-NSM" lemma="κλητός" text="κλητὸς">called</w>
            </verse>
        </chapter>
    </book>
</xml>
`;
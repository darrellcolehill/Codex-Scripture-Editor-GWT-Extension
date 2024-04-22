import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import { marked } from 'marked';
import { getGreekWord } from './api/gwt';
import { ChapterVerseNumbers, WordData } from './types';
import { WacsUlbTaggedAPI } from './api/WacsUlbTaggedAPI';

const wacsUlbTaggedAPI = new WacsUlbTaggedAPI(); 
let currentVerseRef: string = "";

export function activate(context: vscode.ExtensionContext) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;
    let disposeFunction: (() => void) | undefined = undefined;
    context.subscriptions.push(
        vscode.commands.registerCommand('greek-words-for-translators.start', async () => {
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
                disposeFunction = storeListener("verseRef", async (value) => {
                    if (value && value.verseRef !== currentVerseRef) {
                        currentVerseRef = value.verseRef;
                        
                        let ulbContent = await wacsUlbTaggedAPI.getUlbXmlFileFromWacs(value.verseRef);
                        
                        let chapterVerseNumbers = getChapterAndVerseNumber(value.verseRef);

                        if(!chapterVerseNumbers) {
                            return;
                        } 

                        var greekWords : any = [];
						wacsUlbTaggedAPI.parse(ulbContent, chapterVerseNumbers.chapter, chapterVerseNumbers.verse)
						.then(async (result) => {
							console.log(result);       
                            const withStrongs =  await Promise.all(result.map(async (word: WordData) => {
                                if(word.strongs && word.OGNTsort) {
                                    let gwtData = await getGreekWord(word.strongs);
                                    greekWords.push({markdown: gwtData, ...word});
                                    return {markdown: gwtData, ...word};
                                }
                            })); 

                            greekWords.sort((a: WordData, b: WordData) => {

                                let aSort : string | number | any = a.OGNTsort ? a.OGNTsort : 1;
                                let bSort : string | number | any = b.OGNTsort ? b.OGNTsort : 1;

                                return aSort - bSort;
                            });

                            const markup = greekWords.reduce((acc:string, curr:Record<string,string>) => {

                                // Convert Markdown to HTML using marked
                                let htmlContent: any = undefined;
                                if(curr.markdown !== null && curr.markdown !== undefined) {
                                    htmlContent = marked(curr.markdown);
                                }


                                const template = `
                                <div> 
                                ${htmlContent}
                                ${curr.text} - ${curr.strongs}
                                <hr style="height:2px;">
                                </div>
                                `; 
                                acc += template; 
                                return acc;
                            }, ""); 

                            updateWebviewContent(currentPanel!!, value.verseRef, markup);
						})
						.catch((err) => {
							console.error(err);
						});
                    }
                });

                currentPanel.webview.html = getWebviewContent("", "no word clicked yet");

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

function getWebviewContent(verseRef: string, greekWords:string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Greek Words for Translators</title>
    </head>
    <body>
        <h1>Verse Reference: ${verseRef}</h1>
        <div>
        ${greekWords}
        </div>
    </body>
    </html>`;
}

function updateWebviewContent(panel: vscode.WebviewPanel, verseRef: string, greekWords: string) {
    panel.webview.html = getWebviewContent(verseRef, greekWords);
}


function getChapterAndVerseNumber(scribeVerseRef: string) : ChapterVerseNumbers | undefined {
    // Define the regular expression pattern
    const regex = /(\d+):(\d+)/;

    // Use the exec() method to extract chapter and verse numbers
    const match = regex.exec(scribeVerseRef);

    if (match !== null) {
        let chapterNum = parseInt(match[1]); // Extracted chapter number
        let verseNum = parseInt(match[2]); // Extracted verse number
        return {chapter: chapterNum, verse: verseNum};
    } else {
        console.log("No match found.");
        return undefined;
    }
}
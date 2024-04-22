import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { bookNameMap } from './newTestamentBookNameMap';
import axios from 'axios';
import { marked } from 'marked';

interface WordData {
    text: string;
    strongs?: string;
    OGNTsort?: string;
}

interface GreekWordData {
    text: string;
    strongs: string;
    markdown: string
}

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
                disposeFunction = storeListener("verseRef", (value) => {
                    if (value) {

						const scribeBookeName = value.verseRef.substring(0, 3);
						let bookMap: any | null = null;

						for (const key in bookNameMap) {
							if (Object.prototype.hasOwnProperty.call(bookNameMap, key)) {
								const book = bookNameMap[key];
								if (book.scribe === scribeBookeName) {
									bookMap = book;
									break; // Stop searching once the first match is found
								}
							}
						}

						// Get path to resource on disk
						const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media/ulb_tagged_checked', bookMap.enULBTagged + '.xml');

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
						} else {
							console.log("No match found.");
						}


                        var greekWords : any = [];
						parseXml(xmlFileContent, chapter, verse)
						.then(async (result) => {
							console.log(result);       
                            const withStrongs =  await Promise.all(result.map(async (word: WordData) => {
                                if(word.strongs && word.OGNTsort) {
                                    let ogntSort = parseInt(word.OGNTsort); 
                                    let gwtData = await getGreekWord(word.strongs);
                                    greekWords.push({markdown: gwtData?.data, ...word});
                                    return {markdown: gwtData?.data, ...word};
                                }
                            })); 

                            greekWords.sort((a: WordData, b: WordData) => {

                                let aSort : string | number | any = a.OGNTsort ? a.OGNTsort : 1;
                                let bSort : string | number | any = b.OGNTsort ? b.OGNTsort : 1;

                                return aSort - bSort;
                        }   );
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

                const wTags = result.xml.book[0].chapter[chapter - 1].verse[verse - 1].w;

                if (wTags) {
                    wTags.forEach((wTag: any) => {
                        const text = wTag['_'];
                        if(wTag['$'] !== undefined && text !== "√") {
                            const strongs = wTag['$']['strongs'];
                            if(strongs !== undefined && text !== undefined) {
                                words.push( wTag['$']);
                            }
                        }
                    });
                }

                padStrongsWithZeros(words);
                resolve(words);
            }
        });
    });
}


// Takes the target strongs number and calculates its parent folder in the en_gwt repo
// This is greatly dependent on the current structure of the en_gwt
export function getStrongsRange(strongs : String) {
	let thousandsDigit = strongs.charAt(1);
	let hundredsDigit = strongs.charAt(2);
	let tensDigit = strongs.charAt(3);
	let onesDigit = strongs.charAt(4);

	let strongsNumberStr : string =
		thousandsDigit + hundredsDigit + tensDigit + onesDigit;

	let strongsNumber = parseInt(strongsNumberStr);

	let startStrongsRangeNumber;
	let endStrongsRangeNumber;

	if (strongsNumber <= 10) {
		return "g0001-g0010";
	} else if (parseInt(onesDigit) === 0) {
		startStrongsRangeNumber = strongsNumber - 9;
		endStrongsRangeNumber = strongsNumber;
	} else {
		startStrongsRangeNumber =
			strongsNumber - (strongsNumber % 10) + 1;
		endStrongsRangeNumber =
			strongsNumber - (strongsNumber % 10) + 10;
	}

	let startStrongsRangeString = makeFourDigitStrongs(
		"g" + startStrongsRangeNumber
	);
	let endStrongsRangeString = makeFourDigitStrongs(
		"g" + endStrongsRangeNumber
	);

	let strongsRange = (startStrongsRangeString + "-").concat(
		endStrongsRangeString
	);

	return strongsRange.toLocaleLowerCase();
}


// Adds padding zeros (to the second character's posision) until it's length is 5
function makeFourDigitStrongs(strongs : string) {
	if (strongs.length < 5 && strongs.length >= 2) {
		for (let i = strongs.length; i < 5; i++) {
			strongs = stringInsert(strongs, 1, "0", false);
		}
	}

	return strongs;
}


// utility function to insert a string into another string
function stringInsert(str: string, index : number, value : string, replace : boolean) {
	let res = "";

	if (replace === false) {
		res = str.substr(0, index) + value + str.substr(index);
	} else {
		res =
			str.substr(0, index) +
			value +
			str.substr(index + value.length);
	}

	return res;
}



async function getGreekWord(strongs : string) {
	strongs = await makeFourDigitStrongs(
		strongs
	).toLocaleLowerCase();
	let folder = await getStrongsRange(strongs);

	let greekWordInfo;

	try {
		greekWordInfo = await axios.get(
			`https://content.bibletranslationtools.org/WycliffeAssociates/en_gwt/raw/branch/master/${folder}/${strongs}.md`
		);
		return greekWordInfo;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
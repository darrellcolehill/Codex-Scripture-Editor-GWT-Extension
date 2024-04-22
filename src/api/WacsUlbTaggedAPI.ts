import * as xml2js from 'xml2js';
import { WordData } from "../types";
import { bookNameMap } from '../mapping/newTestamentBookNameMap';
import * as fs from 'fs';
import * as vscode from 'vscode';

class WacsUlbTaggedAPI {

    async getUlbXmlFileFromWacs(scribeVerseRef: string) {
        const scribeBookeName = scribeVerseRef.substring(0, 3);
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

        const response = await fetch(`https://content.bibletranslationtools.org/WycliffeAssociates/en_ulb_tagged/raw/branch/master/Checked/${bookMap.enULBTagged}.xml`);

        if (!response.ok) {
            throw new Error('Network response was not ok.');
          }

        let ulbContent = await response.text();

        return ulbContent;

    }

    // Used to fetch en_ulb files from media folder
    private getUlbFileFromDisk(scribeVerseRef: string, extensionUri: vscode.Uri) {

        const scribeBookeName = scribeVerseRef.substring(0, 3);
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
        const onDiskPath = vscode.Uri.joinPath(extensionUri, 'media/ulb_tagged_checked', bookMap.enULBTagged + '.xml');

        // // Read the text file synchronously
        const xmlFileContent = fs.readFileSync(onDiskPath.fsPath, 'utf8');

        return xmlFileContent;
    }

    private padStrongsWithZeros(words: WordData[]): void {
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

    parse(xmlData: string, chapter?: number, verse?: number): Promise<WordData[]> {
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

                    this.padStrongsWithZeros(words);
                    resolve(words);
                }
            });
        });
    }
}

export {WacsUlbTaggedAPI};
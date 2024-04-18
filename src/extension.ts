import * as vscode from 'vscode';
import { initializeStateStore } from './stateStore';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { bookNameMap } from './newTestamentBookNameMap';
import axios from 'axios';
import { workerData } from 'worker_threads';
import path from 'path';



export function activate(context: vscode.ExtensionContext) {
    
    let disposable = vscode.commands.registerCommand('greek-words-for-translators.start', async () => {
        const { storeListener } = await initializeStateStore();

        storeListener("verseRef", (value) => {
            let pdfPath = "C:\\Users\\hilld\\Documents\\GitHub\\Codex-Scripture-Editor-GWT-Extension\\media\\test.pdf";

            if (pdfPath) {
                const absolutePath = path.resolve(pdfPath);
                const uri = vscode.Uri.file(absolutePath);
                vscode.commands.executeCommand('vscode.open', uri, vscode.ViewColumn.Two);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(pdfPath: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body, html, #pdf-container {
                height: 100%;
                margin: 0;
                overflow: hidden;
            }

            #pdf-container object {
                width: 100%;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <div id="pdf-container">
            <object data="${pdfPath}" type="application/pdf" width="100%" height="100%">
                <p>PDF cannot be displayed</p>
            </object>
        </div>
    </body>
    </html>
    `;
}

export function deactivate() {}
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
        const pdfPath = await vscode.window.showInputBox({
            prompt: "Enter the path to the PDF file",
            ignoreFocusOut: true
        });

        if (pdfPath) {
            const absolutePath = path.resolve(pdfPath);
            const panel = vscode.window.createWebviewPanel(
                'pdfViewer', // Identifies the type of the webview. Used internally
                'PDF Viewer', // Title of the panel displayed to the user
                vscode.ViewColumn.Two, // Editor column to show the webview panel in
                {
                    enableScripts: true // Enable JavaScript in the webview
                }
            );

            panel.webview.html = getWebviewContent(absolutePath);
        }
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
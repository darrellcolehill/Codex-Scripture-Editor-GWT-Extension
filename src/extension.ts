import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// Track the current panel with a webview
	let currentPanel: vscode.WebviewPanel | undefined = undefined;
  
	context.subscriptions.push(
	  vscode.commands.registerCommand('greek-words-for-translators.start', () => {

		const columnToShowIn = vscode.window.activeTextEditor
		  ? vscode.window.activeTextEditor.viewColumn
		  : undefined;
  
		if (currentPanel) {
		  // If we already have a panel, show it in the target column
		  currentPanel.reveal(columnToShowIn);
		} else {
		  // Otherwise, create a new panel
		  currentPanel = vscode.window.createWebviewPanel(
			'greek-words-view',
			'Greek Words for Translators',
			columnToShowIn || vscode.ViewColumn.One,
			{}
		  );
		  currentPanel.webview.html = getWebviewContent();
  
		  // Reset when the current panel is closed
		  currentPanel.onDidDispose(
			() => {
			  currentPanel = undefined;
			},
			null,
			context.subscriptions
		  );
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

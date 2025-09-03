import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
    console.log('"zivancic-ext" is now active!');

    const disposable = vscode.commands.registerCommand('zi.bokKoder', () => {
        const panel = vscode.window.createWebviewPanel(
            'ZI',
            'Znanstveno Inkodiranje',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';

                try {
                    const streamResponse = await ollama.chat({
                        model: 'deepseek-coder-v2:16b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });

                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                } catch (err: any) {
                    panel.webview.postMessage({ command: 'chatResponse', text: 'Error: ' + (err?.message ?? err) });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: sans-serif; margin: 1rem; }
    #prompt { width: 100%; box-sizing: border-box; }
    #response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 2rem; }
  </style>
</head>
<body>
  <h2>DubokoTrazeci Koder</h2>
  <textarea id="prompt" rows="3" placeholder="Pitaj nesto..."></textarea><br />
  <button id="askBtn">Pitaj</button>
  <div id="response"></div>

<script>
const vscode = acquireVsCodeApi();

document.getElementById('askBtn').addEventListener('click', () => {
    const text = document.getElementById('prompt').value;
    vscode.postMessage({ command: 'chat', text });
});

window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'chatResponse') {
        document.getElementById('response').innerText = message.text;
    }
});
</script>

</body>
</html>
    `;
}

export function deactivate() {}

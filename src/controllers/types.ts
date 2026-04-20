import * as vscode from 'vscode';
import { SnippetManager } from '../SnippetManager';

export interface ControllerDeps {
  context: vscode.ExtensionContext;
  snippetManager: SnippetManager;
  isCompanyNetwork: boolean;
}

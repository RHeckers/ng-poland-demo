import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  template,
  url,
  move,
  mergeWith,
  renameTemplateFiles
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { Schema } from './schema';

export function generateHttpService(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const sourceTemplates = url('./files');  // Load the template files

    // Apply the template with the options provided (e.g., name)
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ...options,
        ...strings
      }),
      renameTemplateFiles(),
      move('src/app/services/http') // Move generated files to the 'src/app/service' folder
    ]);

    return mergeWith(sourceParametrizedTemplates)(tree, _context);
  };
}

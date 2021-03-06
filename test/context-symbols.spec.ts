import * as ts from 'typescript';
// import {writeFileSync} from 'fs';

import {ContextSymbols} from '../';
import {createProgramFromTsConfig} from './utils/create-program';
import {resourceResolver} from './utils/resource-resolver';

describe('ContextSymbols', () => {
  describe('basic project', () => {
    let program: ts.Program;

    beforeEach(() => {
      program = createProgramFromTsConfig(__dirname + '/../../test/fixture/basic/tsconfig.json');
    });

    it('should return project summary', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const summary = contextSymbols.getContextSummary();
      expect(summary.type.reference.name).toBe('AppModule');
      expect(summary.entryComponents[0].componentType.name).toBe('MainComponent');
      expect(summary.exportedDirectives[0].reference.name).toBe('MainComponent');
      expect(summary.modules[0].reference.name).toBe('CommonModule');
    });

    it('should return directive based on node and file name', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const sourceFile = program.getSourceFiles().filter(f => f.fileName.indexOf('fixture') >= 0).pop();
      const node = (sourceFile.getSourceFile().statements[3] as any);
      const dir = contextSymbols.getDirectiveFromNode(node, sourceFile.fileName);
      expect(dir.isComponent()).toBeTruthy();
      expect(dir.getNonResolvedMetadata().selector).toBe('main-component');
    });

    it('should return reference to the analyzed modules', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const result = contextSymbols.getAnalyzedModules();
      expect(result.ngModules.some(m => m.type.reference.name === 'AppModule')).toBeTruthy();
      expect(result.ngModules.some(m => m.type.reference.name === 'BrowserModule')).toBeTruthy();
      expect(result.ngModules.some(m => m.type.reference.name === 'CommonModule')).toBeTruthy();
    });

    it('should return reference to the registered directives', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const result = contextSymbols.getDirectives();
      expect(result.some(m => m.symbol.name === 'MainComponent')).toBeTruthy();
    });

    it('should return set of all modules', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const result = contextSymbols.getModules();
      expect(result.some(m => m.symbol.name === 'AppModule')).toBeTruthy();
    });

    it('should return set of pipes', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const result = contextSymbols.getPipes();
      expect(result.some(p => p.symbol.name === 'DecimalPipe')).toBeTruthy();
    });

    it('should update the program', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const spy = spyOn(ContextSymbols.prototype as any, 'validate');
      contextSymbols.updateProgram(createProgramFromTsConfig(__dirname + '/../../test/fixture/basic/tsconfig.json'));
      expect(spy).toHaveBeenCalled();
    });

    it('should not return duplicate modules', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const modules = contextSymbols.getModules();
      const modulesMap = {};
      modules.forEach(m => {
        const n = m.symbol.name;
        modulesMap[n] = modulesMap[n] || 0;
        modulesMap[n] += 1;
        expect(modulesMap[n]).toBe(1);
      });
      contextSymbols.updateProgram(createProgramFromTsConfig(__dirname + '/../../test/fixture/basic/tsconfig.json'));
    });
  });

  describe('routing project', () => {
    let program: ts.Program;

    beforeEach(() => {
      program = createProgramFromTsConfig(__dirname + '/../../test/fixture/routing/tsconfig.json');
    });

    it('should find lazy modules', () => {
      const contextSymbols = new ContextSymbols(program, resourceResolver);
      const summary = contextSymbols.getContextSummary();
      expect(summary.type.reference.name).toBe('AppModule');
      // writeFileSync('data.json', JSON.stringify(summary, null, 2));
      const routeConfig = summary.providers
        .filter(p => p.provider.token.identifier.reference.name === 'ANALYZE_FOR_ENTRY_COMPONENTS').pop();
      expect(routeConfig.provider.useValue[0].path).toBe('lazy-a');
      expect(routeConfig.provider.useValue[2].path).toBe('regular');
    });
  });
});

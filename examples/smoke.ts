import { buildDerivedKey, parsePermissionKey } from '../src/engine/permission-key.ts';

const key = buildDerivedKey({ module: 'people', resource: 'employees', action: 'view', scope: 'own', field: 'salary' });
console.log('Built key:', key);

const parsed = parsePermissionKey(key);
console.log('Parsed:', parsed);

console.log('\nPermX SDK is working!');

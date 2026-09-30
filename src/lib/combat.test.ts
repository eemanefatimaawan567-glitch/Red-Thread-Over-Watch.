import assert from 'node:assert/strict';
import { clearSight, quietAccess } from './combat.ts';

const boxes = [{x1: 2, x2: 4, y1: 2, y2: 4}];
assert.equal(clearSight({x:0,y:3}, {x:6,y:3}, boxes), false);
assert.equal(clearSight({x:6,y:3}, {x:0,y:3}, boxes), false);
assert.equal(clearSight({x:0,y:0}, {x:6,y:0}, boxes), true);
assert.equal(clearSight({x:3,y:0}, {x:3,y:6}, boxes), false);
assert.equal(clearSight({x:0,y:0}, {x:1,y:1}, boxes), true);
assert.equal(quietAccess([true,true,true],[3,3,3],true,34), true);
assert.equal(quietAccess([true,true,true],[3,3,3],true,35), false);
assert.equal(quietAccess([true,false,true],[0,0,0],true,0), false);
assert.equal(quietAccess([true,true,true],[0,0,0],false,90), true);
console.log('9 combat and quiet-route assertions passed');

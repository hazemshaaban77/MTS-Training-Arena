import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../components/arena/App.tsx',import.meta.url),'utf8');
const world=readFileSync(new URL('../components/arena/ArenaWorld3D.css',import.meta.url),'utf8');
test('dashboard is not displaced by decorative background world',()=>{
 assert.ok(app.includes("view==='login'&&<div className=\"arena-home-world\""));
 assert.ok(!app.includes("view==='home'||view==='login'"));
 assert.ok(world.includes('>aside.sidebar{position:fixed;z-index:30}'));
 assert.ok(!world.includes('>.workspace,.arena-app:has(.arena-home-world)>aside,'));
});
test('trainer navigation clears inherited login scroll position',()=>{
 assert.match(app,/window\.scrollTo\(\{top:0,left:0,behavior:'instant'\}\)/);
});
test('hero 3D remains scoped to dashboard hero, not full screen',()=>{
 assert.match(app,/className="arena-art dashboard-hero-art arena-hero-world"/);
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../js/data.js');
const items = Object.values(data.components).flat();
const index = new Map(items.map(item => [item.id,item]));

test('catalogue 2026 includes current CPU and GPU families',()=>{
  assert.equal(data.catalogEdition,'2026');
  assert.ok(items.some(p=>p.name.includes('9850X3D')));
  assert.ok(items.some(p=>p.name.includes('RTX 5060 Ti 16GB')));
  assert.ok(items.some(p=>p.name.includes('RX 9070 XT')));
  assert.equal(index.size,items.length);
});

test('each product uses an existing category-specific illustration',()=>{
  for(const [category,list] of Object.entries(data.components)){
    assert.ok(list.length>=3);
    for(const p of list){
      assert.equal(p.image,`images/products/${category}.svg`);
      assert.ok(fs.existsSync(path.resolve(__dirname,'..',p.image)));
      assert.ok(Number.isInteger(p.price)&&p.price>=0);
      assert.equal(p.imageType,'illustration');
    }
  }
});

test('presets reference matching socket, RAM, form-factor and sane PSU power',()=>{
  for(const preset of data.presets){
    const b=Object.fromEntries(Object.entries(preset.components).map(([cat,id])=>[cat,index.get(id)]));
    assert.ok(Object.values(b).every(Boolean),'unknown item in '+preset.id);
    assert.equal(b.cpu.socket,b.motherboard.socket,preset.id);
    assert.equal(b.ram.memoryType,b.motherboard.memoryType,preset.id);
    assert.ok(b.case.supportedFormFactors.includes(b.motherboard.formFactor),preset.id);
    assert.ok(b.case.supportedPsuTypes.includes(b.psu.psuFormFactor),preset.id);
    const price=Object.values(b).reduce((sum,p)=>sum+p.price,0);
    const watts=Object.values(b).reduce((sum,p)=>sum+(p.watts||0),0);
    assert.equal(preset.totalPrice,price,preset.id);
    assert.equal(preset.estimatedWatts,watts,preset.id);
    assert.ok(b.psu.capacityWatts>=watts*1.25,preset.id);
  }
});

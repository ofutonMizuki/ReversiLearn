//import assert from "assert";
import { search, evaluate, read } from "../build/release.js";

import * as fs from 'fs';

let text = fs.readFileSync('../eval.dat').toString().split('\n');
let list = new Array();

for (let i = 0; i < text.length; i++) {
    list.push(Number(text[i]));
}

read(list);
//assert.strictEqual(add(1, 2), 3);

for(let i = 0; i < 13; i++){
    let result = search(0xce849b9fefaf1228n, 0x302a646010502444n, -1, i);
    console.log(`${i}: ${result}`);
}

//console.log(evaluate(0xce849b9fefaf1228n, 0x302a646010502444n, -1))

console.log("ok");

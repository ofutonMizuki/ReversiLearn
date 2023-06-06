const MANUAL_PLAYER = 1, COM_PLAYER = 2, RANDOM_PLAYER = 3;
import { Eval } from './evaluate';
import { init_board_js, BitBoard, Board, BLACK, WHITE, Count, Position } from './board';
const { setTimeout } = require('timers/promises');

import { Worker } from "worker_threads";

async function main() {
    const evaluate = new Eval();
    await evaluate.read('./eval.dat');
    //await evaluate.write('./eval.dat');
    evaluate.readP('./evalP.dat');
    evaluate.writeP('./evalP.dat');

    //探索部のテスト用初期値 
    // board = new Board({
    //     black: (new BitBoard(0xce849b9fefaf1228n)).rotate().rotate(),
    //     white: (new BitBoard(0x302a646010502444n)).rotate().rotate(),
    //     color: WHITE,
    //     posBoard: new BitBoard()
    // });

    let e: number[] = new Array(65);
    let e2: number[] = new Array(65);
    let b = 512;
    for (let j = 0; j < 65; j++) {
        e[j] = 0;
    }
    for (let k = 0; k < 16384; k++) {

        //マルチスレッド関係
        const workers: Worker[] = new Array();
        const nThread: number = 6;
        //Worker作成
        for (let i = 0; i < nThread; i++) {
            workers.push(new Worker("./game.ts", { workerData: { evaluate: evaluate } }));
        }
        //Worker周り初期化
        let results: { b: Board[], c: Count }[] = new Array();
        let workersEndFlag = 0;
        //局面生成
        for (let i = 0; i < nThread; i++) {
            workers[i].on('message', result => {
                //console.dir(result, { depth: null });
                results.push(result);
                console.log(results.length)
                if (results.length > b - nThread) {
                    workersEndFlag |= (0x01 << i);
                    console.log(workersEndFlag)
                    workers[i].terminate();
                }
                else {
                    workers[i].postMessage({ depth: 3 })
                }
            })
        }
        for (let i = 0; i < nThread; i++) {
            workers[i].postMessage({ depth: 3 })
        }

        //生成終了まで待つ
        while (1) {
            await setTimeout(100);
            if (workersEndFlag == ((1 << nThread) - 1)) {
                break;
            }
        }

        //学習
        for (let j = 0; j < b; j++) {
            let result = results[j];
            //console.dir(result, { depth: null });
            for (let i = 0; i < result.b.length; i++) {

                let board1: BitBoard, board2: BitBoard, score: number;
                const r = result.c.black - result.c.white;
                const s = result.b[i].score * 64 * 1000;

                result.b[i] = new Board({
                    black: new BitBoard(result.b[i].black.board),
                    white: new BitBoard(result.b[i].white.board),
                    color: result.b[i].color,
                    posBoard: new BitBoard(result.b[i].posBoard.board),
                    score: result.b[i].score
                })
                const pScore = evaluate.runPerceptron(result.b[i], result.b[i].color) * 64;
                const eScore = evaluate.evaluate(result.b[i], result.b[i].color);
                if (result.b[i].color == BLACK) {
                    board1 = result.b[i].black;
                    board2 = result.b[i].white;
                    score = (result.c.black - result.c.white);
                }
                else {
                    board1 = result.b[i].white;
                    board2 = result.b[i].black;
                    score = (result.c.white - result.c.black);
                }
                console.log(`score:${("     " + Math.floor(s)).substr(-6)}, pScore:${("     " + Math.floor(pScore * 1000)).substr(-6)}, eScore:${("     " + Math.floor(eScore * 1000)).substr(-6)}, s:${("     " + score).substr(-5)}`)

                let count = result.b[i].count();

                if (j < b * (7 / 8)) {
                    for (let c = 0; c < 4; c++) {
                        //evaluate.learn(board1, board2, result.b[i].getPosBoard(), score / 2, 0.01);
                        evaluate.backPropagation(board1.rotate(), board2.rotate(), result.b[i].getPosBoard().rotate().board, ((score / 64)), 0.03);
                        //evaluate.backPropagation(board1.rotate(), board2.rotate(), result.b[i].getPosBoard().rotate().board, (result.b[i].score + (score / 64)) / 2, 0.03);
                        //evaluate.backPropagation(board1.rotate(), board2.rotate(), result.b[i].getPosBoard().rotate().board, result.b[i].score, 0.03);
                        //evaluate.learn(board1.rotate(), board2.rotate(), result.b[i].getPosBoard().rotate(), (result.b[i].score + (score / 64)) * 32, 0.0001);
                    }
                }

                if (j > b * (7 / 8)) {
                    //e[count.black + count.white] += (pScore - (result.b[i].score * 64 + score) / 2) ** 2;
                    e[count.black + count.white] += (pScore - score) ** 2;
                    //console.log('e')
                }
            }
            console.log(`${k}.${j}`);
            //evaluate.writeP('./evalP.dat');
        }

        for (let j = 0; j < 65; j++) {
            e2[j] = (e[j] / (b * (1 / 8)));
            e2[j] = Math.sqrt(e2[j]);
            console.log(e2[j]);
            e[j] = 0;
        }

        //let result = game(board.clone(), 3, gamemode, move)
        //console.dir(result, { depth: null });
        evaluate.writeP('./evalP.dat');
        //await evaluate.write('./eval.dat');
        console.log(`${k}`);
    }
}

main();
import fetch from 'node-fetch';
import { BLACK, BitBoard, Board } from './board';
import fs from 'fs';

export class Eval {
    board1: number[][];
    board2: number[][];
    space: number[][];
    cb: number[][];
    constructor() {
        this.board1 = new Array();
        this.board2 = new Array();
        this.space = new Array();
        this.cb = new Array();
        for (let i = 0; i < 65; i++) {
            this.board1.push(new Array());
            this.board2.push(new Array());
            this.space.push(new Array());
            this.cb.push(new Array());
            for (let j = 0; j < 64; j++) {
                this.board1[i].push(0);
            }
            for (let j = 0; j < 64; j++) {
                this.board2[i].push(0);
            }
            for (let j = 0; j < 64; j++) {
                this.space[i].push(0);
            }
            for (let j = 0; j < 64; j++) {
                this.cb[i].push(0);
            }
        }
    }

    async read(path: string) {
        this.board1 = new Array();
        this.board2 = new Array();
        this.space = new Array();
        this.cb = new Array();
        let text = fs.readFileSync(path).toString().split('\n');;
        for (let i = 0; i < 65; i++) {
            this.board1.push(new Array());
            this.board2.push(new Array());
            this.space.push(new Array());
            this.cb.push(new Array());
            for (let j = 0; j < 64; j++) {
                this.board1[i].push(Number(text[i * 256 + j]));
            }
            for (let j = 0; j < 64; j++) {
                this.board2[i].push(Number(text[i * 256 + j + 64]));
            }
            for (let j = 0; j < 64; j++) {
                this.space[i].push(Number(text[i * 256 + j + 128]));
            }
            for (let j = 0; j < 64; j++) {
                this.cb[i].push(Number(text[i * 256 + j + 192]));
            }
        }
        //console.log(this.board1)
    }

    async write(path: string) {
        let data: string = '';
        for (let i = 0; i < 65; i++) {
            for (let j = 0; j < 64; j++) {
                data += this.board1[i][j].toString();
                data += '\n';
            }
            for (let j = 0; j < 64; j++) {
                data += this.board2[i][j].toString();
                data += '\n';
            }
            for (let j = 0; j < 64; j++) {
                data += this.space[i][j].toString();
                data += '\n';
            }
            for (let j = 0; j < 64; j++) {
                data += this.cb[i][j].toString();
                data += '\n';
            }
        }

        fs.writeFileSync(path, data);
    }

    _eval(_board1: BitBoard, _board2: BitBoard, _cb: BitBoard) {
        let r = 0;
        let n = _board1.count() + _board2.count();
        let board1 = _board1.board, board2 = _board2.board;
        let cb = _cb.board;
        for (let i = 0; i < 64; i++) {
            if (board1 & 0x01n) {
                r += this.board1[n][i];
            }
            else if (board2 & 0x01n) {
                r += this.board2[n][i];
            }
            else {
                r += this.space[n][i];
            }
            if (cb & 0x01n) {
                r += this.cb[n][i];
            }
            board1 >>= 1n;
            board2 >>= 1n;
            cb >>= 1n;
        }
        return r;
    }

    evaluate(board: Board, color: number) {
        let board1: BitBoard, board2: BitBoard;

        if (board.color == BLACK) {
            board1 = board.black;
            board2 = board.white;
        } else {
            board1 = board.white;
            board2 = board.black;
        }

        //盤面の石の数を数える
        let result = this._eval(board1, board2, board.getPosBoard());

        //手番からみたスコアを計算する
        if (color == board.color) {
            return result;
        }
        else {
            return -result;
        }
    }
}
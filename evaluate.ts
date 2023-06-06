import fetch from 'node-fetch';
import { BLACK, BitBoard, Board } from './board';
import fs from 'fs';

class Weight {
    readonly nI = 256;
    readonly nH1 = 256;
    readonly nH2 = 128;
    readonly nH3 = 64;
    readonly nH4 = 32;
    readonly nH5 = 32;

    bias1: number[];
    bias2: number[];
    bias3: number[];
    bias4: number[];
    bias5: number[];

    weightIH1: number[][];
    weightH1H2: number[][];
    weightH2H3: number[][];
    weightH3H4: number[][];
    weightH4H5: number[][];
    weightH5O: number[];

    constructor() {
        this.weightIH1 = new Array(this.nI);
        this.weightH1H2 = new Array(this.nH1);
        this.weightH2H3 = new Array(this.nH2);
        this.weightH3H4 = new Array(this.nH3);
        this.weightH4H5 = new Array(this.nH4);
        this.weightH5O = new Array(this.nH5);


        this.bias1 = new Array(this.nH1);
        this.bias2 = new Array(this.nH2);
        this.bias3 = new Array(this.nH3);
        this.bias4 = new Array(this.nH4);
        this.bias5 = new Array(this.nH5);

        for (let i = 0; i < this.nI; i++) {
            this.weightIH1[i] = new Array(this.nH1);
            for (let j = 0; j < this.nH1; j++) {
                this.weightIH1[i][j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH1);
                this.bias1[j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH1);
            }
        }
        for (let i = 0; i < this.nH1; i++) {
            this.weightH1H2[i] = new Array(this.nH2);
            for (let j = 0; j < this.nH2; j++) {
                this.weightH1H2[i][j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH2);
                this.bias2[j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH2);
            }
        }
        for (let i = 0; i < this.nH2; i++) {
            this.weightH2H3[i] = new Array(this.nH3);
            for (let j = 0; j < this.nH3; j++) {
                this.weightH2H3[i][j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH3);
                this.bias3[j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH3);
            }
        }
        for (let i = 0; i < this.nH3; i++) {
            this.weightH3H4[i] = new Array(this.nH4);
            for (let j = 0; j < this.nH4; j++) {
                this.weightH3H4[i][j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH4);
                this.bias4[j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH4);
            }
        }
        for (let i = 0; i < this.nH4; i++) {
            this.weightH4H5[i] = new Array(this.nH5);
            for (let j = 0; j < this.nH5; j++) {
                this.weightH4H5[i][j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH5);
                this.bias5[j] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH5);
            }
        }

        for (let i = 0; i < this.nH5; i++) {
            this.weightH5O[i] = 2 * (Math.random() - 0.5) / Math.sqrt(this.nH5);
        }
    }
}

class Perceptron {
    input: boolean[];
    hidden1: number[];
    hidden2: number[];
    hidden3: number[];
    hidden4: number[];
    hidden5: number[];

    weight: Weight[];

    constructor() {
        this.weight = new Array();
        for(let i = 0; i < 5; i++){
            this.weight[i] = new Weight();
        }
        
        //this.weight = new Weight();
    }

    // identity(x: number) {
    //     return x;
    // }

    // d_identity(x: number) {
    //     return 1;
    // }

    ReLU(x: number) {
        return x > 0 ? x : 0;
    }

    d_ReLU(x: number) {
        return x > 0 ? 1 : 0;
    }

    // ReLU(x: number) {
    //     if (x < -1) {
    //         return 0.01 * (x + 1) - 1;
    //     }
    //     if (x > 1) {
    //         return 0.01 * (x - 1) + 1;
    //     }
    //     return x;
    // }

    // d_ReLU(x: number) {
    //     if (x < -1) {
    //         return 0.01;
    //     }
    //     if (x > 1) {
    //         return 0.01;
    //     }
    //     return 1;
    // }

    tanh(x: number) {
        return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
    }

    d_tanh(x: number) {
        return 4 / ((Math.exp(x) + Math.exp(-x)) ** 2);
    }

    // sigmoid(x: number){
    //     return 1 / (1 + Math.exp(x))
    // }

    // d_sigmoid(x: number){
    //     return (1 - this.sigmoid(x)) * this.sigmoid(x);
    // }

    run(_board1: BitBoard, _board2: BitBoard, cb: bigint) {
        const count = _board1.count() + _board2.count();
        const weight = this.weight[Math.floor(count / 13)];
        //const weight = this.weight;
        this.input = new Array(weight.nI);
        for (let i = 0; i < weight.nI; i++) {
            this.input[i] = false;
        }
        this.hidden1 = new Array(weight.nH1);
        for (let i = 0; i < weight.nH1; i++) {
            this.hidden1[i] = 0;
        }
        this.hidden2 = new Array(weight.nH2);
        for (let i = 0; i < weight.nH2; i++) {
            this.hidden2[i] = 0;
        }
        this.hidden3 = new Array(weight.nH3);
        for (let i = 0; i < weight.nH3; i++) {
            this.hidden3[i] = 0;
        }
        this.hidden4 = new Array(weight.nH4);
        for (let i = 0; i < weight.nH4; i++) {
            this.hidden4[i] = 0;
        }
        this.hidden5 = new Array(weight.nH5);
        for (let i = 0; i < weight.nH5; i++) {
            this.hidden5[i] = 0;
        }
        let board1 = _board1.board, board2 = _board2.board;
        let result = 0;


        //入力層→中間1層
        for (let i = 0; i < 64; i++) {
            if (board1 & 0x01n) {
                this.input[i] = true;
                for (let j = 0; j < this.hidden1.length; j++) {
                    this.hidden1[j] += weight.weightIH1[i][j];
                }
            }
            else if (board2 & 0x01n) {
                this.input[i + 64] = true;
                for (let j = 0; j < this.hidden1.length; j++) {
                    this.hidden1[j] += weight.weightIH1[i + 64][j];
                }
            }
            else {
                this.input[i + 128] = true;
                for (let j = 0; j < this.hidden1.length; j++) {
                    this.hidden1[j] += weight.weightIH1[i + 128][j];
                }
            }
            if (cb & 0x01n) {
                this.input[i + 192] = true;
                for (let j = 0; j < this.hidden1.length; j++) {
                    this.hidden1[j] += weight.weightIH1[i + 192][j];
                }
            }
            board1 >>= 1n;
            board2 >>= 1n;
            cb >>= 1n;
        }

        //中間1層活性化
        for (let i = 0; i < this.hidden1.length; i++) {
            this.hidden1[i] = this.ReLU(this.hidden1[i] + weight.bias1[i]);
        }


        //中間1層→中間2層
        for (let i = 0; i < this.hidden1.length; i++) {
            for (let j = 0; j < this.hidden2.length; j++) {
                this.hidden2[j] += this.hidden1[i] * weight.weightH1H2[i][j];
            }
        }

        //中間2層活性化
        for (let i = 0; i < this.hidden2.length; i++) {
            this.hidden2[i] = this.ReLU(this.hidden2[i] + weight.bias2[i]);
        }

        //中間2層→中間3層
        for (let i = 0; i < this.hidden2.length; i++) {
            for (let j = 0; j < this.hidden3.length; j++) {
                this.hidden3[j] += this.hidden2[i] * weight.weightH2H3[i][j];
            }
        }

        //中間3層活性化
        for (let i = 0; i < this.hidden3.length; i++) {
            this.hidden3[i] = this.ReLU(this.hidden3[i] + weight.bias3[i]);
        }

        //中間3層→中間4層
        for (let i = 0; i < this.hidden3.length; i++) {
            for (let j = 0; j < this.hidden4.length; j++) {
                this.hidden4[j] += this.hidden3[i] * weight.weightH3H4[i][j];
            }
        }

        //中間4層活性化
        for (let i = 0; i < this.hidden4.length; i++) {
            this.hidden4[i] = this.ReLU(this.hidden4[i] + weight.bias4[i]);
        }

        //中間4層→中間5層
        for (let i = 0; i < this.hidden4.length; i++) {
            for (let j = 0; j < this.hidden5.length; j++) {
                this.hidden5[j] += this.hidden4[i] * weight.weightH4H5[i][j];
            }
        }

        //中間5層活性化
        for (let i = 0; i < this.hidden5.length; i++) {
            this.hidden5[i] = this.ReLU(this.hidden5[i] + weight.bias5[i]);
        }


        //中間5層→出力層
        for (let i = 0; i < this.hidden5.length; i++) {
            result += this.hidden5[i] * weight.weightH5O[i];
        }

        //出力層活性化
        result = this.tanh(result);

        return result;
    }

    backPropagation(_board1: BitBoard, _board2: BitBoard, cb: bigint, t: number, eta: number) {
        const count = _board1.count() + _board2.count();
        const weight = this.weight[Math.floor(count / 13)];
        //const weight = this.weight;
        const score = this.run(_board1, _board2, cb);
        const loss = t - score;


        const delta6 = loss * this.d_tanh(score);
        for (let i = 0; i < this.hidden5.length; i++) {
            weight.weightH5O[i] += eta * delta6 * this.hidden5[i] * (1 / weight.nH5);
        }

        const delta5: number[] = new Array(this.hidden5.length);
        for (let i = 0; i < this.hidden5.length; i++) {
            delta5[i] = delta6 * weight.weightH5O[i] * this.d_ReLU(this.hidden5[i]);
            for (let j = 0; j < this.hidden4.length; j++) {
                weight.weightH4H5[j][i] += eta * delta5[i] * this.hidden4[j] * (1 / weight.nH4);
            }
            weight.bias5[i] += eta * delta5[i] * (1 / weight.nH5);
        }

        const delta4: number[] = new Array(this.hidden4.length);
        for (let i = 0; i < this.hidden4.length; i++) {
            delta4[i] = 0;
            for (let j = 0; j < delta5.length; j++) {
                delta4[i] += delta5[j] * weight.weightH4H5[i][j];
            }
            delta4[i] *= this.d_ReLU(this.hidden4[i]);
            for (let j = 0; j < this.hidden3.length; j++) {
                weight.weightH3H4[j][i] += eta * delta4[i] * this.hidden3[j] * (1 / weight.nH3);
            }
            weight.bias4[i] += eta * delta4[i] * (1 / weight.nH4);
        }

        const delta3: number[] = new Array(this.hidden3.length);
        for (let i = 0; i < this.hidden3.length; i++) {
            delta3[i] = 0;
            for (let j = 0; j < delta4.length; j++) {
                delta3[i] += delta4[j] * weight.weightH3H4[i][j];
            }
            delta3[i] *= this.d_ReLU(this.hidden3[i]);
            for (let j = 0; j < this.hidden2.length; j++) {
                weight.weightH2H3[j][i] += eta * delta3[i] * this.hidden2[j] * (1 / weight.nH2);
            }
            weight.bias3[i] += eta * delta3[i] * (1 / weight.nH3);
        }

        const delta2: number[] = new Array(this.hidden2.length);
        for (let i = 0; i < this.hidden2.length; i++) {
            delta2[i] = 0;
            for (let j = 0; j < delta3.length; j++) {
                delta2[i] += delta3[j] * weight.weightH2H3[i][j];
            }
            delta2[i] *= this.d_ReLU(this.hidden2[i]);
            for (let j = 0; j < this.hidden1.length; j++) {
                weight.weightH1H2[j][i] += eta * delta2[i] * this.hidden1[j] * (1 / weight.nH1);
            }
            weight.bias2[i] += eta * delta2[i] * (1 / weight.nH2);
        }

        for (let i = 0; i < this.hidden1.length; i++) {
            let delta1 = 0;
            for (let j = 0; j < delta2.length; j++) {
                delta1 += delta2[j] * weight.weightH1H2[i][j];
            }
            delta1 *= this.d_ReLU(this.hidden1[i]);
            for (let j = 0; j < this.input.length; j++) {
                weight.weightIH1[j][i] += this.input[j] ? eta * delta1 * (1 / weight.nI) : 0;
            }
            weight.bias1[i] += eta * delta1 * (1 / weight.nH1);
        }
    }

    write(path: string) {
        //const json = JSON.stringify(this.weight, null, "\t");
        const json = JSON.stringify(this.weight);
        fs.writeFileSync(path, json);
    }

    read(path: string) {
        this.weight = JSON.parse(fs.readFileSync(path).toString());
    }
}

export class Eval {
    board1: number[][];
    board2: number[][];
    space: number[][];
    cb: number[][];
    perceptron: Perceptron;

    constructor() {
        this.perceptron = new Perceptron();
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

    learn(_board1: BitBoard, _board2: BitBoard, _cb: BitBoard, t: number, eta: number) {
        let n = _board1.count() + _board2.count();
        let board1 = _board1.board, board2 = _board2.board;
        let cb = _cb.board;
        let score = this._eval(_board1, _board2, _cb);
        let loss = score - t;
        for (let i = 0; i < 64; i++) {
            if (board1 & 0x01n) {
                this.board1[n][i] -= loss * eta;
            }
            else if (board2 & 0x01n) {
                this.board2[n][i] -= loss * eta;
            }
            else {
                this.space[n][i] -= loss * eta;
            }
            if (cb & 0x01n) {
                this.cb[n][i] -= loss * eta;
            }
            board1 >>= 1n;
            board2 >>= 1n;
            cb >>= 1n;
        }
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

    runPerceptron(board: Board, color: number) {
        let board1: BitBoard, board2: BitBoard;

        if (board.color == BLACK) {
            board1 = board.black;
            board2 = board.white;
        } else {
            board1 = board.white;
            board2 = board.black;
        }

        //盤面の石の数を数える
        let result = this.perceptron.run(board1, board2, board.getPosBoard().board);

        //手番からみたスコアを計算する
        if (color == board.color) {
            return result;
        }
        else {
            return -result;
        }
    }

    backPropagation(_board1: BitBoard, _board2: BitBoard, cb: bigint, t: number, eta: number) {
        this.perceptron.backPropagation(_board1, _board2, cb, t, eta);
    }

    writeP(path: string) {
        this.perceptron.write(path);
    }

    readP(path: string) {
        this.perceptron.read(path);
    }
}
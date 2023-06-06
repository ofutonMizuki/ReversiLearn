const INFINITE_SCORE = 32768;
import { init_board_js, BitBoard, Board, BLACK, WHITE, PositionScore } from './board';
import { Eval } from './evaluate';

class tBoard extends Board {
    prev: tBoard | null;
    next: tBoard[];
    numberOfChildNode: number;
    n: number;
    score: number;
    position: PositionScore
    constructor(board: Board) {
        super();
        this.black = board.black;
        this.white = board.white;
        this.color = board.color;
        this.posBoard = board.posBoard;
        this.prev = null;
        this.next = new Array();
        this.numberOfChildNode = 0;
        this.n = 0;
        this.score = 0;
        this.position = new PositionScore(-1,-1, 0);
    }

    clone(): tBoard {
        let newBoard = new tBoard(super.clone());
        newBoard.prev = this.prev;
        newBoard.next = this.next.concat([]);
        newBoard.numberOfChildNode = this.numberOfChildNode;
        newBoard.n = this.n;
        newBoard.score = this.score;
        newBoard.position = this.position.clone();

        return newBoard;
    }
}

function createNextBoard(board: tBoard, position: PositionScore): tBoard {
    //新しい盤面にコピー
    //let newBoard = { ...board };
    let newBoard = board.clone();

    //
    newBoard.next = [];
    newBoard.prev = board;
    newBoard.numberOfChildNode = 0;
    newBoard.n += 1;
    newBoard.position = position.clone();

    //ひっくり返す
    newBoard.reverse(position);


    return newBoard;
}

export function _search(_board: Board, maxDepth: number, evaluate: Eval): PositionScore {
    let board = new tBoard(_board);
    alphaBeta(board, maxDepth - 1, board.color, evaluate, -INFINITE_SCORE, INFINITE_SCORE, true);

    let result = board.position.clone();
    result.s = board.score;
    return result;
}

function alphaBeta(board: tBoard, maxDepth: number, color: number, evaluate: Eval, alpha: number, beta: number, moFlag: boolean): f64 {
    //もしパスならターンチェンジ
    if (board.isPass()) {
        board.changeColor();

        //それでもパスならゲーム終了
        if (board.isPass()) {
            board.changeColor();

            //盤面の石の数を数える
            let result = board.count();

            //手番からみたスコアを計算する
            if (color == BLACK) {
                board.score = result.black - result.white;
            }
            else {
                board.score = result.white - result.black;
            }

            board.score /= 64;

            return board.score;
        }
    }

    //もし探索上限に達したら評価値を求める
    if (maxDepth < board.n) {
        board.score = evaluate.evaluate(board, color) / 64;

        return board.score;
    }

    //合法手の生成
    let positionList = board.getNextPositionList();
    board.numberOfChildNode = positionList.length;
    //ソートをする深さを設定(深さはなんとなくで設定)
    const sortDepth = moFlag ? Math.floor(maxDepth / 1.5) : maxDepth;

    if (color == board.color) {
        let prevBoard = board.prev;
        board.score = -INFINITE_SCORE;

        //枝刈りのためのソートをする場合ソート
        if (board.n < sortDepth && moFlag) {
            const cronedBoard = board.clone();
            for (let i = 0; i < positionList.length; i++) {
                cronedBoard.next.push(createNextBoard(cronedBoard, positionList[i].clone()));
                positionList[i].s = alphaBeta(cronedBoard.next[i], sortDepth - 1, color, evaluate, alpha, beta, false);
            }

            positionList.sort((a, b) => <i32>((b.s * 64000) - (a.s * 64000)));
        }

        for (let i = 0; i < positionList.length; i++) {
            board.next.push(createNextBoard(board, positionList[i].clone()));
            let score = alphaBeta(board.next[i], maxDepth, color, evaluate, alpha, beta, moFlag);
            board.numberOfChildNode += board.next[i].numberOfChildNode;

            if (board.score < score) {
                board.score = score;
            }
            if (alpha < score) {
                board.position = prevBoard == null ? board.next[i].position.clone() : board.position;
                alpha = score;
            }
            if (alpha >= beta) {
                //使わない配列は明示的に解放
                board.next = [];
                return alpha;
            }
        }
    }
    else {
        let prevBoard = board.prev;
        board.score = INFINITE_SCORE;

        //枝刈りのためのソートをする場合ソート
        if (board.n < sortDepth && moFlag) {
            const cronedBoard = board.clone();
            for (let i = 0; i < positionList.length; i++) {
                cronedBoard.next.push(createNextBoard(cronedBoard, positionList[i].clone()));
                positionList[i].s = alphaBeta(cronedBoard.next[i], sortDepth - 1, color, evaluate, alpha, beta, false);
            }

            positionList.sort((a, b) => <i32>((a.s * 64000) - (b.s * 64000)));
        }

        for (let i = 0; i < positionList.length; i++) {
            board.next.push(createNextBoard(board, positionList[i].clone()));
            let score = alphaBeta(board.next[i], maxDepth, color, evaluate, alpha, beta, moFlag);
            board.numberOfChildNode += board.next[i].numberOfChildNode;

            if (board.score > score) {
                board.score = score;
            }
            if (beta > score) {
                board.position = prevBoard == null ? board.next[i].position.clone() : board.position;
                beta = score;
            }
            if (alpha >= beta) {
                //使わない配列は明示的に解放
                board.next = [];
                return beta;
            }
        }
    }

    //使わない配列は明示的に解放
    board.next = [];
    return board.score;
}
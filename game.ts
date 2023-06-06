const MANUAL_PLAYER = 1, COM_PLAYER = 2, RANDOM_PLAYER = 3;
import { Eval } from './evaluate';
import { init_board_js, BitBoard, Board, BLACK, WHITE, Count, Position } from './board';
import { search } from './search';

import { isMainThread, parentPort, workerData } from "worker_threads";

if (isMainThread) {
    throw new Error("メインスレッドでは実行できません");
}
const evaluate = new Eval();

evaluate.read('./eval.dat');
//await evaluate.write('./eval.dat');
evaluate.readP('./evalP.dat');

if (parentPort) {
    parentPort.on("message", (arg: { depth: number }) => {

        function game(_board: Board, depth: number, gamemode: { black: number, white: number }, move: Position): { b: Board[], c: Count } {
            //置ける場所を求める(実際はすでに求められてると思うけれど念の為)
            _board.getPosBoard();

            //もしパスならターンチェンジ
            if (_board.isPass()) {
                _board.changeColor();

                //それでもパスならゲーム終了
                if (_board.isPass()) {
                    _board.changeColor();

                    //盤面の石の数を数えて返す
                    let result = _board.count();
                    let b = new Array();
                    _board.score = _board.color == BLACK ? result.black - result.white : result.white - result.black;
                    //result = _board.color == BLACK ? result : { black: result.white, white: result.black };
                    _board.score /= 64;

                    b.push(_board);
                    return { b: b, c: result };
                }
            }

            let board = _board.clone();
            let count = board.count();
            let mode = (board.color == BLACK) ? gamemode.black : gamemode.white;
            mode = count.black + count.white < 14 ? RANDOM_PLAYER : mode;
            //mode = Math.floor(Math.random() * 10) == 0 ? RANDOM_PLAYER : mode;
            //プレイヤーのゲームモードによって分岐する
            switch (mode) {
                //コンピュータープレイヤー
                case COM_PLAYER:
                    const _d = (64 - (count.black + count.white)) < 7 ? 7 : depth;
                    //思考結果が返ってくるまで待つ
                    let result = search(board.clone(), _d, evaluate);

                    //
                    move.x = result.position.x;
                    move.y = result.position.y;

                    _board.score = result.score;
                    break;

                //ランダムプレイヤー
                case RANDOM_PLAYER:
                    let rresult = search(board.clone(), depth, evaluate);
                    _board.score = rresult.score;

                    const npList = board.getNextPositionList();
                    move = npList[Math.floor(Math.random() * npList.length)].p;
                    break;
                default:
                    break;
            }

            //石を置いてひっくり返す
            board.reverse(move);

            //game()を再帰呼び出しする
            let g = game(board, depth, gamemode, move);
            g.b.unshift(_board);
            return g;
        }

        if (parentPort) {
            let move = { x: -1, y: -1 };
            init_board_js();
            //ゲームモードの設定
            let gamemode = { black: COM_PLAYER, white: COM_PLAYER };

            //console.log(evaluate);

            const board = new Board();
            const result = game(board.clone(), arg.depth, gamemode, move);
            //console.log(result);
            parentPort.postMessage(result);
        }
    });
}
const MANUAL_PLAYER = 1, COM_PLAYER = 2, RANDOM_PLAYER = 3;
import { Eval } from './evaluate';
import { init_board_js, BitBoard, Board, BLACK, WHITE, Count, Position } from './board';
import { search } from './search';

const evaluate = new Eval();

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
            b.push(_board);
            return { b: b, c: result };
        }
    }

    let board = _board.clone();
    let count = board.count();
    let mode = (board.color == BLACK) ? gamemode.black : gamemode.white;
    mode = count.black + count.white < 14 ? RANDOM_PLAYER : mode;
    //プレイヤーのゲームモードによって分岐する
    switch (mode) {
        //コンピュータープレイヤー
        case COM_PLAYER:
            //思考結果が返ってくるまで待つ
            let result = search(board.clone(), depth, evaluate);

            //
            move.x = result.position.x;
            move.y = result.position.y;

            _board.score = result.score;

            //console.log(move)
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

async function main() {
    await evaluate.read('./eval.dat');
    //await evaluate.write('./eval.dat');
    init_board_js();
    let board = new Board();
    let move = { x: -1, y: -1 };

    //探索部のテスト用初期値 
    // board = new Board({
    //     black: (new BitBoard(0xce849b9fefaf1228n)).rotate().rotate(),
    //     white: (new BitBoard(0x302a646010502444n)).rotate().rotate(),
    //     color: WHITE,
    //     posBoard: new BitBoard()
    // });

    for (let j = 0; j < 1; j++) {
        //ゲームモードの設定
        let gamemode = { black: COM_PLAYER, white: COM_PLAYER };
        let result = game(board.clone(), 2 + (j % 2), gamemode, move);
        for (let i = 0; i < result.b.length; i++) {
            let board1: BitBoard, board2: BitBoard, score: number;
            if (result.b[i].color == BLACK) {
                board1 = result.b[i].black;
                board2 = result.b[i].white;
                score = result.b[i].score + (result.c.black - result.c.white);
                //console.log(`result: ${result.c.black - result.c.white}, score: ${result.b[i].score}`)
            }
            else {
                board1 = result.b[i].white;
                board2 = result.b[i].black;
                score = result.b[i].score + (result.c.white - result.c.black);
                //console.log(`result: ${result.c.white - result.c.black}, score: ${result.b[i].score}`)
            }

            score /= 2;
            evaluate.learn(board1, board2, result.b[i].getPosBoard(), score, 0.0078);
        }
        console.dir(result, { depth: null });
        await evaluate.write('./eval.dat');
    }
    await evaluate.write('./eval.dat');
}

main();
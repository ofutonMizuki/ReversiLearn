const MANUAL_PLAYER = 1, COM_PLAYER = 2, RANDOM_PLAYER = 3;
import { Eval } from './evaluate';
import { init_board_js, BitBoard, Board, BLACK, WHITE, Count, Position } from './board';
import { search } from './search';

const evaluate = new Eval();

function game(board: Board, gamemode: { black: number, white: number }, move: Position): Count {
    //置ける場所を求める(実際はすでに求められてると思うけれど念の為)
    board.getPosBoard();

    //もしパスならターンチェンジ
    if (board.isPass()) {
        board.changeColor();

        //それでもパスならゲーム終了
        if (board.isPass()) {

            //盤面の石の数を数えて返す
            let result = board.count();
            return result;
        }
    }

    //プレイヤーのゲームモードによって分岐する
    switch ((board.color == BLACK) ? gamemode.black : gamemode.white) {
        //コンピュータープレイヤー
        case COM_PLAYER:
            //思考結果が返ってくるまで待つ
            let result = search(board.clone(), 4, evaluate);

            //
            move.x = result.position.x;
            move.y = result.position.y;
            console.log(move)
            break;

        //ランダムプレイヤー
        case RANDOM_PLAYER:
            const npList = board.getNextPositionList();
            move = npList[Math.floor(Math.random() * npList.length)].p;
            console.log(move)
            break;
        default:
            break;
    }

    //石を置いてひっくり返す
    board.reverse(move);

    //game()を再帰呼び出しする
    return game(board, gamemode, move);
}

async function main() {
    await evaluate.read("https://othello.ofuton.net/eval/eval");
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

    //ゲームモードの設定
    let gamemode = { black: RANDOM_PLAYER, white: RANDOM_PLAYER };

    console.log(game(board, gamemode, move));
}

main();
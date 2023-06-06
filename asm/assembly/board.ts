export const SPACE = 0;
export const BLACK = 1;
export const WHITE = -1;
const DEFAULT_BLACK_BOARD = 0x810000000;
const DEFAULT_WHITE_BOARD = 0x1008000000;

let table: u64[] = new Array(64);

export function init_board_js(): void {
    let hash: u64 = 0x03F566ED27179461;
    for (let i = 0; i < 64; i++) {
        table[<i32>(hash >> 58)] = i;
        hash <<= 1;
    }
}

export class Count {
    black: number = 0;
    white: number = 0;

    constructor(black: i32, white: i32) {
        this.black = black;
        this.white = white;
    }
}

export class PositionScore {
    x: i32 = 0;
    y: i32 = 0;
    s: f64 = 0;

    constructor(x: i32, y: i32, s: f64 = 0) {
        this.x = x;
        this.y = y;
        this.s = s;
    }

    @inline
    clone(): PositionScore {
        return new PositionScore(this.x, this.y, this.s);
    }
}

export class BitBoard {
    board: u64;
    constructor(board: u64 = 0x00) {
        this.board = board;
    }

    @inline
    clone(): BitBoard {
        let newBitBoard = new BitBoard();
        newBitBoard.board = this.board;
        return newBitBoard;
    }

    @inline
    isSet(x: i32, y: i32): boolean {
        let m = x + y * 8;
        return ((this.board << ((m))) & 0x8000000000000000) != 0 ? true : false;
    }

    @inline
    cr2bitboard(col: i32, row: i32): void // col (0..7), row (0..7) に対応するビットボード生成
    {
        this.board = 0x8000000000000000 >> ((col) + (row) * 8);
    }

    @inline
    GetNumberOfTrailingZeros(x: u64): u64 {
        if (x == 0) return 64;

        let y = (x & -x);
        let i: u64 = <u64>((y * 0x03F566ED27179461) >> 58);
        return table[<i32>(i)];
    }

    @inline
    bitboard2cr(): PositionScore {
        let x: u64 = 63 - this.GetNumberOfTrailingZeros(this.board);
        const pos = new PositionScore(<i32>(x % 8), <i32>(Math.floor(<i32>x / 8)));

        return pos;
    }

    @inline
    isZero(): boolean {
        return this.board == 0 ? true : false;
    }

    @inline
    _count(): u64 {
        let x = this.board;
        x = x - ((x >> 1) & 0x5555555555555555);

        x = (x & 0x3333333333333333) + ((x >> 2) & 0x3333333333333333);

        x = (x + (x >> 4)) & 0x0f0f0f0f0f0f0f0f;
        x = x + (x >> 8);
        x = x + (x >> 16);
        x = x + (x >> 32);
        return (x & 0x0000007f);
    }

    @inline
    count(): u32 {
        let x1: u32 = <u32>(this.board & 0xFFFFFFFF), x0: u32 = (<u32>(this.board >> 32) & 0xFFFFFFFF);
        let t0: u32 = x1 - (x1 >>> 1 & 0x55555555);
        t0 = (t0 & 0x33333333) + ((t0 & 0xcccccccc) >>> 2);
        let t1 = x0 - (x0 >>> 1 & 0x55555555);
        t0 += (t1 & 0x33333333) + ((t1 & 0xcccccccc) >>> 2);
        t0 = (t0 & 0x0f0f0f0f) + ((t0 & 0xf0f0f0f0) >>> 4);
        return (t0 * 0x01010101 >>> 24);
    }

    @inline
    rotate(): this {
        let b = this.board;
        b =
            ((b << 1) & 0xAA00AA00AA00AA00) |
            ((b >> 1) & 0x0055005500550055) |
            ((b >> 8) & 0x00AA00AA00AA00Aa) |
            ((b << 8) & 0x5500550055005500);

        b =
            ((b << 2) & 0xCCCC0000CCCC0000) |
            ((b >> 2) & 0x0000333300003333) |
            ((b >> 16) & 0x0000CCCC0000CCCc) |
            ((b << 16) & 0x3333000033330000);

        b =
            ((b << 4) & 0xF0F0F0F000000000) |
            ((b >> 4) & 0x000000000F0F0F0F) |
            ((b >> 32) & 0x00000000F0F0F0F0) |
            ((b << 32) & 0x0F0F0F0F00000000);

        this.board = b;
        return this;
    }
}

export class Board {
    black: BitBoard = new BitBoard();
    white: BitBoard = new BitBoard();
    color: i32 = 0;
    posBoard: BitBoard = new BitBoard();
    score: f64 = 0;

    constructor() {
        this.black = new BitBoard(DEFAULT_BLACK_BOARD);
        this.white = new BitBoard(DEFAULT_WHITE_BOARD);
        this.color = BLACK;
        this.posBoard = new BitBoard();
        this.score = 0;

        this.getPosBoard();
    }

    clone(): Board {
        let newBoard = new Board();
        //let newBoard = new Board();
        newBoard.black = this.black.clone();
        newBoard.white = this.white.clone();
        newBoard.color = this.color;
        newBoard.posBoard = this.posBoard.clone();

        return newBoard;
    }

    //指定した座標の色を教えてくれます
    @inline
    getColor(position: PositionScore): i32 {
        let x = position.x, y = position.y;
        let black = this.black.isSet(x, y);
        let white = this.white.isSet(x, y);
        if (black == white) {
            return SPACE;
        }
        else {
            if (black) {
                return BLACK;
            }
            else if (white) {
                return WHITE;
            }
            return SPACE;
        }
    }

    //ターンチェンジをしてくれます
    @inline
    changeColor(): void {
        switch (this.color) {
            case BLACK:
                this.color = WHITE;
                break;
            case WHITE:
                this.color = BLACK;
                break;

            default:
                this.color = SPACE;
        }

        this.getPosBoard();
    }

    //パスか確認
    @inline
    isPass(): boolean {
        return this.posBoard.isZero();
    }

    //指定した座標に置けるか確認してくれます
    @inline
    isPos(position: PositionScore): boolean {
        let x = position.x, y = position.y;
        return this.posBoard.isSet(x, y);
    }

    @inline
    getNextPositionList(): PositionScore[] {
        let x = this.posBoard.clone();
        let positionList: PositionScore[] = new Array();
        while (x.board != 0) {
            positionList.push(x.bitboard2cr());

            x.board &= x.board - 1;
        }

        return positionList;
    }

    //指定した座標に石をおいて反転します。
    //この関数では合法手であるかどうかのチェックは行われないので事前にisPos()でチェックしておくこと
    @inline
    reverse(position: PositionScore): u64 {
        let x = position.x, y = position.y;
        let m = new BitBoard();
        let rev: u64;

        m.cr2bitboard(x, y);

        if (this.color == BLACK) {
            rev = this.getRevPat(this.black.board, this.white.board, m.board);
            this.black.board ^= m.board | rev;
            this.white.board ^= rev;
        }
        else {
            rev = this.getRevPat(this.white.board, this.black.board, m.board);
            this.white.board ^= m.board | rev;
            this.black.board ^= rev;
        }

        this.changeColor();

        return rev;
    }

    @inline
    count(): Count {
        return new Count(this.black.count(), this.white.count());
    }

    //以下、外から使わない関数

    @inline
    getPosBoard(): BitBoard {
        let board1: u64 = 0, board2: u64 = 0;

        if (this.color == BLACK) {
            board1 = this.black.board;
            board2 = this.white.board;
        }
        else {
            board1 = this.white.board;
            board2 = this.black.board;
        }

        return this.posBoard = this.genValidMove(board1, board2);
    }

    @inline
    genValidMove(board1: u64, board2: u64): BitBoard {
        let i: u64;
        let blank = new BitBoard(), masked = new BitBoard(), valid = new BitBoard(), t: u64 = 0;

        // 空マスのビットボードを（黒または白）のビットNOTで得る
        blank.board = (~(board1 | board2));

        // 右方向
        masked.board = board2 & 0x7e7e7e7e7e7e7e7e;
        t = masked.board & (board1 << 1);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t << 1);
        }
        valid.board = blank.board & (t << 1);

        // 左方向
        masked.board = board2 & 0x7e7e7e7e7e7e7e7e;
        t = masked.board & (board1 >> 1);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t >> 1);
        }
        valid.board |= blank.board & (t >> 1);

        // 上方向
        masked.board = board2 & 0x00ffffffffffff00;
        t = masked.board & (board1 << 8);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t << 8);
        }
        valid.board |= blank.board & (t << 8);

        // 下方向
        masked.board = board2 & 0x00ffffffffffff00;
        t = masked.board & (board1 >> 8);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t >> 8);
        }
        valid.board |= blank.board & (t >> 8);

        // 右上方向
        masked.board = board2 & 0x007e7e7e7e7e7e00;
        t = masked.board & (board1 << 7);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t << 7);
        }
        valid.board |= blank.board & (t << 7);

        // 左上方向
        masked.board = board2 & 0x007e7e7e7e7e7e00;
        t = masked.board & (board1 << 9);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t << 9);
        }
        valid.board |= blank.board & (t << 9);

        // 右下方向
        masked.board = board2 & 0x007e7e7e7e7e7e00;
        t = masked.board & (board1 >> 9);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t >> 9);
        }
        valid.board |= blank.board & (t >> 9);

        // 左下方向
        masked.board = board2 & 0x007e7e7e7e7e7e00;
        t = masked.board & (board1 >> 7);
        for (i = 0; i < 5; i++) {
            t |= masked.board & (t >> 7);
        }
        valid.board |= blank.board & (t >> 7);

        return valid;
    }

    @inline
    getRevPat(board1: u64, board2: u64, m: u64): u64 { //反転ビットマスクを取得
        let rev = new BitBoard();
        if (((board1 | board2) & m) == 0) {
            let buf = new BitBoard();
            let mask = (m << 1) & 0xfefefefefefefefe;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask << 1) & 0xfefefefefefefefe;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m << 9) & 0xfefefefefefefe00;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask << 9) & 0xfefefefefefefe00;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m << 8) & 0xffffffffffffff00;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask << 8) & 0xffffffffffffff00;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m << 7) & 0x7f7f7f7f7f7f7f00;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask << 7) & 0x7f7f7f7f7f7f7f00;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m >> 1) & 0x7f7f7f7f7f7f7f7f;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask >> 1) & 0x7f7f7f7f7f7f7f7f;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m >> 9) & 0x007f7f7f7f7f7f7f;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask >> 9) & 0x007f7f7f7f7f7f7f;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m >> 8) & 0x00ffffffffffffff;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask >> 8) & 0x00ffffffffffffff;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;

            buf.board = 0;
            mask = (m >> 7) & 0x00fefefefefefefe;
            while (mask != 0 && (mask & board2) != 0) {
                buf.board |= mask;
                mask = (mask >> 7) & 0x00fefefefefefefe;
            }
            if ((mask & board1) != 0)
                rev.board |= buf.board;
        }

        return rev.board;
    }
}
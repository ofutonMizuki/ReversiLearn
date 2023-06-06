// The entry file of your WebAssembly module.
import { BitBoard, Board, PositionScore, init_board_js } from "./board";
import { Eval } from "./evaluate";
import { _search } from "./search";

let _eval = new Eval();

export function search(black: u64, white: u64, color: i32, maxDepth: i32): i32[] {
  init_board_js();
  const _board = new Board();
  _board.black = new BitBoard(black);
  _board.white = new BitBoard(white);
  _board.color = color;
  _board.getPosBoard();
  const result = _search(_board.clone(), maxDepth, _eval);

  return [result.x, result.y, <i32>(result.s * 64000)];
}

export function read(e: f64[]): void {
  _eval.read(e);
}

export function evaluate(black: u64, white: u64, color: i32): f64 {
  const _board = new Board();
  _board.black = new BitBoard(black);
  _board.white = new BitBoard(white);
  _board.color = color;
  return _eval.evaluate(_board.clone(), color);
}

export function add(a: i32, b: i32): i32 {
  return a + b;
}

/// <reference types="types-for-adobe/Illustrator/2015.3"/>

// import { crossPoint } from "./components/crosspoint";
// 端の組み合わせ4点のうち、距離の近い2点で算出
// 距離を返す

// 線分AB,CDのペアA(x1,y1),B(x2,y2),C(x3,y3),D(x4,y4)
// P1,P2,P3で、P1P2とP2P3を仮オフセットした線分AB,CDからその交点を算出したい
/**
 * 「crossPoint」交点算出
 * @param {number} x1
 * @param {number} y1
 *
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {number} x4
 * @param {number} y4
 * @return {[number,number]} [x,y] 交点のPathItem
 */
function crossPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
): [number, number] {
    const vy1 = y2 - y1;
    const vx1 = x1 - x2;
    const c_1 = -1 * vy1 * x1 - vx1 * y1;
    const vy2 = y4 - y3;
    const vx2 = x3 - x4;
    const c_2 = -1 * vy2 * x3 - vx2 * y3;

    const c_3 = vx1 * vy2 - vx2 * vy1;
    if (c_3 === 0) {
        //平行によりうまく求められないとき。
        return [(x2 + x3) * 0.5, (y2 + y3) * 0.5];
    } else {
        return [(c_1 * vx2 - c_2 * vx1) / c_3, (vy1 * c_2 - vy2 * c_1) / c_3];
    }
}

//---------------------------------------------
/**
 * @summary 2点間の距離を返す
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @returns {number}
 */
function diffPoints(x1: number, y1: number, x2: number, y2: number): number {
    const diffX = Math.abs(x2 - x1);
    const diffY = Math.abs(y2 - y1);
    return Math.sqrt(diffX * diffX + diffY * diffY);
}

/**
 * @method
 * @param {[number, number]} cp
 * @param {[PathPoint, PathPoint]} end 線端
 * @returns {boolean} 線端上に交点があるか(falseなら延長上にある)
 */
function isCrossPointOnLine(
    cp: [number, number],
    end: [PathPoint, PathPoint]
): boolean {
    const endsDistance = diffPoints(
        end[0].anchor[0],
        end[0].anchor[1],
        end[1].anchor[0],
        end[1].anchor[1]
    );
    const cp2end0Distance = diffPoints(
        end[0].anchor[0],
        end[0].anchor[1],
        cp[0],
        cp[1]
    );
    const cp2end1Distance = diffPoints(
        cp[0],
        cp[1],
        end[1].anchor[0],
        end[1].anchor[1]
    );
    // cpと線端の片方ずつの長さは、線端上に交点があるなら、endsDistanceとほぼ等しい
    return Math.abs(cp2end0Distance + cp2end1Distance - endsDistance) < 1;
}

/**
 * パス2つを元に、交点を決定する
 * @param path
 */
function decideCrossPoint(
    path: [PathItem, PathItem]
): {
    cp: [number, number];
    points: [number, number][];
} {
    // TODO : この際、交点が始点-始点の次などにあるかも判定したい
    // パスそれぞれの始点・終点、始点の次・終点の1つ前を収集する
    const path1: PathItem = path[0];
    const pi1length: number = path1.pathPoints.length;
    const path2: PathItem = path[1];
    const pi2length: number = path2.pathPoints.length;
    const p1: PathPoint = path1.pathPoints[0];
    const p2: PathPoint = path1.pathPoints[pi1length - 1];
    const p3: PathPoint = path2.pathPoints[0];
    const p4: PathPoint = path2.pathPoints[pi2length - 1];
    const pathPoints: [PathPoint, PathPoint, PathPoint, PathPoint] = [
        p1,
        p2,
        p3,
        p4,
    ];
    const p1next: PathPoint = path1.pathPoints[1];
    const p2next: PathPoint = path1.pathPoints[pi1length - 2];
    const p3next: PathPoint = path2.pathPoints[1];
    const p4next: PathPoint = path2.pathPoints[pi2length - 2];
    const pathPointsNext: [PathPoint, PathPoint, PathPoint, PathPoint] = [
        p1next,
        p2next,
        p3next,
        p4next,
    ];
    //---------------------------------------------
    // 最も距離差の少ない端2点の組み合わせを選択
    // 交点をひとまずひたすら繋いでいく
    // 交点だけでなく、path2つのどちらか・anchorとの対応情報、距離差も算出する

    // 交点
    let cps: [number, number][] = [];

    // 引数のpathのどちらか＋anchor番号
    let anchorTypes: [boolean, boolean][] = [];

    // cpsの組み合わせの場合の、2点間距離差
    // 最も小さいものを採用する
    let diffs: number[] = [];

    const p1_p1next: [PathPoint, PathPoint] = [p1, p1next];
    const p2_p2next: [PathPoint, PathPoint] = [p2, p2next];
    const p3_p3next: [PathPoint, PathPoint] = [p3, p3next];
    const p4_p4next: [PathPoint, PathPoint] = [p4, p4next];
    const lineEnds: [PathPoint, PathPoint][] = [
        p1_p1next,
        p2_p2next,
        p3_p3next,
        p4_p4next,
    ];

    // 線端4つの組み合わせ6通りのオブジェクトを格納する
    let lineEndPairs: [[PathPoint, PathPoint], [PathPoint, PathPoint]][] = [];

    // 各組み合わせ方でそれぞれ処理を行う
    for (let i = 0; i < 2; i++) {
        for (let j = 2; j < 4; j++) {
            // 組み合わせパターンを格納していく
            lineEndPairs.push([lineEnds[i], lineEnds[j]]);
            cps.push(
                crossPoint(
                    pathPoints[i].anchor[0],
                    pathPoints[i].anchor[1],
                    pathPointsNext[i].anchor[0],
                    pathPointsNext[i].anchor[1],
                    pathPoints[j].anchor[0],
                    pathPoints[j].anchor[1],
                    pathPointsNext[j].anchor[0],
                    pathPointsNext[j].anchor[1]
                )
            );
            diffs.push(
                diffPoints(
                    pathPoints[i].anchor[0],
                    pathPoints[i].anchor[1],
                    pathPoints[j].anchor[0],
                    pathPoints[j].anchor[1]
                )
            );
            const isFirstAnchor = (num: number) => {
                return num % 2 === 0;
            };
            // 最初のアンカーなら0、そうでなければ長さの1つ前
            // 使用する線端は点配列のどの位置にあるか
            anchorTypes.push([isFirstAnchor(i), isFirstAnchor(j)]);
        }
    }
    // あまり好ましくないコード……
    // 最小値を持つdiffのindexを出す
    let minDiff = diffs[0];
    let minDiffIndex = 0;
    for (let i = 0; i < diffs.length; i++) {
        const diff = diffs[i];
        if (diff < minDiff) {
            minDiff = diff;
            minDiffIndex = i;
        }
    }
    // 交点、組み合わせる線端、その際使用する線端は点配列のどの位置にあるかの最終決定
    const cp = cps[minDiffIndex];
    const endPair = lineEndPairs[minDiffIndex];
    const anchorType = anchorTypes[minDiffIndex];

    // ! : ここで切り出し処理を行うが、順序・交点と線端の関係に注意
    // ! : 線上にある場合は、終端を交点とみなす

    // 交点と、交点の際の線端組み合わせから、交点が線上にあるか判定
    const pair1OnLine = isCrossPointOnLine(cp, endPair[0]);
    const pair2OnLine = isCrossPointOnLine(cp, endPair[1]);

    // 線端上にある:始点または終点を交点に置換し結合
    //     (共通で交点を追加するので、置換すべき点を削除すれば良い)
    // 線誕上にない:交点を追加し結合
    // (交点が始点または終点のどちらにくるかも参考に)
    const p1replaceAnchorIndex = anchorType[0] ? 0 : pi1length - 1;
    const p2replaceAnchorIndex = anchorType[1] ? 0 : pi2length - 1;

    // path1
    let cpFixedPath1Points: [number, number][] = [];
    for (let i = 0; i < path1.pathPoints.length; i++) {
        const point = path1.pathPoints[i];

        // 交点に代替するかどうか
        const replace2cp = i === p1replaceAnchorIndex && pair1OnLine;
        if (!replace2cp) {
            // 代替するごく一部をのぞき追加
            cpFixedPath1Points.push([point.anchor[0], point.anchor[1]]);
        }
    }
    // path2
    let cpFixedPath2Points: [number, number][] = [];
    for (let i = 0; i < path2.pathPoints.length; i++) {
        const point = path2.pathPoints[i];

        // 交点に代替するかどうか
        const replace2cp = i === p2replaceAnchorIndex && pair2OnLine;
        if (!replace2cp) {
            // 代替するごく一部をのぞき追加
            cpFixedPath2Points.push([point.anchor[0], point.anchor[1]]);
        }
    }

    // 向きを修正しpath1+交点+path2の配列を作成する
    // false,trueの状態にしたい(path1の終端,交点,path2の始端)
    const vectorFixedPath1Points =
        anchorType[0] === false
            ? cpFixedPath1Points
            : cpFixedPath1Points.reverse();
    const vectorFixedPath2Points =
        anchorType[1] === true
            ? cpFixedPath2Points
            : cpFixedPath2Points.reverse();

    // 最後に点を格納する
    let points: [number, number][] = [];
    for (let i = 0; i < vectorFixedPath1Points.length; i++) {
        points.push(vectorFixedPath1Points[i]);
    }
    points.push(cp);
    for (let i = 0; i < vectorFixedPath2Points.length; i++) {
        points.push(vectorFixedPath2Points[i]);
    }

    // その交点における[path1のアンカー番号,path2のアンカー番号]
    // const cpAnchorIndexs = anchorIndexs[minDiffIndex];
    //---------------------------------------------
    // path1,path2を繋げたpathPointを作りたい
    // ……と思ったけど、スクリプトで繋げるのは手間だし貧弱
    // あえてユーザーに任せるのも手？
    // 交点を返す
    return {
        cp: cp,
        points,
    };
}

//---------------------------------------------
// ログについての処理
//---------------------------------------------
/**
 * @method addLog ログ追加メソッド
 * @param {string} info
 * @param {string} value
 * @param {string} logText
 * @returns {string} 出力テキスト
 */
function addLog(info: string, value: string, logText: string): string {
    // TODO : もう少しログを簡易的に記載させたい
    return logText.concat("\n", info, "\n", value);
}

//---------------------------------------------
// スタート時の処理
//---------------------------------------------
/**
 * @method generate スタート時に実行されるエントリーポイント
 */
function generate() {
    /**
     * @var {string} log 出力用簡易文字列
     */
    let log = "";

    // @ts-ignore
    // type-for-adobeでは対応していないプロパティの模様
    const selections: any[] | null = app.activeDocument.selection;

    // nullの場合は戻す
    // 気持ち悪いけどこれが楽
    if (selections === null) {
        return addLog("----------ERROR----------", "選択が無い", log);
    }

    try {
        // 型変換周りでエラーを吐く(それはそう)が、今回は無視
        // filterはうまく変換されないので使えない……なんで？
        let paths: PathItem[] = [];
        for (const obj of selections) {
            if (obj.typename == "PathItem") {
                // pathItemとみなして追加する
                paths.push(obj as PathItem);
            }
        }

        // pathItemが2個ではないなら戻す
        // 将来的には仕様を変更するかもしれない
        if (paths.length !== 2) {
            return addLog(
                "----------ERROR----------",
                "パスが2個ではない",
                log
            );
        }

        // pathPointで1点か点なしはさすがにNG
        if (paths[0].pathPoints.length < 2 && paths[1].pathPoints.length < 2) {
            return addLog("----------ERROR----------", "1点か点なし", log);
        }
        const crossPointResult: {
            cp: [number, number];
            points: [number, number][];
        } = decideCrossPoint([paths[0], paths[1]]);

        //@ts-ignore
        // type-for-adobe非対応
        const newPath: PathItem = paths[1].duplicate();
        newPath.stroked = true;

        // let setPoints: [number, number][] = [];
        // const path1Points = paths[1].pathPoints;
        // for (let i = 0; i < path1Points.length; i++) {
        //     const point = path1Points[i];
        //     setPoints.push([point.anchor[0], point.anchor[1]]);
        // }
        // setPoints.push(crossPointResult.cp);

        // 交点1つのみの線を生成する

        newPath.setEntirePath(crossPointResult.points);

        log = addLog("★crosspoint", crossPoint.toString(), log);
    } catch (error) {
        log = addLog("----------ERROR----------", error, log);
    }
    return addLog(
        "----------正常終了----------",
        new Date().toLocaleTimeString(),
        log
    );
}

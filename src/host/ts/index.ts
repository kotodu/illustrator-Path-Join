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
    y4: number): [number, number] {
    const vy1 = y2 - y1;
    const vx1 = x1 - x2;
    const c_1 = -1 * vy1 * x1 - vx1 * y1;
    const vy2 = y4 - y3;
    const vx2 = x3 - x4;
    const c_2 = -1 * vy2 * x3 - vx2 * y3;

    const c_3 = vx1 * vy2 - vx2 * vy1;
    if (c_3 === 0) { //平行によりうまく求められないとき。
        return [
            (x2 + x3) * 0.5,
            (y2 + y3) * 0.5
        ];
    } else {
        return [
            (c_1 * vx2 - c_2 * vx1) / c_3,
            (vy1 * c_2 - vy2 * c_1) / c_3
        ];
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
//---------------------------------------------
/**
 * パス2つを元に、交点を決定する
 * @param path 
 */
function decideCrossPoint(path: [PathItem, PathItem]): [number, number] {
    // パスそれぞれの始点・終点、始点の次・終点の1つ前を収集する
    const path1: PathItem = path[0];
    const pi1length: number = path1.pathPoints.length;
    const path2: PathItem = path[1];
    const pi2length: number = path2.pathPoints.length;
    const p1: PathPoint = path1.pathPoints[0];
    const p2: PathPoint = path1.pathPoints[pi1length - 1];
    const p3: PathPoint = path2.pathPoints[0];
    const p4: PathPoint = path2.pathPoints[pi2length - 1];
    const pathPoints: [
        PathPoint,
        PathPoint,
        PathPoint,
        PathPoint
    ] = [p1, p2, p3, p4];
    const p1next: PathPoint = path1.pathPoints[1];
    const p2next: PathPoint = path1.pathPoints[pi1length - 2];
    const p3next: PathPoint = path2.pathPoints[1];
    const p4next: PathPoint = path2.pathPoints[pi2length - 2];
    const pathPointsNext: [
        PathPoint,
        PathPoint,
        PathPoint,
        PathPoint
    ] = [p1next, p2next, p3next, p4next];
    //---------------------------------------------
    // 最も距離差の少ない端2点の組み合わせを選択
    // 交点をひとまずひたすら繋いでいく
    // 交点だけでなく、path2つのどちらか・anchorとの対応情報、距離差も算出する

    // 交点
    let cps: [number, number][] = [];

    // 引数のpathのどちらか＋anchor番号
    let anchorIndexs: [number, number][] = [];

    // cpsの組み合わせの場合の、2点間距離差
    // 最も小さいものを採用する
    let diffs: number[] = [];
    for (let i = 0; i < 2; i++) {
        for (let j = 2; j < 4; j++) {
            cps.push(crossPoint(
                pathPoints[i].anchor[0],
                pathPoints[i].anchor[1],
                pathPointsNext[i].anchor[0],
                pathPointsNext[i].anchor[1],
                pathPoints[j].anchor[0],
                pathPoints[j].anchor[1],
                pathPointsNext[j].anchor[0],
                pathPointsNext[j].anchor[1]
            ));
            diffs.push(diffPoints(
                pathPoints[i].anchor[0],
                pathPoints[i].anchor[1],
                pathPoints[j].anchor[0],
                pathPoints[j].anchor[1]
            ));
            const isFirstAnchor = (num: number) => {
                return num % 2 === 0;
            }
            // 最初のアンカーなら0、そうでなければ長さの1つ前
            anchorIndexs.push([
                isFirstAnchor(i) ? 0 : pi1length - 1,
                isFirstAnchor(j) ? 0 : pi2length - 1
            ])

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
    // 交点の最終決定
    const cp = cps[minDiffIndex];
    // その交点における[path1のアンカー番号,path2のアンカー番号]
    // const cpAnchorIndexs = anchorIndexs[minDiffIndex];
    //---------------------------------------------
    // path1,path2を繋げたpathPointを作りたい
    // ……と思ったけど、スクリプトで繋げるのは手間だし貧弱
    // あえてユーザーに任せるのも手？
    // 交点を返す
    return cp;
}



//---------------------------------------------
// スタート時の処理
//---------------------------------------------
/**
 * @method generate スタート時に実行されるエントリーポイント
 */
function generate() {
    // @ts-ignore
    // type-for-adobeでは対応していないプロパティの模様
    const selections: any[] | null = app.activeDocument.selection;

    // nullの場合は戻す
    // 気持ち悪いけどこれが楽
    if (selections === null) {
        // logLines.push("no-selection!")
        return "null"
    }

    let log = "";
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
            return "パスが2個ではない";
        }

        // pathPointで1点か点なしはさすがにNG
        if (
            paths[0].pathPoints.length < 2
            && paths[1].pathPoints.length < 2
        ) {
            return "1点か点なし";
        }
        const crossPoint: [number, number] = decideCrossPoint([
            paths[0],
            paths[1]
        ]);
        //@ts-ignore
        // type-for-adobe非対応
        const newPath: PathItem = paths[1].duplicate();
        newPath.stroked = true;

        let setPoints: [number, number][] = [];
        const path1Points = paths[1].pathPoints;
        for (let i = 0; i < path1Points.length; i++){
            const point = path1Points[i];
            setPoints.push([
                point.anchor[0],
                point.anchor[1]
            ]);
        }
        setPoints.push(crossPoint);

        // 交点1つのみの線を生成する

        newPath.setEntirePath(setPoints);

        log = log
            + "\n"
            + "crosspoint:"
            + crossPoint.toString()
            + "\n"
            + "pathPoints0:"
            + newPath.pathPoints[0].anchor[0].toString()
            + ","
            + newPath.pathPoints[0].anchor[1].toString()
            + "\n"
            + "pathPointsLength:"
            + newPath.pathPoints.length

    } catch (error) {
        log = log
            + "\n"
            + "エラー終了 : "
            + error;
    }
    return log.concat(
        "\n",
        "終了 : ",
        new Date().toLocaleTimeString()
    );
}

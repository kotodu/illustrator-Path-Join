/// <reference types="types-for-adobe/Illustrator/2015.3"/>
/**
 * @file 拡張機能に用いるillustratorスクリプト"illustrator-Path-Join"
 * @author kotodu
 * @description パスオブジェクト2つの交点を補完し、結合する
 * @license MIT
 */
// 端の組み合わせ4点のうち、距離の近い2点で算出

// 線分AB,CDのペアA(x1,y1),B(x2,y2),C(x3,y3),D(x4,y4)
// P1,P2,P3で、P1P2とP2P3を仮オフセットした線分AB,CDからその交点を算出したい
/**
 * @method crossPoint 交点算出
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
 * @method diffPoints 2点間の距離を返す
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} 距離
 */
function diffPoints(x1: number, y1: number, x2: number, y2: number): number {
    const diffX = Math.abs(x2 - x1);
    const diffY = Math.abs(y2 - y1);
    return Math.sqrt(diffX * diffX + diffY * diffY);
}

/**
 * @method isCrossPointOnLine 指定の点が2点間上にあるかどうか返す
 * @param {[number, number]} cp 指定の点(交点)
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
 * @method reverse 配列を反転させる
 * @param {Array} array 何かの配列
 * @returns {Array} 反転した配列
 * @description 既定であるけどExtendScriptは対応してないかも
 */
function reverse(array: Array<any>): Array<any> {
    let newArray = [];
    for (let i = array.length - 1; i >= 0; i--) {
        newArray.push(array[i]);
    }
    return newArray;
}

/**
 * @method getNextPoint 線端の次の点を返す
 * @param {PathPoint[]} pathPoints
 * @param {number} endIndex
 * @returns {PathPoint}
 * @description 始点ならその次、終点ならその前
 */
function getNextPoint(pathPoints: PathPoint[], endIndex: number): PathPoint {
    if (endIndex === 0) {
        return pathPoints[1];
    } else {
        return pathPoints[endIndex - 1];
    }
}

/**
 * @method decideAnchors パス2つを元に、新しいパスの点配列を決定する
 * @param {[PathItem, PathItem]} path パス2つ
 * @returns {[number,number][]} アンカーのピクセル座標[x,y]の配列
 */
function decideAnchors(path: [PathItem, PathItem]): [number, number][] {
    // 4パターンの結合方法[path1結合位置、path2結合位置]
    const joinIndexOptions = [
        [0, 0],
        [0, path[1].pathPoints.length - 1],
        [path[0].pathPoints.length - 1, 0],
        [path[0].pathPoints.length - 1, path[1].pathPoints.length - 1],
    ];

    // 結合方法ごとに、交点、線端間距離、線端上に交点がくるか、その際のアンカー配列を作成
    // 最も線端間距離の短い場合のアンカー配列を採用する

    let cps: [number, number][] = [];
    let diffs: number[] = [];
    let anchors: [number, number][][] = [];

    for (let i = 0; i < joinIndexOptions.length; i++) {
        anchors.push([]);
        const joinIndexPath1 = joinIndexOptions[i][0];
        const joinPointPath1 = path[0].pathPoints[joinIndexPath1];
        const joinIndexPath2 = joinIndexOptions[i][1];
        const joinPointPath2 = path[1].pathPoints[joinIndexPath2];
        // 線端間距離の算出
        const diff = diffPoints(
            joinPointPath1.anchor[0],
            joinPointPath1.anchor[1],
            joinPointPath2.anchor[0],
            joinPointPath2.anchor[1]
        );
        diffs.push(diff);

        // 交点の算出
        const endNextPath1 = getNextPoint(path[0].pathPoints, joinIndexPath1);
        const endNextPath2 = getNextPoint(path[1].pathPoints, joinIndexPath2);
        const cp = crossPoint(
            joinPointPath1.anchor[0],
            joinPointPath1.anchor[1],
            endNextPath1.anchor[0],
            endNextPath1.anchor[1],
            joinPointPath2.anchor[0],
            joinPointPath2.anchor[1],
            endNextPath2.anchor[0],
            endNextPath2.anchor[1]
        );
        cps.push(cp);

        // 線端上にあるか
        const cpOnPath1 = isCrossPointOnLine(cp, [
            joinPointPath1,
            endNextPath1,
        ]);
        const cpOnPath2 = isCrossPointOnLine(cp, [
            joinPointPath2,
            endNextPath2,
        ]);

        // 線端上にある場合、線端を削除する
        // path1→path2となるよう必要ならアンカー配列を反転
        let slicedPath1Points: PathPoint[] = [];
        for (let j = 0; j < path[0].pathPoints.length; j++) {
            const pathPoint = path[0].pathPoints[j];
            if (!cpOnPath1 || joinIndexPath1 !== j) {
                slicedPath1Points.push(pathPoint);
            }
        }
        let slicedPath2Points: PathPoint[] = [];
        for (let j = 0; j < path[1].pathPoints.length; j++) {
            const pathPoint = path[1].pathPoints[j];
            if (!cpOnPath2 || joinIndexPath2 !== j) {
                slicedPath2Points.push(pathPoint);
            }
        }
        let reversedPath1Points: PathPoint[] = [];
        if (joinIndexPath1 !== 0) {
            reversedPath1Points = slicedPath1Points;
        } else {
            reversedPath1Points = reverse(slicedPath1Points);
        }
        let reversedPath2Points: PathPoint[] = [];
        if (joinIndexPath2 === 0) {
            reversedPath2Points = slicedPath2Points;
        } else {
            reversedPath2Points = reverse(slicedPath2Points);
        }

        // 格納
        for (let j = 0; j < reversedPath1Points.length; j++) {
            const point = reversedPath1Points[j];
            anchors[i].push([point.anchor[0], point.anchor[1]]);
        }
        anchors[i].push(cp);
        for (let j = 0; j < reversedPath2Points.length; j++) {
            const point = reversedPath2Points[j];
            anchors[i].push([point.anchor[0], point.anchor[1]]);
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

    // const cp = cps[minDiffIndex];
    const points = anchors[minDiffIndex];
    return points;
}

//---------------------------------------------
// ログについての処理
// ただのconsoleはデバッグで済ませること
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
    var text = logText.concat("\n", info, "\n", value);
    return text;
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

    // ! : type-for-adobeでは対応していない
    // @ts-ignore
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
            const info = `[${new Date().toLocaleTimeString()}] - ERROR`;
            return addLog(info, "パスは2つ選択してください", log);
        }

        // pathPointで1点か点なしはさすがにNG
        if (paths[0].pathPoints.length < 2 && paths[1].pathPoints.length < 2) {
            const info = `[${new Date().toLocaleTimeString()}] - ERROR`;
            return addLog(info, "パスが想定外です", log);
        }

        const pathPointAnchors = decideAnchors([paths[0], paths[1]]);

        // ! : type-for-adobe非対応
        // @ts-ignore
        const newPath: PathItem = paths[1].duplicate();
        newPath.stroked = true;

        // 交点1つのみの線を生成する

        newPath.setEntirePath(pathPointAnchors);
    } catch (error) {
        const info = `[${new Date().toLocaleTimeString()}] - ERROR`;
        return addLog(info, error, log);
    }
    const info = `[${new Date().toLocaleTimeString()}] - SUCCESS`;
    return addLog(info, "パスは作成されました", log);
}
// デバッグ用
/**
 * @summary ExtendScript toolkit使用時は、コメントアウトする(またはjsx単体配布時)
 */
// generate();


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

export {
    crossPoint
}
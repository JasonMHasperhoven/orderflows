import Konva from "konva";
import { scaleLinear } from "d3-scale";
import { dispatch as d3Dispatch } from "d3-dispatch";
const { Stage, Layer, Rect, Text, Circle, Tween, Easings, Path } = Konva;

function OrderFlowDiagram(id, { width = 600, height = 300 } = {}) {
  // config
  const blue = "#61dafb";
  const green = "#24C1B0";
  const red = "#FF5F7F";
  const animationTicks = 1000;
  const textsPadding = 20;
  const xStart = textsPadding;
  const xEnd = width - textsPadding;
  const xCurvePercentageStart = 20;
  const xCurvePercentageEnd = 80;
  // const blockHeightPercentage = 33; // 33% of the height

  const buySellRatio = 0.7;

  // instance vars
  let layer;
  // scales so that we can render in percentages from 0 to 100
  const xScale = scaleLinear().domain([0, 100]).range([xStart, xEnd]);
  const yScale = scaleLinear().domain([0, 100]).range([0, height]);
  const sizeScale = scaleLinear().domain([1, 2500]).range([1, 50]);

  const orders = [];
  let isRunning = true;
  const dispatch = d3Dispatch("init");

  function updateOrderState() {
    orders.forEach((order) => {
      if (order.animationState === "entering") {
        order.progress = 1 / animationTicks;
        order.animationState = "animating";

        order.node = new Rect({
          x: xScale(0),
          y: yScale(33),
          width: sizeScale(order.volume),
          height: 8,
          fill: blue,
        });

        order.tween = new Tween({
          node: order.node,
          x: xScale(100),
          y: order.side === "buy" ? yScale(33) : yScale(67),
          fill: order.side === "buy" ? green : red,
          easing: Easings.EaseIn,
        });

        layer.add(order.node);
      }
      if (order.animationState === "animating") {
        order.progress += 1 / animationTicks;
        if (order.progress >= 1) {
          order.progress = 1;
          order.animationState = "completing";
        }
      }
      if (order.animationState === "completing") {
        order.animationState = "completed";
      }
    });
  }

  function init() {
    const stage = new Stage({
      container: id,
      width,
      height,
    });

    layer = new Layer();

    const ordersBlockText = new Text({
      x: 0,
      y: 0,
      text: "Orders",
      fontSize: 14,
      fill: "#fff",
    });

    ordersBlockText.rotate(-90);
    ordersBlockText.setPosition({
      y: yScale(50) + ordersBlockText.getTextWidth() / 2,
    });

    const ordersBlock = new Rect({
      x: xScale(0),
      y: yScale(33),
      width: xScale(1),
      height: yScale(33),
      fill: blue,
    });

    const buyOrdersBlockText = new Text({
      x: 0,
      y: 0,
      text: "Buys",
      fontSize: 14,
      fill: "#fff",
    });

    buyOrdersBlockText.rotate(90);
    buyOrdersBlockText.setPosition({
      x: width,
      y: yScale(33) / 2 - buyOrdersBlockText.getTextWidth() / 2,
    });

    const buyOrdersBlock = new Rect({
      x: xScale(95),
      y: 0,
      width: xScale(1),
      height: yScale(33),
      fill: green,
    });

    const sellOrdersBlockText = new Text({
      x: 0,
      y: 0,
      text: "Sells",
      fontSize: 14,
      fill: "#fff",
    });

    sellOrdersBlockText.rotate(90);
    sellOrdersBlockText.setPosition({
      x: width,
      y: yScale(67) + yScale(33) / 2 - sellOrdersBlockText.getTextWidth() / 2,
    });

    const sellOrdersBlock = new Rect({
      x: xScale(95),
      y: yScale(67),
      width: xScale(1),
      height: yScale(33),
      fill: red,
    });

    function createFlowPath(side = "buy", buySellRatio = 0.5) {
      const startBlock = ordersBlock;
      const endBlock = side === "buy" ? buyOrdersBlock : sellOrdersBlock;

      const startBlockY =
        side === "buy"
          ? startBlock.y()
          : startBlock.y() + startBlock.height() * buySellRatio;

      function curvePath(x1, y1, x2, y2, curvature = 0.5) {
        const dx = x2 - x1;
        const controlX1 = x1 + dx * curvature;
        const controlX2 = x2 - dx * curvature;
        return `C${controlX1},${y1} ${controlX2},${y2} ${x2},${y2}`;
      }

      return new Path({
        data: [
          `M${startBlock.x() + startBlock.width()},${startBlockY}`,
          `L${xScale(xCurvePercentageStart)},${startBlockY}`,
          curvePath(
            xScale(xCurvePercentageStart),
            startBlockY,
            xScale(xCurvePercentageEnd),
            endBlock.y()
          ),
          `L${endBlock.x()},${endBlock.y()}`,
          `L${endBlock.x()},${endBlock.y() + endBlock.height()}`,
          `L${xScale(xCurvePercentageEnd)},${endBlock.y() + endBlock.height()}`,
          curvePath(
            xScale(xCurvePercentageEnd),
            endBlock.y() + endBlock.height(),
            xScale(xCurvePercentageStart),
            startBlockY +
              startBlock.height() *
                (side === "buy" ? buySellRatio : 1 - buySellRatio)
          ),
          `L${startBlock.x() + startBlock.width()},${
            startBlockY +
            startBlock.height() *
              (side === "buy" ? buySellRatio : 1 - buySellRatio)
          }`,
        ].join(" "),
        fill: "#fff",
        opacity: 0.2,
      });
    }

    const buyFlow = createFlowPath("buy", buySellRatio);
    layer.add(buyFlow);
    const sellFlow = createFlowPath("sell", buySellRatio);
    layer.add(sellFlow);

    layer.add(ordersBlockText);
    layer.add(ordersBlock);
    layer.add(buyOrdersBlockText);
    layer.add(buyOrdersBlock);
    layer.add(sellOrdersBlockText);
    layer.add(sellOrdersBlock);
    stage.add(layer);

    dispatch.call("init");
  }

  function render() {
    orders.forEach((order) => {
      if (order.animationState === "animating") {
        order.tween.seek(order.progress);
        layer.draw();
      }
      if (order.animationState === "completing") {
        order.tween.destroy();
        layer.remove(order.node);
      }
      layer.draw();
    });
  }

  function animate() {
    updateOrderState();
    render();
    console.log(orders);

    requestAnimationFrame(() => {
      if (isRunning) {
        animate();
      }
    });
  }

  return {
    init,
    dispatch,
    /**
     * add order to the diagram
     * @param {{
     *   id: String,
     *   side: "buy" | "sell",
     *   volume: number,
     *   timestamp: number,
     *   animationState: "entering" | "animating" | "completed",
     *   progress: number,
     * }} order
     */
    addOrder: (order) => {
      console.log("TCL: OrderFlowDiagram -> order", order);
      orders.push({ ...order });
    },
    run: () => {
      isRunning = true;
      animate();
    },
    pause: () => {
      isRunning = false;
    },
  };
}

export { OrderFlowDiagram };

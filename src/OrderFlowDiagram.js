import Konva from "konva";
import { scaleLinear } from "d3-scale";
import { dispatch as d3Dispatch } from "d3-dispatch";
const { Stage, Layer, Rect, Text, Circle } = Konva;

function OrderFlowDiagram(id, { width = 600, height = 300 } = {}) {
  // config
  const blue = "#61dafb";
  const green = "#24C1B0";
  const red = "#FF5F7F";
  const animationTicks = 300;

  // instance vars
  let layer;
  // scales so that we can render in percentages from 0 to 100
  let xScale = scaleLinear().domain([0, 100]).range([0, width]);
  let yScale = scaleLinear().domain([0, 100]).range([0, height]);

  let orders = [];
  let isRunning = true;
  const dispatch = d3Dispatch("init");

  function updateOrderState() {
    orders.forEach((order) => {
      if (order.animationState === "entering") {
        order.progress = 1 / animationTicks;
        order.animationState = "animating";

        order.element = new Circle({
          x: xScale(0),
          y: yScale(33),
          width: xScale(2),
          height: yScale(2),
          fill: blue,
        });

        layer.add(order.element);
      }
      if (order.animationState === "animating") {
        order.progress += 1 / animationTicks;
        if (order.progress >= 1) {
          order.progress = 1;
          order.animationState = "completed";
        }
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

    const ordersStart = new Rect({
      x: 0,
      y: yScale(33),
      width: xScale(5),
      height: yScale(33),
      fill: blue,
      cornerRadius: 4,
    });

    const buyOrdersEnd = new Rect({
      x: xScale(95),
      y: 0,
      width: xScale(5),
      height: yScale(33),
      fill: green,
      cornerRadius: 4,
    });

    const sellOrdersEnd = new Rect({
      x: xScale(95),
      y: yScale(67),
      width: xScale(5),
      height: yScale(33),
      fill: red,
      cornerRadius: 4,
    });

    layer.add(ordersStart);
    layer.add(buyOrdersEnd);
    layer.add(sellOrdersEnd);
    stage.add(layer);

    dispatch.call("init");
  }

  function render() {
    orders.forEach((order) => {
      if (order.animationState === "animating") {
        // Or update both at once
        order.element.position({
          x: xScale(order.progress * 100),
          y: yScale(33),
        });

        // Re-draw the layer to see changes
        layer.draw();
      }
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

import { useEffect, useRef, useId, useState, useCallback } from "react";
import { useOrderStream } from "./useOrderStream";
import { Button } from "./Button";
import "./Canvas.css";
import { OrderFlowDiagram } from "./OrderFlowDiagram";

export const Canvas = () => {
  const id = useId();
  const orderFlowDiagram = useRef(new OrderFlowDiagram(id));
  // const [isStreamingEnabled, setIsStreamingEnabled] = useState(true);

  const { stream, isStreaming, pauseStream, resumeStream } = useOrderStream({
    onOrderReceived: (order) => {
      orderFlowDiagram.current.addOrder(order);
    },
    // enabled: isStreamingEnabled,
  });
  console.log("TCL: Canvas -> isStreaming", isStreaming);

  useEffect(() => {
    orderFlowDiagram.current.init();
    orderFlowDiagram.current.dispatch.on("init", () => {
      if (isStreaming) {
        orderFlowDiagram.current.run();
      } else {
        orderFlowDiagram.current.pause();
      }
    });
  }, [id]);

  // useEffect(() => {
  //   orderFlowDiagram.current.dispatch.on("init", () => {
  //     if (isStreaming) {
  //       orderFlowDiagram.current.run();
  //     } else {
  //       orderFlowDiagram.current.pause();
  //     }
  //   });
  // }, [isStreaming]);

  return (
    <div>
      <div className="Canvas-container">
        <Button onClick={() => (isStreaming ? pauseStream() : resumeStream())}>
          {isStreaming ? "Pause Streaming" : "Start Streaming"}
        </Button>
      </div>
      <div id={id} />
    </div>
  );
};

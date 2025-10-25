import "./Slider.css";
import { useEffect, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import useSize from "./useSize";

export const Slider = ({ value, onInput }) => {
  const ref = useRef();
  const scaleRef = useRef();
  const deltaRef = useRef();
  const [scaleLoaded, setScaleLoaded] = useState();
  const [width] = useSize(ref);
  const scale = scaleRef.current;

  const handleMouseMove = (event) => {
    /* eslint-disable no-param-reassign */
    if (deltaRef.current) {
      const isTouch = event.type === "touchmove";
      deltaRef.current.deltaX =
        (isTouch ? event.touches[0].clientX : event.clientX) -
        deltaRef.current.initX;
      const dx = deltaRef.current.deltaX;

      const nextX = Math.min(Math.max(0, scale(value) + dx), scale(100));
      const nextValue = scale.invert(nextX);
      onInput(nextValue);

      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      } else if (document.selection) {
        document.selection.empty();
      }
    }
  };

  const handlePointerDown = (event) => {
    const isTouch = event.type === "touchstart";
    deltaRef.current = {};
    deltaRef.current.initX = isTouch ? event.touches[0].clientX : event.clientX;

    document.body.addEventListener(
      isTouch ? "touchmove" : "mousemove",
      handleMouseMove
    );

    document.body.addEventListener(
      isTouch ? "touchend" : "pointerup",
      () => {
        document.body.removeEventListener(
          isTouch ? "touchmove" : "mousemove",
          handleMouseMove
        );
        deltaRef.current = null;
      },
      { once: true }
    );
  };

  useEffect(() => {
    if (width) {
      scaleRef.current = scaleLinear().domain([0, 100]).range([0, width]);
      setScaleLoaded(true);
    }
  }, [width]);

  return (
    <div className="Slider">
      <div ref={ref} className="Slider-track">
        {scaleLoaded && (
          <div
            className="Slider-track-fill"
            style={{
              right: Math.min(width, width - scale(value)),
            }}
          >
            <button
              className="Slider-track-thumb"
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            />
          </div>
        )}
      </div>
    </div>
  );
};

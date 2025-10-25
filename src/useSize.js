/* eslint-disable consistent-return */
import { useEffect, useState } from "react";

// can be controlled using dep array or else use resize observer
export default function useSize(
  ref,
  dependencyArray = [],
  fallback = typeof window !== "undefined" && document.body
) {
  const [size, setSize] = useState({});

  useEffect(() => {
    let observer;

    const el = ref?.current || fallback;

    if (el) {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });

      if (!dependencyArray.length) {
        observer = new ResizeObserver((entries) => {
          // Wrap it in requestAnimationFrame to avoid this error - ResizeObserver loop limit exceeded
          requestAnimationFrame(() => {
            setSize({
              width: entries[0].target.clientWidth,
              height: entries[0].target.clientHeight,
            });
          });
        });

        observer.observe(el);
      }
    }

    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.current, ...dependencyArray]);

  return [size.width, size.height];
}

![Order Flow Diagram](https://github.com/JasonMHasperhoven/orderflows/blob/main/public/orderflow.png)

# Assessment Notes

This was a very unique challenge that I enjoyed a lot (not the typical react + state management). I have experience with konva and d3-scale so I have both here.

### A couple of bulletpoints:

- OrderFlowDiagram uses SOLID principle (js-style)
- OrderFlowDiagram does mutations, which we generally try to avoid in js, but I think it's appropriate here to make the code more simple (python-like).
- Similarly, all the animation logic is done in one loop (orders.forEach) for performance reasons (it hurts readability somewhat).
- I use d3-scale quite a lot here (for the x- and y-axis, but also for the history filter and the slider), because it handles interpolation (from % to px, and % to timestamp) very well.
- The orders animate from the starting (orders) block to their respective side's ending block.
- For that, I built on-top of the existing props (progress and animationState provided by useOrderStream)
- The block and flow sizes update in real-time depending on the total accumulated volume
- The slider is custom built, also to demonstrate some lesser known options like { once: true } in document.body.addEventListener().
- Slider instance vars are contained by the use of useRefs()
- useSize was a copy-paste from another project

## What could be improved?

- The project uses plain css. An improvement would be to use vars for theme/color and spacing for consistency.
- The orders.forEach() loop could be replaced with a while loop (lodash also uses this and is the most performant afaik).
- There's no typesafety at the moment. Enhancing it with typescript would be welcome.
- Animating the block size & flows. Blocks can be done easily with konva: new Tween(), however the flows require additional code.
- Constants for the order sides ("buy", "sell"), as right now they're string.
- The canvas is a static size and could be made responsive.

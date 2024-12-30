import { grida } from "@/grida";
import { cmath } from "@/grida-canvas/cmath";

const svg_1 = `<svg width="311" height="311" viewBox="0 0 311 311" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_198_311" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="311" height="311">
<path d="M176.709 155.5C191.051 118.901 206.645 68.9716 206.645 51.6611C206.645 23.1305 183.515 0 154.983 0C126.452 0 103.322 23.1305 103.322 51.6611C103.322 68.9716 118.915 118.901 133.257 155.5C118.915 192.099 103.322 242.028 103.322 259.339C103.322 287.87 126.452 311 154.983 311C183.515 311 206.645 287.87 206.645 259.339C206.645 242.028 191.051 192.099 176.709 155.5Z" fill="white"/>
<path d="M155.5 134.291C118.902 119.949 68.9714 104.355 51.6611 104.355C23.1295 104.355 0 127.485 0 156.017C0 184.548 23.1295 207.678 51.6611 207.678C68.9714 207.678 118.902 192.085 155.5 177.743C192.098 192.085 242.029 207.678 259.339 207.678C287.871 207.678 311 184.548 311 156.017C311 127.485 287.871 104.355 259.339 104.355C242.029 104.355 192.098 119.949 155.5 134.291Z" fill="white"/>
</mask>
<g mask="url(#mask0_198_311)">
<rect x="-155.5" y="-155.5" width="466.5" height="466.5" fill="#92E16A"/>
</g>
</svg>
`;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  root_id: "playground",
  nodes: {
    playground: {
      id: "playground",
      name: "playground",
      type: "container",
      active: true,
      locked: true,
      expanded: true,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      position: "relative",
      width: 960,
      height: 540,
      fill: { type: "solid", color: { r: 255, g: 255, b: 255, a: 1 } },
      padding: 0,
      cornerRadius: 0,
      style: {
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      },
      children: [
        //
        "h1",
        "p",
        "sticker_1",
        "sticker_2",
        "rect_1",
        "shapes_container",
        // "ellipse_1",
        "background",
      ],
      layout: "flow",
      direction: "horizontal",
      mainAxisAlignment: "start",
      crossAxisAlignment: "start",
      mainAxisGap: 0,
      crossAxisGap: 0,
    },
    background: {
      id: "background",
      name: "background",
      type: "image",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: -1,
      rotation: 0,
      position: "absolute",
      top: 0,
      left: 0,
      width: 960,
      height: 540,
      fit: "cover",
      cornerRadius: 0,
      style: {},
    },
    sticker_1: {
      id: "sticker_1",
      name: "sticker",
      type: "vector",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      // path: svg_1,
      position: "absolute",
      top: 300,
      left: -100,
      width: 320,
      height: 320,
      paths: [],
    },
    sticker_2: {
      id: "sticker_2",
      name: "sticker",
      type: "vector",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      position: "absolute",
      top: -100,
      // left: 100,
      right: 10,
      width: 639,
      height: 345,
      fill: {
        type: "solid",
        color: { r: 153, g: 206, b: 255, a: 1 },
      },
      paths: [
        {
          d: "M632.87 42.1812C627.912 2.97944 612.126 -38.0455 573.64 -60.9674C552.636 -73.4703 536.328 -76.3355 514.15 -74.7727C464.184 -71.647 437.961 -43.2551 419.957 -7.30923C415.261 1.9377 413.434 -0.537207 411.347 -7.70032C402.606 -39.0878 385.907 -69.3027 347.812 -77.2472C291.453 -88.8385 255.446 -63.1817 229.484 -12.3887C225.962 -5.48609 224.918 -2.88163 221.787 -11.0867C199.348 -71.6476 119.766 -70.2147 78.9319 -42.6042C15.3974 0.24431 -0.257731 95.7092 0.0031907 170.727C0.264113 238.19 22.3121 341.599 109.721 338.083C147.685 336.52 185.127 309.822 200.652 272.053C203.653 264.889 204.958 257.986 207.306 268.275C233.137 384.187 378.601 355.274 406.52 270.75C410.564 258.637 412.912 261.242 415.782 270.75C430.655 318.808 484.666 349.544 533.589 337.823C636.522 313.338 649.568 173.722 633 42.1812H632.87Z",
          fillRule: "evenodd",
          fill: "fill",
        },
      ],
    },
    shapes_container: {
      id: "shapes_container",
      name: "shapes_container",
      type: "container",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      position: "absolute",
      top: 0,
      left: 0,
      width: 200,
      height: 200,
      expanded: false,
      fill: { type: "solid", color: { r: 255, g: 255, b: 255, a: 1 } },
      style: {},
      cornerRadius: 0,
      padding: 0,
      children: ["child_rect_1", "child_rect_2"],
      layout: "flow",
      direction: "horizontal",
      mainAxisAlignment: "start",
      crossAxisAlignment: "start",
      mainAxisGap: 0,
      crossAxisGap: 0,
    },
    child_rect_1: {
      id: "child_rect_1",
      name: "child_rect_1",
      type: "rectangle",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      width: 100,
      height: 100,
      position: "absolute",
      top: 0,
      left: 0,
      cornerRadius: 0,
      fill: {
        id: "gradient_1",
        type: "radial_gradient",
        stops: [
          {
            offset: 0,
            color: { r: 255, g: 0, b: 0, a: 1 },
          },
          {
            offset: 1,
            color: { r: 0, g: 0, b: 255, a: 1 },
          },
        ],
        transform: cmath.transform.identity,
      },
      strokeWidth: 0,
      strokeCap: "butt",
      effects: [],
    },
    child_rect_2: {
      id: "child_rect_2",
      name: "child_rect_2",
      type: "rectangle",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      width: 100,
      height: 100,
      position: "absolute",
      top: 100,
      left: 100,
      cornerRadius: 0,
      fill: {
        id: "gradient_1",
        type: "radial_gradient",
        stops: [
          {
            offset: 0,
            color: { r: 255, g: 0, b: 0, a: 1 },
          },
          {
            offset: 1,
            color: { r: 0, g: 255, b: 0, a: 1 },
          },
        ],
        transform: cmath.transform.identity,
      },
      strokeWidth: 0,
      strokeCap: "butt",
      effects: [],
    },
    rect_1: {
      id: "rect_1",
      name: "rect_1",
      type: "rectangle",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      width: 200,
      height: 200,
      position: "absolute",
      top: 50,
      left: 50,
      cornerRadius: 0,
      // fill: { type: "solid", color: { r: 50, g: 50, b: 50, a: 1 } },
      fill: {
        id: "gradient_1",
        type: "radial_gradient",
        stops: [
          {
            offset: 0,
            color: { r: 255, g: 0, b: 0, a: 1 },
          },
          {
            offset: 1,
            color: { r: 0, g: 0, b: 255, a: 1 },
          },
        ],
        transform: cmath.transform.identity,
      },
      strokeWidth: 0,
      strokeCap: "butt",
      effects: [],
    },
    ellipse_1: {
      id: "ellipse_1",
      name: "ellipse_1",
      type: "ellipse",
      active: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      width: 200,
      height: 200,
      position: "absolute",
      top: 100,
      left: 100,
      fill: { type: "solid", color: { r: 0, g: 255, b: 0, a: 1 } },
      strokeWidth: 0,
      strokeCap: "butt",
      effects: [],
    },
    h1: {
      id: "h1",
      name: "h1",
      type: "text",
      active: true,
      locked: false,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      opacity: 1,
      zIndex: 0,
      rotation: 0,
      position: "absolute",
      top: 120,
      left: 300,
      width: 360,
      height: "auto",
      fill: { type: "solid", color: { r: 0, g: 0, b: 0, a: 1 } },
      fontSize: 32,
      fontWeight: 500,
      textAlign: "center",
      textAlignVertical: "center",
      textDecoration: "none",
      style: {},
    },
    p: {
      id: "p",
      name: "p",
      type: "text",
      active: true,
      locked: false,
      text: "Quisque quis nunc convallis erat pharetra tempor in in urna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras eu arcu quis eros fermentum convallis. Etiam luctus, orci quis placerat scelerisque, lacus velit tempus neque, non pharetra mi erat ac leo. Pellentesque dignissim sodales volutpat. Nulla arcu erat, consequat eu imperdiet at, consectetur id quam. Nunc dignissim placerat ipsum quis viverra. Cras facilisis, mauris at vehicula mollis, tellus nunc bibendum dolor, sit amet bibendum nisi sem in lorem. Suspendisse potenti. Duis lobortis pellentesque eros, quis tincidunt magna. Nam dignissim vehicula justo posuere dictum. Aenean sodales fermentum ultrices. Fusce malesuada nisi at mauris pulvinar, nec lacinia turpis luctus.",
      opacity: 0.8,
      zIndex: 0,
      rotation: 0,
      position: "absolute",
      top: 300,
      left: 200,
      width: 560,
      height: "auto",
      fill: { type: "solid", color: { r: 0, g: 0, b: 0, a: 0.8 } },
      fontSize: 13,
      fontWeight: 400,
      textAlign: "center",
      textAlignVertical: "center",
      textDecoration: "none",
      style: {},
    },
  },
} satisfies grida.program.document.IDocumentDefinition;

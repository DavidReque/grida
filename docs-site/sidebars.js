const together = [
  {
    type: "autogenerated",
    dirName: "together",
  },
  {
    type: "link",
    href: "https://github.com/gridaco/grida/issues/new",
    label: "Feature Requests",
  },
  {
    type: "link",
    label: "Chat with us on Slack",
    href: "https://grida.co/join-slack",
  },
];

const api = [
  {
    type: "autogenerated",
    dirName: "references",
  },
  {
    type: "category",
    label: "Design to Code Blueprints",
    items: [
      {
        type: "autogenerated",
        dirName: "@designto-code",
      },
    ],
  },
  {
    type: "category",
    label: "Flags Reference",
    items: [
      {
        type: "autogenerated",
        dirName: "@designto-code/flags",
      },
    ],
  },
  {
    type: "category",
    label: "Conventions",
    items: [
      {
        type: "autogenerated",
        dirName: "conventions",
      },
    ],
  },
];

const flags = [
  {
    type: "autogenerated",
    dirName: "flags",
  },
  // {
  //   type: "autogenerated",
  //   dirName: "@designto-code/flags",
  // },
  {
    type: "category",
    label: "Heading Flags",
    collapsed: false,
    items: [
      {
        type: "doc",
        id: "@designto-code/flags/--as-h1",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--as-h2",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--as-h3",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--as-h4",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--as-h5",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--as-h6",
      },
    ],
  },
  {
    type: "category",
    label: "Sizing Flags",
    collapsed: false,
    items: [
      {
        type: "doc",
        id: "@designto-code/flags/--width",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--height",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--min-width",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--min-height",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--max-width",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--max-height",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--fix-width",
      },
      {
        type: "doc",
        id: "@designto-code/flags/--fix-height",
      },
    ],
  },
  {
    type: "doc",
    id: "@designto-code/flags/--artwork",
  },
  {
    type: "doc",
    id: "@designto-code/flags/--as-wrap",
  },
];

const docs = [
  {
    type: "category",
    label: "Getting Started",
    collapsed: false,
    items: [
      {
        type: "autogenerated",
        dirName: "getting-started",
      },
    ],
  },
  {
    type: "category",
    label: "Concepts",
    collapsed: false,
    items: [
      {
        type: "autogenerated",
        dirName: "concepts",
      },
    ],
  },
  {
    type: "category",
    label: "Assistant",
    items: [
      {
        type: "autogenerated",
        dirName: "assistant",
      },
    ],
  },
];

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: docs,
  flagsSidebar: flags,
  togetherSidebar: together,
  apiSidebar: api,
};

module.exports = sidebars;

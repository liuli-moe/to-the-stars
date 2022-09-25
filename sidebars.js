/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

const path = require('path')

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],

  // But you can create a sidebar manually

  // tutorialSidebar: [
  //   '01/'
  //   // {
  //   //   type: 'category',
  //   //   label: '量子纠缠',
  //   //   items: ['01/001-第一章-许愿.md'],
  //   // },
  // ],
}

module.exports = sidebars

'use strict';

// Block sequence container

BB.BlockSequence = BB.Component.prototype.create({
  constructor: function(name, workspace) {
    BB.Component.prototype.constructor.call(this, 'BlockSequence');
    this.name = name;
    this.workspace = workspace;
    this.children = [];
    this.parent = workspace;
    this.width = 0;
    this.height = 0;
    this.nested = true;
    this.blockDistance = 0.5; // 1px distance between blocks
    this.x = 0;
    this.y = 0;

    this.selectable = true;
    this.selected_ = false;
    this.rendered_ = false;
  },

  render: function() {
    if (!this.workspace) {
      throw 'BlockSequence container must have a workspace to be rendered';
      return;
    }
    if (!this.rendered_) {
      this.container = this.workspace.childContainer.group();
      this.root = this.container;
      this.childContainer = this.container;
      this.container.move(this.x, this.y);
      this.rendered_ = true;
    }
    return this;
  },

  addBlock: function(block) {
    if (block.workspace != this.workspace) {
      throw 'Move a block from a diferent workspace are not implemented'; // TODO: Move a block from a diferent workspace
    }
    if (block.rendered_ == false || this.rendered_ == false) {
      throw 'Headless BlockSequence are not implemented, you must render the BlockSequence and block before using this method'; // TODO: Headless BBlocks
    }
    // if is the first block
    if (this.children.length == 0) {
      this.x = block.x;
      this.y = block.y;
      this.container.move(this.x, this.y);
    }
    block.move(this.width, this.height);
    this.height += block.height + this.blockDistance;
  
    this.children.push(block);
    block.workspace.removeChild(block.index_);
    this.container.add(block.container);
    block.parent = this;
  
    var this_ = this;
    var length_dragstart = block.dragstart.length;
    block.dragstart.push(function() {
      this_.dragstart(this, length_dragstart);
    });
    var length_dragmove = block.dragmove.length;
    block.dragmove.push(function(ddx, ddy) {
      this_.dragmove(this, length_dragmove, ddx, ddy);
    });
    var length_dragend = block.dragend.length;
    block.dragend.push(function() {
      this_.dragend(this, length_dragend);
    });
    return this;
  },

  dragstart: function(block, length, ddx, ddy) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] != block) {
        BB.runCallbacks(this.children[i].dragstart, this.children[i], [], length);
      }
    }
  },
  dragmove: function(block, length, ddx, ddy) {
    this.x += ddx;
    this.y += ddy;
    this.container.dmove(ddx, ddy);
    block.dmove(-ddx, -ddy); // revert duplicated behaviour
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] != block) { // avoids infinite loop
        BB.runCallbacks(this.children[i].dragmove, this.children[i], [], length);
      }
    }
  },
  dragend: function(block, length, ddx, ddy) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] != block) {
        BB.runCallbacks(this.children[i].dragend, this.children[i], [], length);
      }
    }
  },
});

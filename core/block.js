'use strict'

// A Block is an svg group that do any behavior, this can contain Fields or other Blocks

BB.Block = BB.Component.prototype.create({
  constructor: function(name, options, customOptions)  {
    this.parentClass_.constructor.call(this, 'Block');
    this.name = name;
    this.id = null;
    this.x = 0;
    this.y = 0;
    this.width = 20;
    this.height = 20;
    this.container = null; // contains attached elements(border) and SVG document
    this.childContainer = null; // svg group that contains all children
    this.statement = true;
    this.root = null;
    this.rootDark = null; //shadow effect
    this.nested = true; // Blocks are nested by default, allows toTopPropagate
    this.fields = [];
    this.attachDraggable = [];
    this.style = {
      className: 'BBComponentBlock'
    };
    this.selectedClass = 'BBComponentBlockSelected';
    // Capabilities of block
    this.selectable = true;
    this.draggable_ = true;
    
    this.metrics = {
      borderRadius: 2,
      borderWidth: 1,
      initialSpace: {x: 4, y: 0},
      finalSpace: {x: 4, y: 4},
      fieldSpace: 5,
      topRowSpace: 2.5,
      bottomRowSpace: 2.5,
      widthType: 'globalWidth',
    };

    // Options
    if (customOptions) { //options of a custom blocks
      this.customOptions = customOptions;
    }
    if (!options) {
      return;
    }
    // TODO: Implement validation for options
    this.optionList = ['x',
                       'y',
                       'stylingFunction',
                       'colorPalette',
                       'metrics'];
    for (var i = 0,el; el = this.optionList[i]; i++) {
      if (options.hasOwnProperty(el)) {
        this[el] = options[el];
      }
    }
    if (options.hasOwnProperty('selectable')) {
      this.selectable = options.selectable;
    }
    if (options.hasOwnProperty('draggable')) {
      this.draggable_ = options.draggable;
    }
    if (options.render) {
      this.render();
    }
  },

  appendField: function(field) {
      this.fields.push(field);
      return field;
  },

  newRow: function() {
      this.fields.push('newRow');
  },

  widthType: function(type) {
    if (type == 'grouped') {
      this.fields.push('groupedWidth');
    } else if (type == 'global') {
      this.fields.push('globalWidth');
    } else if (type == 'single') {
      this.fields.push('singleWidth');
    } else {
      throw 'Unknown width type';
    }
  },

  render: function() {
    if (!this.workspace) {
      throw 'Blocks must have a workspace to be rendered';
      return;
    }
    if (!this.rendered_) {
      this.init(this.customOptions); // attributes of custom Block
      //needs create container before initSVG, because it render the fields
      this.container = this.workspace.root.group();
      this.container.move(this.x, this.y);
      this.initSvg(); // compute graphics for rendering
      if (!this.colorPalette) {
        this.colorPalette = BB.colorPalettes.block.light; //default palette
      }
      // styling
      this.bgColor = this.colorPalette.background;
      this.shadowColor = this.colorPalette.shadowColor;
      this.lightColor = this.colorPalette.lightColor;
      this.borderColor = this.colorPalette.border;
      if (this.stylingFunction) {
        this.stylingFunction();
      }
      //render block - render fields and all block svg
      this.renderBlock_();
      // render children
      this.childContainer = this.workspace.root.group(); 
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].render();
        this.childContainer.add(this.children[i].container);
      }
      //this.container.add(this.rootDark);
      //this.container.add(this.rootLight);
      this.container.add(this.root);
      this.container.add(this.childContainer);
      // add fields to top of container
      for (var i = 0; i < this.fields.length; i++) {
        if (typeof(this.fields[i]) == 'object') {
          this.fields[i].toTop();
        }
      }
      //this.attachDraggable.push(this.rootDark);
      //this.attachDraggable.push(this.rootLight);
      this.attachDraggable.push(this.root);
      this.updateDraggable();
      this.workspace.childContainer.add(this.container);
      this.workspace.childRendered(this);
      if (this.attach) {
        this.attach(); // attach additional svg elements to block
      }
      this.rendered_ = true;
    }
  },

  attachEvents: function(child) {
    this.attachDraggable.push(child);
    this.container.draggable(this.workspace, null, this.attachDraggable);
  },

  updateDraggable: function(child) {
    // Prevents text selection and default behavior
    var this_ = this;
    var pereventDefaultClosure = function(e) {
      e.preventDefault();
      e.stopPropagation();
    };
    BB.attachToEls(this.attachDraggable, 'down', pereventDefaultClosure);
    if (this.draggable_) {
      this.container.draggable(this, null, this.attachDraggable);
    } else if (this.rendered_) {
      this.container.fixedDrag(); // Remove dragging from container
    }
    var toTopClosure = function() {
      this_.setSelected(true);
    };
    BB.attachToEls(this.attachDraggable, 'down', toTopClosure);
  },

  dragstart: function() {
    this.root.addClass('BBComponentBlockDragging');
  },

  dragend: function() {
    this.root.removeClass('BBComponentBlockDragging');
  },

  setDraggable: function(bool) {
    this.draggable_ = bool;
    if (this.rendered_) {
      this.updateDraggable();
    }
  },

  // calculate metrics
  initSvg: function() {
    var globalWidth = this.metrics.initialSpace.x, box, maxHeight = 0;
    var metrics = {
      width: this.metrics.initialSpace.x,
      y: this.metrics.initialSpace.y
    };
    this.metrics.rows = [];
    this.metrics.numRows = 0;
    for (var i = 0; i < this.fields.length; i++) {
      if (typeof(this.fields[i]) == 'string') { //field control commands
        switch (this.fields[i]) {
            case 'newRow':
              metrics.y += maxHeight + this.metrics.bottomRowSpace + this.metrics.initialSpace.y + this.metrics.topRowSpace;
              metrics.width  += this.metrics.finalSpace.x - this.metrics.fieldSpace;
              this.metrics.rows[this.metrics.numRows] = {
                width: metrics.width,
                y: metrics.y,
                height: maxHeight + this.metrics.topRowSpace,
                widthType: this.metrics.widthType
              };
              this.metrics.numRows++;
              globalWidth = Math.max(metrics.width, globalWidth);
              metrics.width = this.metrics.initialSpace.x;
              maxHeight = 0;
              break;
            case 'globalWidth':
              this.metrics.widthType = 'globalWidth';
              break;
            case 'groupedWidth':
              this.metrics.widthType = 'groupedWidth';
              break;
            case 'singleWidth':
              this.metrics.widthType = 'singleWidth';
              break;
            default:
            throw 'Unknown width type';
        }
      } else {
        // updates incrementally metrics for dinamic fields rendering
        this.metrics.rows[this.metrics.numRows] = {
          width: metrics.width,
          y: metrics.y,
          height: maxHeight + this.metrics.topRowSpace,
          widthType: this.metrics.widthType
        };
        this.fields[i].row = this.metrics.numRows;
        this.fields[i].render();
        box = this.fields[i].bbox();
        this.fields[i].container.move(metrics.width, metrics.y + this.metrics.topRowSpace); // position of field
        metrics.width += box.width + this.metrics.fieldSpace;
        maxHeight = Math.max(maxHeight, box.height);
      }
    }
    metrics.width += this.metrics.finalSpace.x - this.metrics.fieldSpace;
    globalWidth = Math.max(metrics.width, globalWidth);
    metrics.y += box.height + this.metrics.finalSpace.y;
    this.metrics.rows.push({
      width: metrics.width,
      y: metrics.y,
      height: maxHeight,
      widthType: this.metrics.widthType
    });
    this.width = globalWidth;
    this.height = metrics.y;
    // compute widths
    var i, j, groupFound = false, maxWidth;
    for (i = 0; i < this.metrics.rows.length; i++) {
      if (this.metrics.rows[i].widthType == 'groupedWidth') {
        if (groupFound == false) {
          maxWidth = this.metrics.rows[i].width;
          for (j=i+1;j<this.metrics.rows.length && this.metrics.rows[j].widthType=='groupedWidth'; j++) {
            maxWidth = Math.max(maxWidth, this.metrics.rows[j].width);
          }
          groupFound = true;
        }
        this.metrics.rows[i].width = maxWidth; // uniforms width
      } else {
         if (this.metrics.rows[i].widthType == 'globalWidth') {
           this.metrics.rows[i].width = this.width; // global width
         }
         groupFound = false;
      }
    }
    // compute heights
    var height, lastWidth = this.metrics.rows[0].width;
    this.metrics.rows[0].lastRadius = 'plane';
    for (i = 1; i < this.metrics.rows.length; i++) {
      height = this.metrics.rows[i].height;
      if (lastWidth < this.metrics.rows[i].width) {
        this.metrics.rows[i].lastRadius = 'convex';
        this.metrics.rows[i-1].nextRadius = 'concave';
      }else if (lastWidth > this.metrics.rows[i].width) {
        this.metrics.rows[i].lastRadius = 'concave';
        this.metrics.rows[i-1].nextRadius = 'convex';
      } else {
        this.metrics.rows[i].lastRadius = 'plane';
        this.metrics.rows[i-1].nextRadius = 'plane';
      }
      lastWidth = this.metrics.rows[i].width;
    }
    this.metrics.rows[this.metrics.rows.length-1].nextRadius = 'convex';
  },

  //renders the block root
  renderBlock_: function() {
    //TODO: block root must be a group
    var radius = this.metrics.borderRadius; // for typing
    var rowSpace = this.metrics.rowSpace; // for typing
    this.root = this.workspace.root.path().M({x: radius, y: this.height})
                .q({x: -radius, y: 0}, {x: -radius, y: -radius})
                .v(-this.height + 2*radius) // left side
                .q({x: 0, y: -radius}, {x: radius, y: -radius});
    // top
    var row = this.metrics.rows[0]; //for typing
    var height = row.y;
    height -= radius;
    //first row
    this.root.H(row.width - radius)
              .q({x: radius, y: 0}, {x: radius, y: radius});
    //render by row rigth line - middle
    for (var i = 1; i < this.metrics.rows.length - 1 ; i++) {
      row = this.metrics.rows[i];
      height = row.y;
      height -= radius;
      if (row.lastRadius == 'convex') {
        this.root.q({x: 0, y: radius}, {x: radius, y: radius})
                 .H(row.width - radius)
                 .q({x: radius, y: 0}, {x: radius, y: radius})
                 .V(height);
      } else if (row.lastRadius == 'concave') {
        this.root.q({x: 0, y: radius}, {x: -radius, y: radius})
                 .H(row.width + radius)
                 .q({x: -radius, y: 0}, {x: -radius, y: radius})
                 .V(height);
      } else if (row.lastRadius == 'plane') {
        this.root.V(height);
      } else {
        throw 'Unsopported type of radius: ' + row.lastRadius;
      }
    }
    //last row
    row = this.metrics.rows[this.metrics.rows.length-1];
    if (row.lastRadius == 'plane') {
      this.root.V(row.y - radius);
    } else {
      this.root.q({x: 0, y: radius}, {x: radius, y: radius})
                .H(row.width - radius)
                .q({x: radius, y: 0}, {x: radius, y: radius})
                .V(row.y - radius);
    }
    var finalRow = this.metrics.rows[this.metrics.rows.length - 1]; //for typing
    var finalWidth = finalRow.width;
    // bottom line
    this.root.q({x: 0, y: radius}, {x: -radius, y: radius})
             .h(-finalWidth + 2*radius)
             // TODO: report border bug in svg, when drag a block with black border, this project dont use that, use svg rect
    // this bug is resolved in chromium 44, TODO: test in chrome 42
             /*.stroke({ color: this.borderColor,
                       opacity: 1,
                       width: this.metrics.borderWidth
              }).fill(this.bgColor);*/
    this.root.fill(this.bgColor);
    this.root.addClass(this.style.className);
  },

  onBlur: function() { // Unselect all fields
    var i, len = this.fields.length;
    for (i = 0; i < len; i++) {
      if (typeof(this.fields[i]) == 'object' && this.fields[i].setSelected) {
        this.fields[i].setSelected(false);
      }
    }
  }
});

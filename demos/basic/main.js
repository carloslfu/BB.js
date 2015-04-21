var mainWorkspace, nested1, nested11, nested12, nested121, nested2, nested21, nested22, nested221, block1, block2, block3, block4;
var main = function() {
	mainWorkspace = new BB.Workspace('main', 'mainWorkspaceDiv');
	nested1 = mainWorkspace.addWorkspace('nested1', {width : 300, height: 400, x: 350, y: 10});
	nested2 = mainWorkspace.addWorkspace('nested2', {width : 300, height: 400});
	nested21 = nested2.addWorkspace('nested21', {width : 210, height: 140, x: 10, y: 10});

	//BB.Workspace.prototype.colorPalette = BB.colorPalettes.workspace.dark;
	//BB.Block.prototype.colorPalette = BB.colorPalettes.block.dark;
	// alternate color palette for workspace backgrounds
	BB.Workspace.prototype.stylingFunction = function() {
		this.bgColor = this.colorPalette.background[(this.level % 2 == 1) ? 'nested' : 'main'];
	};
    // Main Workspace
	mainWorkspace.render();
    block1 = mainWorkspace.addBlock('block1', test_blocks.test_dev);
	block1.render();
	block1.move(100, 100);
    block2 = mainWorkspace.addBlock('block2', example_blocks.example);
	block2.render();
	block2.move(50, 170);
    //field button fires animation
    block2.fields[5].ondown = block1.methods.animation;
    block1.methods.animationStart = function () {
      block2.fields[5].ondown = null;
    }
    block1.methods.animationEnd = function () {
      block2.fields[5].ondown = block1.methods.animation;
    }
    // Nested workspace 1
    block3 = nested1.addBlock('block3', test_blocks.test);
	block3.render();
    block3.rotate(0);
	block3.move(20, 30);
    nested2.move(350,400);
    block4 = nested1.addBlock('block4', example_blocks.example);
	block4.render();
	block4.move(20, 100);
    // Nested workspace 2
    nested2.move(660,10);
    block6 = nested2.addBlock('block5', example_blocks.example);
	block6.render();
	block6.move(50, 165);
    // Nested workspace 2 - 1
    nested21.move(10,10);
    block5 = nested21.addBlock('block6', test_blocks.test);
	block5.render();
	block5.move(50, 10);
};
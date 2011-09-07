if(!jsBackend) { var jsBackend = new Object(); }


/**
 * Interaction for the pages module
 *
 * @author	Tijs Verkoyen <tijs@sumocoders.be>
 * @author	Matthias Mullie <matthias@netlash.com>
 * @author	Dieter Vanden Eynde <dieter@netlash.com>
 */
jsBackend.pages =
{
	// init, something like a constructor
	init: function()
	{
		// load the tree
		jsBackend.pages.tree.init();

		// are we adding or editing?
		if(typeof templates != 'undefined')
		{
			// load stuff for the page
			jsBackend.pages.template.init();
			jsBackend.pages.extras.init();
		}

		// manage templates
		jsBackend.pages.manageTemplates.init();

		$('#saveAsDraft').click(function(evt)
		{
			$('form').append('<input type="hidden" name="status" value="draft" />');
			$('form').submit();
		});

		// do meta
		if($('#title').length > 0) $('#title').doMeta();
	},


	// end
	eoo: true
}


/**
 * All methods related to the controls (buttons, ...)
 *
 * @author	Matthias Mullie <matthias@netlash.com>
 * @author	Tijs Verkoyen <tijs@sumocoders.be>
 * @author	Dieter Vanden Eynde <dieter@netlash.com>
 */
jsBackend.pages.extras =
{
	// when adding an extra, we'll need to temporarily save the position we're adding it to
	extraForPosition: null,


	// this variable will store the HTML content of the editor we'll be editing; to allow cancelling the edit
	htmlContent: '',


	// init, something like a constructor
	init: function()
	{
		// bind events
		$('#extraType').change(jsBackend.pages.extras.populateExtraModules);
		$('#extraModule').change(jsBackend.pages.extras.populateExtraIds);

		// bind buttons
		$('a.addBlock').live('click', jsBackend.pages.extras.showExtraDialog);
		$('a.deleteBlock').live('click', jsBackend.pages.extras.deleteBlock);
		$('.showEditor').live('click', jsBackend.pages.extras.editContent);
		$('.toggleVisibility').live('click', jsBackend.pages.extras.toggleVisibility);

		// load initial data, or initialize the dialogs
		jsBackend.pages.extras.load();

		// make the blocks sortable
		jsBackend.pages.extras.sortable();
	},


	// load initial data, or initialize the dialog
	load: function()
	{
		// initialize the modal for choosing an extra
		if($('#addBlock').length > 0)
		{
			$('#addBlock').dialog(
			{
				autoOpen: false,
				draggable: false,
				resizable: false,
				modal: true,
				width: 500,
				buttons:
				{
					'{$lblOK|ucfirst}': function()
					{
						// add the extra
						jsBackend.pages.extras.addBlock($('#extraExtraId').val(), jsBackend.pages.extras.extraForPosition);

						// clean the saved position
						jsBackend.pages.extras.extraForPosition = null;

						// close dialog
						$(this).dialog('close');
					},
					'{$lblCancel|ucfirst}': function()
					{
						// close the dialog
						$(this).dialog('close');

						// clean the saved position
						jsBackend.pages.extras.extraForPosition = null;
					}
				}
			 });
		}
	},


	// change the extra for a block
	showExtraDialog: function(evt)
	{
		// prevent the default action
		evt.preventDefault();

		// save the position wherefor we will change the extra
		jsBackend.pages.extras.extraForPosition = $(this).parent().parent().data('position');

		// init var
		var hasModules = false;

		// check if there already blocks linked
		$('input[id^=blockExtraId]').each(function()
		{
			// get id
			var id = $(this).val();

			// check if a block is already linked
			if(id != '' && typeof extrasById[id] != 'undefined' && extrasById[id].type == 'block') hasModules = true;
		});

		// blocks linked?
		if(hasModules)
		{
			// show warning
			$('#extraWarningAlreadyBlock').show();

			// disable blocks
			$('#extraType option[value="block"]').prop('disabled', true);
		}
		else
		{
			// hide warning
			$('#extraWarningAlreadyBlock').hide();

			// enable blocks
			$('#extraType option[value="block"]').prop('disabled', false);

			// home can't have any modules linked!
			if(typeof pageID != 'undefined' && pageID == 1) $('#extraType option[value="block"]').prop('disabled', true);
		}

		// set type
		$('#extraType').val('html');
		$('#extraExtraId').val('');

		// populate the modules
		jsBackend.pages.extras.populateExtraModules();

		// open the modal
		$('#addBlock').dialog('open');
	},


	// store the extra for real
	addBlock: function(selectedExtraId, selectedPosition)
	{
		// clone prototype block
		var block = $('.contentBlock:first').clone();

		// fetch amount of blocks already on page, it'll be the index of the newly added block
		var index = $('.contentBlock').length;

		// update index occurences in the hidden data
		var blockHtml = $('textarea[id^=blockHtml]', block);
		var blockExtraId = $('input[id^=blockExtraId]', block);
		var blockPosition = $('input[id^=blockPosition]', block);
		var blockVisibility = $('input[id^=blockVisible]', block);

		blockHtml.attr('id', blockHtml.attr('id').replace(0, index)).attr('name', blockHtml.attr('name').replace(0, index));
		blockExtraId.attr('id', blockExtraId.attr('id').replace(0, index)).attr('name', blockExtraId.attr('name').replace(0, index));
		blockPosition.attr('id', blockPosition.attr('id').replace(0, index)).attr('name', blockPosition.attr('name').replace(0, index));
		blockVisibility.attr('id', blockVisibility.attr('id').replace(0, index)).attr('name', blockVisibility.attr('name').replace(0, index));

		// save position
		blockPosition.val(selectedPosition);

		// add block to dom
		block.appendTo($('#editContent'));

		// get block visibility
		var visible = blockVisibility.prop('checked');

		// block/widget
		if(typeof extrasById != 'undefined' && typeof extrasById[selectedExtraId] != 'undefined')
		{
			// save extra id
			$('input[id^=blockExtraId]', block).val(selectedExtraId);

			// add visual representation of block to template visualisation
			jsBackend.pages.extras.addBlockVisual(selectedPosition, index, selectedExtraId, visible);

			// don't show editor
			$('.blockContentHTML', block).hide();
		}

		// editor
		else
		{
			// save extra id
			$('input[id^=blockExtraId]', block).val('');

			// add visual representation of block to template visualisation
			jsBackend.pages.extras.addBlockVisual(selectedPosition, index, null, visible);

			// show editor
			$('.blockContentHTML', block).show();
		}

		// reset block indexes
//		jsBackend.pages.extras.resetIndexes();
	},


	// add block visual on template
	addBlockVisual: function(position, index, extraId, visible)
	{
		// block
		if(extraId)
		{
			// link to edit this block/widget
			var editLink = '';
			if(extrasById[extraId].type == 'block' && extrasById[extraId].data.url) editLink = extrasById[extraId].data.url;
			if(extrasById[extraId].type == 'widget' && typeof extrasById[extraId].data.edit_url != 'undefined' && extrasById[extraId].data.edit_url) editLink = extrasById[extraId].data.edit_url;

			// title, description & visibility
			var title = extrasById[extraId].human_name;
			var description = extrasById[extraId].path;
		}

		// editor
		else
		{
			// link to edit this content, title, description & visibility
			var editLink = '';
			var title = '{$lblEditor|ucfirst}';
			var description = $('#blockHtml' + index).val().substr(0, 200);
			description = utils.string.stripTags(description);
		}

		// create html to be appended in template-view
		var blockHTML = '<div class="templatePositionCurrentType' + (visible ? ' ' : ' templateDisabled') + '" data-block-id="' + index + '">' +
							'<span class="templateTitle">' + title + '</span>' +
							'<span class="templateDescription">' + description + '</span>' +
							'<div class="buttonHolder">' +
								'<a href="#" class="button linkButton icon iconOnly ' + (visible ? 'iconApprove ' : 'iconReject ') + 'toggleVisibility"><span>&nbsp;</span></a>' +
								'<a href="' + (editLink ? editLink : '#') + '" class="' + (extraId ? '' : 'showEditor ') + 'button icon iconOnly iconEdit' + '"' + (extraId && editLink ? ' target="_blank"' : '') + (extraId && editLink ? '' : ' onclick="return false;"') + (extraId && !editLink ? 'style="display: none;" ' : '') + '><span>{$lblEdit|ucfirst}</span></a>' +
								'<a href="#" class="deleteBlock button icon iconOnly iconDelete"><span>Delete</span></a>' +
							'</div>' +
						'</div>';

		// set block description in template-view
		$('#templatePosition-' + position + ' .linkedBlocks').append(blockHTML);

		// mark as updated
		jsBackend.pages.extras.updatedBlock($('.templatePositionCurrentType[data-block-id=' + index + ']'));
	},


	// delete a linked block
	deleteBlock: function(evt)
	{
		// prevent default action
		evt.preventDefault();

		// save element to variable
		var element = $(this);

		$('#confirmDeleteBlock').dialog(
		{
			draggable: false,
			resizable: false,
			modal: true,
			width: 940,
			buttons:
			{
				'{$lblOK|ucfirst}': function()
				{
					// fetch block index
					var index = element.parent().parent('.templatePositionCurrentType').data('blockId');

					// remove block from template overview
					element.parent().parent('.templatePositionCurrentType').remove();

					// remove block
					$('#blockExtraId' + index).parent().remove();

					// after removing all from fallback; hide fallback
					jsBackend.pages.extras.hideFallback();

					// reset indexes (sequence)
					jsBackend.pages.extras.resetIndexes();

					// close dialog
					$(this).dialog('close');
				},
				'{$lblCancel|ucfirst}': function()
				{
					// close the dialog
					$(this).dialog('close');
				}
			 }
		 });
	},


	// edit content
	editContent: function(e)
	{
		// prevent default event action
		e.preventDefault();

		// fetch block index
		var index = $(this).parent().parent().data('blockId');

		// save content to allow for cancelling the edited text
		jsBackend.pages.extras.htmlContent = $('#blockHtml' + index).val();

		// disable scrolling
		$('body').css('overflow', 'hidden');

		// placeholder for block node that will be moved by the jQuery dialog
		$('#blockHtml' + index).parent().parent().parent().after('<div id="blockPlaceholder"></div>');

		// show dialog
		$('#blockHtml' + index).parent().parent().parent().dialog(
		{
			closeOnEscape: false,
			draggable: false,
			resizable: false,
			modal: true,
			width: 940,
			title: '{$lblEditor|ucfirst}',
			buttons:
			{
				'{$lblOK|ucfirst}': function()
				{
					// save content
					jsBackend.pages.extras.setContent(index, true);

					// close dialog
					$(this).dialog('close');
				},
				'{$lblCancel|ucfirst}': function()
				{
					// reset content
					jsBackend.pages.extras.setContent(index, false);

					// close the dialog
					$(this).dialog('close');
				}
			},
			// jQuery's dialog is so nice to move this node to display it well, but does not put it back where it belonged
			close: function(e, ui)
			{
				// destroy dialog (to get rid of html order problems)
				$(this).dialog('destroy');

				// find block placeholder
				var blockPlaceholder = $('#blockPlaceholder');

				// move node back to the original position
				$(this).insertBefore(blockPlaceholder);

				// remove placeholder
				blockPlaceholder.remove();
			}
		});

		// add editor
		tinyMCE.execCommand('mceAddControl', true, 'blockHtml' + index);
	},


	// hide fallback
	hideFallback: function()
	{
		// after removing all from fallback; hide fallback
		if($('#templateVisualFallback .templatePositionCurrentType').length == 0) $('#templateVisualFallback').hide();
	},


	// populate the dropdown with the modules
	populateExtraModules: function()
	{
		// get selected value
		var selectedType = $('#extraType').val();

		// hide
		$('#extraModuleHolder').hide();
		$('#extraExtraIdHolder').hide();
		$('#extraModule').html('<option value="-1">-</option>');
		$('#extraExtraId').html('<option value="-1">-</option>');

		// only widgets and block need the module dropdown
		if(selectedType == 'widget' || selectedType == 'block')
		{
			// loop modules
			for(var i in extrasData)
			{
				// add option if needed
				if(typeof extrasData[i]['items'][selectedType] != 'undefined') $('#extraModule').append('<option value="'+ extrasData[i].value +'">'+ extrasData[i].name +'</option>');
			}

			// show
			$('#extraModuleHolder').show();
		}
	},


	// populates the dropdown with the extra's
	populateExtraIds: function()
	{
		// get selected value
		var selectedType = $('#extraType').val();
		var selectedModule = $('#extraModule').val();

		// hide and clear previous items
		$('#extraExtraIdHolder').hide();
		$('#extraExtraId').html('');

		// any items?
		if(typeof extrasData[selectedModule] != 'undefined' && typeof extrasData[selectedModule]['items'][selectedType] != 'undefined')
		{
			if(extrasData[selectedModule]['items'][selectedType].length == 1 && selectedType == 'block')
			{
				$('#extraExtraId').append('<option selected="selected" value="'+ extrasData[selectedModule]['items'][selectedType][0].id +'">'+ extrasData[selectedModule]['items'][selectedType][0].label +'</option>');
			}

			else
			{
				// loop items
				for(var i in extrasData[selectedModule]['items'][selectedType])
				{
					// add option
					$('#extraExtraId').append('<option value="'+ extrasData[selectedModule]['items'][selectedType][i].id +'">'+ extrasData[selectedModule]['items'][selectedType][i].label +'</option>');
				}

				// show
				$('#extraExtraIdHolder').show();
			}
		}
	},


	// reset all indexes to keep all items in proper order
	resetIndexes: function()
	{
		// mark content to be reset
		$('.contentBlock').addClass('reset');

		// reorder indexes of existing blocks:
		// is doesn't really matter if a certain block at a certain position has a certain index; the important part
		// is that they're all sequential without gaps and that the sequence of blocks inside a position is correct
		$('.templatePositionCurrentType').each(function(i)
		{
			// fetch block id
			var oldIndex = $(this).data('blockId');
			var newIndex = i + 1;

			// update index of entry in template-view
			$(this).data('blockId', newIndex);
			$(this).attr('data-block-id', newIndex);

			// update index occurences in the hidden data
			var blockHtml = $('.reset #blockHtml' + oldIndex);
			var blockExtraId = $('.reset #blockExtraId' + oldIndex);
			var blockPosition = $('.reset #blockPosition' + oldIndex);

			blockHtml.attr('id', blockHtml.attr('id').replace(oldIndex, newIndex)).attr('name', blockHtml.attr('name').replace(oldIndex, newIndex));
			blockExtraId.attr('id', blockExtraId.attr('id').replace(oldIndex, newIndex)).attr('name', blockExtraId.attr('name').replace(oldIndex, newIndex));
			blockPosition.attr('id', blockPosition.attr('id').replace(oldIndex, newIndex)).attr('name', blockPosition.attr('name').replace(oldIndex, newIndex));

			// no longer mark as needing to be reset
			blockExtraId.parent().removeClass('reset');

			// while we're at it, make sure the position is also correct
			blockPosition.val($(this).parent().parent().data('position'));
		});

		// mark all as having been reset
		$('.contentBlock').removeClass('reset');
	},


	// save/reset the content
	setContent: function(index, saveContent)
	{
		// content does not need to be saved
		if(!saveContent)
		{
			// reset to previous content
			tinyMCE.get('blockHtml' + index).setContent(jsBackend.pages.extras.htmlContent);
		}

		// re-enable scrolling
		$('body').css('overflow', 'auto');

		// remove editor
		tinyMCE.execCommand('mceRemoveControl', true, 'blockHtml' + index);

		// add short description to visual representation of block
		var description = $('#blockHtml' + index).val().substr(0, 200);
		description = utils.string.stripTags(description);
		$('.templatePositionCurrentType[data-block-id=' + index + '] .templateDescription').html(description);

		// mark as updated
		jsBackend.pages.extras.updatedBlock($('.templatePositionCurrentType[data-block-id=' + index + ']'));
	},


	// re-order blocks
	sortable: function()
	{
		// make blocks sortable
		$('div.linkedBlocks').sortable(
		{
			items: '.templatePositionCurrentType',
			tolerance: 'pointer',
			placeholder: 'dragAndDropPlaceholder',
			forcePlaceholderSize: true,
			connectWith: 'div.linkedBlocks',
			opacity: 0.7,
			stop: function(event, ui)
			{
				// reorder indexes of existing blocks:
				jsBackend.pages.extras.resetIndexes();

				// mark as updated
				jsBackend.pages.extras.updatedBlock(ui.item);

				// after removing all from fallback; hide fallback
				jsBackend.pages.extras.hideFallback();
			},
			start: function(event, ui)
			{
				// check if we're moving from template
				if($(this).parents('#templateVisualLarge').length > 0)
				{
					// disable dropping to fallback
					$('div.linkedBlocks').sortable('option', 'connectWith', '#templateVisualLarge div.linkedBlocks');
				}
				else
				{
					// enable dropping on fallback
					$('div.linkedBlocks').sortable('option', 'connectWith', 'div.linkedBlocks');
				}

				// refresh sortable to reflect altered dropping
				$('div.linkedBlocks').sortable('refresh');
			}
		});
	},


	// toggle block visibility
	toggleVisibility: function(e)
	{
		// prevent default event action
		e.preventDefault();

		// get index of block
		var index = $(this).parent().parent().data('blockId');

		// get visibility checbox
		var checkbox = $('#blockVisible' + index);

		// get current visibility state
		var visible = checkbox.prop('checked');

		// invert visibility
		visible = !visible;

		// change visibility state
		checkbox.prop('checked', visible);

		// remove current visibility indicators
		$(this).removeClass('iconApprove').removeClass('iconReject');
		$(this).parent().parent().removeClass('templateDisabled');

		// toggle visibility indicators
		if(visible) $(this).addClass('iconApprove');
		else
		{
			$(this).addClass('iconReject');
			$(this).parent().parent().addClass('templateDisabled');
		}
	},


	// display an effect on updated items
	updatedBlock: function(element)
	{
		element.effect('highlight');
	},


	// end
	eoo: true
}


/**
 * All methods related to managing the templates
 *
 * @author	Tijs Verkoyen <tijs@sumocoders.be>
 */
jsBackend.pages.manageTemplates =
{
	// init, something like a constructor
	init: function()
	{
		// check if we need to do something
		if($('#numBlocks').length > 0)
		{
			// bind event
			$('#numBlocks').change(jsBackend.pages.manageTemplates.showMetaData);

			// execute, to initialize
			jsBackend.pages.manageTemplates.showMetaData();
		}
	},


	// method to show the metadata about a specific block in a template
	showMetaData: function()
	{
		var itemsToShow = $('#numBlocks').val();
		var i = 0;

		// loop elements
		$('#metaData p').each(function()
		{
			// hide if needed
			if(i >= itemsToShow) $(this).hide();

			// show otherwise
			else $(this).show();

			// increment
			i++;
		});
	},


	// end
	eoo: true
}


/**
 * All methods related to the templates
 *
 * @author	Matthias Mullie <matthias@netlash.com>
 * @author	Tijs Verkoyen <tijs@sumocoders.be>
 */
jsBackend.pages.template =
{
	// init, something like a constructor
	init: function()
	{
		// bind events
		$('#changeTemplate').bind('click', jsBackend.pages.template.showTemplateDialog);

		// load to initialize when adding a page
		jsBackend.pages.template.changeTemplate($('#changeTemplate').parents('form').prop('id') == 'add');

		// load the dialog
		jsBackend.pages.template.load();
	},


	// method to change a template
	changeTemplate: function(changeExtras)
	{
		// destroy sortable blocks
		$('div.linkedBlocks').sortable('destroy');

		// get checked
		var selected = $('#templateList input:radio:checked').val();

		// get current template
		var current = templates[selected];
		var i = 0;

		// hide default (base) block
		$('#block-0').hide();

		// set HTML for the visual representation of the template
		$('#templateVisual').html(current.html);
		$('#templateVisualLarge').html(current.htmlLarge);
		$('#templateVisualFallback .linkedBlocks').html('');
		$('#templateId').val(selected);
		$('#templateLabel, #tabTemplateLabel').html(current.label);

		// hide fallback by default
		$('#templateVisualFallback').hide();

		// loop blocks
		$('#editContent .contentBlock').each(function(i)
		{
			// fetch variables
			var index = $('input[id^=blockExtraId]', this).attr('id').replace('blockExtraId', '');
			var extraId = $('input[id^=blockExtraId]', this).val();
			var position = $('input[id^=blockPosition]', this).val();
			var visible = $('input[id^=blockVisible]', this).prop('checked');

			// skip default (base) block
			if(index == 0) return;

			// check if this position exists
			if($.inArray(position, current.data.names) < 0)
			{
				// blocks in positions that do no longer exist should go to fallback
				position = 'fallback';

				// show fallback
				$('#templateVisualFallback').show();
			}

			// add visual representation of block to template visualisation
			jsBackend.pages.extras.addBlockVisual(position, index, extraId, visible);
		});

		// make the blocks sortable (again)
		jsBackend.pages.extras.sortable();
	},


	// load initial data, or initialize the dialog
	load: function()
	{
		$('#chooseTemplate').dialog(
		{
			autoOpen: false,
			draggable: false,
			resizable: false,
			modal: true,
			width: 940,
			buttons:
			{
				'{$lblOK|ucfirst}': function()
				{
					if($('#templateList input:radio:checked').val() != $('#templateId').val())
					{
						// change the template for real
						jsBackend.pages.template.changeTemplate(true);
					}

					// close dialog
					$(this).dialog('close');
				},
				'{$lblCancel|ucfirst}': function()
				{
					// close the dialog
					$(this).dialog('close');
				}
			 }
		 });
	},


	// show the dialog to alter the selected template
	showTemplateDialog: function(evt)
	{
		// prevent the default action
		evt.preventDefault();

		// open the modal
		$('#chooseTemplate').dialog('open');
	},


	// end
	eoo: true
}


/**
 * All methods related to the tree
 *
 * @author	Tijs Verkoyen <tijs@sumocoders.be>
 */
jsBackend.pages.tree =
{
	// init, something like a constructor
	init: function()
	{
		if($('#tree div').length == 0) return false;

		// add "treeHidden"-class on leafs that are hidden, only for browsers that don't support opacity
		if(!jQuery.support.opacity) $('#tree ul li[rel="hidden"]').addClass('treeHidden');

		var openedIds = [];
		if(typeof pageID != 'undefined')
		{
			// get parents
			var parents = $('#page-'+ pageID).parents('li');

			// init var
			var openedIds = ['page-'+ pageID];

			// add parents
			for(var i = 0; i < parents.length; i++) openedIds.push($(parents[i]).attr('id'));
		}

		// add home if needed
		if(!utils.array.inArray('page-1', openedIds)) openedIds.push('page-1');

		var options =
		{
			ui: { theme_name: 'fork' },
			opened: openedIds,
			rules:
			{
				multiple: false,
				multitree: 'all',
				drag_copy: false
			},
			lang: { loading: '{$lblLoading|ucfirst}' },
			callback:
			{
				beforemove: jsBackend.pages.tree.beforeMove,
				onselect: jsBackend.pages.tree.onSelect,
				onmove: jsBackend.pages.tree.onMove
			},
			types:
			{
				'default': { renameable: false, deletable: false, creatable: false, icon: { image: '/backend/modules/pages/js/jstree/themes/fork/icons.gif' } },
				'page': { icon: { position: '0 -80px' } },
				'folder': { icon: { position: false } },
				'hidden': { icon: { position: false } },
				'home': { draggable: false, icon: { position: '0 -112px' } },
				'pages': { icon: { position: false } },
				'error': { draggable: false, max_children: 0, icon: { position: '0 -160px' } },
				'sitemap': { max_children: 0, icon: { position: '0 -176px' } },
				'redirect': { icon: { position: '0 -264px' } },
				'direct_action': { max_children: 0, icon: { position: '0 -280px' } }
			},
			plugins:
			{
				cookie: { prefix: 'jstree_', types: { selected: false }, options: { path: '/' } }
			}
		};

		// create tree
		$('#tree div').tree(options);

		// layout fix for the tree
		$('.tree li.open').each(function()
		{
			// if the so-called open-element doesn't have any childs we should replace the open-class.
			if($(this).find('ul').length == 0) $(this).removeClass('open').addClass('leaf');
		});
	},


	// before an item will be moved we have to do some checks
	beforeMove: function(node, refNode, type, tree)
	{
		// get pageID that has to be moved
		var currentPageID = $(node).attr('id').replace('page-', '');
		if(typeof refNode == 'undefined') parentPageID = 0;
		else var parentPageID = $(refNode).attr('id').replace('page-', '')

		// home is a special item
		if(parentPageID == '1')
		{
			if(type == 'before') return false;
			if(type == 'after') return false;
		}

		// init var
		var result = false;

		// make the call
		$.ajax(
		{
			async: false, // important that this isn't asynchronous
			url: '/backend/ajax.php?module=pages&action=get_info&language='+ jsBackend.current.language,
			data: 'id=' + currentPageID,
			error: function(XMLHttpRequest, textStatus, errorThrown)
			{
				if(jsBackend.debug) alert(textStatus);
				result = false;
			},
			success: function(json, textStatus)
			{
				if(json.code != 200)
				{
					if(jsBackend.debug) alert(textStatus);
					result = false;
				}
				else
				{
					if(json.data.allow_move == 'Y') result = true;
				}
			}
		});

		// return
		return result;
	},


	// when an item is selected
	onSelect: function(node, tree)
	{
		// get current and new URL
		var currentPageURL = window.location.pathname + window.location.search;
		var newPageURL = $(node).find('a').attr('href');

		// only redirect if destination isn't the current one.
		if(typeof newPageURL != 'undefined' && newPageURL != currentPageURL) window.location = newPageURL;
	},


	// when an item is moved
	onMove: function(node, refNode, type, tree, rollback)
	{
		// get pageID that has to be moved
		var currentPageID = $(node).attr('id').replace('page-', '');

		// get pageID wheron the page has been dropped
		if(typeof refNode == 'undefined') droppedOnPageID = 0;
		else var droppedOnPageID = $(refNode).attr('id').replace('page-', '')

		// make the call
		$.ajax(
		{
			url: '/backend/ajax.php?module=pages&action=move&language='+ jsBackend.current.language,
			data: 'id=' + currentPageID + '&dropped_on='+ droppedOnPageID +'&type='+ type,
			success: function(json, textStatus)
			{
				if(json.code != 200)
				{
					if(jsBackend.debug) alert(textStatus);

					// show message
					jsBackend.messages.add('error', '{$errCantBeMoved|addslashes}');

					// rollback
					$.tree.rollback(rollback);
				}
				else
				{
					// show message
					jsBackend.messages.add('success', '{$msgPageIsMoved|addslashes}'.replace('%1$s', json.data.title));
				}
			}
		});
	},


	// end
	eoo: true
}


$(document).ready(jsBackend.pages.init);
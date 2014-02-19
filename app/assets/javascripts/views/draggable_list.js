// ELMO.Views.DraggableList
//
// View model for a draggable, editable list of options/levels/whatever.
(function(ns, klass) {

  // constructor
  ns.DraggableList = klass = function(attribs) { var self = this;
    self.listeners = {};

    // copy attribs
    for (var key in attribs) self[key] = attribs[key];

    // render the items
    self.render_items();

    // hookup setup edit/remove links (deferred)
    self.wrapper.on('click', 'a.action_link_edit', function(){
      self.edit_item($(this).closest('div.inner').data('item'));
      return false;
    });

    self.wrapper.on('click', 'a.action_link_remove', function(){
      self.remove_item($(this).closest('div.inner').data('item'));
      return false;
    });

    // hookup save button on modal
    self.modal.find('button.btn-primary').on('click', function(){ self.save_item(); return false; });
  };

  // renders the html to the view
  klass.prototype.render_items = function() { var self = this;
    // create outer ol tag
    self.ol = $("<ol>");

    // add li tags
    self.items.get().forEach(function(item, idx){
      $('<li>').html(self.render_item(item)).appendTo(self.ol);
    });

    // append to wrapper div
    self.wrapper.append(self.ol);

    // setup the sortable plugin unless in show mode
    if (self.form_mode != 'show' && self.can_reorder) {
      self.ol.nestedSortable({
        handle: 'div',
        items: 'li',
        toleranceElement: '> div',
        maxLevels: 1,

        // notify model when sorting changes
        change: function(){ self.items.dirty = true; }
      });
    }
  };

  // builds the inner div tag for an item
  klass.prototype.render_item = function(item) { var self = this;

    // make inner tag
    var inner = $('<div>').attr('class', 'inner')

    // add sort icon if not in show mode
    if (self.form_mode != 'show' && self.can_reorder)
      inner.append($('<i>').attr('class', 'icon-sort'));

    // add name (add nbsp to make sure div doesn't collapse if name is blank)
    inner.append(item.translation() + '&nbsp;');

    // add edit/remove unless in show mode
    if (self.form_mode != 'show') {
      var links = $('<div>').attr('class', 'links')

      // only show the edit link if the item is editable
      if (item.editable)
        links.append(self.edit_link);

      // don't show the removable link if the item isn't removable
      // or if the global removable permission is false
      if (self.can_remove && item.removable)
        links.append(self.remove_link);

      // add a spacer if empty, else it won't render right
      if (links.is(':empty'))
        links.append('&nbsp;')

      links.appendTo(inner);
    }

    // add locales
    inner.append($('<em>').html(item.locale_str()));

    // associate item with data model bidirectionally
    inner.data('item', item);
    item.div = inner;

    return inner;
  };

  // adds an item to the view
  // item - the model object to be added
  klass.prototype.add_item = function(item) { var self = this;
    // wrap in li and add to view
    $('<li>').html(self.render_item(item)).appendTo(self.ol);

    self.trigger('change');
  };

  // shows the edit dialog
  // item - the model object to be edited
  klass.prototype.edit_item = function(item) { var self = this;
    // save the as an instance var as we will need to access it
    // when the modal gets closed
    self.active_item = item;

    // clear the text boxes
    self.modal.find('.translation input').val("");

    // hide the in_use warning
    self.modal.find('div[id$=in_use_name_change_warning]').hide();

    // then populate text boxes
    self.active_item.locales().forEach(function(l){
      self.modal.find('.translation input[id$=name_' + l + ']').val(self.active_item.translation(l));
    });

    // show the modal
    self.modal.modal('show');

    console.log(self.modal);

    // show the in_use warning if appopriate
    if (self.active_item.in_use) self.modal.find('div[id$=in_use_name_change_warning]').show();
  };

  // removes an item from the view
  // item - the model object to be removed
  klass.prototype.remove_item = function(item) { var self = this;
    // remove from view
    item.div.closest('li').remove();

    // notify model
    item.remove();

    self.trigger('change');
  };

  // saves entered translations to data model
  klass.prototype.save_item = function() { var self = this;

    self.modal.find('.translation input').each(function(){
      self.active_item.update_translation({field: 'name', locale: $(this).data('locale'), value: $(this).val()});
    });

    // re-render the item in the view
    var old_div = self.active_item.div;
    var new_div = self.render_item(self.active_item);
    old_div.replaceWith(new_div);
    self.active_item.div = new_div;

    // done with this item
    self.active_item = null;

    self.modal.modal('hide');
  };

  // returns number of items
  klass.prototype.count = function() { var self = this;
    return self.ol.find('li').length;
  };

  // registers event listeners
  klass.prototype.on = function(event_name, cb) { var self = this;
    if (!self.listeners[event_name])
      self.listeners[event_name] = [];

    self.listeners[event_name].push(cb);
  };

  // notifies listeners for the given event
  klass.prototype.trigger = function(event_name) { var self = this;
    (self.listeners[event_name] || []).forEach(function(f){
      f.apply(self,  Array.prototype.slice.call(arguments).slice(1));
    });
  };

})(ELMO.Views);


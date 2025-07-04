FUNC.parsetemplate = function(body) {

	var helpers = {};
	var model = EMPTYOBJECT;
	var output = {};
	var strhelpers = '';
	var beg = body.indexOf('<scr' + 'ipt>');
	var end;

	// helpers
	if (beg !== -1) {
		end = body.indexOf('</scr' + 'ipt>', beg + 8);
		strhelpers = body.substring(beg + 8, end).trim();
		body = body.substring(0, beg) + body.substring(end + 9);
	}

	// model
	beg = body.indexOf('<scr' + 'ipt type="text/json">');
	if (beg !== -1) {
		end = body.indexOf('</scr' + 'ipt>', beg + 8);

		try {
			model = JSON.parse(body.substring(beg + 25, end).trim(), function(key, value) {
				return typeof(value) === 'string' && value.isJSONDate() ? new Date(value) : value;
			});
		} catch (e) {
			output.error = e;
			model = {};
			SETTER('notify/warning', 'Invalid model: ' + e.message);
		}

		body = body.substring(0, beg) + body.substring(end + 9);
	}

	try {
		if (strhelpers)
			new Function('Thelpers', strhelpers)(helpers);
	} catch (e) {
		output.error = e;
		SETTER('notify/warning', 'Invalid helpers: ' + e.message);
	}

	output.helpers = helpers;
	try {
		output.template = Tangular.compile(body.trim());
	} catch (e) {
		SETTER('notify/warning', 'Invalid template: ' + e.message);
		output.template = () => '';
	}
	output.model = model;
	return output;
};

COMPONENT('listform', 'empty:---;default:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var skip2 = false;
	var skip = false;
	var container;
	var form;
	var items;
	var plugin;

	self.validate = function(value) {
		if (config.disabled)
			return true;
		var valid = config.required ? !!(value && value.length > 0) : true;
		if (valid && config.invalidform)
			valid = self.$$invalid ? false : valid;
		return valid;
	};

	self.make = function() {

		plugin = config.plugin || self.ID;
		self.aclass(cls + ' invisible');

		if (config.selector) {
			var customselector = $(document).find(config.selector);
			self.html(customselector.html());
		}

		var scr = self.find('script');
		var tmp;

		self.template = Tangular.compile(scr.eq(0).html());
		form = '<div class="{0}-form-container hidden{2}"><ui-plugin path="{1}" config="isolated:1"><div class="{0}-form">{3}</div></ui-plugin></div>'.format(cls, plugin, config.formclass ? (' ' + config.formclass) : '', scr.eq(1).html());
		tmp = scr.eq(2).html();
		scr.remove();

		var footer = tmp ? '<div class="{0}-footer">{1}</div>'.format(cls, tmp) : '';

		if (footer && config.footertop)
			self.append(tmp);

		self.append('<div class="{0}-container"><div class="{0}-emptylabel">{1}</div><div class="{0}-items"></div></div>'.format(cls, config.empty));

		if (footer && !config.footertop)
			self.append(tmp);

		container = self.find(cls2 + '-items');

		var entersubmit = function() {
			self.find('button[name="submit"]').trigger('click');
		};

		config.enter && self.event('keydown', 'input', function(e) {
			if (config.enter && e.which === 13)
				setTimeout2(self.ID, entersubmit, 200);
		});

		self.event('click', cls2 + '-item', function() {

			if (config.disabled)
				return;

			var t = this;
			if (form.$target === t)
				self.cancel();
			else
				self.edit(t);
		});

		self.event('click', 'button', function(e) {

			if (config.disabled)
				return;

			var el = $(this);
			var parent = el.closest(cls2 + '-item');
			var tmp;
			var fn;

			if (parent.length) {
				var data = parent[0].$data;
				self.cancel();
				e.stopPropagation();
				switch (this.name) {
					case 'up':
					case 'down':
						tmp = parent.aclass(cls + '-item-highlight');
						tmp.rclass(cls + '-item-highlight', 1000);
						var index = items.indexOf(data);

						tmp = index + (this.name === 'up' ? -1 : 1);
						if (tmp < 0 || tmp >= items.length)
							return;

						var a = items[tmp];
						items[tmp] = items[index];
						items[index] = a;
						NODEMOVE(parent[0], this.name === 'up');
						skip = true;
						self.bind('@modified @touched @setter', items);
						config.move && self.EXEC(config.move, items);
						break;

					case 'remove':

						fn = function(is) {
							self.cancel();
							if (is !== false && data) {
								parent.remove();
								items.splice(items.indexOf(data), 1);
								skip = true;
								self.bind('@modified @touched @setter', items);
							}
						};

						if (config.remove)
							self.EXEC(config.remove, data, fn, self.get());
						else
							fn();
						break;
				}
				return;
			}

			var is = false;

			switch (this.name) {

				case 'create':
					self.add();
					is = true;
					break;

				case 'submit':
				case 'update':

					tmp = GET('{0} @reset'.format(plugin));
					fn = function(tmp) {
						if (tmp) {

							if (!items)
								items = [];

							if (form.$target) {
								COPY(tmp, form.$data);
								self.redraw(form.$target, form.$data);
							} else {
								items.push(tmp);
								self.create(tmp);
							}
							self.$$invalid = false;
							skip = true;
							self.bind('@modified @touched @setter', items);
						}
						self.cancel();
					};

					if (config[this.name])
						self.EXEC(config[this.name], tmp, fn, self.get(), form.$data);
					else
						fn(tmp);

					is = true;
					break;

				case 'cancel':
					self.cancel();
					is = true;
					break;

				case 'remove':

					var el = form.$target;
					var data = form.$data;

					fn = function(is) {
						if (is !== false && data) {
							el.parentNode.removeChild(el);
							items.splice(items.indexOf(data), 1);
							skip = true;
							self.$$invalid = false;
							self.bind('@modified @touched @setter', items);
						}
						self.cancel();
					};

					if (config.remove)
						self.EXEC(config.remove, data, fn, self.get());
					else
						fn();

					is = true;
					break;
			}

			if (is) {
				e.preventDefault();
				e.stopPropagation();
			}
		});
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'disabled':
				self.tclass('ui-' + key, !!value);
				self.find('button[name="create"]').prop('disabled', !!value);
				break;
			case 'required':
				self.tclass(cls + '-' + key, !!value);
				if (!init)
					self.validate2();
				break;
		}
	};

	self.add = function() {

		self.check();

		if (!$(form).hclass('hidden') && !form.$data) {
			self.cancel();
			return;
		}

		var fn = function(obj) {

			if (config.newbie)
				obj[config.newbie] = true;

			if (config.create || !config.default)
				SET('{0} @reset'.format(plugin), obj);
			else
				SET('{0} @default'.format(plugin), obj);

			self.edit();
		};

		if (config.create)
			self.EXEC(config.create, {}, fn, self.get());
		else
			fn({});
	};

	self.check = function() {
		if (!self.$$check) {
			form = $(form)[0];
			container.append(form);
			self.compile && self.compile();
			self.$$check = true;
			self.$$invalid = true;
			if (config.invalidform)
				self.validate2();
		}
	};

	self.edit = function(el) {

		self.check();
		self.cancel();

		var before;
		var parent;

		if (el) {
			parent = el.parentNode;
			var children = parent.children;
			for (var i = 0; i < children.length; i++) {
				if (children[i] === el) {
					before = children[i + 1];
					break;
				}
			}
			form.$target = el;
			form.$data = el.$data;
			SET('{0} @reset'.format(plugin), CLONE(el.$data));
			$(el).aclass(cls + '-selected');
		} else {
			parent = container[0];
			form.$target = form.$data = null;
		}

		if (before)
			parent.insertBefore(form, before);
		else
			parent.appendChild(form);

		setTimeout(function() {
			$(form).tclass(cls + '-new', !el).rclass('hidden');
			config.autofocus && self.autofocus(config.autofocus);
		}, 150);

		if (config.invalidform) {
			self.$$invalid = true;
			self.validate2();
			skip2 = true;
			self.update();
		}

	};

	self.cancel = function() {
		if (self.$$check) {

			if (self.$$invalid) {
				self.$$invalid = false;
				self.validate2();
				skip2 = true;
				self.update();
			}

			if (form.parentNode !== self.dom)
				self.dom.appendChild(form);

			form.$target && $(form.$target).rclass(cls + '-selected');
			form.$target = form.$data = null;
			$(form).aclass('hidden');
		}
	};

	self.redraw = function(el, data) {
		el.innerHTML = self.template(data);
	};

	self.create = function(item) {
		var dom = document.createElement('DIV');
		dom.setAttribute('class', cls + '-item' + (config.itemclass ? (' '  + config.itemclass) : ''));
		dom.innerHTML = self.template(item);
		dom.$data = item;
		container[0].appendChild(dom);
	};

	self.setter = function(value, path, type) {

		if (skip2) {
			skip2 = false;
			return;
		}

		if ((M.is20 && type.init) || !type)
			self.rclass('invisible');

		items = value;
		self.tclass(cls + '-empty', !value || !value.length);
		self.cancel();

		if (skip) {
			skip = false;
			return;
		}

		form.$data && self.cancel();
		container.find(cls2 + '-item').remove();

		if (value) {
			for (var i = 0; i < value.length; i++)
				self.create(value[i]);
		}
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
	};

});

COMPONENT('autodarkmode', function(self, config) {

	self.readonly();
	self.singleton();
	self.blind();

	self.make = function() {

		var body = $('body');
		var match = W.matchMedia('(prefers-color-scheme: dark)');

		match.addEventListener('change', function(e) {
			body.tclass('ui-dark', e.matches);
			config.exec && self.SEEX(config.exec, match.matches);
		});

		body.tclass('ui-dark', match.matches);
		config.exec && self.SEEX(config.exec, match.matches);
	};

});

COMPONENT('table', 'highlight:true;border:true;unhighlight:true;multiple:false;pk:id;visibleY:1;scrollbar:0;pluralizepages:# pages,# page,# pages,# pages;pluralizeitems:# items,# item,# items,# items;margin:0', function(self, config, cls) {

	var cls2 = '.' + cls;
	var etable, ebody, eempty, ehead, eheadsize, efooter, container;
	var opt = { selected: [] };
	var templates = {};
	var sizes = {};
	var names = {};
	var aligns = {};
	var sorts = {};
	var dcompile = false;
	var prevsort;
	var prevhead;
	var extradata;

	self.readonly();
	self.nocompile();
	// self.bindvisible();

	self.make = function() {

		self.aclass(cls + ' invisible' + (config.detail ? (' ' + cls + '-detailed') : '') + ((config.highlight || config.click || config.exec) ? (' ' + cls + '-selectable') : '') + (config.border ? (' ' + cls + '-border') : '') + (config.flat ? (' ' + cls + '-flat') : '') + (config.noborder ? (' noborder') : ''));

		self.find('script').each(function() {

			var el = $(this);
			var type = el.attrd('type');

			switch (type) {
				case 'detail':
					var h = el.html();
					dcompile = h.COMPILABLE();
					templates.detail = Tangular.compile(h);
					return;
				case 'empty':
					templates.empty = el.html();
					return;
			}

			var display = (el.attrd('display') || '').toLowerCase();
			var template = Tangular.compile(el.html());
			var size = (el.attrd('size') || '').split(',');
			var name = (el.attrd('head') || '').split(',');
			var align = (el.attrd('align') || '').split(',');
			var sort = (el.attrd('sort') || '').split(',');
			var i;

			for (i = 0; i < align.length; i++) {
				switch (align[i].trim()) {
					case '0':
						align[i] = 'left';
						break;
					case '1':
						align[i] = 'center';
						break;
					case '2':
						align[i] = 'right';
						break;
				}
			}

			display = (display || '').split(',').trim();

			for (i = 0; i < align.length; i++)
				align[i] = align[i].trim();

			for (i = 0; i < size.length; i++)
				size[i] = size[i].trim().toLowerCase();

			for (i = 0; i < sort.length; i++)
				sort[i] = sort[i].trim();

			for (i = 0; i < name.length; i++) {
				name[i] = name[i].trim().replace(/'[a-z-\s]+'/, function(val) {
					if (val.indexOf(' ') === -1)
						val = val + ' ti';
					return '<i class="ti-{0}"></i>'.format(val.replace(/'/g, ''));
				});
			}

			if (!size[0] && size.length === 1)
				size = EMPTYARRAY;

			if (!align[0] && align.length === 1)
				align = EMPTYARRAY;

			if (!name[0] && name.length === 1)
				name = EMPTYARRAY;

			if (display.length) {
				for (i = 0; i < display.length; i++) {
					templates[display[i]] = template;
					sizes[display[i]] = size.length ? size : null;
					names[display[i]] = name.length ? name : null;
					aligns[display[i]] = align.length ? align : null;
					sorts[display[i]] = sort.length ? sort : null;
				}
			} else {
				templates.lg = templates.md = templates.sm = templates.xs = template;
				sizes.lg = sizes.md = sizes.sm = sizes.xs = size.length ? size : null;
				names.lg = names.md = names.sm = names.xs = name.length ? name : null;
				sorts.lg = sorts.md = sorts.sm = sorts.xs = sort.length ? sort : null;
				aligns.lg = aligns.md = aligns.sm = aligns.xs = align.length ? align : null;
			}
		});

		self.html('<div class="{0}-headcontainer"><table class="{0}-head"><thead></thead></table></div><div class="{0}-container"><table class="{0}-table"><thead></thead><tbody class="{0}-tbody"></tbody></table><div class="{0}-empty hidden"></div></div>'.format(cls));
		etable = self.find(cls2 + '-table');
		ebody = etable.find('tbody');
		eempty = self.find(cls2 + '-empty').html(templates.empty || '');
		ehead = self.find(cls2 + '-head thead');
		eheadsize = etable.find('thead');
		container = self.find(cls2 + '-container');

		etable.on('click', 'button', function() {
			if (config.click) {
				var btn = $(this);
				var row = opt.items[+btn.closest('tr').attrd('index')];
				self.SEEX(config.click, btn[0].name, row, btn);
			}
		});

		if (config.paginate) {
			self.append('<div class="{0}-footer"><div class={0}-pagination-items hidden-xs"></div><div class="{0}-pagination"><button name="page-first" disabled><i class="ti ti-angle-double-left"></i></button><button name="page-prev" disabled><i class="ti ti-angle-left"></i></button><div><input type="text" name="page" maxlength="5" class="{0}-pagination-input" /></div><button name="page-next" disabled><i class="ti ti-angle-right"></i></button><button name="page-last" disabled><i class="ti ti-angle-double-right"></i></button></div><div class="{0}-pagination-pages"></div></div>'.format(cls));
			efooter = self.find(cls2 + '-footer');

			efooter.on('change', cls2 + '-pagination-input', function() {

				var value = self.get();
				var val = +this.value;

				if (isNaN(val))
					return;

				if (val >= value.pages)
					val = value.pages;
				else if (val < 1)
					val = 1;

				value.page = val;
			});

			efooter.on('click', 'button', function() {
				var data = self.get();

				var model = {};
				model.page = data.page;
				model.limit = data.limit;

				if (prevsort)
					model.sort = prevsort && prevsort.type ? (prevsort.name + '_' + prevsort.type) : '';

				switch (this.name) {
					case 'page-first':
						model.page = 1;
						self.SEEX(config.paginate, model);
						break;
					case 'page-last':
						model.page = data.pages;
						self.SEEX(config.paginate, model);
						break;
					case 'page-prev':
						model.page -= 1;
						self.SEEX(config.paginate, model);
						break;
					case 'page-next':
						model.page += 1;
						self.SEEX(config.paginate, model);
						break;
				}
			});
		}

		if (config.scrollbar) {
			self.scrollbar = SCROLLBAR(container, { visibleY: !!config.visibleY });
			ehead.parent().parent().aclass(cls + '-scrollbar');
		}

		templates.empty && templates.empty.COMPILABLE() && COMPILE(eempty);

		self.event('click', '.sort', function() {

			if (self.hclass(cls + '-isempty'))
				return;

			var th = $(this);
			var i = th.find('i');
			var type;

			if (i.attr('class') === 'ti') {
				// no sort
				prevsort && prevsort.el.find('i').rclass2('ti-');
				i.aclass('ti-long-arrow-up');
				type = 'asc';
			} else if (i.hclass('ti-long-arrow-up')) {
				// ascending
				i.rclass('ti-long-arrow-up').aclass('ti-long-arrow-down');
				type = 'desc';
			} else if (i.hclass('ti-long-arrow-down')) {
				// descending
				i.rclass('ti-long-arrow-down');
				type = '';
			}

			var index = th.index();
			var data = self.get();

			prevsort = { index: index, type: type, el: th, name: sorts[WIDTH()][index] };

			if (config.paginate) {
				var model = {};
				model.page = data.page;
				model.limit = data.limit;
				model.sort = type ? (prevsort.name + '_' + type) : undefined;
				self.SEEX(config.paginate, model);
			} else if (prevsort.name) {
				opt.items = (data.items ? data.items : data).slice(0);
				if (type)
					opt.items.quicksort(prevsort.name, type === 'asc');
				else {
					var tmp = self.get() || EMPTYARRAY;
					opt.items = tmp.items ? tmp.items : tmp;
					prevsort = null;
				}
				opt.sort = type ? (prevsort.name + '_' + type) : undefined;
				config.filter && self.EXEC(config.filter, opt, 'sort');
				self.redraw();
			}
		});

		var blacklist = { A: 1, BUTTON: 1 };
		var dblclick = 0;

		var forceselect = function(el, index, is) {

			if (!config.highlight) {
				config.exec && self.SEEX(config.exec, opt.items[index], el);
				return;
			}

			if (config.multiple) {
				if (is) {
					if (config.unhighlight) {
						el.rclass(cls + '-selected');
						config.detail && self.row_detail(el);
						opt.selected = opt.selected.remove(index);
						config.exec && self.SEEX(config.exec, self.selected(), el);
					}
				} else {
					opt.selected.push(index);
					el.aclass(cls + '-selected');
					config.exec && self.SEEX(config.exec, self.selected(), el);
					config.detail && self.row_detail(el);
				}
			} else {

				if (is && !config.unhighlight)
					return;

				if (opt.selrow) {
					opt.selrow.rclass(cls + '-selected');
					config.detail && self.row_detail(opt.selrow);
					opt.selrow = null;
					opt.selindex = -1;
				}

				// Was selected
				if (is) {
					config.exec && self.SEEX(config.exec);
					return;
				}

				opt.selindex = index;
				opt.selrow = el;
				el.aclass(cls + '-selected');
				config.exec && self.SEEX(config.exec, opt.items[index], el);
				config.detail && self.row_detail(el);
			}
		};

		ebody.on('click', '> tr', function(e) {

			var el = $(this);
			var node = e.target;

			if (blacklist[node.tagName] || (node.tagName === 'SPAN' && node.getAttribute('class') || '').indexOf('link') !== -1)
				return;

			if (node.tagName === 'I') {
				var parent = $(node).parent();
				if (blacklist[parent[0].tagName] || (parent[0].tagName === 'SPAN' && parent.hclass('link')))
					return;
			}

			var now = Date.now();
			var isdblclick = dblclick ? (now - dblclick) < 250 : false;
			dblclick = now;

			var index = +el.attrd('index');
			if (index > -1) {

				var is = config.highlight ? el.hclass(cls + '-selected') : true;

				if (isdblclick && config.dblclick && is) {
					self.forceselectid && clearTimeout(self.forceselectid);
					self.SEEX(config.dblclick, opt.items[index], el);
					return;
				}

				self.forceselectid && clearTimeout(self.forceselectid);
				self.forceselectid = setTimeout(forceselect, config.dblclick ? is ? 250 : 1 : 1, el, index, is);
			}
		});

		var resize = function() {
			setTimeout2(self.ID, self.resize, 500);
		};

		self.on('resize2 + resize', resize);
	};

	self.resize2 = function() {
		self.scrollbar && setTimeout2(self.ID + 'scrollbar', self.scrollbar.resize, 300);
	};

	self.resize = function() {

		var display = WIDTH();
		if (display !== opt.display && sizes[display] && sizes[display] !== sizes[opt.display]) {
			self.refresh();
			return;
		}

		if (config.height > 0)
			self.find(cls2 + '-container').css('height', config.height - config.margin);
		else if (config.height) {
			var el = self.parent(config.height);
			var header = self.find(cls2 + '-head');
			var plus = (config.noborder ? 0 : 2);
			var footer = config.paginate ? (self.find(cls2 + '-footer').height() + plus) : 0;
			self.find(cls2 + '-container').css('height', el.height() - header.height() - footer - plus - config.margin);
		}

		self.scrollbar && self.scrollbar.resize();
	};

	self.row_detail = function(el) {

		var index = +el.attrd('index');
		var row = opt.items[index];
		var eld = el.next();

		if (el.hclass(cls + '-selected')) {

			// Row is selected
			if (eld.hclass(cls + '-detail')) {
				// Detail exists
				eld.rclass('hidden');
			} else {

				// Detail doesn't exist
				el.after('<tr class="{0}-detail"><td colspan="{1}" data-index="{2}"></td></tr>'.format(cls, el.find('td').length, index));
				eld = el.next();

				var tmp;

				if (config.detail === true) {
					tmp = eld.find('td');
					tmp.html(templates.detail(row, { index: index, user: window.user, data: extradata }));
					dcompile && COMPILE(tmp);
				} else {
					tmp = eld.find('td');
					self.EXEC(config.detail, row, function(row) {
						var is = typeof(row) === 'string';
						tmp.html(is ? row : templates.detail(row, { index: index, user: window.user, data: extradata }));
						if ((is && row.COMPILABLE()) || dcompile)
							COMPILE(tmp);
					}, tmp);
				}
			}

		} else
			eld.hclass(cls + '-detail') && eld.aclass('hidden');

		self.resize2();
	};

	self.redrawrow = function(index, row) {

		if (typeof(index) === 'number')
			index = ebody.find('tr[data-index="{0}"]'.format(index));

		if (index.length) {
			var template = templates[opt.display];
			var indexer = {};
			indexer.data = extradata;
			indexer.user = W.user;
			indexer.index = +index.attrd('index');
			var is = index.hclass(cls + '-selected');
			var next = index.next();
			index.replaceWith(template(row, indexer).replace('<tr', '<tr data-index="' + indexer.index + '"'));
			next.hclass(cls + '-detail') && next.remove();
			is && ebody.find('tr[data-index="{0}"]'.format(indexer.index)).trigger('click');
		}
	};

	self.appendrow = function(row) {

		var index = opt.items.indexOf(row);
		if (index == -1)
			index = opt.items.push(row) - 1;

		var template = templates[opt.display];
		var indexer = {};
		indexer.data = extradata;
		indexer.user = W.user;
		indexer.index = index;
		ebody.append(template(row, indexer).replace('<tr', '<tr data-index="' + indexer.index + '"'));
	};

	self.removerow = function(row) {
		var index = opt.items.indexOf(row);
		if (index == -1)
			return;
		opt.selected = opt.selected.remove(index);
		opt.items.remove(row);
	};

	self.redraw = function() {
		var clsh = 'hidden';
		var count = 0;
		var indexer = { user: W.user, data: extradata };
		var builder = [];
		var template = templates[WIDTH()];
		if (template) {
			for (var i = 0; i < opt.items.length; i++) {
				var item = opt.items[i];
				count++;
				indexer.index = i;
				builder.push(template(item, indexer).replace('<tr', '<tr data-index="' + i + '"'));
			}
		}
		count && ebody.html(builder.join(''));
		eempty.tclass(clsh, count > 0);
		etable.tclass(clsh, count == 0);
		self.tclass(cls + '-isempty', count === 0);
		config.redraw && self.EXEC(config.redraw, self);
	};

	self.redrawpagination = function() {

		if (!config.paginate)
			return;

		var value = self.get();
		efooter.find('button').each(function() {

			var el = $(this);
			var dis = true;

			switch (this.name) {
				case 'page-next':
					dis = value.page >= value.pages;
					break;
				case 'page-prev':
					dis = value.page === 1;
					break;
				case 'page-last':
					dis = !value.pages || value.page === value.pages;
					break;
				case 'page-first':
					dis = value.page === 1;
					break;
			}

			el.prop('disabled', dis);
		});

		efooter.find('input')[0].value = value.page;
		efooter.find(cls2 + '-pagination-pages')[0].innerHTML = value.pages.pluralize.apply(value.pages, config.pluralizepages);
		efooter.find(cls2 + '-pagination-items')[0].innerHTML = value.count.pluralize.apply(value.count, config.pluralizeitems);
	};

	self.selected = function() {
		var rows = [];
		for (var i = 0; i < opt.selected.length; i++) {
			var row = opt.items[opt.selected[i]];
			row && rows.push(row);
		}
		return rows;
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'pluralizepages':
				config.pluralizepages = value.split(',').trim();
				break;
			case 'pluralizeitems':
				config.pluralizeitems = value.split(',').trim();
				break;
			case 'datasource':
				self.datasource(value, self.bind);
				break;
			case 'paginate':
			case 'exec':
			case 'click':
			case 'filter':
			case 'redraw':
				if (value && value.SCOPE)
					config[key] = value.SCOPE(self, value);
				break;
		}
	};

	self.bind = function(path, val) {
		extradata = val;
	};

	self.setter = function(value) {

		if (config.paginate && value == null) {
			var model = {};
			model.page = 1;
			if (prevsort)
				model.sort = prevsort && prevsort.type ? (prevsort.name + '_' + prevsort.type) : '';
			self.EXEC(config.paginate, model);
			return;
		}

		var data = value ? value.items ? value.items : value : value;
		var empty = !data || !data.length;
		var clsh = 'hidden';

		if (!self.isinit) {
			self.rclass('invisible', 10);
			self.isinit = true;
		}

		var display = WIDTH();
		var builder = [];
		var buildersize = [];
		var selected = opt.selected.slice(0);

		for (var i = 0; i < selected.length; i++) {
			var row = opt.items[selected[i]];
			selected[i] = row[config.pk];
		}

		var size = sizes[display];
		var name = names[display];
		var align = aligns[display];
		var sort = sorts[display];

		if (prevhead !== display) {
			if ((size && size.length) || (name && name.length) || (align && align.length)) {

				var arr = name || size || align;

				for (var i = 0; i < arr.length; i++) {
					var w = !size || size[i] === '0' ? 'auto' : size[i];
					builder.push('<th style="width:{0};text-align:{2}"{3}>{1}</th>'.format(w, (sort && sort[i] ? '<i class="ti"></i>' : '') + (name ? name[i] : ''), align ? align[i] : 'left', sort && sort[i] ? ' class="sort"' : ''));
					buildersize.push('<th style="width:{0}"></th>'.format(w));
				}

				ehead.parent().tclass('hidden', !name);
				ehead.html('<tr>{0}</tr>'.format(builder.join('')));
				eheadsize.html('<tr>{0}</tr>'.format(buildersize.join('')));

			} else
				ehead.html('');

			prevsort = null;
			prevhead = display;
		}

		setTimeout(self.resize, 100);

		opt.display = display;
		opt.items = data ? data.slice(0) : 0;
		opt.data = value;
		opt.selindex = -1;
		opt.selrow = null;
		opt.selected = [];
		opt.sort = prevsort;

		self.redrawpagination();
		config.filter && self.EXEC(config.filter, opt, 'refresh');
		config.exec && self.SEEX(config.exec, config.multiple ? [] : null);

		if (empty) {
			etable.aclass(clsh);
			eempty.rclass(clsh);
			self.aclass(cls + '-isempty');
			config.hidewhenempty && self.aclass('hidden');
			return;
		}

		config.hidewhenempty && self.rclass('hidden');
		self.redraw();

		if (config.remember) {
			for (var i = 0; i < selected.length; i++) {
				if (selected[i]) {
					var index = opt.items.findIndex(config.pk, selected[i]);
					if (index !== -1)
						ebody.find('tr[data-index="{0}"]'.format(index)).trigger('click');
				}
			}
		}
	};

});
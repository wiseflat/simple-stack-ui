NEWSCHEMA('Terraform', function(schema) {

	schema.action('read_ansible_item', {
		name: 'Read ansible variable set with hostname',
		params: '*name:String',
		action: function($) {
			var params = $.params;
			NOSQL('ansible').find().where('name', params.name).callback(function(err, response){
				$.callback(response.length > 0 ? true : false);
			});
		}
	});

	schema.action('list', {
		name: 'List of terraform project',
		permissions: 'terraform',
		action: function($) {
			NOSQL('terraform').list().autoquery($.query, 'id:string,name:string,token:string,dtcreated:string,dtupdated:string', 'dtcreated_desc', 100).callback(function(err, response){
				$.callback(response.items);
			});
		}
	});

	schema.action('read', {
		name: 'Read terraform proeject',
		permissions: 'terraform',
		params: '*id:UID',
		action: function($) {
			var params = $.params;

			NOSQL('terraform').one().where('id', params.id).callback(function(err, response){
				var result = {
					id: params.id,
					name: response.name,
					dtcreated: response.dtcreated,
					dtupdated: response.dtupdated
				};

				NOSQL(response.token).one().callback(function(err, response){
					result.tfstates = response;
					$.callback(result);
				});
			});
		}
	});

	schema.action('create', {
		name: 'Create a terraform project',
		input: '*name,*token',
		permissions: 'ansible',
		action: function($, model) {
			model.id = UID();
			model.dtcreated = NOW = new Date();
			model.dtupdated = NOW = new Date();
			NOSQL('terraform').insert(model);
			$.success();
		}
	});

	schema.action('update', {
		name: 'Update a terraform project',
		input: '*name, *token',
		params: '*id:UID',
		permissions: 'terraform',
		action: function($, model) {
			var params = $.params;
			NOSQL('terraform').modify({ name: model.name, token: model.token, dtupdated: NOW = new Date() }).where('id', params.id).callback($.done());

		}
	});

	schema.action('remove', {
		name: 'Remove a terraform project',
		params: '*id:UID',
		permissions: 'terraform',
		action: function($) {
			var params = $.params;
			NOSQL('terraform').remove().where('id', params.id).callback($.done());
		}
	});

	// schema.action('tfstates_lock', {
	// 	name: 'Lock terraform states',
	// 	params: '*id:string',
	// 	permissions: 'terraform',
	// 	action: function($, model) {
	// 		var params = $.params;
	// 		console.log(params, model);
	// 		// NOSQL('{0}-status'.format(params.id)).insert({status: 'lock'});
	// 		// $.callback();
	// 		// $.status('423');
	// 		$.invalid(423, { Info: true });
	// 		// $.status(423).json({ Info: true });
	// 	}
	// });

	// schema.action('tfstates_unlock', {
	// 	name: 'Unlock terraform states',
	// 	params: '*id:string',
	// 	permissions: 'terraform',
	// 	action: function($, model) {
	// 		var params = $.params;
	// 		console.log(params, model);
	// 		// NOSQL('{0}-status'.format(params.id)).insert({status: 'lock'});
	// 		$.callback();
	// 	}
	// });

	schema.action('tfstates_update', {
		name: 'Update terraform states',
		params: '*id:UID',
		permissions: 'terraform',
		action: function($, model) {
			var params = $.params;
			NOSQL('tfstate-' + params.id).insert(model);

			model.resources.wait(function(resource, next) {
				if(resource.type !== 'ansible_host'){
					next();
				}
				else {
					resource.instances.wait(function(instance, next) {
						var arr = [];

						arr.push(function(next) {
							$.action('read_ansible_item').params({ name: instance.attributes.name }).callback(function(err, response){
								if(!response) {
									NOSQL('ansible').insert({
										id: UID(),
										name: instance.attributes.name,
										group_vars: false,
										variables: instance.attributes.variables,
										dtcreated: NOW = new Date(),
										dtupdated: NOW = new Date()
									});
									next();
								}
								else {
									next();
								}
							});
						});

						arr.push(function(next) {
							instance.attributes.groups.wait(function(value, next) {
								$.action('read_ansible_item').params({ name: value }).callback(function(err, response){
									if(!response) {
										NOSQL('ansible').insert({
											id: UID(),
											name: value,
											group_vars: true,
											variables: {},
											dtcreated: NOW = new Date(),
											dtupdated: NOW = new Date()
										});
										next();
									}
									else {
										next();
									}
								});
							}, () => next());
						});
						arr.async(next());
					}, () => next());
				}
			}, () => $.success());
		}
	});

	schema.action('tfstates_read', {
		name: 'Update terraform states',
		params: '*id:UID',
		permissions: 'terraform',
		action: function($) {
			var params = $.params;
			NOSQL('tfstate-' + params.id).one().callback(function(err, response){
				if(err || response === undefined)
					$.callback({
						"version": 4
					});
				else
					$.callback(response);
			});
		}
	});
});
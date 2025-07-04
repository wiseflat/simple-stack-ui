NEWSCHEMA('Ansible', function(schema) {

	YAML = require('yamljs');

	// function convertArrayToObject(array) {
	// 	return array.reduce((acc, item) => {
	// 		acc[item.name] = item.version;
	// 		return acc;
	// 	}, {});
	// }

	schema.action('list', {
		name: 'List of ansible variables',
		permissions: 'ansible',
		action: function($) {
			NOSQL('ansible').list().autoquery($.query, 'id:string,name:string,group_vars:Boolean,variables:string,dtcreated:string', 'dtcreated_desc', 100).callback(function(err, response){
				var result = {
					group_vars: [],
					host_vars: [],
				};
				for (i=0; i<response.items.length;i++){
					result[response.items[i].group_vars ? 'group_vars': 'host_vars'].push({
						id: response.items[i].id,
						name: response.items[i].name,
						group_vars: response.items[i].group_vars,
						variables: YAML.stringify(response.items[i].variables, inline=4, spaces=2)
					});
				}
				$.callback(result);
			});
		}
	});

	schema.action('list_hosts', {
		name: 'List of ansible hosts',
		permissions: 'ansible',
		action: function($) {
			NOSQL('ansible').list().autoquery($.query, 'id:string,name:string,group_vars:Boolean', 'name_desc', 100).callback(function(err, response){
				var result = [];
				for (i=0; i<response.items.length;i++){
					if(!response.items[i].group_vars){
						result.push(response.items[i].name);
					}
				}
				$.callback(result);
			});
		}
	});

	// schema.action('list2', {
	// 	name: 'List of ansible variables',
	// 	permissions: 'ansible',
	// 	action: function($) {
	// 		NOSQL('ansible').list().autoquery($.query, 'id:string,name:string,group_vars:Boolean', 'dtcreated_desc', 100).callback(function(err, response){
				
	// 			var result = {
	// 				groups: [],
	// 				hosts: [],
	// 			};
	// 			for (i=0; i<response.items.length;i++){
	// 				if(response.items[i].group_vars){
	// 					result.groups.push({
	// 						id: response.items[i].name,
	// 						name: response.items[i].name
	// 					});
	// 				}
	// 				else {
	// 					result.hosts.push({
	// 						id: response.items[i].name,
	// 						name: response.items[i].name
	// 					});
	// 				}
	// 			}
	// 			$.callback(result);
	// 		});
	// 	}
	// });

	schema.action('read', {
		name: 'Read ansible variable set',
		permissions: 'ansible',
		params: '*id:UID',
		action: function($) {
			var params = $.params;
			NOSQL('ansible').one().where('id', params.id).callback(function(err, response){
				$.callback({
					id: params.id,
					name: response.name,
					group_vars: response.group_vars,
					variables: YAML.stringify(response.variables, inline=4, spaces=2)
				});
			});
		}
	});

	schema.action('update', {
		name: 'Update a ansible variable set',
		input: '*name, group_vars:Boolean, *variables',
		params: '*id:UID',
		permissions: 'ansible',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').modify({ name: model.name, group_vars: model.group_vars, variables: YAML.parse(model.variables), dtupdated: NOW = new Date() }).where('id', params.id).callback($.done());
		}
	});

	schema.action('remove', {
		name: 'Remove a ansible variable set',
		params: '*id:UID',
		permissions: 'ansible',
		action: function($) {
			var params = $.params;
			NOSQL('ansible').remove().where('id', params.id).callback($.done());
		}
	});

	schema.action('inventory_read', {
		name: 'Read Ansible inventory',
		// params: '*id:UID',
		// permissions: 'ansible',
		action: async function($) {

			// console.log('read inventory');
			var inventory = {
				"_meta": {
					"hostvars": {
						"localhost": {
							"ansible_connection": "local"
						}
					}
				},
				"all": {
					"hosts": [],
					"vars": {},
					"children": []
				},
				"infrastructure": {
					"hosts": [],
					"vars": {},
					"children": []
				},
				"ungrouped": ['localhost']
			};

			NOSQL('ansible').one().where('name', 'all').callback(function(err, result){
				inventory.all.vars = result.variables;
			});

			NOSQL('ansible').one().where('name', 'all').callback(function(err, result){
				inventory.all.vars = result.variables;
			});

			NOSQL('ansible').one().where('name', 'infrastructure').callback(function(err, result){
				inventory.infrastructure.vars = result.variables;
			});

			// NOSQL('ansible').one().where('name', 'infrastructure').callback(function(err, result){
			// 	inventory.all.vars = result.variables;
			// 	// NOSQL('software').list().callback(function(err, softwares){
			// 	// 	const softwares_list = {
			// 	// 		softwares: convertArrayToObject(softwares.items)
			// 	// 	};
			// 	// 	inventory.all.vars = {...ansible_group_all.variables, ...softwares_list};
			// 	// });
			// });

			DATA.list('nosql/terraform').autoquery($.query, 'id:string,name:string,token:string,dtcreated:string,dtupdated:string', 'dtcreated_desc', 100).callback(function(err, response){

				response.items.wait(function(value, next) {
					NOSQL('tfstate-' + value.id).one().callback(function(err, tfstate){

						tfstate.resources.wait(function(resource, next) {
							if(resource.type != 'ansible_host'){
								next();
								return;
							}

							resource.instances.wait(function(instance, next) {
								instance.attributes.groups.wait(function(group, next) {
									if(inventory[group] === undefined){
										inventory[group] = {
											"hosts": [],
											"vars": {},
											"children": []
										}
									}
									inventory[group].hosts.push(instance.attributes.name);			
									next();
								}, () => next());

								NOSQL('ansible').one().where('name', instance.attributes.name).callback(function(err, ansible){
									inventory._meta.hostvars[instance.attributes.name] = {...instance.attributes.variables, ...ansible.variables};
								});
							}, () => next());
						}, () => next());
					});
					
				}, () => $.callback(inventory));
			});
		}
	});

	schema.action('software_version', {
		name: 'Insert or update software version',
		permissions: 'ansible',
		input: '*name, *version:String, *hostname:String',
		action: function($, model) {
			NOSQL('ansible').one().where('name', model.hostname).callback(function(err, response){
				if(response.variables.softwares === undefined) 
					response.variables.softwares = {};
				response.variables.softwares[model.name] = model.version;
				NOSQL('ansible').modify({ variables: response.variables, dtupdated: NOW = new Date() }).where('id', response.id).callback($.done());
			});
		}
	});
});
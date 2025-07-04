NEWSCHEMA('Domain', function(schema) {

	schema.action('list', {
		name: 'List of domains',
		permissions: 'domain',
		action: function($) {
			NOSQL('ansible').list().autoquery($.query, 'id:string,group_vars:Boolean,variables:string', 'name_desc', 100).callback(function(err, response){
				var softwares = {};
				for (const obj of response.items) {
					if(!obj.group_vars){
						
						// Get softwares from domain already deployed
						for (const [key, value] of Object.entries(obj.variables.domains)) {
							if(softwares[value.software] === undefined) {
								softwares[value.software] = [];
							}
							// Skip domain where status is defined
							if(value.status === undefined){
								softwares[value.software].push({ id: obj.id, name: key, software: value.software });
							}
						}

						// Get softwares when no domains created yet
						for (const [key, value] of Object.entries(obj.variables.softwares)) {
							if(softwares[key] === undefined) {
								softwares[key] = [];
							}
						}
						
					}
				}

				const result = Object.entries(softwares).map(([key, value]) => ({
					software: key,
					domains: value
				}));
				$.callback(result.quicksort('software'));
			});
		}
	});

	schema.action('read', {
		name: 'Read domain',
		permissions: 'domain',
		input: '*name:string',
		params: '*id:UID',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').one().where('id', params.id).callback(function(err, response){
				if(response.variables.domains[model.name] === undefined){
					$.success(false);
					return;
				}
				$.callback({
					hostname: response.name,
					variables: YAML.stringify(response.variables.domains[model.name], inline=4, spaces=2)
				});
			});
		}
	});

	schema.action('create', {
		name: 'Create a domain',
		input: '*name, *hostname:string, *variables:String',
		// permissions: 'domain',
		action: function($, model) {
			model.id = UID();
			model.dtcreated = NOW = new Date();
			model.dtupdated = NOW = new Date();
			$.success();
			NOSQL('ansible').one().where('name', model.hostname).callback(function(err, response){
				if(err || response === undefined){
					$.success(false);
					return;
				}
				response.variables.domains[model.name] = YAML.parse(model.variables);
				NOSQL('ansible').modify({ variables: response.variables, dtupdated: NOW = new Date() }).where('name', model.hostname).callback($.done());
			});
		}
	});

	schema.action('update', {
		name: 'Update a domain',
		input: '*name, *hostname:string, *variables:String',
		params: '*id:UID',
		// permissions: 'domain',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').one().where('name', model.hostname).callback(function(err, response){
				response.variables.domains[model.name] = YAML.parse(model.variables);
				NOSQL('ansible').modify({ variables: response.variables, dtupdated: NOW = new Date() }).where('name', model.hostname).callback($.done());
			});
			
		}
	});

	schema.action('build_image', {
		name: 'Build an image',
		permissions: 'domain',
		input: '*name:string',
		action: function($, model) {
			NOSQL('ansible').list().autoquery($.query, 'id:string,name:string,group_vars:Boolean,variables:string', 'name_desc', 100).callback(function(err, response){
				var hosts = [];
				for (const obj of response.items) {
					if(!obj.group_vars){
						for (const [key, value] of Object.entries(obj.variables.softwares)) {
							// console.log(obj.name, key, model.name);
							if(key == model.name) {
								hosts.push(obj.name);
							}
						}
					}
				}

				const payload = {
					meta: {
						hosts: hosts.toString()
					},
					type: 'saas-image',
					software: model.name
				};
				// console.log(payload);
				// $.success();
				NOSQL('runner').one().where('id', '1ohbl001la51d').callback(function(err, runner){
					RESTBuilder.make(function(builder) {
						builder.method('POST');
						builder.url(runner.endpoint);
						builder.json(payload);
						if(runner.authentication){
							builder.auth(runner.login, runner.password);
						}
						builder.callback(function(err, response, output){
							$.success();
						});
					});
				});				
			});
		}
	});

	schema.action('redeploy', {
		name: 'Redeploy a domain',
		permissions: 'domain',
		input: '*name:string',
		params: '*id:UID',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').one().where('id', params.id).callback(function(err, response){
				const payload = {
					meta: {
						hosts: response.name
					},
					type: 'saas-deploy',
					software: response.variables.domains[model.name].software,
					domain: model.name,
					confirmation: 'yes'
				};
				NOSQL('runner').one().where('id', '1ohbl001la51d').callback(function(err, runner){
					RESTBuilder.make(function(builder) {
						builder.method('POST');
						builder.url(runner.endpoint);
						builder.json(payload);
						if(runner.authentication){
							builder.auth(runner.login, runner.password);
						}
						builder.callback(function(err, response, output){
							$.success();
						});
					});
				});
			});
		}
	});

	schema.action('redeploy_all', {
		name: 'Build an image',
		permissions: 'domain',
		input: '*name:string',
		action: function($, model) {
			NOSQL('ansible').list().autoquery($.query, 'id:string,name:string,group_vars:Boolean,variables:string', 'name_desc', 100).callback(function(err, response){
				var domains = [];
				for (const obj of response.items) {
					if(!obj.group_vars){
						for (const [key, value] of Object.entries(obj.variables.domains)) {
							if(value.software == model.name) {
								domains.push({host: obj.name, name: key});
							}
						}
					}
				}

				domains.wait(function(domain, next) {
					const payload = {
						meta: {
							hosts: domain.host
						},
						type: 'saas-deploy',
						software: model.name,
						domain: domain.name,
						confirmation: 'yes'
					};
					NOSQL('runner').one().where('id', '1ohbl001la51d').callback(function(err, runner){
						RESTBuilder.make(function(builder) {
							builder.method('POST');
							builder.url(runner.endpoint);
							builder.json(payload);
							if(runner.authentication){
								builder.auth(runner.login, runner.password);
							}
							builder.callback(function(err, response, output){
								next();
							});
						});
					});	
						
				}, () => $.success());			
			});
		}
	});

	schema.action('backup', {
		name: 'Backup a domain',
		permissions: 'domain',
		input: '*name:string',
		params: '*id:UID',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').one().where('id', params.id).callback(function(err, response){
				const payload = {
					meta: {
						hosts: response.name
					},
					type: 'saas-operate',
					software: response.variables.domains[model.name].software,
					domain: model.name,
					task: 'backup'
				};
				NOSQL('runner').one().where('id', '1ohbl001la51d').callback(function(err, runner){
					RESTBuilder.make(function(builder) {
						builder.method('POST');
						builder.url(runner.endpoint);
						builder.json(payload);
						if(runner.authentication){
							builder.auth(runner.login, runner.password);
						}
						builder.callback(function(err, response, output){
							$.success();
						});
					});
				});
			});
		}
	});

	schema.action('restore', {
		name: 'Restore a domain',
		permissions: 'domain',
		input: '*name:string',
		params: '*id:UID',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').one().where('id', params.id).callback(function(err, response){
				const payload = {
					meta: {
						hosts: response.name
					},
					type: 'saas-operate',
					software: response.variables.domains[model.name].software,
					domain: model.name,
					task: 'restore'
				};
				NOSQL('runner').one().where('id', '1ohbl001la51d').callback(function(err, runner){
					RESTBuilder.make(function(builder) {
						builder.method('POST');
						builder.url(runner.endpoint);
						builder.json(payload);
						if(runner.authentication){
							builder.auth(runner.login, runner.password);
						}
						builder.callback(function(err, response, output){
							$.success();
						});
					});
				});
			});
		}
	});

	schema.action('destroy', {
		name: 'Destroy a domain',
		permissions: 'domain',
		input: '*name:string',
		params: '*id:UID',
		action: function($, model) {
			var params = $.params;
			NOSQL('ansible').one().where('id', params.id).callback(function(err, response){
				const payload = {
					meta: {
						hosts: response.name
					},
					type: 'saas-operate',
					software: response.variables.domains[model.name].software,
					domain: model.name,
					task: 'destroy'
				};
				NOSQL('runner').one().where('id', '1ohbl001la51d').callback(function(err, runner){
					RESTBuilder.make(function(builder) {
						builder.method('POST');
						builder.url(runner.endpoint);
						builder.json(payload);
						if(runner.authentication){
							builder.auth(runner.login, runner.password);
						}
						builder.callback(function(err, res, output){
							if(output.status != 200){
								$.invalid('Runner unreachable');
								return;
							}
							// Set domain status as destroyed
							response.variables.domains[model.name].status = 'destroyed';
							NOSQL('ansible').modify({ variables: response.variables, dtupdated: NOW = new Date() }).where('id', params.id).callback($.done());
						});
					});
				});
			});
		}
	});

	// schema.action('remove', {
	// 	name: 'Remove a domain',
	// 	params: '*id:UID',
	// 	permissions: 'domain',
	// 	action: function($) {
	// 		var params = $.params;
	// 		NOSQL('domain').remove().where('id', params.id).callback($.done());
	// 	}
	// });

	schema.action('update_version', {
		name: 'Update a domain software version',
		input: '*host:string,*domain,*software:string,*version:string',
		// permissions: 'software',
		action: function($, model) {
			NOSQL('ansible').one().where('name', model.host).callback(function(err, response){
				// console.log(response);
				response.variables.domains[model.domain].version = model.version;
				NOSQL('ansible').modify({ variables: response.variables }).where('id', response.id).callback($.success());				
			});
		}
	});
});
NEWSCHEMA('Playbooks', function(schema) {

	YAML = require('yamljs');

	schema.action('query', {
		name: 'Query playbooks',
		action: function($) {
			DATA.list('nosql/playbooks').autoquery($.query, 'id:string,name:string,cron:Boolean,cron_day:String,cron_hour:String,cron_minute:String,dtcreated:string,dtupdated:string,summary:string', 'name_asc', 100).callback(function(err, response){
				$.callback(response.items);
			});
		}
	});

	schema.action('read', {
		name: 'Query detail',
		params: '*id:String',
		action: function($) {
			var params = $.params;
			NOSQL('playbooks').one().where('id', params.id).callback(function(err, response){
				response.payload = YAML.stringify(response.payload, inline=4, spaces=2);
				$.callback(response);				
			});
		}
	});

	schema.action('create', {
		name: 'Create a playbook',
		input: '*name:String,*runners_id:[UID],*payload:String,*payload:String,cron:Boolean,cron_day:String,cron_hour:String,cron_minute:String',
		permissions: 'ansible',
		action: function($, model) {
			model.id = UID();
			model.dtcreated = NOW = new Date();
			model.dtupdated = NOW = new Date();
			model.payload = YAML.parse(model.payload);
			NOSQL('playbooks').insert(model);
			$.success();
		}
	});

	schema.action('update', {
		name: 'Update a playbook',
		input: '*name:String,*runners_id:[UID],*payload:String,host:String,cron:Boolean,cron_day:String,cron_hour:String,cron_minute:String',
		params: '*id:String',
		// permissions: 'playbook',
		action: function($, model) {
			var params = $.params;
			model.dtupdated = NOW = new Date();
			model.payload = YAML.parse(model.payload);
			NOSQL('playbooks').modify(model).where('id', params.id).callback($.done());
		}
	});

	schema.action('remove', {
		name: 'remove playbooks',
		query: 'id:String',
		action: function($) {
			NOSQL('playbooks').remove().where('id', params.id).callback($.done());
		}
	});

	schema.action('run', {
		name: 'Run playbook',
		params: '*id:UID',
		action: function($) {
			var params = $.params;
			NOSQL('playbooks').one().where('id', params.id).callback(function(err, playbook){
				playbook.runners_id.wait(function(runner_id, next) {
					NOSQL('runner').one().where('id', runner_id).callback(function(err, runner){
						RESTBuilder.make(function(builder) {
							builder.method('POST');
							builder.url(runner.endpoint);
							builder.json(playbook.payload);
							if(runner.authentication){
								builder.auth(runner.login, runner.password);
							}
							builder.callback(function(err, response, output){
								next(err ? 'cancel' : '');
							});
						});
					});
				}, function(err){
					$.success(err ? false : true);
				});
			});
		}
	});
});
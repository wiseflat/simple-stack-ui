NEWSCHEMA('Runner', function(schema) {

	schema.define('name', 'String(300)', true);
	schema.define('endpoint', 'String(100)', true);
	schema.define('authentication', Boolean);
	schema.define('login', 'String(100)');
	schema.define('password', 'String(100)');

	schema.action('query', {
		name: 'Query runner',
		action: function($) {
			DATA.list('nosql/runner').autoquery($.query, 'id:string,name:string,endpoint:string,authentication:Boolean,login:string,password:string,dtcreated:string,dtupdated:string,summary:string', 'dtupdated_desc', 100).callback(function(err, response){
				$.callback(response.items);
			});
		}
	});

	schema.action('read', {
		name: 'Query detail',
		params: '*id:String',
		action: function($) {
			var params = $.params;
			NOSQL('runner').one().where('id', params.id).callback(function(err, response){
				$.callback(response);
			});
		}
	});

	schema.action('create', {
		name: 'Create a runner',
		input: '*name:string,*endpoint:string,authentication:Boolean,*login:string,*password:string',
		permissions: 'ansible',
		action: function($, model) {
			model.id = UID();
			model.dtcreated = NOW = new Date();
			model.dtupdated = NOW = new Date();
			NOSQL('runner').insert(model);
			$.success();
		}
	});

	schema.action('update', {
		name: 'Update a runner',
		input: '*name:string,*endpoint:string,authentication:Boolean,*login:string,*password:string',
		params: '*id:UID',
		action: function($, model) {
			var params = $.params;
			model.dtupdated = NOW = new Date();
			NOSQL('runner').modify(model).where('id', params.id).callback($.done());
		}
	});

	schema.action('remove', {
		name: 'remove runner',
		params: '*id:UID',
		action: function($) {
			var params = $.params;
			NOSQL('runner').remove().where('id', params.id).callback($.done());
		}
	});

	schema.action('sync', {
		name: 'synchronize runner',
		params: '*id:UID',
		action: function($) {
			var params = $.params;
			NOSQL('runner').one().where('id', params.id).callback(function(err, response){
				RESTBuilder.make(function(builder) {
					builder.method('POST');
					builder.url(response.endpoint);
					if(response.authentication){
						builder.auth(response.login, response.password);
					}
					builder.json({
						type: 'ping'
					});
					builder.callback(function(err, response, output){
						$.success(output.status != 200 ? false : true);
					});
				});
			});
		}
	});
});
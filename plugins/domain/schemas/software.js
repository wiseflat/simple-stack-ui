NEWSCHEMA('Software', function(schema) {

	schema.action('create', {
		name: 'Create a software',
		input: '*name,*version:string,*hosts:[string]',
		// permissions: 'software',
		action: function($, model) {
			model.hosts.wait(function(value, next) {
				NOSQL('ansible').one().where('name', value).callback(function(err, response){
					response.variables.softwares[model.name] = model.version;
					NOSQL('software').modify({ variables: response.variables }).where('id', response.id).callback(next());
				});
			}, () => $.success());
		}
	});

	// schema.action('update', {
	// 	name: 'Update a software',
	// 	input: '*name, *version:String',
	// 	params: '*id:UID',
	// 	// permissions: 'software',
	// 	action: function($, model) {
	// 		var params = $.params;
	// 		NOSQL('software').modify({ name: model.name, version: model.version, dtupdated: NOW = new Date() }).where('id', params.id).callback($.done());
	// 	}
	// });

	// schema.action('remove', {
	// 	name: 'Remove a software',
	// 	params: '*id:UID',
	// 	permissions: 'software',
	// 	action: function($) {
	// 		var params = $.params;
	// 		NOSQL('software').remove().where('id', params.id).callback($.done());
	// 	}
	// });
});
NEWSCHEMA('Logs', function(schema) {

	// schema.define('playbook_name', 'String(300)', true);
	// schema.define('uid', 'String(100)', true);
	// schema.define('event', 'String(100)');
	// schema.define('summary', Object)({});
	// schema.define('host', 'String(100)');
	// schema.define('task', 'String(500)');
	// schema.define('result', Object);
	// schema.define('warning', Array);
	// schema.define('deprecations', Array);
	// schema.define('reference', 'String(50)');
	// schema.define('changed', Boolean);

	schema.action('read', {
		name: 'Read log',
		params: '*id:String',
		action: function($) {
			var params = $.params;
			NOSQL('playbooks_log').one().where('id', params.id).callback(function(err, response){
				$.callback(response);
			});
		}
	});

	schema.action('insert', {
		name: 'insert log',
		action: function($, model) {

			const dtcreated = NOW = new Date();

			console.log(model);
			switch (model.event) {
				case 'playbook_start':
					// NOSQL('playbooks').insert({id: model.id, name: '', playbook_name: model.playbook_name, summary: {}, dtcreated: dtcreated, dtupdated: ''});
					$.success();
					break;
				case 'ok':
				case 'failed':
				case 'skipped':
					NOSQL('playbooks_detail').insert({
						id: UID(),
						run_id: model.id,
						host: model.host,
						dtcreated: NOW = new Date(),
						event: model.event,
						task: model.task,
						warning: model.warning,
						deprecations: model.deprecations,
						reference: model.reference,
						changed: model.changed
					});
					$.success();
					break;
				case 'unreachable':
					$.success();
					break;
				case 'summary':
					// NOSQL('playbooks').modify({ summary: model.summary, dtupdated: NOW = new Date() }).where('id', model.id);
					$.success();
					break;
				default:
					$.success();
					break;
			}
		}
	});
});
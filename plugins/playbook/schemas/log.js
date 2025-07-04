NEWSCHEMA('Logs', function(schema) {

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
					$.success();
					break;
				default:
					$.success();
					break;
			}
		}
	});
});
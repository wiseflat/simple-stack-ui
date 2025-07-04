exports.icon = 'ti ti-play';
exports.name = '@(Run a playbook)';
exports.position = 4;
exports.permissions = [{ id: 'playbook', name: 'playbook' }];
exports.visible = user => user.sa || user.permissions.includes('playbook');

exports.install = function() {

	ROUTE('+API     /api/       -playbooks           		*Playbooks   --> query');
	ROUTE('+API     /api/       -playbooks_read/{id} 		*Playbooks   --> read');	
	ROUTE('+API     /api/    	+playbooks_create         	*Playbooks   --> create');
	ROUTE('+API     /api/   	+playbooks_update/{id}    	*Playbooks   --> update');
	ROUTE('+API     /api/       -playbooks_remove    		*Playbooks   --> remove');
	ROUTE('+API     /api/       -playbooks_run/{id}   		*Playbooks   --> run');

	ROUTE('+API     /api/       -playbooks_log/{id} 		*Logs   --> read');
	ROUTE('+POST     /api/playbooks_log/		*Logs   --> insert');
};
exports.icon = 'ti ti-robot';
exports.name = '@(Configure a runner)';
exports.position = 3;
exports.permissions = [{ id: 'runner', name: 'runner' }];
exports.visible = user => user.sa || user.permissions.includes('runner');

exports.install = function() {

	ROUTE('+API     /api/       -runner           		*runner   --> query');
	ROUTE('+API     /api/       -runner_read/{id} 		*runner   --> read');
	ROUTE('+API    /api/    	+runner_create         	*runner   --> create');
	ROUTE('+API    /api/   		+runner_update/{id}    	*runner   --> update');
	ROUTE('+API     /api/       -runner_remove/{id}		*runner   --> remove');
	ROUTE('+API     /api/       -runner_sync/{id}		*runner   --> sync');
};
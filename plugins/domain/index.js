exports.icon = 'ti ti-cowboy';
exports.name = '@(Domain)';
exports.permissions = [{ id: 'domain', name: 'Domain' }];
exports.position = 3;
exports.visible = user => user.sa || user.permissions.includes('domain');

exports.install = function() {
	ROUTE('+API    /api/    -domain                *Domain   --> list');
	ROUTE('+API    /api/    +domain_read/{id}      *Domain   --> read');
	ROUTE('+API    /api/    +domain_create    	   *Domain   --> create');
	ROUTE('+API    /api/    +domain_update/{id}    *Domain   --> update');
	// ROUTE('+API    /api/    -domain_remove/{id}    *Domain   --> remove');

	ROUTE('+API    /api/    +domain_build_image     	 *Domain   --> build_image');
	ROUTE('+API    /api/    +domain_redeploy/{id}    	 *Domain   --> redeploy');
	ROUTE('+API    /api/    +domain_redeploy_all    	 *Domain   --> redeploy_all');
	ROUTE('+API    /api/    +domain_backup/{id} 	   	 *Domain   --> backup');
	ROUTE('+API    /api/    +domain_restore/{id}    	 *Domain   --> restore');
	ROUTE('+API    /api/    +domain_destroy/{id}    	 *Domain   --> destroy');
	ROUTE('+API    /api/    +domain_update_version  	 *Domain   --> update_version');

	ROUTE('+API    /api/    +software_create    	 *Software   --> create');
	ROUTE('+API    /api/    +software_edit    	 	 *Software   --> edit');
	

	// ROUTE('+POST   /api/domain/		*Domain   --> update');
	// ROUTE('+GET   /api/domain/{name}	*Domain   --> read');

};
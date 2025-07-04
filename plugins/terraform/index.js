exports.icon = 'ti ti-cloud';
exports.name = '@(Terraform states)';
exports.permissions = [{ id: 'terraform', name: 'Terraform' }];
exports.position = 2;
exports.visible = user => user.sa || user.permissions.includes('terraform');

exports.install = function() {
	ROUTE('+POST    /api/tfstates/{id}                *Terraform   --> tfstates_update');
	ROUTE('+GET    /api/tfstates/{id}                 *Terraform   --> tfstates_read');

	// ROUTE('+GET    /api/tfstates/lock/{id}           *Terraform   --> tfstates_lock');
	// ROUTE('+POST    /api/tfstates/unlock/{id}         *Terraform   --> tfstates_unlock');

	ROUTE('+API    /api/    -terraform                *Terraform   	--> list');
	ROUTE('+API    /api/    -terraform_read/{id}      *Terraform   	--> read');
	ROUTE('+API    /api/    +terraform_create         *Terraform	--> create');
	ROUTE('+API    /api/    +terraform_update/{id}    *Terraform   	--> update');
	ROUTE('+API    /api/    -terraform_remove/{id}    *Terraform   	--> remove');
};
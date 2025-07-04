exports.icon = 'ti ti-book';
exports.name = '@(Ansible inventory)';
exports.permissions = [{ id: 'ansible', name: 'Ansible' }];
exports.position = 3;
exports.visible = user => user.sa || user.permissions.includes('ansible');

exports.install = function() {
	ROUTE('+API    /api/    -ansible                *Ansible   --> list');
	ROUTE('+API    /api/    -ansible_list_hosts     *Ansible   --> list_hosts');
	// ROUTE('+API    /api/    -ansible_list2           *Ansible   --> list2');

	ROUTE('+API    /api/    -ansible_read/{id}      *Ansible   --> read');
	// ROUTE('+API    /api/    +ansible_create         *Ansible   --> create');
	ROUTE('+API    /api/    +ansible_update/{id}    *Ansible   --> update');
	ROUTE('+API    /api/    -ansible_remove/{id}    *Ansible   --> remove');
	ROUTE('+API    /api/    +ansible_software_version 	*Ansible   --> software_version');

	ROUTE('+GET     /api/inventory/		*Ansible   --> inventory_read');

};